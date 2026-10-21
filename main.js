
/*
  SolarEraser Chat — Step 50E
  Live messaging + online presence TEST

  Public rooms only.
  Presence nicknames are provisional until we add
  server-verified profile lookup.
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
let channel = null;
let switching = false;
let busy = false;

leftPanel.style.display = "none";

layout.style.gridTemplateColumns =
  "minmax(0, 1fr) minmax(150px, 210px)";

layout.style.gridTemplateAreas = '"center right"';

sendArea.disabled = true;
sendButton.disabled = true;
sendArea.placeholder = "Connecting...";

// Temporary connection status, outside chat history.
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
  "border-radius:5px",
  "max-width:max-content"
].join(";");

document.body.appendChild(statusBar);

function setStatus(text, error = false) {
  statusBar.textContent = text;
  statusBar.style.color =
    error ? "#ff9393" : "#aaa8ca";

  if (error) console.error(text);
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

// Room dropdown above the online-user list.
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

// Render connected users from Supabase Presence.
// This is a functional test, not trusted identity verification.
function renderUsers() {
  userNames.replaceChildren();

  if (!channel || !currentRoomId) return;

  const state = channel.presenceState();
  const people = new Map();

  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (!entry || !entry.account_id) continue;

      const accountId = String(entry.account_id);

      // Collapse multiple tabs for the same account.
      if (!people.has(accountId)) {
        people.set(accountId, {
          nickname: String(entry.nickname || "Guest"),
          color: validColor(entry.nickname_color)
        });
      }
    }
  }

  const sortedPeople = [...people.values()].sort(
    (a, b) => a.nickname.localeCompare(b.nickname)
  );

  for (const person of sortedPeople) {
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

async function leaveChannel() {
  if (channel && supabase) {
    const oldChannel = channel;
    channel = null;

    userNames.replaceChildren();

    try {
      await oldChannel.untrack();
    } catch (error) {
      console.warn("Untrack warning:", error);
    }

    await supabase.removeChannel(oldChannel);
  }
}

async function joinRoom(roomName) {
  if (!supabase || !profile || switching) return;
  if (!PUBLIC_ROOMS.includes(roomName)) return;

  if (currentRoom === roomName && channel) {
    roomSelector.value = roomName;
    return;
  }

  switching = true;
  setInputReady(false);

  const previousRoom = currentRoom;

  try {
    await leaveChannel();

    messages.replaceChildren();
    currentRoom = null;
    currentRoomId = null;

    const { data: roomId, error: joinError } =
      await supabase.rpc("join_public_chat_room", {
        requested_name: roomName
      });

    if (joinError) throw joinError;
    if (!roomId) {
      throw new Error("No room ID returned.");
    }

    const topic = "chat-room:" + roomId;

    const newChannel = supabase.channel(topic, {
      config: {
        private: true,
        broadcast: { self: true },
        presence: { key: authUserId }
      }
    });

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

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Your login session expired.");
    }

    await supabase.realtime.setAuth(
      session.access_token
    );

    channel = newChannel;

    await new Promise((resolve, reject) => {
      newChannel.subscribe((state, error) => {
        if (state === "SUBSCRIBED") {
          resolve();
        } else if (
          state === "CHANNEL_ERROR" ||
          state === "TIMED_OUT" ||
          state === "CLOSED"
        ) {
          reject(
            error || new Error("Realtime connection failed")
          );
        }
      });
    });

    currentRoom = roomName;
    currentRoomId = roomId;
    roomSelector.value = roomName;

    // Publish our presence to this room.
    const { error: trackError } =
      await newChannel.track({
        account_id: profile.account_id,
        nickname: profile.nickname,
        nickname_color: validColor(
          profile.nickname_color
        )
      });

    if (trackError) throw trackError;

    renderUsers();
    setInputReady(true);
    setStatus("Connected to " + roomName);
    sendArea.focus();

  } catch (error) {
    console.error("Room connection failed:", error);

    setStatus(
      "Room connection failed: " + error.message,
      true
    );

    roomSelector.value = previousRoom || "Main Room";
    currentRoom = null;
    currentRoomId = null;

    await leaveChannel();

  } finally {
    switching = false;
  }
}

roomSelector.addEventListener("change", () => {
  joinRoom(roomSelector.value);
});

async function sendMessage() {
  if (busy || switching || !currentRoomId) return;

  const content = sendArea.value.trim();
  if (!content) return;

  busy = true;

  try {
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

    // Server broadcasts the accepted message.
    sendArea.value = "";

  } catch (error) {
    console.error(error);

    privateWarning(
      "Could not send message: " + error.message
    );

  } finally {
    busy = false;
    sendArea.focus();
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
      throw new Error("Chat profile was not found.");
    }

    await joinRoom("Main Room");

  } catch (error) {
    console.error("Startup failed:", error);

    setStatus(
      "Startup failed: " + error.message,
      true
    );
  }
}

startChat();
