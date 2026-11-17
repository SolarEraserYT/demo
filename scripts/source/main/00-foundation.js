
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
// STEP 136BM — Secret remembrance room.
const SECRET_ROOM_NAME = "remembrance";

function isRemembranceRoom() {
  return (
    currentRoomType === "private" &&
    String(currentRoom || "").toLowerCase() ===
      SECRET_ROOM_NAME
  );
}

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
let chatAccountBanned = false;

// Step 113C-3: SERVER announcement room-session tracking.
let serverAnnouncementSession = null;

const verifiedRoomGlows = new Map();
// STEP 136BG — Verified levels for user list sorting.
const verifiedUserLevels = new Map();
// STEP 136BJ — Refresh user levels every 60 seconds.
setInterval(() => {
  if (!supabase || !channel || !presenceWorking || switching) {
    return;
  }

  // Clear cached levels so fresh values are fetched.
  verifiedUserLevels.clear();

  // Rebuild the list and request updated levels.
  renderUsers();
}, 60000);
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
  notice.className = "message_item solar-private-notice";
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
  window.innerWidth <= 760
    ? "minmax(0, 7fr) minmax(0, 3fr)"
    : "minmax(0, 1fr) minmax(150px, 210px)";

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

statusBar.style.display = "none";

function setStatus(text, error = false) {
  statusBar.textContent = text;
  statusBar.style.color =
    error ? "#ff9393" : "#aaa8ca";

  console.log("[Chat status]", text);
}

