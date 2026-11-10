
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
let chatAccountBanned = false;

// Step 113C-3: SERVER announcement room-session tracking.
let serverAnnouncementSession = null;

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
 // USERNAME HOVER CARDS
 // --------------------------------------------------

const hoverCard = document.createElement("div");
hoverCard.className = "chat-hover-card";
hoverCard.hidden = true;
document.body.appendChild(hoverCard);

let hoverCardTimer = null;
let hoverCardRequest = 0;
const hoverProfileCache = new Map();

function formatHoverDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return [hours, minutes, secs]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}

function romanHoverLevel(number) {
  let n = Math.max(1, Math.floor(Number(number) || 1));
  const symbols = [
    [1000, "M"], [900, "CM"], [500, "D"],
    [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"],
    [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];

  let result = "";

  for (const [value, symbol] of symbols) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }

  return result;
}

function addHoverCardLine(label, value, color) {
  const line = document.createElement("div");

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label + " ";

  const valueSpan = document.createElement("span");
  valueSpan.textContent = String(value ?? "");

  if (color) valueSpan.style.color = color;

  line.append(labelSpan, valueSpan);
  hoverCard.appendChild(line);
}

function positionHoverCard(element) {
  const rect = element.getBoundingClientRect();

  const width = hoverCard.offsetWidth;
  const height = hoverCard.offsetHeight;

  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }

  if (top + height > window.innerHeight - 8) {
    top = rect.top - height - 6;
  }

  hoverCard.style.left = Math.max(8, left) + "px";
  hoverCard.style.top = Math.max(8, top) + "px";
}

function hideUsernameHoverCard() {
  clearTimeout(hoverCardTimer);
  hoverCardRequest++;
  hoverCard.hidden = true;
}

async function showUsernameHoverCard(element) {
  const accountId = element.dataset.accountId;
  if (!accountId || !supabase) return;

  const request = ++hoverCardRequest;

  hoverCard.replaceChildren();
  addHoverCardLine("Loading", "profile...");
  hoverCard.hidden = false;
  positionHoverCard(element);

  try {
    let profile;
    const cached = hoverProfileCache.get(accountId);

    if (cached && Date.now() - cached.time < 15000) {
      profile = cached.profile;
    } else {
      const { data, error } = await supabase.rpc(
        "get_chat_hover_profile",
        { p_account_id: accountId }
      );

      if (error) throw error;

      profile = Array.isArray(data) ? data[0] : data;

      if (!profile) {
        throw new Error("Profile unavailable");
      }

      hoverProfileCache.set(accountId, {
        profile,
        time: Date.now()
      });
    }

    if (request !== hoverCardRequest) return;

    hoverCard.replaceChildren();

    addHoverCardLine(
      "Nickname",
      profile.nickname,
      validColor(profile.nickname_color)
    );

    addHoverCardLine("Unique ID", profile.account_id);

    addHoverCardLine(
      "User Level",
      romanHoverLevel(profile.level) +
        " (" + profile.level + ")" +
        ", Next Level in " +
        formatHoverDuration(profile.seconds_to_next_level)
    );

    addHoverCardLine(
      "Online Time",
      formatHoverDuration(profile.online_seconds)
    );

    addHoverCardLine(
      "Role",
      profile.role || "user"
    );

    addHoverCardLine(
      "BNC",
      profile.bnc_enabled ? "Yes" : "No"
    );

    if (profile.created_at) {
      addHoverCardLine(
        "Joined",
        new Date(profile.created_at).toLocaleDateString()
      );
    }

    positionHoverCard(element);

  } catch (error) {
    if (request !== hoverCardRequest) return;

    hoverCard.replaceChildren();
    addHoverCardLine(
      "Profile",
      "Unavailable"
    );

    console.warn("[Hover Card]", error.message);
  }
}

function attachUsernameHoverCard(element) {
  element.addEventListener("mouseenter", () => {
    clearTimeout(hoverCardTimer);

    hoverCardTimer = setTimeout(() => {
      showUsernameHoverCard(element);
    }, 250);
  });

  element.addEventListener(
    "mouseleave",
    hideUsernameHoverCard
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

  // Convert a level into Roman numerals.
  function toRoman(number) {
    let n = Math.floor(Number(number));

    if (!Number.isFinite(n) || n < 1) {
      n = 1;
    }

    const values = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"]
    ];

    let result = "";

    for (const [value, symbol] of values) {
      while (n >= value) {
        result += symbol;
        n -= value;
      }
    }

    return result;
  }

  const level = document.createElement("span");
  level.className = "chat-level";
  level.textContent =
    "[" + toRoman(data.level) + "]";

  level.style.color = "#609dff";

  const nick = document.createElement("span");
  nick.className = "nick";

  nick.textContent =
    "[" + String(data.nickname || "Guest") + "]";

  applyGlow(
    nick,
    data.account_id,
    data.nickname_color
  );
  
  attachUsernameHoverCard(nick);
  
  const content = document.createElement("span");
  content.className = "message";
  content.textContent = data.content;

  line.append(time, level, nick, content);
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

       attachUsernameHoverCard(name);

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

 // STEP 111D — Recover room Presence after Realtime reconnects.
let presenceRecoveryRunning = false;
let lastPresenceRecoveryAttempt = 0;

async function recoverRoomPresence(expectedChannel = channel) {
  if (
    presenceRecoveryRunning ||
    switching ||
    !profile ||
    !currentRoomId ||
    !expectedChannel ||
    channel !== expectedChannel ||
    expectedChannel.state !== "joined"
  ) return;

  // Avoid hammering Realtime if a Presence sync is delayed.
  const now = Date.now();
  if (now - lastPresenceRecoveryAttempt < 8000) return;
  lastPresenceRecoveryAttempt = now;
  presenceRecoveryRunning = true;

  try {
    const result = await expectedChannel.track({
      account_id: profile.account_id,
      nickname: profile.nickname,
      nickname_color: validColor(profile.nickname_color)
    });

    if (channel !== expectedChannel) return;

    if (result === "ok") {
      presenceWorking = true;
      renderUsers();
      console.log("[Presence] Re-tracked after reconnect/check.");
    } else {
      console.warn("[Presence] Recovery track result:", result);
    }
  } catch (error) {
    console.warn("[Presence] Recovery failed:", error);
  } finally {
    presenceRecoveryRunning = false;
  }
}

// A lost Presence entry can also happen without a fresh SUBSCRIBED event.
// Verify our own account is still in the current channel's Presence state.
setInterval(() => {
  if (
    !channel ||
    !profile ||
    !currentRoomId ||
    switching ||
    channel.state !== "joined"
  ) return;

  const state = channel.presenceState();
  const myAccountId = String(profile.account_id);
  const found = Object.values(state).some(entries =>
    Array.isArray(entries) && entries.some(entry =>
      String(entry?.account_id || "") === myAccountId
    )
  );

  if (!found) recoverRoomPresence(channel);
}, 12000);

// --------------------------------------------------
// JOIN ROOMS
// --------------------------------------------------

async function joinRoom(roomName, roomType = "public") {
  if (
    chatAccountBanned ||
    !supabase ||
    !profile ||
    switching
  ) {
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
      let initiallySubscribed = false;

      newChannel.subscribe((state, error) => {
        if (channel !== newChannel) return;

        if (state === "SUBSCRIBED") {
          if (!initiallySubscribed) {
            initiallySubscribed = true;
            resolve();
          } else {
            // A re-subscription may reset server-side Presence.
            // Re-track instead of only redrawing the user list.
            recoverRoomPresence(newChannel);
          }

        } else if (
          state === "CHANNEL_ERROR" ||
          state === "TIMED_OUT" ||
          state === "CLOSED"
        ) {
          presenceWorking = false;
          userNames.replaceChildren();

          if (!initiallySubscribed) {
            reject(
              error ||
              new Error("Realtime subscription failed")
            );
          }
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

  // Clear the rejected message, but don't erase
  // anything new typed while the request was pending.
  if (sendArea.value.trim() === content) {
    sendArea.value = "";
  } else if (sendArea.value.startsWith(content)) {
    sendArea.value = sendArea.value.slice(content.length);
  }

  return;
}



if (data?.status === "sent") {
  // Clear the submitted message, but preserve anything
  // the user typed while waiting for the server.
  if (sendArea.value.trim() === content) {
    sendArea.value = "";
  } else if (sendArea.value.startsWith(content)) {
    sendArea.value = sendArea.value.slice(content.length);
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
// STEP 117L-3 — Check account ban status on startup.
const { data: banStatus, error: banStatusError } =
  await supabase.rpc("my_chat_ban_status");

if (banStatusError) {
  throw banStatusError;
}

if (banStatus === true) {
  chatAccountBanned = true;

  setInputReady(false);
  setStatus("This account has been banned.", true);

  privateWarning(
    "Your account has been banned from SolarEraser Chat."
  );

  return;
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
  setInterval(checkKickEvents, 10000);

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
if (type === "ban") {
  chatAccountBanned = true;

  // Invalidate any pending room connection.
  connectionNumber++;

  // Disconnect from the current chat room.
  try {
    await leaveChannel();
  } catch (error) {
    console.warn("[Ban] Disconnect:", error);
  }

  currentRoom = null;
  currentRoomId = null;
  currentRoomType = null;
  presenceWorking = false;

  userNames.replaceChildren();
  messages.replaceChildren();

  // Prevent further messages and room changes.
  setInputReady(false);
  sendArea.placeholder = "Account banned";
  roomSelector.disabled = true;

  setStatus("This account has been banned.", true);

  privateWarning(
    "Your account has been banned from SolarEraser Chat."
  );

  // Mark the private moderation event as processed.
  const { error: ackError } = await supabase.rpc(
    "ack_chat_mod_event",
    { p_event_id: event.event_id }
  );

  if (ackError) {
    console.warn(
      "[Ban] Could not acknowledge event:",
      ackError.message
    );
  }

  break;
}
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

  setInterval(checkTimeoutEvents, 10000);

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

/*
  SolarEraser Chat — Step 111C-4
  Private Realtime moderation notifications

  Keep all existing code above this block.
  Existing polling remains as backup.
*/

(function installRealtimeModeration() {
  let moderationChannel = null;
  let connecting = false;
  let processing = false;

  async function processModerationEvents() {
    if (
      processing ||
      !supabase ||
      !profile ||
      !currentRoomId ||
      switching
    ) return;

    processing = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        const type = event.event_type;

        if (
  type !== "kick" &&
  type !== "timeout" &&
  type !== "untimeout" &&
  type !== "ban"
) {
  continue;
}

        // Ban events must be handled by the existing
        // ban listener, not treated as an untimeout.
        if (type === "ban") {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const stillInSource =
          String(currentRoomId || "") === sourceRoom;

        if (stillInSource) {
          const destination =
            type === "timeout" ? "Spam" : "Main Room";

          const moved = await joinRoom(
            destination,
            "public"
          );

          if (!moved) break;

          if (type === "kick") {
            privateWarning(
              "You were kicked to Main Room."
            );
          } else if (type === "timeout") {
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
            { p_event_id: event.event_id }
          );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Realtime moderation]",
        error.message
      );
    } finally {
      processing = false;
    }
  }

  async function connectModerationChannel() {
    if (
      connecting ||
      moderationChannel ||
      !supabase ||
      !authUserId ||
      !profile
    ) return;

    connecting = true;

    try {
      const { data: sessionData } =
        await supabase.auth.getSession();

      const token =
        sessionData.session?.access_token;

      if (!token) {
        throw new Error("No auth token.");
      }

      await supabase.realtime.setAuth(token);

      const topic = "chat-mod:" + authUserId;

      const newChannel = supabase.channel(
        topic,
        {
          config: {
            private: true
          }
        }
      );

      newChannel.on(
        "broadcast",
        { event: "moderation_changed" },
        () => {
          processModerationEvents();
        }
      );

      moderationChannel = newChannel;

      newChannel.subscribe(status => {
        if (status === "SUBSCRIBED") {
          console.log(
            "[Moderation] Private Realtime connected!"
          );

          processModerationEvents();
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.warn(
            "[Moderation] Channel status:",
            status
          );

          if (moderationChannel === newChannel) {
            moderationChannel = null;
          }
        }
      });

    } catch (error) {
      console.warn(
        "[Moderation] Connection failed:",
        error.message
      );
    } finally {
      connecting = false;
    }
  }

  // Wait until anonymous login and profile load.
  const startupTimer = setInterval(() => {
    if (!supabase || !authUserId || !profile) {
      return;
    }

    clearInterval(startupTimer);
    connectModerationChannel();
  }, 1000);

  // Retry connection occasionally if necessary.
  setInterval(() => {
    if (
      supabase &&
      authUserId &&
      profile &&
      !moderationChannel
    ) {
      connectModerationChannel();
    }
  }, 30000);

  console.log(
    "[SolarEraser Chat] " +
    "Step 111C Realtime moderation loaded!"
  );
})();

/*
  SolarEraser Chat — Step 113A
  Electric-blue SERVER announcements

  Presentation only.
  Trusted server event integration comes in Step 113B.
*/

(function installBlueServerAnnouncements() {
  const style = document.createElement("style");

  style.textContent = `
    .solar-server-name {
      color: #38A8FF !important;
      font-weight: 700;
      text-shadow:
        0 0 4px #38A8FF,
        0 0 9px #168AFF,
        0 0 16px #006DFF;
    }

    .solar-server-text {
      color: #B9E0FF !important;
      text-shadow:
        0 0 4px rgba(56,168,255,.65),
        0 0 9px rgba(56,168,255,.25);
    }

    .solar-server-target {
      color: #D5EEFF;
      cursor: pointer;
      text-decoration: none;
    }

    .solar-server-target:hover {
      text-decoration: underline;
    }
  `;

  document.head.appendChild(style);

  function displayServerAnnouncement(event) {
    if (!event || typeof event !== "object") return;

    const messagesContainer =
      document.querySelector(".messages");

    if (!messagesContainer) return;

    const allowedTypes = {
      kick: "was kicked to Main Room.",
      timeout: "was timed out and moved to Spam.",
      untimeout: "was released from timeout.",
      ban: "was permanently banned from the server."
    };

    const action = allowedTypes[event.type];

    if (!action) return;

    const nickname = String(
      event.nickname || "Unknown user"
    );

    const line = document.createElement("div");
    line.className = "message_item solar-server-line";

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

    const server = document.createElement("span");
    server.className = "nick solar-server-name";
    server.textContent = "SERVER";

    const message = document.createElement("span");
    message.className = "message solar-server-text";

    const target = document.createElement("span");
    target.className = "solar-server-target";
    target.textContent = nickname;

    const accountId = String(event.account_id || "");

    if (accountId) {
      target.title = "Click to copy account ID";

      target.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(accountId);
        } catch (error) {
          console.warn("[SERVER] Copy failed:", error);
        }
      });
    } else {
      target.style.cursor = "default";
    }

    message.append(
      target,
      document.createTextNode(" " + action)
    );

    line.append(time, server, message);

    messagesContainer.appendChild(line);

    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  }

  // Internal renderer only. Step 113B will connect
  // this to authenticated, server-generated events.
  window.solarRenderServerAnnouncement =
    displayServerAnnouncement;

  console.log(
    "[SolarEraser Chat] Step 113A blue SERVER ready!"
  );
})();

/*
  SolarEraser Chat — Step 113B-7
  Trusted SERVER announcement polling
*/


/*
  SolarEraser Chat — Step 113C-2
  Database-cursor SERVER announcement listener
*/


/*
  SolarEraser Chat — Step 113C-3D
  Room-session-aware SERVER announcement listener
*/


/*
  SolarEraser Chat — Step 113C-2
  Database-cursor SERVER announcement listener
*/
(function installServerAnnouncementListener() {
  let trackedRoomId = null;
  let lastAnnouncementId = 0;
  let initialized = false;
  let checking = false;
  let generation = 0;

  async function checkServerAnnouncements() {
    if (
      !supabase ||
      !currentRoomId ||
      switching ||
      typeof window.solarRenderServerAnnouncement !== "function"
    ) return;

    const roomId = String(currentRoomId);

    if (trackedRoomId !== roomId) {
      trackedRoomId = roomId;
      lastAnnouncementId = 0;
      initialized = false;
      generation++;
    }

    if (checking) return;
    checking = true;

    const requestGeneration = generation;

    try {
      if (!initialized) {
        const { data, error } = await supabase.rpc(
          "get_chat_server_announcement_cursor",
          { p_room_id: roomId }
        );

        if (error) throw error;

        if (
          switching ||
          String(currentRoomId) !== roomId ||
          requestGeneration !== generation
        ) return;

        lastAnnouncementId = Number(data) || 0;
        initialized = true;
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_chat_server_announcements",
        {
          p_room_id: roomId,
          p_after_id: lastAnnouncementId
        }
      );

      if (error) throw error;

      if (
        switching ||
        String(currentRoomId) !== roomId ||
        requestGeneration !== generation
      ) return;

      for (const announcement of data || []) {
        const id = Number(announcement.id);

        if (!Number.isSafeInteger(id)) continue;
        if (id <= lastAnnouncementId) continue;

        lastAnnouncementId = id;

        window.solarRenderServerAnnouncement({
          type: announcement.event_type,
          nickname: announcement.target_nickname,
          account_id: announcement.target_account_id
        });
      }

    } catch (error) {
      console.warn(
        "[SERVER] Announcement check failed:",
        error.message
      );
    } finally {
      checking = false;
    }
  }

  setInterval(checkServerAnnouncements, 2000);
  setTimeout(checkServerAnnouncements, 500);

  console.log(
    "[SolarEraser Chat] Step 113C cursor listener loaded!"
  );
})();

// ==================================================
// STEP 114N — Live presence heartbeat for /rooms
// ==================================================

(function installChatLivePresenceHeartbeat() {
  let heartbeatRunning = false;

  async function sendPresenceHeartbeat() {
    if (
      !supabase ||
      !profile ||
      !currentRoomId ||
      !channel ||
      switching ||
      heartbeatRunning
    ) {
      return;
    }

    // Only report presence while our Realtime
    // channel is successfully connected.
    if (channel.state !== "joined") return;

    heartbeatRunning = true;

    const roomId = String(currentRoomId);

    try {
      const { error } = await supabase.rpc(
        "heartbeat_chat_presence",
        { p_room_id: roomId }
      );

      if (error) throw error;

    } catch (error) {
      console.warn(
        "[Rooms] Presence heartbeat failed:",
        error.message
      );

    } finally {
      heartbeatRunning = false;
    }
  }

  // Update every 15 seconds.
  setInterval(sendPresenceHeartbeat, 15000);

  // First heartbeat shortly after connecting.
  setTimeout(sendPresenceHeartbeat, 3000);

  console.log(
    "[SolarEraser Chat] Step 114N heartbeat loaded!"
  );
})();
// ==================================================
// STEP 114O — Admin-only /rooms popup
// ==================================================

(function installAdminRoomsCommand() {
  const previousHandleCommand = handleCommand;

  // Create popup.
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100000",
    "background:rgba(0,0,0,.65)",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:16px"
  ].join(";");

  const popup = document.createElement("div");
  popup.style.cssText = [
    "background:#202431",
    "color:#e9eaf5",
    "border:1px solid #41475c",
    "border-radius:8px",
    "padding:18px",
    "width:min(420px,100%)",
    "max-height:75vh",
    "overflow-y:auto",
    "font:13px Arial,sans-serif"
  ].join(";");

  const heading = document.createElement("div");
  heading.style.cssText =
    "display:flex;justify-content:space-between;" +
    "align-items:center;margin-bottom:14px;";

  const title = document.createElement("strong");
  title.textContent = "Active Rooms";
  title.style.fontSize = "16px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";
  closeButton.style.cssText =
    "background:none;border:0;color:#aaa;" +
    "font-size:18px;cursor:pointer;";

  closeButton.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  heading.append(title, closeButton);

  const content = document.createElement("div");
  popup.append(heading, content);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      overlay.style.display = "none";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      overlay.style.display = "none";
    }
  });

  async function showActiveRooms() {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }
    try {
      const { data, error } = await supabase.rpc(
        "get_admin_active_rooms"
      );

      if (error) {
        privateWarning("Invalid command");
        return;
      }

      const rooms = Array.isArray(data) ? data : [];

      // Only show the popup AFTER Supabase
      // has successfully authorized the request.
      content.replaceChildren();
      overlay.style.display = "flex";

      if (!rooms.length) {
        content.textContent = "No active rooms.";
        return;
      }

      let totalUsers = 0;

      for (const room of rooms) {
        const count = Number(room.online_users) || 0;
        totalUsers += count;

        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;justify-content:space-between;" +
          "gap:12px;padding:10px 0;" +
          "border-bottom:1px solid #353a4b;";

        const roomName = document.createElement("span");
        roomName.textContent =
          (room.room_type === "private" ? "🔒 " : "🌐 ") +
          room.room_name;

        const users = document.createElement("span");
        users.style.whiteSpace = "nowrap";
        users.style.color = "#aaaec7";
        users.textContent =
          count + (count === 1 ? " user" : " users");

        row.append(roomName, users);
        content.appendChild(row);
      }

      const footer = document.createElement("div");
      footer.style.cssText =
        "margin-top:14px;font-weight:bold;" +
        "display:flex;justify-content:space-between;gap:10px;";

      const totalRooms = document.createElement("span");
      totalRooms.textContent = rooms.length + " active rooms";

      const total = document.createElement("span");
      total.textContent = totalUsers + " users";

      footer.append(totalRooms, total);
      content.appendChild(footer);

       } catch (error) {
      console.warn("[Rooms] Request failed:", error);
      privateWarning("Invalid command");
    }
  }

  handleCommand = async function(content) {
    if (/^\/rooms(?:\s*)$/i.test(content)) {
      await showActiveRooms();
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 114O /rooms loaded!"
  );
})();
// ==================================================
// STEP 115C — Admin-only /find USER_ID
// ==================================================

(function installAdminFindCommand() {
  const previousHandleCommand = handleCommand;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Private popup, matching the /rooms design.
  const overlay = document.createElement("div");

  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100001",
    "background:rgba(0,0,0,.65)",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:16px"
  ].join(";");

  const popup = document.createElement("div");

  popup.style.cssText = [
    "background:#202431",
    "color:#e9eaf5",
    "border:1px solid #41475c",
    "border-radius:8px",
    "padding:18px",
    "width:min(420px,100%)",
    "max-height:75vh",
    "overflow-y:auto",
    "font:13px Arial,sans-serif"
  ].join(";");

  const heading = document.createElement("div");

  heading.style.cssText =
    "display:flex;justify-content:space-between;" +
    "align-items:center;margin-bottom:14px;";

  const title = document.createElement("strong");
  title.textContent = "Find User";
  title.style.fontSize = "16px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";

  closeButton.style.cssText =
    "background:none;border:0;color:#aaa;" +
    "font-size:18px;cursor:pointer;";

  const content = document.createElement("div");

  function closePopup() {
    overlay.style.display = "none";
  }

  closeButton.addEventListener("click", closePopup);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closePopup();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePopup();
  });

  heading.append(title, closeButton);
  popup.append(heading, content);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  function addResultRow(label, value) {
    const row = document.createElement("div");

    row.style.cssText =
      "display:flex;justify-content:space-between;" +
      "gap:12px;padding:10px 0;" +
      "border-bottom:1px solid #353a4b;";

    const name = document.createElement("span");
    name.textContent = label;
    name.style.color = "#aaaec7";

    const result = document.createElement("span");
    result.textContent = String(value);
    result.style.textAlign = "right";
    result.style.overflowWrap = "anywhere";

    row.append(name, result);
    content.appendChild(row);
  }

  async function findUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Never show a popup before server authorization.
    // A malformed ID gets the same generic response
    // as an unrecognized command.
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Invalid command");
      return;
    }

    try {
      const { data, error } = await supabase.rpc(
        "admin_find_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        privateWarning("Invalid command");
        return;
      }

      // Authorization succeeded.
      const user = Array.isArray(data) ? data[0] : data;

      content.replaceChildren();

      if (!user) {
        content.textContent = "User not found.";
        overlay.style.display = "flex";
        return;
      }

      addResultRow("Username", user.nickname || "Unknown");
      addResultRow("Account ID", user.account_id);
      addResultRow(
        "Status",
        user.online_status === "Online" ? "Online" : "Offline"
      );
      addResultRow(
        "Room",
        user.online_status === "Online"
          ? (user.room_name || "Unknown")
          : "None"
      );
      addResultRow(
        "Room Type",
        user.online_status === "Online"
          ? (
              user.room_type === "private"
                ? "Private"
                : "Public"
            )
          : "None"
      );

      overlay.style.display = "flex";

    } catch (error) {
      console.warn("[Find] Request failed:", error);
      privateWarning("Invalid command");
    }
  }

  // Intercept only /find.
  // Every other command continues working unchanged.
  handleCommand = async function(content) {
    const match = content.match(
      /^\/find(?:\s+(.*))?$/i
    );

    if (match) {
      await findUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 115C /find loaded!"
  );
})();

/*
  STEP 117O — Global staff /ban command
  Preserves all existing commands.
*/

(function installBanCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let banning = false;

  async function banUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Verify staff permissions on the server before
    // revealing command-specific usage or errors.
    const { data: staffData, error: staffError } =
      await supabase.rpc("get_admin_active_rooms");

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Usage: /ban USER_ID");
      return;
    }

    if (banning) return;
    banning = true;

    try {
      const { error } = await supabase.rpc(
        "ban_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        if (error.message === "Invalid command") {
          privateWarning("Invalid command");
        } else {
          privateWarning("Ban failed: " + error.message);
        }
        return;
      }

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning("Ban failed: " + error.message);

    } finally {
      banning = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/ban(?:\s+(.*))?$/i
    );

    if (match) {
      await banUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 117O /ban loaded!"
  );
})();

/*
  STEP 118C — Silent /unban command
  Global staff only.
  Preserves all existing commands.
*/

(function installUnbanCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let unbanning = false;

  async function unbanUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Verify global staff authorization first.
    const { error: staffError } = await supabase.rpc(
      "get_admin_active_rooms"
    );

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Usage: /unban USER_ID");
      return;
    }

    if (unbanning) return;
    unbanning = true;

    try {
      const { error } = await supabase.rpc(
        "unban_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        if (error.message === "Invalid command") {
          privateWarning("Invalid command");
        } else {
          privateWarning(
            "Unban failed: " + error.message
          );
        }
        return;
      }

      // Silent success: no SERVER announcement,
      // no public message, no popup.
      // The user can reconnect after refreshing.

    } catch (error) {
      privateWarning(
        "Unban failed: " + error.message
      );

    } finally {
      unbanning = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/unban(?:\s+(.*))?$/i
    );

    if (match) {
      await unbanUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 118C /unban loaded!"
  );
})();

/*
  STEP 119A — Clickable chat usernames

  Normal click: copy and append nickname.
  Shift-click: copy and append account ID.
  Works on old messages, even after users leave.
*/

(function installChatUsernameClicks() {
  messages.addEventListener("click", async event => {
    const name = event.target.closest(
      ".nick[data-account-id]"
    );

    if (!name || !messages.contains(name)) {
      return;
    }

    const value = event.shiftKey
      ? name.dataset.accountId
      : name.textContent;

    if (!value) return;

    // Keep existing text in the message input.
    const existing = sendArea.value;

    const separator =
      existing.length > 0 && !/\s$/.test(existing)
        ? " "
        : "";

    sendArea.value = existing + separator + value;

    sendArea.focus();
    sendArea.setSelectionRange(
      sendArea.value.length,
      sendArea.value.length
    );

    // Copy nickname or account ID.
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.warn("[Chat username copy]", error);
    }
  });

  // Show users that chat usernames are clickable.
  const style = document.createElement("style");

  style.textContent = `
    .messages .nick[data-account-id] {
      cursor: pointer;
    }

    .messages .nick[data-account-id]:hover {
      text-decoration: underline;
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 119A] Chat usernames are clickable!"
  );
})();

/*
  STEP 120B — SolarEraser Chat welcome messages

  Pink: welcome
  Green: instructions
  Yellow: safety reminder

  Displayed once per room entry.
  Scrolls naturally with chat messages.
*/

(function installWelcomeMessages() {
  const originalJoinRoom = joinRoom;

  const welcomeLines = [
    {
      color: "#ff76ca",
      text: "Welcome to SolarEraser Chat!"
    },
    {
      color: "#60df73",
      text: "Type /help to see available commands."
    },
    {
      color: "#60df73",
      text: "To change your nickname, type /nick followed by your new name."
    },
    {
      color: "#60df73",
      text: "To join a private room, type /join followed by the room name."
    },
    {
      color: "#ffd447",
      text: "Please respect other users and avoid sharing personal information."
    }
  ];

  function showWelcomeMessages() {
    if (chatAccountBanned || !currentRoomId) return;

    const time = new Date().toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );

    const fragment = document.createDocumentFragment();

    for (const item of welcomeLines) {
      const line = document.createElement("div");
      line.className = "message_item";
line.dataset.solarWelcome = "true";
      const content = document.createElement("span");
      content.className = "message";
      content.style.color = item.color;
      content.textContent = "[" + time + "] " + item.text;

      line.appendChild(content);
      fragment.appendChild(line);
    }

    messages.prepend(fragment);
  }

  joinRoom = async function(...args) {
    const previousRoomId = currentRoomId;
    const result = await originalJoinRoom(...args);

    if (
      result === true &&
      currentRoomId &&
      currentRoomId !== previousRoomId
    ) {
      showWelcomeMessages();
    }

    return result;
  };

  // Startup can begin before this block is installed.
  // Detect the initial room connection as well.
  let initialWelcomeShown = false;

  const initialCheck = setInterval(() => {
    if (initialWelcomeShown || chatAccountBanned) {
      clearInterval(initialCheck);
      return;
    }

    if (currentRoomId && channel && !switching) {
      initialWelcomeShown = true;
      clearInterval(initialCheck);

      // Avoid displaying twice if the join wrapper
      // already inserted the welcome messages.
      if (!messages.querySelector(
        '[data-solar-welcome="true"]'
      )) {
        showWelcomeMessages();
      }
    }
  }, 250);

  console.log("[Step 120B] Welcome messages loaded!");
})();

/*
  STEP 121B — Scrolling room topics

  Main Room: welcome instructions
  Spam: timeout explanation
  Private rooms: ownership and /topic

  /topic will be implemented later.
*/

(function installScrollingRoomTopics() {
  const MAIN_TOPIC =
    "Welcome to SolarEraser Chat! " +
    "To change your nickname type /nick and your new nickname. " +
    "To join a room type /join and the room name. " +
    "If you experience any lag, try disabling some options " +
    "in the ⚙️ settings panel.";

  const SPAM_TOPIC =
    "If you were moved here, that means you have been " +
    "temporarily timed out. Spamming is allowed here.";

  const PRIVATE_TOPIC =
    "If your nickname glows, you are the current owner " +
    "of the room. You can change this topic by typing " +
    "/topic and the new room topic.";

  const topicBar = document.createElement("div");
  topicBar.id = "solar-room-topic";

  const topicText = document.createElement("span");
  topicText.id = "solar-room-topic-text";

  topicBar.appendChild(topicText);

  const topicStyle = document.createElement("style");

  topicStyle.textContent = `
    #solar-room-topic {
      width: 100%;
      height: 22px;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
      background: #292929;
      border-bottom: 1px solid #555;
      color: #ff76ca;
      font: 12px Arial, sans-serif;
      display: flex;
      align-items: center;
    }

    #solar-room-topic-text {
      display: inline-block;
      white-space: nowrap;
      flex: none;
      padding-left: 100%;
      animation: solarTopicScroll 28s linear infinite;
      will-change: transform;
    }

    @keyframes solarTopicScroll {
      from {
        transform: translateX(0);
      }

      to {
        transform: translateX(-100%);
      }
    }
  `;

  document.head.appendChild(topicStyle);

  // Place topic bar above the chat messages.
  messages.parentNode.insertBefore(topicBar, messages);

  let displayedTopic = "";

  function updateTopic() {
    let topic = MAIN_TOPIC;

    if (currentRoomType === "private") {
      topic = PRIVATE_TOPIC;
    } else if (currentRoom === "Spam") {
      topic = SPAM_TOPIC;
    }

    if (topic === displayedTopic) return;

    displayedTopic = topic;
    topicText.textContent = topic;

    // Restart scrolling when the topic changes.
    topicText.style.animation = "none";
    void topicText.offsetWidth;
    topicText.style.animation = "";
  }

  // Update immediately after switching rooms.
  const originalJoinRoom = joinRoom;

  joinRoom = async function(...args) {
    const result = await originalJoinRoom(...args);

    if (result === true) {
      updateTopic();
    }

    return result;
  };

  // Show the appropriate topic on startup.
  updateTopic();

  // Catch initial connection and moderation moves.
  setInterval(() => {
    if (currentRoomId && !switching) {
      updateTopic();
    }
  }, 500);

  console.log(
    "[Step 121B] Three scrolling room topics installed!"
  );
})();

/*
  STEP 121C — Move scrolling topic into toolbar

  Keep existing room topics and animation.
  Use a dark blue background.
*/

(function moveScrollingTopicToToolbar() {
  const topicBar = document.getElementById(
    "solar-room-topic"
  );

  const settingsButton = document.querySelector(
    '.menu_button[data-target="settings"]'
  );

  if (!topicBar || !settingsButton) {
    console.warn(
      "[Step 121C] Topic bar or settings button missing."
    );
    return;
  }

  const toolbar = settingsButton.parentElement;

  // Place topic alongside the toolbar controls.
  toolbar.appendChild(topicBar);

  // Make toolbar items sit side by side.
  toolbar.style.display = "flex";
  toolbar.style.alignItems = "center";

  // Allow topic to occupy remaining toolbar width.
  topicBar.style.flex = "1 1 0";
  topicBar.style.minWidth = "0";
  topicBar.style.width = "auto";
  topicBar.style.height = "24px";
  topicBar.style.marginLeft = "12px";

  // Darker blue than the main chat background.
  topicBar.style.background = "#0c1323";
  topicBar.style.border = "1px solid #202c46";
  topicBar.style.borderRadius = "4px";

  // Keep the existing pink scrolling text.
  topicBar.style.color = "#ff76ca";

  console.log(
    "[Step 121C] Topic moved into toolbar!"
  );
})();

/*
  STEP 122A — Dynamic input hint + connecting screen

  Shows the current nickname in the input bar.
  Shows a yellow connection notice until joined.
  Keeps the scrolling topic visible throughout.
*/

(function installChatVisualPolish() {
  const CONNECTING_TEXT = "Trying to connect...";

  // ------------------------------------------
  // 1. Dynamic nickname hint
  // ------------------------------------------

  function updateInputHint() {
    if (chatAccountBanned) return;

    const nickname = profile?.nickname || "Guest";

    if (!sendArea.disabled) {
      sendArea.placeholder =
        'You are typing as "' + nickname +
        '". To change nick, type /nick and your new nickname.';
    }
  }

  // Keep the hint updated after nickname changes,
  // reconnects and room switches.
  setInterval(updateInputHint, 500);

  // ------------------------------------------
  // 2. Connection message
  // ------------------------------------------

  let connectingNotice = null;

  function showConnectingNotice() {
    if (connectingNotice || chatAccountBanned) return;

    const line = document.createElement("div");
    line.className = "message_item";
    line.id = "solar-connecting-notice";

    const time = document.createElement("span");
    time.className = "time";
    time.textContent =
      "[" + new Date().toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      ) + "]";

    const text = document.createElement("span");
    text.className = "message";
    text.textContent = CONNECTING_TEXT;
    text.style.color = "#ffd447";
    text.style.fontWeight = "bold";

    line.append(time, text);

    messages.prepend(line);
    connectingNotice = line;
  }

  function removeConnectingNotice() {
    if (connectingNotice) {
      connectingNotice.remove();
      connectingNotice = null;
    }
  }

  // Display while the initial room is connecting.
  if (!currentRoomId && !chatAccountBanned) {
    showConnectingNotice();
  }

  // Monitor connection state without changing
  // the existing room or Realtime logic.
  setInterval(() => {
    if (chatAccountBanned) {
      removeConnectingNotice();
      return;
    }

    if (currentRoomId && channel && !switching) {
      removeConnectingNotice();
      updateInputHint();
    } else if (!currentRoomId && !switching) {
      showConnectingNotice();
    }
  }, 250);

  // ------------------------------------------
  // 3. Visual styling
  // ------------------------------------------

  const style = document.createElement("style");

  style.textContent = `
    .send_area::placeholder {
      color: #a6a9b8;
      opacity: 1;
      font-size: 12px;
    }

    #solar-connecting-notice .time {
      color: #ffd447;
      margin-right: 5px;
    }

    #solar-connecting-notice .message {
      color: #ffd447;
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 122A] Input hint and connection screen installed!"
  );
})();

/*
  STEP 123B — Mobile long-press account IDs

  Tap: existing nickname behavior.
  Hold: copy and append account ID.
  Works in user list and chat messages.
*/

(function installMobileLongPressIDs() {
  const HOLD_MS = 500;

  let holdTimer = null;
  let holdTarget = null;
  let holdStartX = 0;
  let holdStartY = 0;
  let suppressClick = false;

  const SELECTOR =
    ".right .name[data-account-id], " +
    ".messages .nick[data-account-id]";

  function cancelHold() {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  function getName(target) {
    return target.closest?.(SELECTOR);
  }

  document.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;

    const name = getName(event.target);
    if (!name) return;

    cancelHold();

    holdTarget = name;
    holdStartX = event.clientX;
    holdStartY = event.clientY;
    suppressClick = false;

    holdTimer = setTimeout(async () => {
      holdTimer = null;

      if (!holdTarget || !holdTarget.isConnected) return;

      const id = holdTarget.dataset.accountId;
      if (!id) return;

      suppressClick = true;

      // Preserve existing text.
      const existing = sendArea.value;
      const separator =
        existing && !/\s$/.test(existing) ? " " : "";

      sendArea.value = existing + separator + id;

      // Copy the account ID.
      try {
        await navigator.clipboard.writeText(id);
      } catch (error) {
        console.warn("[Long press copy]", error);
      }

      // Avoid forcing the mobile keyboard open.
      privateWarning("Account ID copied.");
    }, HOLD_MS);
  }, true);

  document.addEventListener("pointermove", event => {
    if (!holdTimer) return;

    const distanceX = Math.abs(
      event.clientX - holdStartX
    );

    const distanceY = Math.abs(
      event.clientY - holdStartY
    );

    // Scrolling should cancel a pending hold.
    if (distanceX > 12 || distanceY > 12) {
      cancelHold();
    }
  }, true);

  document.addEventListener("pointerup", cancelHold, true);
  document.addEventListener("pointercancel", cancelHold, true);

  // Stop the normal nickname click after a long hold.
  document.addEventListener("click", event => {
    if (!suppressClick) return;

    const name = getName(event.target);
    if (!name) return;

    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  // Prevent mobile text selection on usernames.
  const style = document.createElement("style");

  style.textContent = `
    @media (pointer: coarse) {
      .right .name[data-account-id],
      .messages .nick[data-account-id] {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-y;
      }
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 123B] Mobile long-press IDs installed!"
  );
})();

/*
  STEP 124H — /admin_authority

  /admin_authority USER_ID
    Grants admin authority.

  /admin_authority remove USER_ID
    Removes admin authority.

  Database verifies all permissions.
  Existing commands remain unchanged.
*/

(function installAdminAuthorityCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let authorityBusy = false;

  async function runAdminAuthority(rawArgs) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Check staff access before revealing usage.
    const { error: staffError } = await supabase.rpc(
      "get_admin_active_rooms"
    );

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    const args = rawArgs.trim().split(/\s+/);

    let grant = true;
    let targetId = "";

    if (args[0]?.toLowerCase() === "remove") {
      grant = false;
      targetId = args[1] || "";

      if (args.length !== 2) targetId = "";
    } else {
      targetId = args[0] || "";

      if (args.length !== 1) targetId = "";
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /admin_authority USER_ID " +
        "or /admin_authority remove USER_ID"
      );
      return;
    }

    if (authorityBusy) return;
    authorityBusy = true;

    try {
      const { data, error } = await supabase.rpc(
        "set_chat_admin_authority",
        {
          p_target_account_id: targetId,
          p_grant: grant
        }
      );

      if (error) {
        if (
          error.message === "Permission denied" ||
          error.message === "Not authenticated"
        ) {
          privateWarning("Invalid command");
        } else {
          privateWarning(
            "Admin authority failed: " + error.message
          );
        }
        return;
      }

      privateWarning(
        data || "Admin authority updated successfully."
      );

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "Admin authority failed: " + error.message
      );

    } finally {
      authorityBusy = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/admin_authority(?:\s+(.*))?$/i
    );

    if (match) {
      await runAdminAuthority(match[1] || "");
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 124H /admin_authority loaded!"
  );
})();

/*
  STEP 125B — SOLARERASER CHAT UPDATE NOTIFIER

  Checks version.json every 30 seconds.
  Shows a top-right popup when a new version
  becomes available.

  Does not automatically refresh the page.
*/

(function installUpdateNotifier() {
  const VERSION_URL = "./version.json";
  const CHECK_INTERVAL = 30000;

  let currentVersion = null;
  let updateAvailable = false;
  let checking = false;

  const notification = document.createElement("div");

  notification.id = "solar-update-notification";

  notification.style.cssText = [
    "position:fixed",
    "top:15px",
    "right:15px",
    "z-index:99999",
    "width:min(310px,calc(100vw - 30px))",
    "box-sizing:border-box",
    "background:#171a24",
    "border:1px solid #7774e8",
    "border-radius:8px",
    "padding:13px",
    "color:#f1f1f7",
    "font:13px Arial,sans-serif",
    "box-shadow:0 6px 25px #0009",
    "display:none"
  ].join(";");

  const heading = document.createElement("div");

  heading.textContent = "🔄 New version available!";

  heading.style.cssText =
    "font-weight:bold;color:#ff76ca;" +
    "font-size:14px;margin-bottom:8px;";

  const description = document.createElement("div");

  description.textContent =
    "A new version of SolarEraser Chat is available. " +
    "Refresh to get the latest features.";

  description.style.cssText =
    "line-height:1.5;margin-bottom:12px;";

  const refreshButton = document.createElement("button");

  refreshButton.textContent = "Refresh";

  refreshButton.style.cssText =
    "background:#7774e8;color:white;border:0;" +
    "border-radius:5px;padding:7px 15px;" +
    "font-weight:bold;cursor:pointer;";

  const actions = document.createElement("div");

  actions.style.cssText =
    "display:flex;justify-content:flex-end;";

  actions.appendChild(refreshButton);

  notification.append(
    heading,
    description,
    actions
  );

  document.body.appendChild(notification);

  refreshButton.addEventListener("click", () => {
    // Reload with a unique URL to bypass page caching.
    const url = new URL(window.location.href);

    url.searchParams.set(
      "v",
      String(Date.now())
    );

    window.location.replace(url.toString());
  });

  async function checkForUpdates() {
    if (checking || updateAvailable) return;

    checking = true;

    try {
      const response = await fetch(
        VERSION_URL + "?t=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Version check failed: " + response.status
        );
      }

      const data = await response.json();

      const latestVersion = String(
        data.version || ""
      ).trim();

      if (!latestVersion) return;

      if (currentVersion === null) {
        currentVersion = latestVersion;

        console.log(
          "[Updates] Current version:",
          currentVersion
        );

        return;
      }

      if (latestVersion !== currentVersion) {
        updateAvailable = true;

        notification.style.display = "block";

        console.log(
          "[Updates] New version detected:",
          latestVersion
        );
      }

    } catch (error) {
      console.warn(
        "[Updates] Could not check version:",
        error.message
      );

    } finally {
      checking = false;
    }
  }

  // Check immediately, then every 30 seconds.
  checkForUpdates();

  setInterval(
    checkForUpdates,
    CHECK_INTERVAL
  );

  console.log(
    "[SolarEraser Chat] Step 125B update notifier loaded!"
  );
})();

 // STEP 125F — Automatic deployment test

/*
  SolarEraser Chat — Step 129A
  Permission-aware /help command.

  /glow and /g intentionally remain secret.
*/


/*
  SolarEraser Chat — Step 129B
  Pink, clickable, permission-aware /help.
*/

(function installChatHelp() {
  const previousHandleCommand = handleCommand;

  async function showChatHelp() {
    if (!supabase || !currentRoomId) {
      privateWarning("Connect to a room first.");
      return;
    }

    try {
      const requestedRoom = String(currentRoomId);

      const { data, error } = await supabase.rpc(
        "get_chat_help_permissions",
        { p_room_id: requestedRoom }
      );

      if (error) throw error;

      if (String(currentRoomId) !== requestedRoom) {
        return;
      }

      const permissions = Array.isArray(data)
        ? data[0]
        : data;

      if (!permissions) {
        privateWarning("Help is unavailable in this room.");
        return;
      }

      const role = String(
        permissions.global_role || "user"
      ).toLowerCase();

      const isOwner = role === "owner";
      const isStaff = [
        "owner", "admin", "manager"
      ].includes(role);

      const isPrivateOwner =
        permissions.is_private_owner === true;

      const commands = [
        "/nick",
        "/join",
        "/recover",
        "/recover_code"
      ];

      if (isPrivateOwner || isStaff) {
        commands.push("/kick");
      }

      if (isStaff) {
        commands.push(
          "/ban",
          "/timeout",
          "/untimeout",
          "/rooms",
          "/find"
        );
      }

      if (isOwner) {
        commands.push(
          "/admin_authority",
          ".server"
        );
      }

      // /glow and /g are intentionally hidden.

      const line = document.createElement("div");
      line.className = "chat-help-line";

      const timestamp = document.createElement("span");
      timestamp.className = "chat-help-time";
      timestamp.textContent =
        "[" + new Date().toLocaleTimeString(
          "en-US",
          { hour12: false }
        ) + "] ";

      const heading = document.createElement("span");
      heading.className = "chat-help-heading";
      heading.textContent = "COMMANDS";

      line.append(timestamp, heading);

      for (const command of commands) {
        const item = document.createElement("span");
        item.className = "chat-help-command";
        item.textContent = command;
        item.title = "Insert " + command;

        item.addEventListener("click", () => {
          // Use the existing chat input.
          sendArea.value = command + " ";
          sendArea.dispatchEvent(
            new Event("input", { bubbles: true })
          );
          sendArea.focus();
        });

        line.appendChild(item);
      }

      messages.appendChild(line);

      line.scrollIntoView({
        block: "end",
        behavior: "smooth"
      });

    } catch (error) {
      privateWarning(
        "Help failed: " + error.message
      );
    }
  }

  handleCommand = async function(content) {
    if (/^\/help\s*$/i.test(content)) {
      await showChatHelp();
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 129B /help loaded!"
  );
})();
