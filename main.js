
/*
  SolarEraser Chat — Step 49
  Public-room live messaging test

  Private rooms are not enabled in this version.
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
let currentRoom = null;
let currentRoomId = null;
let channel = null;
let busy = false;
let switching = false;

// For this test, move room selection to the right.
leftPanel.style.display = "none";
layout.style.gridTemplateColumns =
  "minmax(0, 1fr) minmax(150px, 210px)";
layout.style.gridTemplateAreas = '"center right"';

sendArea.disabled = true;
sendButton.disabled = true;
sendArea.placeholder = "Connecting...";

// Temporary diagnostic status OUTSIDE the chat messages.
const statusBar = document.createElement("div");
statusBar.style.cssText = [
  "position:fixed",
  "bottom:61px",
  "left:10px",
  "right:220px",
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
  statusBar.style.color = error ? "#ff9393" : "#aaa8ca";
  if (error) console.error(text);
}

function privateWarning(text) {
  // Local notice: never sent to other users.
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

function displayMessage(data) {
  if (!data || typeof data.content !== "string") return;

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
  nick.style.color = /^#[0-9a-f]{6}$/i.test(
    data.nickname_color || ""
  ) ? data.nickname_color : "#ffffff";

  const content = document.createElement("span");
  content.className = "message";
  content.textContent = data.content;

  line.append(time, nick, content);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

const roomSelector = document.createElement("select");
roomSelector.setAttribute("aria-label", "Choose public room");
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

for (const room of PUBLIC_ROOMS) {
  const option = document.createElement("option");
  option.value = room;
  option.textContent = room;
  roomSelector.appendChild(option);
}

const userNames = document.createElement("div");

function renderUsers() {
  userNames.replaceChildren();

  if (!profile) return;

  // Multi-user presence will be implemented later.
  // For now we display only our own verified profile.
  const item = document.createElement("div");
  item.className = "user_item";
  item.textContent = profile.nickname;
  item.style.color =
    profile.nickname_color || "#ffffff";

  userNames.appendChild(item);
}

userList.replaceChildren(roomSelector, userNames);

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
    await supabase.removeChannel(oldChannel);
  }
}

async function joinRoom(roomName) {
  if (!supabase || !profile || switching) return;
  if (!PUBLIC_ROOMS.includes(roomName)) return;

  switching = true;
  setInputReady(false);

  const previousRoom = currentRoom;

  try {
    // Stop listening to the previous room.
    await leaveChannel();

    // Clear old messages; no history is loaded.
    messages.replaceChildren();
    currentRoom = null;
    currentRoomId = null;

    const { data: roomId, error: joinError } =
      await supabase.rpc("join_public_chat_room", {
        requested_name: roomName
      });

    if (joinError) throw joinError;
    if (!roomId) throw new Error("No room ID returned.");

    const topic = "chat-room:" + roomId;

    // Private Realtime channel, even for public rooms.
    const newChannel = supabase.channel(topic, {
      config: {
        private: true,
        broadcast: { self: true }
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

    // Ensure Realtime has the current login token.
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

    // The broadcast displays the accepted message.
    // We do not insert a second local copy.
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

    const { data, error: profileError } =
      await supabase.rpc("my_chat_profile");

    if (profileError) throw profileError;

    profile = getProfile(data);

    if (!profile?.nickname) {
      throw new Error("Chat profile was not found.");
    }

    renderUsers();
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
