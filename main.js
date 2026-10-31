
/*
  SolarEraser Chat — Step 107

  Public rooms: Main Room, Spam
  Private rooms: /j, /join
  Nicknames: /nick, /n
  Room glow: /g, /glow
  Click usernames to insert account IDs
  Shift-click usernames to copy IDs
  Server-verified owner and room glow
  Nickname color picker with 3 saved slots
  Server-side cooldowns and anti-spam
  No chat history
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
const SLOT_STORAGE_KEY = "solareraser_chat_colors_v1";

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
let verifiedOwner = false;

const verifiedRoomGlows = new Map();
let glowRoomId = null;
let glowRequestRunning = false;
let glowRefreshTimer = null;

function validColor(value) {
  if (typeof value !== "string") return "#FFFFFF";

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }

  const rgb = value.match(
    /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/
  );

  if (rgb) {
    return "#" + rgb.slice(1, 4).map(value =>
      Math.min(255, Number(value))
        .toString(16)
        .padStart(2, "0")
    ).join("").toUpperCase();
  }

  return "#FFFFFF";
}

function getProfile(data) {
  return Array.isArray(data) ? data[0] : data;
}

function privateWarning(text) {
  const notice = document.createElement("div");
  notice.textContent = text;
  notice.style.cssText =
    "color:#ffbd77;font-size:12px;padding:4px 0;";

  messages.appendChild(notice);
  messages.scrollTop = messages.scrollHeight;
}

function cooldownWarning(seconds) {
  const wait = Math.max(
    1,
    Math.ceil(Number(seconds) || 1)
  );

  const line = document.createElement("div");
  line.className = "message_item";

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = new Date().toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }
  );

  const warning = document.createElement("span");
  warning.className = "message";
  warning.textContent =
    "You are writing too fast, wait " +
    wait + " second(s)";
  warning.style.color = "#ffd447";

  line.append(time, warning);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

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

// --------------------------------------------------
// VERIFIED GLOW
// --------------------------------------------------

function applyGlow(element, accountId, color) {
  const id = String(accountId || "");
  const hex = validColor(color);

  element.dataset.accountId = id;
  element.style.color = hex;

  const hasGlow =
    glowRoomId === String(currentRoomId) &&
    verifiedRoomGlows.get(id) === true;

  element.classList.toggle("chat-glow", hasGlow);

  if (hasGlow) {
    element.style.setProperty("--glow-color", hex);
  } else {
    element.style.removeProperty("--glow-color");
  }
}

function repaintVerifiedGlows() {
  const elements = document.querySelectorAll(
    ".right .name[data-account-id], " +
    ".messages .nick[data-account-id]"
  );

  for (const element of elements) {
    const id = element.dataset.accountId;

    const hasGlow =
      glowRoomId === String(currentRoomId) &&
      verifiedRoomGlows.get(id) === true;

    element.classList.toggle("chat-glow", hasGlow);

    if (hasGlow) {
      element.style.setProperty(
        "--glow-color",
        validColor(element.style.color)
      );
    } else {
      element.style.removeProperty("--glow-color");
    }
  }
}

async function refreshVerifiedGlows() {
  if (
    !supabase ||
    !currentRoomId ||
    !channel ||
    glowRequestRunning
  ) return;

  const requestedRoom = String(currentRoomId);
  glowRequestRunning = true;

  try {
    const { data, error } = await supabase.rpc(
      "get_chat_room_glow",
      { p_room_id: requestedRoom }
    );

    if (error) throw error;

    if (String(currentRoomId) !== requestedRoom) {
      return;
    }

    verifiedRoomGlows.clear();

    for (const person of data || []) {
      verifiedRoomGlows.set(
        String(person.account_id),
        person.has_glow === true
      );
    }

    glowRoomId = requestedRoom;
    repaintVerifiedGlows();

  } catch (error) {
    console.warn(
      "[Glow] Refresh failed:",
      error.message
    );

  } finally {
    glowRequestRunning = false;

    if (
      currentRoomId &&
      String(currentRoomId) !== requestedRoom
    ) {
      scheduleGlowRefresh();
    }
  }
}

function scheduleGlowRefresh() {
  clearTimeout(glowRefreshTimer);

  glowRefreshTimer = setTimeout(
    refreshVerifiedGlows,
    250
  );
}

// --------------------------------------------------
// MESSAGES
// --------------------------------------------------

function displayMessage(data) {
  if (
    !data ||
    typeof data.content !== "string"
  ) return;

  const line = document.createElement("div");
  line.className = "message_item";

  const time = document.createElement("span");
  time.className = "time";

  time.textContent = new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

  const nick = document.createElement("span");
  nick.className = "nick";
  nick.textContent = String(data.nickname || "Guest");

  applyGlow(
    nick,
    data.account_id,
    data.nickname_color
  );

  const content = document.createElement("span");
  content.className = "message";
  content.textContent = data.content;

  line.append(time, nick, content);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;

  if (
    data.account_id &&
    !verifiedRoomGlows.has(String(data.account_id))
  ) {
    scheduleGlowRefresh();
  }
}

// --------------------------------------------------
// PUBLIC ROOM SELECTOR
// --------------------------------------------------

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

function updateRoomSelector() {
  const oldPrivateOption =
    roomSelector.querySelector(
      'option[data-private-room="true"]'
    );

  if (oldPrivateOption) oldPrivateOption.remove();

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

// --------------------------------------------------
// ONLINE USERS AND CLICKABLE IDS
// --------------------------------------------------

function renderUsers() {
  userNames.replaceChildren();

  if (!channel || !presenceWorking) return;

  const state = channel.presenceState();
  const people = new Map();

  for (const entries of Object.values(state)) {
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!entry || !entry.account_id) continue;

      const accountId = String(entry.account_id);

      if (!people.has(accountId)) {
        people.set(accountId, {
          accountId,
          nickname: String(entry.nickname || "Guest"),
          color: validColor(entry.nickname_color)
        });
      }
    }
  }

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

    applyGlow(
      name,
      person.accountId,
      person.color
    );

    // Click = insert ID and copy it.
    // Shift-click = copy ID only.
    name.style.cursor = "pointer";
    name.title =
      "Click to insert ID; Shift-click to copy ID";

    name.addEventListener("click", async event => {
      const id = person.accountId;

      try {
        await navigator.clipboard.writeText(id);
      } catch (error) {
        console.warn("[Clipboard]", error);
      }

      if (!event.shiftKey) {
        const existing = sendArea.value.trim();

        sendArea.value = existing
          ? existing + " " + id
          : id;

        sendArea.focus();
      }
    });

    item.appendChild(name);
    userNames.appendChild(item);
  }

  repaintVerifiedGlows();
  scheduleGlowRefresh();
}

// --------------------------------------------------
// SUPABASE CONNECTION
// --------------------------------------------------

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

  if (!data.session?.access_token) {
    throw new Error("Could not refresh login.");
  }

  await supabase.realtime.setAuth(
    data.session.access_token
  );

  return data.session;
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
    console.warn("[Presence] Untrack:", error);
  }

  await supabase.removeChannel(oldChannel);
}

async function trackMyPresence() {
  if (!channel || !profile) return "error";

  return await channel.track({
    account_id: profile.account_id,
    nickname: profile.nickname,
    nickname_color: validColor(profile.nickname_color)
  });
}

// --------------------------------------------------
// JOIN ROOMS
// --------------------------------------------------

async function joinRoom(roomName, roomType = "public") {
  if (!supabase || !profile || switching) {
    return false;
  }

  if (
    roomType !== "public" &&
    roomType !== "private"
  ) return false;

  if (
    roomType === "public" &&
    !PUBLIC_ROOMS.includes(roomName)
  ) return false;

  if (roomType === "private") {
    roomName = roomName.trim().toLowerCase();

    if (!/^[a-z0-9_-]{1,32}$/.test(roomName)) {
      privateWarning(
        "Private room names must be 1–32 characters: " +
        "letters, numbers, underscores, or hyphens."
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

    await leaveChannel();
    messages.replaceChildren();

    currentRoom = null;
    currentRoomId = null;
    currentRoomType = null;

    glowRoomId = null;
    verifiedRoomGlows.clear();

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

    for (const event of ["sync", "join", "leave"]) {
      newChannel.on(
        "presence",
        { event },
        () => {
          if (channel === newChannel) {
            renderUsers();
          }
        }
      );
    }

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
            error ||
            new Error("Realtime subscription failed")
          );
        }
      });
    });

    if (attempt !== connectionNumber) {
      return false;
    }

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

    let result = "error";

    try {
      result = await trackMyPresence();
    } catch (error) {
      console.error("[Presence] Track:", error);
    }

    if (result === "ok") {
      presenceWorking = true;
      renderUsers();
      scheduleGlowRefresh();

    } else {
      presenceWorking = false;
      userNames.replaceChildren();

      setStatus(
        "Chat connected; online list unavailable",
        true
      );
    }

    sendArea.focus();
    return true;

  } catch (error) {
    console.error("[Chat] Connection error:", error);

    setStatus(
      "Room connection failed: " + error.message,
      true
    );

    privateWarning(
      "Could not join room: " + error.message
    );

    if (!channel) {
      currentRoom = null;
      currentRoomId = null;
      currentRoomType = null;
    }

    return false;

  } finally {
    switching = false;
    setInputReady(Boolean(currentRoomId && channel));
    updateRoomSelector();
  }
}

roomSelector.addEventListener("change", () => {
  if (roomSelector.value === "__private_current__") {
    return;
  }

  joinRoom(roomSelector.value, "public");
});

// --------------------------------------------------
// NICKNAME COMMANDS
// --------------------------------------------------

async function changeNickname(rawNickname) {
  const nickname = rawNickname.trim();

  if (!nickname) {
    privateWarning("Usage: /nick YOUR NAME");
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

  profile.nickname =
    typeof data === "string" ? data : nickname;

  if (channel && presenceWorking) {
    try {
      const result = await trackMyPresence();

      if (result !== "ok") {
        privateWarning(
          "Nickname saved, but the online list " +
          "may need a reconnect."
        );
      }

    } catch (error) {
      console.warn(
        "[Presence] Nickname update:",
        error
      );
    }
  }

  renderUsers();

  privateWarning(
    "Your nickname is now " + profile.nickname + "."
  );
}

// --------------------------------------------------
// /G AND /GLOW COMMANDS
// --------------------------------------------------

async function grantRoomGlow(targetId) {
  if (!currentRoomId || !supabase) {
    privateWarning("You are not connected to a room.");
    return;
  }

  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!validId.test(targetId)) {
    privateWarning("Usage: /g USER_ID");
    return;
  }

  const roomId = currentRoomId;

  const { data, error } = await supabase.rpc(
    "grant_chat_room_glow",
    {
      p_room_id: roomId,
      p_target_account_id: targetId
    }
  );

  if (error) {
    privateWarning(error.message);
    return;
  }

  privateWarning(data || "Glow granted.");

  if (currentRoomId === roomId) {
    await refreshVerifiedGlows();
  }
}

// --------------------------------------------------
// COMMAND HANDLER
// --------------------------------------------------

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
    const requestedRoom =
      (joinMatch[1] || "").trim();

    if (!requestedRoom) {
      privateWarning("Usage: /j ROOM or /join ROOM");
      return;
    }

    await joinRoom(requestedRoom, "private");
    return;
  }

  const glowMatch = content.match(
    /^\/(?:g|glow)(?:\s+(.*))?$/i
  );

  if (glowMatch) {
    await grantRoomGlow(
      (glowMatch[1] || "").trim()
    );
    return;
  }

  privateWarning(
    "Unknown command. Available: " +
    "/nick, /n, /j, /join, /g, /glow."
  );
}

// --------------------------------------------------
// SEND MESSAGES
// --------------------------------------------------

async function sendMessage() {
  if (busy || switching || !currentRoomId) return;

  const content = sendArea.value.trim();
  if (!content) return;

  busy = true;

  try {
    if (content.startsWith("/")) {
      sendArea.value = "";
      await handleCommand(content);
      return;
    }

    const { data, error } = await supabase.rpc(
      "send_chat_message_v2",
      {
        p_room_id: currentRoomId,
        p_content: content
      }
    );

    if (error) {
      privateWarning(error.message);
      return;
    }

    if (data?.status === "cooldown") {
      cooldownWarning(data.wait_seconds);
      return;
    }

    if (data?.status === "sent") {
      if (sendArea.value.trim() === content) {
        sendArea.value = "";
      }
      return;
    }

    privateWarning("Unexpected message response.");

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

sendArea.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// --------------------------------------------------
// NICKNAME COLOR PICKER
// --------------------------------------------------

const pickerStyle = document.createElement("style");

pickerStyle.textContent = `
  .solar-color-menu {
    position: fixed;
    z-index: 9999;
    width: 226px;
    padding: 7px;
    background: #282828;
    border: 1px solid #555;
    box-shadow: 0 5px 18px #0009;
    color: #eee;
    font: 12px Arial, sans-serif;
    overflow: visible;
  }

  .solar-color-menu button,
  .solar-color-menu select {
    font: inherit;
  }

  .solar-color-menu button {
    cursor: pointer;
  }

  .solar-color-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
  }

  .solar-color-preview {
    width: 17px;
    height: 17px;
    border: 1px solid #999;
    flex: none;
    cursor: pointer;
  }

  .solar-color-preview:hover {
    outline: 1px solid #aaa;
  }

  .solar-color-select {
    flex: 1;
    min-width: 0;
    background: #333;
    color: #eee;
    border: 1px solid #666;
    padding: 4px;
  }

  .solar-color-popup {
    position: absolute;
    left: 0;
    top: calc(100% + 4px);
    bottom: auto;
    z-index: 10001;
    padding: 9px;
    background: #292929;
    border: 1px solid #666;
    box-shadow: 0 6px 18px #000a;
    display: none;
    width: 216px;
  }

  .solar-color-popup.open {
    display: block;
  }

  .solar-color-workspace {
    display: flex;
    gap: 6px;
  }

  .solar-color-square {
    position: relative;
    width: 174px;
    height: 174px;
    cursor: crosshair;
    background:
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, transparent);
    border: 1px solid #666;
    touch-action: none;
  }

  .solar-color-cursor {
    position: absolute;
    width: 9px;
    height: 9px;
    border: 1px solid white;
    border-radius: 50%;
    box-shadow: 0 0 2px #000;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .solar-hue-bar {
    position: relative;
    width: 22px;
    height: 174px;
    cursor: pointer;
    border: 1px solid #666;
    background: linear-gradient(
      to bottom,
      red 0%,
      yellow 16.67%,
      lime 33.33%,
      cyan 50%,
      blue 66.67%,
      magenta 83.33%,
      red 100%
    );
    touch-action: none;
  }

  .solar-hue-cursor {
    position: absolute;
    left: -3px;
    right: -3px;
    height: 3px;
    border: 1px solid white;
    background: #111;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .solar-color-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    margin-top: 9px;
  }

  .solar-color-actions button {
    border: 0;
    background: #383838;
    color: white;
    padding: 4px 7px;
  }

  .solar-color-actions .cancel {
    color: #ff5555;
  }

  .solar-color-actions .choose {
    background: #555;
  }

  .solar-color-error {
    color: #ff9b83;
    min-height: 13px;
    font-size: 11px;
  }
`;

document.head.appendChild(pickerStyle);

const colorMenu = document.createElement("div");
colorMenu.className = "solar-color-menu";
colorMenu.style.display = "none";

const colorRow = document.createElement("div");
colorRow.className = "solar-color-row";

const colorPreview = document.createElement("div");
colorPreview.className = "solar-color-preview";

const colorSelect = document.createElement("select");
colorSelect.className = "solar-color-select";

const newColorOption = document.createElement("option");
newColorOption.value = "new";
newColorOption.textContent = "New color!";
colorSelect.appendChild(newColorOption);

for (let i = 1; i <= 3; i++) {
  const option = document.createElement("option");
  option.value = "slot" + i;
  option.textContent = "Color " + i;
  colorSelect.appendChild(option);
}

colorRow.append(colorPreview, colorSelect);

const openColorButton = document.createElement("button");
openColorButton.textContent = "choose";
openColorButton.style.cssText =
  "background:#414141;color:#fff;" +
  "border:1px solid #666;padding:4px 8px;";

const colorPopup = document.createElement("div");
colorPopup.className = "solar-color-popup";

const colorWorkspace = document.createElement("div");
colorWorkspace.className = "solar-color-workspace";

const colorSquare = document.createElement("div");
colorSquare.className = "solar-color-square";

const squareCursor = document.createElement("div");
squareCursor.className = "solar-color-cursor";
colorSquare.appendChild(squareCursor);

const hueBar = document.createElement("div");
hueBar.className = "solar-hue-bar";

const hueCursor = document.createElement("div");
hueCursor.className = "solar-hue-cursor";
hueBar.appendChild(hueCursor);

colorWorkspace.append(colorSquare, hueBar);

const colorError = document.createElement("div");
colorError.className = "solar-color-error";

const colorActions = document.createElement("div");
colorActions.className = "solar-color-actions";

const cancelColorButton = document.createElement("button");
cancelColorButton.className = "cancel";
cancelColorButton.textContent = "cancel";

const chooseColorButton = document.createElement("button");
chooseColorButton.className = "choose";
chooseColorButton.textContent = "choose";

colorActions.append(
  cancelColorButton,
  chooseColorButton
);

colorPopup.append(
  colorWorkspace,
  colorActions,
  colorError
);

colorMenu.append(
  colorRow,
  openColorButton,
  colorPopup
);

document.body.appendChild(colorMenu);

let colorHue = 0;
let colorSat = 0;
let colorValue = 1;
let selectedHex = "#FFFFFF";

function hsvToHex(h, s, v) {
  const f = n => {
    const k = (n + h / 60) % 6;

    return v - v * s *
      Math.max(Math.min(k, 4 - k, 1), 0);
  };

  return "#" + [5, 3, 1]
    .map(n =>
      Math.round(f(n) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")
    .toUpperCase();
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }

    h *= 60;

    if (h < 0) h += 360;
  }

  return {
    h,
    s: max === 0 ? 0 : d / max,
    v: max
  };
}

function updateColorPicker() {
  selectedHex = hsvToHex(
    colorHue,
    colorSat,
    colorValue
  );

  const pureHue = hsvToHex(colorHue, 1, 1);

  colorSquare.style.background =
    "linear-gradient(to top, #000, transparent), " +
    "linear-gradient(to right, #fff, " +
    pureHue + ")";

  squareCursor.style.left =
    (colorSat * 100) + "%";

  squareCursor.style.top =
    ((1 - colorValue) * 100) + "%";

  hueCursor.style.top =
    (colorHue / 360 * 100) + "%";

  colorPreview.style.background = selectedHex;
}

function setPickerHex(hex) {
  const hsv = hexToHsv(validColor(hex));

  colorHue = hsv.h;
  colorSat = hsv.s;
  colorValue = hsv.v;

  updateColorPicker();
}

function readColorSlots() {
  try {
    const value = JSON.parse(
      localStorage.getItem(SLOT_STORAGE_KEY) || "{}"
    );

    return value && typeof value === "object"
      ? value
      : {};

  } catch {
    return {};
  }
}

function saveColorSlot(slot, hex) {
  const slots = readColorSlots();
  slots[slot] = validColor(hex);

  try {
    localStorage.setItem(
      SLOT_STORAGE_KEY,
      JSON.stringify(slots)
    );
  } catch (error) {
    console.warn("[Colors] Local save failed:", error);
  }
}

function updateColorSlotOptions() {
  const slots = readColorSlots();

  for (let i = 1; i <= 3; i++) {
    const option = colorSelect.querySelector(
      'option[value="slot' + i + '"]'
    );

    if (option) {
      option.textContent =
        "Color " + i +
        (slots["slot" + i] ? " ✓" : "");
    }
  }
}

async function saveNicknameColor(hex) {
  if (!supabase || !profile) {
    throw new Error("Chat is still connecting.");
  }

  const { data, error } = await supabase.rpc(
    "change_chat_nickname_color",
    { p_color: validColor(hex) }
  );

  if (error) throw error;

  profile.nickname_color = validColor(data);

  if (channel && presenceWorking) {
    const result = await trackMyPresence();

    if (result !== "ok") {
      privateWarning(
        "Color saved, but the online list " +
        "may need a reconnect."
      );
    }
  }

  renderUsers();

  // Update messages belonging to this account.
  for (const nick of messages.querySelectorAll(
    ".message_item .nick[data-account-id]"
  )) {
    if (
      nick.dataset.accountId ===
      String(profile.account_id)
    ) {
      nick.style.color = profile.nickname_color;

      if (nick.classList.contains("chat-glow")) {
        nick.style.setProperty(
          "--glow-color",
          profile.nickname_color
        );
      }
    }
  }

  privateWarning(
    "Nickname color saved: " +
    profile.nickname_color
  );
}

function openColorPopup() {
  colorError.textContent = "";
  colorPopup.classList.add("open");
}

function closeColorPopup() {
  colorPopup.classList.remove("open");
}

function toggleColorPopup() {
  if (colorPopup.classList.contains("open")) {
    closeColorPopup();
  } else {
    openColorPopup();
  }
}

openColorButton.addEventListener(
  "click",
  toggleColorPopup
);

colorPreview.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  toggleColorPopup();
});

cancelColorButton.addEventListener("click", () => {
  closeColorPopup();
});

function chooseFromColorSelect() {
  const choice = colorSelect.value;
  const slots = readColorSlots();

  if (choice === "new") {
    setPickerHex(
      profile?.nickname_color || "#FFFFFF"
    );
  } else {
    setPickerHex(
      slots[choice] ||
      profile?.nickname_color ||
      "#FFFFFF"
    );
  }

  openColorPopup();
}

colorSelect.addEventListener(
  "change",
  chooseFromColorSelect
);

chooseColorButton.addEventListener(
  "click",
  async () => {
    chooseColorButton.disabled = true;
    colorError.textContent = "";

    try {
      const color = selectedHex;
      await saveNicknameColor(color);

      if (colorSelect.value === "new") {
        const slots = readColorSlots();

        const freeSlot =
          ["slot1", "slot2", "slot3"]
            .find(slot => !slots[slot]);

        if (freeSlot) {
          saveColorSlot(freeSlot, color);
        }

      } else {
        saveColorSlot(
          colorSelect.value,
          color
        );
      }

      updateColorSlotOptions();
      closeColorPopup();

    } catch (error) {
      colorError.textContent = error.message;

    } finally {
      chooseColorButton.disabled = false;
    }
  }
);

function attachColorPointer(element, update) {
  element.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();

      element.setPointerCapture(
        event.pointerId
      );

      update(event);
    }
  );

  element.addEventListener(
    "pointermove",
    event => {
      if (element.hasPointerCapture(event.pointerId)) {
        update(event);
      }
    }
  );
}

attachColorPointer(colorSquare, event => {
  const rect = colorSquare.getBoundingClientRect();

  colorSat = Math.min(
    1,
    Math.max(
      0,
      (event.clientX - rect.left) / rect.width
    )
  );

  colorValue = 1 - Math.min(
    1,
    Math.max(
      0,
      (event.clientY - rect.top) / rect.height
    )
  );

  updateColorPicker();
});

attachColorPointer(hueBar, event => {
  const rect = hueBar.getBoundingClientRect();

  colorHue = Math.min(
    359.99,
    Math.max(
      0,
      (event.clientY - rect.top) /
        rect.height * 360
    )
  );

  updateColorPicker();
});

// --------------------------------------------------
// SETTINGS GEAR
// --------------------------------------------------

const settingsGear = document.querySelector(
  '.menu_button[data-target="settings"]'
);

function positionColorMenu() {
  if (!settingsGear) return;

  const rect = settingsGear.getBoundingClientRect();

  colorMenu.style.left =
    Math.max(8, rect.left) + "px";

  colorMenu.style.top =
    Math.max(8, rect.bottom + 5) + "px";
}

if (settingsGear) {
  settingsGear.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    if (colorMenu.style.display !== "none") {
      colorMenu.style.display = "none";
      closeColorPopup();
      return;
    }

    positionColorMenu();
    updateColorSlotOptions();

    colorSelect.value = "new";

    setPickerHex(
      profile?.nickname_color || "#FFFFFF"
    );

    colorMenu.style.display = "block";
  });
}

document.addEventListener("click", event => {
  if (
    !colorMenu.contains(event.target) &&
    !settingsGear?.contains(event.target)
  ) {
    colorMenu.style.display = "none";
    closeColorPopup();
  }
});

window.addEventListener("resize", () => {
  if (colorMenu.style.display !== "none") {
    positionColorMenu();
  }
});

// --------------------------------------------------
// START CHAT
// --------------------------------------------------

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

    const {
      data: glowData,
      error: glowError
    } = await supabase.rpc(
      "my_chat_glow_profile"
    );

    if (glowError) throw glowError;

    const glowProfile = getProfile(glowData);

    verifiedOwner = Boolean(
      glowProfile &&
      String(glowProfile.account_id) ===
        String(profile.account_id) &&
      glowProfile.role === "owner"
    );

    if (glowProfile) {
      profile.nickname_color = validColor(
        glowProfile.nickname_color
      );
    }

    console.log(
      "[Chat] Logged in as:",
      profile.nickname,
      "| Verified owner:",
      verifiedOwner
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

// Periodically refresh server-verified permissions.
setInterval(() => {
  if (currentRoomId && channel) {
    refreshVerifiedGlows();
  }
}, 12000);

startChat();

console.log(
  "[SolarEraser Chat] Step 107 loaded!"
);

// STEP 108D — Restore original username-click behavior.
//
// Click: append nickname + copy nickname.
// Shift-click: append account ID + copy ID.
// NEVER erase existing input text.

(function fixUserClicks() {
  userNames.addEventListener("click", async event => {
    const name = event.target.closest(
      ".name[data-account-id]"
    );

    if (!name || !userNames.contains(name)) {
      return;
    }

    // Prevent the older username handler from running.
    event.stopPropagation();

    const value = event.shiftKey
      ? name.dataset.accountId
      : name.textContent;

    if (!value) return;

    // Preserve everything already typed.
    const existing = sendArea.value;

    // Add a space only when needed.
    const separator =
      existing.length > 0 && !/\s$/.test(existing)
        ? " "
        : "";

    sendArea.value = existing + separator + value;

    // Put the cursor at the end.
    sendArea.focus();
    sendArea.setSelectionRange(
      sendArea.value.length,
      sendArea.value.length
    );

    // Copy the same value to clipboard.
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.warn("[Clipboard]", error);
    }
  }, true);

  console.log(
    "[Users] Append nickname/ID without replacing text!"
  );
})();

/*
  SolarEraser Chat — Step 109E
  /kick command and private moderation events

  Keep all existing code above this block.
*/

(function installKickSystem() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let checkingEvents = false;
  let kicking = false;

  async function kickUser(targetId) {
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /kick USER_ID (Shift-click a username)"
      );
      return;
    }

    if (!supabase || !currentRoomId) {
      privateWarning("You are not connected to a room.");
      return;
    }

    if (kicking) return;
    kicking = true;

    try {
      const { data, error } = await supabase.rpc(
        "kick_chat_user",
        {
          p_room_id: currentRoomId,
          p_target_account_id: targetId
        }
      );

      if (error) throw error;

      // Private confirmation to the moderator only.
      privateWarning(data || "User kicked to Main Room.");

      // Refresh server-verified room glow.
      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "Kick failed: " + error.message
      );
    } finally {
      kicking = false;
    }
  }

  async function checkKickEvents() {
    if (
      !supabase ||
      !profile ||
      switching ||
      checkingEvents
    ) {
      return;
    }

    checkingEvents = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        if (event.event_type !== "kick") {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const stillInKickedRoom =
          String(currentRoomId || "") === sourceRoom;

        if (stillInKickedRoom) {
          const moved = await joinRoom(
            "Main Room",
            "public"
          );

          if (!moved) {
            // Retry later if the room switch fails.
            break;
          }

          privateWarning(
            "You were kicked to Main Room."
          );
        }

        // Do not pull someone out of a different
        // room because of an old notification.

        const { error: ackError } = await supabase.rpc(
          "ack_chat_mod_event",
          { p_event_id: event.event_id }
        );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Kick] Event check failed:",
        error.message
      );
    } finally {
      checkingEvents = false;
    }
  }

  /*
    Intercept only /kick.

    All other commands continue through your
    existing command handler unchanged.
  */

  const originalHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/kick(?:\s+(.*))?$/i
    );

    if (match) {
      await kickUser((match[1] || "").trim());
      return;
    }

    return originalHandleCommand(content);
  };

  // Poll private moderation events every 2.5 seconds.
  // This does not create public chat messages.
  setInterval(checkKickEvents, 2500);

  // Check shortly after startup as well.
  setTimeout(checkKickEvents, 3000);

  console.log(
    "[SolarEraser Chat] Step 109E /kick loaded!"
  );
})();

/*
  SolarEraser Chat — Step 110D

  Adds:
    /timeout USER_ID
    /untimeout USER_ID

  Handles:
    timeout  -> Spam
    untimeout -> Main Room

  Keep ALL existing JavaScript above this block.
  Existing /kick remains unchanged.
*/

(function installTimeoutSystem() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let moderationBusy = false;
  let checkingTimeoutEvents = false;

  // ------------------------------------------
  // TIMEOUT COMMANDS
  // ------------------------------------------

  async function runTimeoutCommand(
    action,
    targetId
  ) {
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /" + action +
        " USER_ID (Shift-click a username)"
      );
      return;
    }

    if (!supabase || !profile || !currentRoomId) {
      privateWarning("Chat is not connected.");
      return;
    }

    if (moderationBusy) return;

    moderationBusy = true;

    try {
      const functionName =
        action === "timeout"
          ? "timeout_chat_user"
          : "untimeout_chat_user";

      const { data, error } = await supabase.rpc(
        functionName,
        {
          p_target_account_id: targetId
        }
      );

      if (error) throw error;

      privateWarning(
        data || (
          action === "timeout"
            ? "User moved to Spam."
            : "User released to Main Room."
        )
      );

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "/" + action + " failed: " +
        error.message
      );

    } finally {
      moderationBusy = false;
    }
  }

  // ------------------------------------------
  // PRIVATE MODERATION EVENTS
  // ------------------------------------------

  async function checkTimeoutEvents() {
    if (
      !supabase ||
      !profile ||
      switching ||
      checkingTimeoutEvents
    ) {
      return;
    }

    checkingTimeoutEvents = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        const type = event.event_type;

        // Leave kick events for the existing
        // Step 109E kick listener.
        if (
          type !== "timeout" &&
          type !== "untimeout"
        ) {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const inSourceRoom =
          String(currentRoomId || "") === sourceRoom;

        const destination =
          type === "timeout"
            ? "Spam"
            : "Main Room";

        // Only move automatically if the browser
        // is still showing the affected room.
        //
        // Old events should not pull the user
        // out of a room they joined later.

        if (inSourceRoom) {
          const moved = await joinRoom(
            destination,
            "public"
          );

          if (!moved) {
            // Do not acknowledge a failed move.
            // The next poll will retry.
            break;
          }

          if (type === "timeout") {
            privateWarning(
              "You have been timed out. " +
              "You cannot leave Spam until " +
              "a moderator releases you."
            );
          } else {
            privateWarning(
              "Your timeout has ended. " +
              "You have been moved to Main Room."
            );
          }
        }

        const { error: ackError } =
          await supabase.rpc(
            "ack_chat_mod_event",
            {
              p_event_id: event.event_id
            }
          );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Timeout] Event check failed:",
        error.message
      );

    } finally {
      checkingTimeoutEvents = false;
    }
  }

  // ------------------------------------------
  // COMMAND HANDLER
  // ------------------------------------------

  // Preserve the existing command handler,
  // including the working /kick command.

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const timeoutMatch = content.match(
      /^\/timeout(?:\s+(.*))?$/i
    );

    if (timeoutMatch) {
      await runTimeoutCommand(
        "timeout",
        (timeoutMatch[1] || "").trim()
      );
      return;
    }

    const untimeoutMatch = content.match(
      /^\/untimeout(?:\s+(.*))?$/i
    );

    if (untimeoutMatch) {
      await runTimeoutCommand(
        "untimeout",
        (untimeoutMatch[1] || "").trim()
      );
      return;
    }

    return previousHandleCommand(content);
  };

  // ------------------------------------------
  // AUTOMATIC EVENT CHECKING
  // ------------------------------------------

  setInterval(checkTimeoutEvents, 2500);

  setTimeout(checkTimeoutEvents, 3500);

  console.log(
    "[SolarEraser Chat] " +
    "Step 110D timeout system loaded!"
  );
})();

/*
  SolarEraser Chat — Step 110E
  Timeout refresh recovery

  Paste at the very bottom of main.js.
  Keep all existing code.
*/

(function installTimeoutRefreshRecovery() {
  let recoveryRunning = false;

  const originalJoinRoom = joinRoom;

  joinRoom = async function(roomName, roomType = "public") {
    const result = await originalJoinRoom(
      roomName,
      roomType
    );

    if (
      result ||
      recoveryRunning ||
      !supabase ||
      !profile ||
      roomName !== "Main Room" ||
      roomType !== "public"
    ) {
      return result;
    }

    recoveryRunning = true;

    try {
      // A failed Main Room join might mean the
      // account is timed out. Let the server decide
      // whether Spam is allowed.

      const spamResult = await originalJoinRoom(
        "Spam",
        "public"
      );

      if (spamResult) {
        privateWarning(
          "You are timed out. " +
          "You must remain in Spam until " +
          "a moderator releases you."
        );

        return true;
      }

      return false;

    } finally {
      recoveryRunning = false;
    }
  };

  // startChat() may already be running when
  // this block loads, so check once afterward.
  setTimeout(async () => {
    if (
      supabase &&
      profile &&
      !currentRoomId &&
      !switching
    ) {
      await joinRoom("Main Room", "public");
    }
  }, 4000);

  console.log(
    "[SolarEraser Chat] " +
    "Step 110E refresh recovery loaded!"
  );
})();
