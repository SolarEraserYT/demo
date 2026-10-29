
/*
  SolarEraser Chat — Step 83
  Public rooms, private rooms, nickname commands,
  live messaging, and Realtime Presence.

  No chat history.
*/

const SUPABASE_URL =
  "https://vebumdgtroqcpnvrlvhi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_CySjpyERFH6C4c6MQ4VmUg_dRueCRAF";

const messages = document.querySelector(".messages");
const sendArea = document.querySelector(".send_area");
const sendButton = document.querySelector(".send_button");
const userList = document.querySelector(".right");
const leftPanel = document.querySelector(".left");
const layout = document.querySelector(".container");

const PUBLIC_ROOMS = ["Main Room", "Spam"];

let supabase = null;
let profile = null;
let authUserId = null;
let currentRoom = null;
let currentRoomId = null;
let currentRoomType = null;
let channel = null;
let switching = false;
let busy = false;
let presenceWorking = false;
let connectionNumber = 0;

leftPanel.style.display = "none";

layout.style.gridTemplateColumns =
  "minmax(0, 1fr) minmax(150px, 210px)";

layout.style.gridTemplateAreas = '"center right"';

sendArea.disabled = true;
sendButton.disabled = true;
sendArea.placeholder = "Connecting...";

const statusBar = document.createElement("div");

statusBar.style.cssText = [
  "position:fixed",
  "bottom:61px",
  "left:10px",
  "z-index:20",
  "pointer-events:none",
  "font-size:12px",
  "color:#aaa8ca",
  "background:#171a24",
  "padding:3px 8px",
  "border-radius:5px"
].join(";");

document.body.appendChild(statusBar);

function setStatus(text, error = false) {
  statusBar.textContent = text;
  statusBar.style.color =
    error ? "#ff9393" : "#aaa8ca";

  console.log("[Chat status]", text);
}

function privateWarning(text) {
  const notice = document.createElement("div");

  notice.textContent = text;
  notice.style.cssText =
    "color:#ffbd77;font-size:12px;padding:4px 0;";

  messages.appendChild(notice);
  messages.scrollTop = messages.scrollHeight;
}

function getProfile(data) {
  return Array.isArray(data) ? data[0] : data;
}

function validColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "")
    ? value
    : "#ffffff";
}

function displayMessage(data) {
  if (!data || typeof data.content !== "string") {
    return;
  }

  const line = document.createElement("div");
  line.className = "message_item";

  const time = document.createElement("span");
  time.className = "time";

  time.textContent = new Date().toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  );

  const nick = document.createElement("span");
  nick.className = "nick";
  nick.textContent = String(data.nickname || "Guest");
  nick.style.color = validColor(data.nickname_color);

  const content = document.createElement("span");
  content.className = "message";
  content.textContent = data.content;

  line.append(time, nick, content);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

// Public room selector.
const roomSelector = document.createElement("select");

roomSelector.setAttribute(
  "aria-label",
  "Choose public room"
);

roomSelector.style.cssText = [
  "width:100%",
  "padding:9px",
  "background:#222637",
  "color:#e7e9f3",
  "border:1px solid #373b50",
  "border-radius:6px",
  "margin-bottom:12px",
  "cursor:pointer"
].join(";");

for (const roomName of PUBLIC_ROOMS) {
  const option = document.createElement("option");
  option.value = roomName;
  option.textContent = roomName;
  roomSelector.appendChild(option);
}

const userNames = document.createElement("div");

userList.replaceChildren(roomSelector, userNames);

// Display the current room without listing private
// rooms as publicly discoverable rooms.
function updateRoomSelector() {
  const oldPrivateOption =
    roomSelector.querySelector(
      'option[data-private-room="true"]'
    );

  if (oldPrivateOption) {
    oldPrivateOption.remove();
  }

  if (currentRoomType === "private") {
    const option = document.createElement("option");

    option.value = "__private_current__";
    option.textContent = "Private: " + currentRoom;
    option.dataset.privateRoom = "true";

    roomSelector.appendChild(option);
    roomSelector.value = "__private_current__";
  } else if (currentRoomType === "public") {
    roomSelector.value = currentRoom;
  }
}

function renderUsers() {
  userNames.replaceChildren();

  if (!channel || !presenceWorking) return;

  const state = channel.presenceState();
  const people = new Map();

  console.log("[Presence] State:", state);

  for (const entries of Object.values(state)) {
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!entry || !entry.account_id) continue;

      const accountId = String(entry.account_id);

      if (!people.has(accountId)) {
        people.set(accountId, {
          nickname: String(entry.nickname || "Guest"),
          color: validColor(entry.nickname_color)
        });
      }
    }
  }

  console.log(
    "[Presence] Users found:",
    people.size
  );

  const sorted = [...people.values()].sort(
    (a, b) => a.nickname.localeCompare(b.nickname)
  );

  for (const person of sorted) {
    const item = document.createElement("div");
    item.className = "user_item";
    item.style.padding = "5px 8px";

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = person.nickname;
    name.style.color = person.color;

    item.appendChild(name);
    userNames.appendChild(item);
  }
}

function setInputReady(ready) {
  sendArea.disabled = !ready;
  sendButton.disabled = !ready;

  sendArea.placeholder = ready
    ? "Type a message..."
    : "Connecting to room...";
}

async function refreshRealtimeAuth() {
  const { data, error } =
    await supabase.auth.refreshSession();

  if (error) throw error;

  const session = data.session;

  if (!session?.access_token) {
    throw new Error("Could not refresh login.");
  }

  await supabase.realtime.setAuth(
    session.access_token
  );

  console.log(
    "[Presence] Authentication refreshed:",
    Boolean(session.access_token)
  );

  return session;
}

async function leaveChannel() {
  if (!channel || !supabase) return;

  const oldChannel = channel;

  channel = null;
  presenceWorking = false;
  userNames.replaceChildren();

  try {
    await oldChannel.untrack();
  } catch (error) {
    console.warn(
      "[Presence] Untrack warning:",
      error
    );
  }

  await supabase.removeChannel(oldChannel);
}

// Shared room connection for public and private rooms.
async function joinRoom(roomName, roomType = "public") {
  if (!supabase || !profile || switching) return false;

  if (
    roomType !== "public" &&
    roomType !== "private"
  ) {
    return false;
  }

  if (
    roomType === "public" &&
    !PUBLIC_ROOMS.includes(roomName)
  ) {
    return false;
  }

  if (roomType === "private") {
    roomName = roomName.trim().toLowerCase();

    if (
      !/^[a-z0-9_-]{1,32}$/.test(roomName)
    ) {
      privateWarning(
        "Private room names must be 1–32 characters: letters, numbers, underscores, or hyphens."
      );
      return false;
    }
  }

  if (
    currentRoom === roomName &&
    currentRoomType === roomType &&
    channel
  ) {
    updateRoomSelector();
    return true;
  }

  switching = true;
  setInputReady(false);

  const attempt = ++connectionNumber;

  try {
    // Ask the database to join the new room first.
    // If this fails, we keep the old connection.
    const functionName =
      roomType === "private"
        ? "join_private_chat_room"
        : "join_public_chat_room";

    const { data: roomId, error: joinError } =
      await supabase.rpc(functionName, {
        requested_name: roomName
      });

    if (joinError) throw joinError;

    if (!roomId) {
      throw new Error("No room ID returned.");
    }

    // Remove the old Presence connection.
    await leaveChannel();

    // No history is carried between rooms.
    messages.replaceChildren();

    currentRoom = null;
    currentRoomId = null;
    currentRoomType = null;

    await refreshRealtimeAuth();

    const newChannel = supabase.channel(
      "chat-room:" + roomId,
      {
        config: {
          private: true,
          broadcast: { self: true },
          presence: { key: authUserId }
        }
      }
    );

    newChannel.on(
      "broadcast",
      { event: "chat_message" },
      ({ payload }) => {
        if (channel !== newChannel) return;
        displayMessage(payload);
      }
    );

    newChannel.on(
      "presence",
      { event: "sync" },
      () => {
        console.log("[Presence] SYNC");

        if (channel === newChannel) {
          renderUsers();
        }
      }
    );

    newChannel.on(
      "presence",
      { event: "join" },
      () => {
        if (channel === newChannel) {
          renderUsers();
        }
      }
    );

    newChannel.on(
      "presence",
      { event: "leave" },
      () => {
        if (channel === newChannel) {
          renderUsers();
        }
      }
    );

    channel = newChannel;

    await new Promise((resolve, reject) => {
      newChannel.subscribe((state, error) => {
        console.log(
          "[Presence] Subscription:",
          state,
          error || ""
        );

        if (state === "SUBSCRIBED") {
          resolve();
        } else if (
          state === "CHANNEL_ERROR" ||
          state === "TIMED_OUT" ||
          state === "CLOSED"
        ) {
          reject(
            error ||
            new Error("Realtime subscription failed")
          );
        }
      });
    });

    if (attempt !== connectionNumber) return false;

    currentRoom = roomName;
    currentRoomId = roomId;
    currentRoomType = roomType;

    updateRoomSelector();

    setInputReady(true);

    setStatus(
      "Connected to " +
      (roomType === "private" ? "private room " : "") +
      roomName
    );

    const payload = {
      account_id: profile.account_id,
      nickname: profile.nickname,
      nickname_color: validColor(
        profile.nickname_color
      )
    };

    console.log("[Presence] Attempting track");

    let result;

    try {
      result = await newChannel.track(payload);
    } catch (error) {
      console.error(
        "[Presence] Track exception:",
        error
      );

      result = "error";
    }

    console.log(
      "[Presence] TRACK RESULT:",
      result
    );

    if (result === "ok") {
      presenceWorking = true;
      renderUsers();

      console.log(
        "[Presence] SUCCESS — online tracking active"
      );
    } else {
      presenceWorking = false;
      userNames.replaceChildren();

      console.warn(
        "[Presence] FAILED — tracking rejected.",
        "Status:",
        result
      );

      setStatus(
        "Chat connected; online list unavailable",
        true
      );
    }

    sendArea.focus();
    return true;

  } catch (error) {
    console.error(
      "[Chat] Connection error:",
      error
    );

    setStatus(
      "Room connection failed: " + error.message,
      true
    );

    privateWarning(
      "Could not join room: " + error.message
    );

    // If the previous channel was already removed,
    // the page can be refreshed to reconnect.
    if (!channel) {
      currentRoom = null;
      currentRoomId = null;
      currentRoomType = null;
    }

    return false;

  } finally {
    switching = false;

    setInputReady(
      Boolean(currentRoomId && channel)
    );

    updateRoomSelector();
  }
}

// Public room switching.
roomSelector.addEventListener("change", () => {
  if (roomSelector.value === "__private_current__") {
    return;
  }

  joinRoom(roomSelector.value, "public");
});

// Nickname commands.
async function changeNickname(rawNickname) {
  const nickname = rawNickname.trim();

  if (
    !nickname ||
    nickname.length > 15 ||
    !/^[A-Za-z0-9_]+$/.test(nickname)
  ) {
    privateWarning(
      "Nicknames must be 1–15 characters: letters, numbers, or underscores."
    );
    return;
  }

  const { data, error } = await supabase.rpc(
    "change_chat_nickname",
    { p_nickname: nickname }
  );

  if (error) {
    privateWarning(error.message);
    return;
  }

  const savedNickname =
    typeof data === "string" ? data : nickname;

  profile.nickname = savedNickname;

  if (channel && presenceWorking) {
    try {
      const result = await channel.track({
        account_id: profile.account_id,
        nickname: savedNickname,
        nickname_color: validColor(
          profile.nickname_color
        )
      });

      if (result !== "ok") {
        privateWarning(
          "Nickname saved, but the online list may need a reconnect."
        );
      }
    } catch (error) {
      console.warn(
        "[Presence] Nickname update warning:",
        error
      );

      privateWarning(
        "Nickname saved, but the online list may need a reconnect."
      );
    }
  }

  privateWarning(
    "Your nickname is now " + savedNickname + "."
  );
}

// Command handler.
async function handleCommand(content) {
  const nicknameMatch = content.match(
    /^\/(?:nick|n)(?:\s+(.*))?$/i
  );

  if (nicknameMatch) {
    await changeNickname(nicknameMatch[1] || "");
    return;
  }

  const joinMatch = content.match(
    /^\/(?:j|join)(?:\s+(.*))?$/i
  );

  if (joinMatch) {
    const requestedRoom = (joinMatch[1] || "").trim();

    if (!requestedRoom) {
      privateWarning(
        "Usage: /j ROOM or /join ROOM"
      );
      return;
    }

    await joinRoom(requestedRoom, "private");
    return;
  }

  privateWarning(
    "Unknown command. Available: /nick, /n, /j, /join."
  );
}

async function sendMessage() {
  if (busy || switching || !currentRoomId) return;

  const content = sendArea.value.trim();

  if (!content) return;

  busy = true;

  try {
    // Commands are never sent as public messages.
    if (content.startsWith("/")) {
      sendArea.value = "";
      await handleCommand(content);
      return;
    }

    const { error } = await supabase.rpc(
      "send_chat_message",
      {
        p_room_id: currentRoomId,
        p_content: content
      }
    );

    if (error) {
      privateWarning(error.message);
      return;
    }

    sendArea.value = "";

  } catch (error) {
    privateWarning(
      "Could not send message: " + error.message
    );

  } finally {
    busy = false;

    if (!sendArea.disabled) {
      sendArea.focus();
    }
  }
}

sendButton.addEventListener("click", sendMessage);

sendArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

async function startChat() {
  try {
    setStatus("Connecting to Supabase...");

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session) {
      const { error: authError } =
        await supabase.auth.signInAnonymously();

      if (authError) throw authError;
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      throw new Error("Guest login failed.");
    }

    authUserId = user.id;

    const { data, error: profileError } =
      await supabase.rpc("my_chat_profile");

    if (profileError) throw profileError;

    profile = getProfile(data);

    if (!profile?.nickname || !profile?.account_id) {
      throw new Error("Chat profile not found.");
    }

    console.log(
      "[Chat] Logged in as:",
      profile.nickname
    );

    await joinRoom("Main Room", "public");

  } catch (error) {
    console.error("[Chat] Startup failed:", error);

    setStatus(
      "Startup failed: " + error.message,
      true
    );
  }
}

startChat();
