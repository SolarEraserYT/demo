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

// Rebuild the user list whenever verified glow changes.
renderUsers();

// Keep existing message glow effects updated.
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

