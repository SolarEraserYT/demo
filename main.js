
/*
  SolarEraser Chat — Step 97

  - Public and private rooms
  - /nick, /n, /j, /join
  - Verified owner glow
  - Realtime Presence
  - Anti-spam v2 and cooldown warnings
  - EmuChat-style nickname color picker
  - No chat history
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
let verifiedOwner = false;

const SLOT_STORAGE_KEY = "solareraser_chat_colors_v1";

function validColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "")
    ? value.toUpperCase()
    : "#FFFFFF";
}

function applyOwnGlow(element, accountId) {
  if (
    verifiedOwner &&
    String(accountId) === String(profile?.account_id)
  ) {
    element.classList.add("chat-glow");
    element.style.setProperty(
      "--glow-color",
      validColor(profile.nickname_color)
    );
  }
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
    wait +
    " second(s)";
  warning.style.color = "#ffd447";

  line.append(time, warning);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
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
  nick.style.color = validColor(data.nickname_color);

  applyOwnGlow(nick, data.account_id);

  const content = document.createElement("span");
  content.className = "message";
  content.textContent = data.content;

  line.append(time, nick, content);
  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

// PUBLIC ROOM SELECTOR

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
    name.style.color = person.color;

    applyOwnGlow(name, person.accountId);

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

async function joinRoom(roomName, roomType = "public") {
  if (!supabase || !profile || switching) return false;

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
    const functionName =
      roomType === "private"
        ? "join_private_chat_room"
        : "join_public_chat_room";

    const { data: roomId, error: joinError } =
      await supabase.rpc(functionName, {
        requested_name: roomName
      });

    if (joinError) throw joinError;
    if (!roomId) throw new Error("No room ID returned.");

    await leaveChannel();
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

    for (const event of ["sync", "join", "leave"]) {
      newChannel.on(
        "presence",
        { event },
        () => {
          if (channel === newChannel) renderUsers();
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

    let result = "error";

    try {
      result = await trackMyPresence();
    } catch (error) {
      console.error("[Presence] Track:", error);
    }

    if (result === "ok") {
      presenceWorking = true;
      renderUsers();
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

  profile.nickname =
    typeof data === "string" ? data : nickname;

  if (channel && presenceWorking) {
    try {
      await trackMyPresence();
    } catch (error) {
      console.warn("[Presence] Nickname update:", error);
    }
  }

  privateWarning(
    "Your nickname is now " + profile.nickname + "."
  );
}

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
      privateWarning("Usage: /j ROOM or /join ROOM");
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
    if (!sendArea.disabled) sendArea.focus();
  }
}

sendButton.addEventListener("click", sendMessage);

sendArea.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

// EMUCHAT-STYLE COLOR PICKER

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
    bottom: calc(100% + 4px);
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
  "background:#414141;color:#fff;border:1px solid #666;padding:4px 8px;";

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
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;

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

    return value &&
      typeof value === "object" ? value : {};
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

function positionColorMenu() {
  const gear = document.querySelector(".settings");

  if (!gear) return;

  const rect = gear.getBoundingClientRect();

  colorMenu.style.left =
    Math.max(8, rect.left) + "px";

  colorMenu.style.top =
    Math.max(8, rect.bottom + 5) + "px";
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
        "Color saved, but the online list may need a reconnect."
      );
    }
  }

  renderUsers();

  // Update the glow/color of messages already visible
  // from this account.
  for (const line of messages.querySelectorAll(
    ".message_item"
  )) {
    const nick = line.querySelector(".nick");
    if (!nick) continue;

    if (nick.textContent === profile.nickname) {
      nick.style.color = profile.nickname_color;

      if (verifiedOwner) {
        nick.classList.add("chat-glow");
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

openColorButton.addEventListener("click", () => {
  if (colorPopup.classList.contains("open")) {
    closeColorPopup();
  } else {
    openColorPopup();
  }
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
    openColorPopup();
    return;
  }

  const slotColor = slots[choice];

  if (slotColor) {
    setPickerHex(slotColor);
  } else {
    setPickerHex(
      profile?.nickname_color || "#FFFFFF"
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

        const freeSlot = ["slot1", "slot2", "slot3"]
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
      (event.clientY - rect.top) / rect.height * 360
    )
  );

  updateColorPicker();
});

// Use the existing settings gear.
// This avoids replacing the user's settings layout.
const settingsGear =
  document.querySelector(".settings");

if (settingsGear) {
  settingsGear.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    if (colorMenu.style.display === "none") {
      positionColorMenu();
      updateColorSlotOptions();

      colorSelect.value = "new";

      setPickerHex(
        profile?.nickname_color || "#FFFFFF"
      );

      colorMenu.style.display = "block";
    } else {
      colorMenu.style.display = "none";
      closeColorPopup();
    }
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

// START CHAT

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
    if (!user) throw new Error("Guest login failed.");

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

startChat();

// STEP 99 — Connect the existing settings gear
// to the nickname color picker.

const settingsButtonFix = document.querySelector(
  ".top_left .gear, " +
  ".top_left .settings, " +
  ".top_left button:first-child, " +
  ".toolbar button:first-child, " +
  "[title='Settings'], " +
  "[aria-label='Settings']"
);

if (settingsButtonFix) {
  settingsButtonFix.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const picker = document.querySelector(
      ".solar-color-menu"
    );

    if (!picker) return;

    if (picker.style.display === "none") {
      const rect =
        settingsButtonFix.getBoundingClientRect();

      picker.style.left =
        Math.max(8, rect.left) + "px";

      picker.style.top =
        Math.max(8, rect.bottom + 5) + "px";

      picker.style.display = "block";

      colorSelect.value = "new";

      setPickerHex(
        profile?.nickname_color || "#FFFFFF"
      );

      updateColorSlotOptions();
    } else {
      picker.style.display = "none";
      closeColorPopup();
    }
  });

  console.log(
    "[Settings] Color picker connected!"
  );
} else {
  console.warn(
    "[Settings] Could not find settings button."
  );
}

/*
  STEP 99 — Fix settings gear using its
  actual selector from index.html.
*/

const realSettingsGear = document.querySelector(
  '.menu_button[data-target="settings"]'
);

if (realSettingsGear) {
  realSettingsGear.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Toggle the existing color picker.
    const isOpen = colorMenu.style.display !== "none";

    if (isOpen) {
      colorMenu.style.display = "none";
      closeColorPopup();
      return;
    }

    const rect = realSettingsGear.getBoundingClientRect();

    colorMenu.style.left = Math.max(8, rect.left) + "px";
    colorMenu.style.top = Math.max(8, rect.bottom + 5) + "px";

    colorSelect.value = "new";

    setPickerHex(
      profile?.nickname_color || "#FFFFFF"
    );

    updateColorSlotOptions();

    colorMenu.style.display = "block";
  });

  console.log(
    "[Settings] Real settings gear connected!"
  );
}

// STEP 100 — Fix EmuChat color picker positioning
// and make the color preview square clickable.

(function fixColorPicker() {
  // Override the old upward-opening popup style.
  const fixStyle = document.createElement("style");

  fixStyle.textContent = `
    .solar-color-menu {
      overflow: visible !important;
    }

    .solar-color-popup {
      top: calc(100% + 4px) !important;
      bottom: auto !important;
      left: 0 !important;
      z-index: 10001 !important;
    }

    .solar-color-preview {
      cursor: pointer !important;
    }

    .solar-color-preview:hover {
      outline: 1px solid #aaa;
    }
  `;

  document.head.appendChild(fixStyle);

  // Clicking the colored square opens the picker.
  colorPreview.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (colorPopup.classList.contains("open")) {
      closeColorPopup();
    } else {
      setPickerHex(
        profile?.nickname_color || "#FFFFFF"
      );

      openColorPopup();
    }
  });

  console.log(
    "[Colors] Popup positioning and preview fixed!"
  );
})();

// STEP 102 — Updated nickname commands
// Supports spaces, emojis, and owner/admin exceptions.
// Supabase validates the actual nickname rules.

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
          "Nickname saved, but the online list may need a reconnect."
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

// STEP 104 — Everyone can see verified glows.
// Owner/admin/manager: glow in every room.
// Private room owner / granted glow: room-specific.
// Spam: everyone glows.
// Permissions come from Supabase, never from user Presence.

const verifiedRoomGlows = new Map();
let glowRoomId = null;
let glowRequestRunning = false;
let glowRefreshTimer = null;

function repaintVerifiedGlows() {
  const elements = document.querySelectorAll(
    ".right .name[data-account-id], " +
    ".messages .nick[data-account-id]"
  );

  for (const element of elements) {
    const id = element.dataset.accountId;
    const hasGlow = verifiedRoomGlows.get(id) === true;

    element.classList.toggle("chat-glow", hasGlow);

    if (hasGlow) {
      const color = validColor(
        element.style.color ||
        (
          id === String(profile?.account_id)
            ? profile.nickname_color
            : "#FFFFFF"
        )
      );

      // style.color may be an RGB string.
      // Convert it to a valid hex color when needed.
      let glowColor = color;

      if (
        color === "#FFFFFF" &&
        element.style.color.startsWith("rgb")
      ) {
        const numbers =
          element.style.color.match(/\d+/g);

        if (numbers && numbers.length >= 3) {
          glowColor = "#" + numbers
            .slice(0, 3)
            .map(number =>
              Number(number)
                .toString(16)
                .padStart(2, "0")
            )
            .join("")
            .toUpperCase();
        }
      }

      element.style.setProperty(
        "--glow-color",
        glowColor
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

    // Ignore a response from a room we already left.
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
      "[Glow] Could not refresh verified permissions:",
      error.message
    );
  } finally {
    glowRequestRunning = false;

    // If we switched rooms during the request,
    // immediately refresh for the new room.
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

  glowRefreshTimer = setTimeout(() => {
    refreshVerifiedGlows();
  }, 250);
}

// Replace the old self-only glow logic.
// Existing chat rendering will automatically use this.
applyOwnGlow = function(element, accountId) {
  const id = String(accountId || "");

  element.dataset.accountId = id;

  // Never trust role/glow claims from the browser.
  const hasGlow =
    glowRoomId === String(currentRoomId) &&
    verifiedRoomGlows.get(id) === true;

  element.classList.toggle("chat-glow", hasGlow);

  if (hasGlow) {
    element.style.setProperty(
      "--glow-color",
      validColor(
        id === String(profile?.account_id)
          ? profile.nickname_color
          : "#FFFFFF"
      )
    );
  } else {
    element.style.removeProperty("--glow-color");
  }
};

// Every Presence update rebuilds the user list.
// Refresh server-verified glow permissions too.
const originalRenderUsers = renderUsers;

renderUsers = function() {
  originalRenderUsers();

  if (glowRoomId !== String(currentRoomId)) {
    verifiedRoomGlows.clear();
    glowRoomId = null;
  }

  repaintVerifiedGlows();
  scheduleGlowRefresh();
};

// Messages also receive verified glow permissions.
// Newly arrived users may not be in the cache yet.
const originalDisplayMessage = displayMessage;

displayMessage = function(data) {
  originalDisplayMessage(data);

  repaintVerifiedGlows();

  if (
    data?.account_id &&
    !verifiedRoomGlows.has(String(data.account_id))
  ) {
    scheduleGlowRefresh();
  }
};

// Recheck periodically for room-owner transfers,
// newly granted glows, and admin role changes.
setInterval(() => {
  if (currentRoomId && channel) {
    refreshVerifiedGlows();
  }
}, 12000);

console.log(
  "[Glow] Server-verified room glow enabled!"
);
