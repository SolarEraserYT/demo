// --------------------------------------------------
// ONLINE USERS AND CLICKABLE IDS
// --------------------------------------------------

// BNC accounts displayed alongside live Realtime Presence users.
let bncUsers = new Map();
// Fetch BNC accounts assigned to the current room.
async function refreshBncUsers() {
  if (!supabase || !currentRoomId || !channel) {
    bncUsers.clear();
    return;
  }

  const roomId = currentRoomId;

  try {
    const { data, error } = await supabase.rpc(
      "get_chat_room_bnc_users",
      { p_room_id: roomId }
    );

    if (error) throw error;

    // Ignore responses from a room we already left.
    if (currentRoomId !== roomId || !channel) return;

    const updated = new Map();

    for (const person of data || []) {
      if (!person.account_id) continue;

      const accountId = String(person.account_id);

      updated.set(accountId, {
        accountId,
        nickname: String(person.nickname || "Guest"),
        color: validColor(person.nickname_color)
      });
    }

    bncUsers = updated;
    renderUsers();

  } catch (error) {
    console.warn("[BNC] User refresh failed:", error);
  }
}
// Passively refresh BNC users every 15 seconds.
setInterval(() => {
  if (
    !supabase ||
    !channel ||
    !currentRoomId ||
    !presenceWorking ||
    switching
  ) return;

  refreshBncUsers();
}, 15000);

/* ==========================================
   STEP 136BH — FETCH VERIFIED USER LEVELS
   ========================================== */

const pendingUserLevelRequests = new Set();

async function fetchVerifiedUserLevel(accountId) {
  const id = String(accountId || "");

  if (
    !id ||
    !supabase ||
    verifiedUserLevels.has(id) ||
    pendingUserLevelRequests.has(id)
  ) return;

  pendingUserLevelRequests.add(id);

  try {
    const { data, error } = await supabase.rpc(
      "get_chat_hover_profile",
      { p_account_id: id }
    );

    if (error) throw error;

    const user = Array.isArray(data) ? data[0] : data;

    if (!user) return;

    const level = Math.max(
      1,
      Math.floor(Number(user.level) || 1)
    );

    verifiedUserLevels.set(id, level);

    // Reorder the list once the verified level arrives.
    if (channel && presenceWorking) {
      renderUsers();
    }

  } catch (error) {
    console.warn(
      "[User Levels] Failed to load:",
      id,
      error.message
    );

  } finally {
    pendingUserLevelRequests.delete(id);
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
  color: validColor(entry.nickname_color),

  // Sorting information
  level: Number(entry.level) || 1,
  hasGlow: Boolean(entry.has_glow)
});
      }
    }
  }
  // Include BNC accounts, but don't duplicate live users.
  for (const [accountId, person] of bncUsers) {
    if (!people.has(accountId)) {
      people.set(accountId, person);
    }
  }
  
  
/* ==========================================
   STEP 136BI — GLOW FIRST, THEN LEVEL
   ========================================== */

// Request verified levels for everyone in the room,
// including BNC users.
for (const person of people.values()) {
  fetchVerifiedUserLevel(person.accountId);
}

const sorted = [...people.values()].sort((a, b) => {
  // Use the existing server-verified glow information.
  const aGlowing =
    glowRoomId === String(currentRoomId) &&
    verifiedRoomGlows.get(a.accountId) === true;

  const bGlowing =
    glowRoomId === String(currentRoomId) &&
    verifiedRoomGlows.get(b.accountId) === true;

  // 1. Glowing users ALWAYS appear above regular users.
  if (aGlowing !== bGlowing) {
    return aGlowing ? -1 : 1;
  }

  // 2. Within each group, highest level appears first.
  const aLevel = verifiedUserLevels.get(a.accountId) ?? 1;
  const bLevel = verifiedUserLevels.get(b.accountId) ?? 1;

  if (aLevel !== bLevel) {
    return bLevel - aLevel;
  }

  // 3. Alphabetical order when levels are equal.
  return a.nickname.localeCompare(b.nickname);
});


  for (const person of sorted) {
    const item = document.createElement("div");
    item.className = "user_item";
    item.style.padding = "5px 8px";
/* AFLAC — Experimental Red Void Nameplate */

const targetNameplateId =
  "81e3b4ba-569b-4885-a71b-ae8230eb5423";

// Local development uses a separate guest account.
// Allow that account to preview the effect locally.
const isLocalPreview =
  ["localhost", "127.0.0.1"].includes(
    window.location.hostname
  ) &&
  String(person.accountId) === String(profile?.id);

if (
  String(person.accountId) === targetNameplateId ||
  isLocalPreview
) {
  item.classList.add("nameplate-red-void");

  const particles = document.createElement("div");
  particles.className = "red-void-particles";
  particles.setAttribute("aria-hidden", "true");

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement("span");

    particle.style.setProperty(
      "--x", `${5 + (i * 29) % 91}%`
    );
    particle.style.setProperty(
      "--drift", `${(i % 2 ? 1 : -1) * (9 + (i % 5) * 5)}px`
    );
    particle.style.setProperty(
      "--duration", `${1.7 + (i % 5) * 0.24}s`
    );
    particle.style.setProperty(
      "--delay", `${-i * 0.29}s`
    );
    particle.style.setProperty(
      "--size", `${2 + (i % 3)}px`
    );

    particles.appendChild(particle);
  }

  item.appendChild(particles);
}
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

  /* ==========================================
     SOLAR TEMPEST — EQUIPPED NAMECARD SYNC
     ========================================== */

  const cardState = renderUsers.solarCardState ??= {
    equipped: new Map(),
    rows: new Map(),
    ids: [],
    room: "",
    signature: "",
    loading: false,
    lastFetch: 0,
    timer: null,
    fetch: null,
    apply: null
  };

  // Connect each visible username row to its account ID.
  cardState.rows = new Map(
    sorted.map((person, index) => [
      String(person.accountId),
      userNames.children[index]
    ])
  );

  cardState.ids = sorted.map(person =>
    String(person.accountId)
  );

  // Apply only the card verified by Supabase.
  cardState.apply = () => {
    for (const [accountId, row] of cardState.rows) {
      if (!row || !row.isConnected) continue;

      
      // Find this user's equipped calling card.
      
const cardId = cardState.equipped.get(accountId);

// Give HTTP Tactical the normal rounded
// calling-card container, like Red Void.
row.classList.toggle(
  "nameplate-http-tactical",
  cardId === "http_tactical"
);

const equipped = cardId === "solar_tempest";

      // Use the ORIGINAL animated WebP files.
      
const animatedUrl =
  cardId === "blasted"
    ? "/blasted.webp"
    : cardId === "http_tactical"
      ? "/iridescent_damascus_calling_card.gif"
      : null;


      if (animatedUrl) {
        // Display the complete animation behind the name.
        // Important prevents the normal hover background
        // from covering the calling card.
        row.style.setProperty(
          "background",
          `#100f14 url("${animatedUrl}") center / 100% 100% no-repeat`,
          "important"
        );

        row.style.setProperty(
          "min-height",
          cardId === "http_tactical" ? "42px" : "40px",
          "important"
        );
      } else {
        // Restore the normal background or Solar Tempest.
        row.style.removeProperty("background");
        row.style.removeProperty("min-height");
      }


      row.classList.toggle(
        "nameplate-solar-tempest",
        equipped
      );

      let effects = row.querySelector(
        ":scope > .solar-tempest-effects"
      );

      if (equipped && !effects) {
        effects = document.createElement("div");
        effects.className = "solar-tempest-effects";
        effects.setAttribute("aria-hidden", "true");

        effects.innerHTML = `
          <div class="solar-tempest-flares"></div>

          <svg
            class="solar-tempest-electricity"
            viewBox="0 0 300 50"
            preserveAspectRatio="none"
          >
            <path
              d="M-5 30 L30 25 L53 8 L69 36
                 L94 13 L118 30 L148 5
                 L162 30 L199 14 L226 37
                 L258 13 L305 25"
              fill="none"
              stroke="#ffffff"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        `;

        row.insertBefore(effects, row.firstChild);
      }

      if (!equipped && effects) {
        effects.remove();
      }
    }
  };

  // Keep the cosmetics in sync across all viewers.
  if (!cardState.fetch) {
    cardState.fetch = async () => {
      if (
        cardState.loading ||
        !supabase ||
        !channel ||
        !presenceWorking ||
        !cardState.ids.length
      ) return;

      const requestedRoom = String(currentRoomId);
      const requestedIds = cardState.ids.slice(0, 200);

      cardState.loading = true;
      cardState.lastFetch = Date.now();

      try {
        const { data, error } = await supabase.rpc(
          "get_visible_chat_namecards",
          { p_account_ids: requestedIds }
        );

        if (error) throw error;

        // Ignore replies from rooms we already left.
        if (String(currentRoomId) !== requestedRoom) {
          return;
        }

        cardState.equipped = new Map(
          (Array.isArray(data) ? data : [])
            
            .filter(entry =>
              [
                "solar_tempest",
                "blasted",
                "http_tactical"
              ].includes(entry.card_id)
            )

            .map(entry => [
              String(entry.account_id),
              entry.card_id
            ])
        );

        cardState.apply();

      } catch (error) {
        console.warn(
          "[Solar Tempest] Could not sync namecards:",
          error
        );

      } finally {
        cardState.loading = false;
      }
    };

    // Refresh periodically so Equip / Unequip
    // becomes visible to other connected users.
    cardState.timer = setInterval(() => {
      if (channel && presenceWorking) {
        void cardState.fetch();
      }
    }, 12000);
  }

  // Restore the correct card after every user-list redraw.
  cardState.apply();

  const roomKey = String(currentRoomId);
  const signature = [...cardState.ids].sort().join("|");

  if (
    roomKey !== cardState.room ||
    signature !== cardState.signature ||
    Date.now() - cardState.lastFetch >= 12000
  ) {
    cardState.room = roomKey;
    cardState.signature = signature;
    void cardState.fetch();
  }

  /* END SOLAR TEMPEST SYNC */
  if (!document.getElementById("solar-tempest-style")) {
    const style = document.createElement("style");
    style.id = "solar-tempest-style";
    style.textContent = `
      .nameplate-solar-tempest {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        border-radius: 12px;
        border: 1px solid rgba(255, 240, 190, 0.18);
        background:
          radial-gradient(circle at 18% 50%, rgba(255, 70, 70, 0.24), transparent 22%),
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.13), transparent 18%),
          radial-gradient(circle at 78% 50%, rgba(255, 215, 70, 0.28), transparent 24%),
          linear-gradient(90deg, rgba(255, 218, 90, 0.12), rgba(255,255,255,0.06) 40%, rgba(255, 90, 90, 0.12)),
          linear-gradient(135deg, rgba(255, 230, 120, 0.12), rgba(255,255,255,0.02) 40%, rgba(255, 70, 70, 0.10));
        box-shadow:
          inset 0 0 18px rgba(255, 245, 180, 0.08),
          inset 0 0 38px rgba(255, 90, 90, 0.08),
          0 0 14px rgba(255, 230, 120, 0.08),
          0 0 24px rgba(255, 70, 70, 0.08);
        animation: solarTempestPulse 3.6s ease-in-out infinite;
      }

      .nameplate-solar-tempest > :not(.solar-tempest-effects) {
        position: relative;
        z-index: 3;
      }

      .nameplate-solar-tempest::before {
        content: "";
        position: absolute;
        top: -40%;
        left: -65%;
        width: 44%;
        height: 190%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255,255,255,0.00) 20%,
          rgba(255,255,255,0.95) 50%,
          rgba(255,230,150,0.85) 62%,
          rgba(255,110,110,0.60) 72%,
          transparent 100%
        );
        filter: blur(2px);
        transform: rotate(18deg);
        opacity: 0.9;
        pointer-events: none;
        z-index: 4;
        animation: solarTempestSweep 2.8s linear infinite;
      }

      .nameplate-solar-tempest::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255,255,255,0.26);
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.08),
          0 0 8px rgba(255,255,255,0.08),
          0 0 14px rgba(255, 230, 110, 0.10),
          0 0 20px rgba(255, 70, 70, 0.10);
        pointer-events: none;
        z-index: 2;
      }

      .solar-tempest-effects {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
        z-index: 1;
      }

      .solar-tempest-flares,
      .solar-tempest-flares::before,
      .solar-tempest-flares::after {
        position: absolute;
        inset: 0;
        content: "";
        pointer-events: none;
      }

      .solar-tempest-flares {
        background:
          radial-gradient(circle at 18% 52%, rgba(255, 45, 45, 0.30), transparent 16%),
          radial-gradient(circle at 30% 50%, rgba(255, 220, 90, 0.24), transparent 10%),
          radial-gradient(circle at 52% 50%, rgba(255, 255, 255, 0.16), transparent 8%),
          radial-gradient(circle at 76% 48%, rgba(255, 50, 50, 0.26), transparent 14%),
          radial-gradient(circle at 86% 52%, rgba(255, 215, 120, 0.20), transparent 10%);
        filter: blur(1px);
        opacity: 0.95;
        animation: solarTempestFlares 7s ease-in-out infinite;
      }

      .solar-tempest-flares::before {
        background:
          radial-gradient(circle at 22% 50%, rgba(255,255,255,0.75), transparent 1.2%),
          radial-gradient(circle at 40% 45%, rgba(255,225,110,0.65), transparent 1.1%),
          radial-gradient(circle at 58% 55%, rgba(255,90,90,0.55), transparent 1.0%),
          radial-gradient(circle at 72% 48%, rgba(255,255,255,0.75), transparent 1.1%);
        opacity: 0.85;
        animation: solarTempestSparkles 5.5s linear infinite;
      }

      .solar-tempest-flares::after {
        background:
          radial-gradient(circle at 15% 50%, rgba(255,90,90,0.22), transparent 2.2%),
          radial-gradient(circle at 38% 50%, rgba(255,255,255,0.20), transparent 1.6%),
          radial-gradient(circle at 62% 50%, rgba(255,220,110,0.25), transparent 2.0%),
          radial-gradient(circle at 84% 50%, rgba(255,90,90,0.20), transparent 1.8%);
        filter: blur(2px);
        animation: solarTempestDrift 4.8s ease-in-out infinite alternate;
      }

      .solar-tempest-electricity {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0.96;
        mix-blend-mode: screen;
        z-index: 2;
        animation: solarTempestElectricFlicker 0.8s steps(2, end) infinite;
      }

      .solar-tempest-electricity path {
        stroke: rgba(255,255,255,0.98);
        stroke-dasharray: 20 18;
        stroke-dashoffset: 0;
        filter:
          drop-shadow(0 0 2px rgba(255,255,255,1))
          drop-shadow(0 0 6px rgba(110,225,255,0.95))
          drop-shadow(0 0 11px rgba(170,120,255,0.80))
          drop-shadow(0 0 15px rgba(255,80,80,0.55));
        animation:
          solarLightningMove 1.15s linear infinite,
          solarLightningPulse 0.45s steps(2, end) infinite;
      }

      @keyframes solarTempestPulse {
        0%, 100% {
          box-shadow:
            inset 0 0 18px rgba(255, 245, 180, 0.08),
            inset 0 0 38px rgba(255, 90, 90, 0.08),
            0 0 14px rgba(255, 230, 120, 0.08),
            0 0 24px rgba(255, 70, 70, 0.08);
        }
        50% {
          box-shadow:
            inset 0 0 24px rgba(255, 245, 180, 0.14),
            inset 0 0 52px rgba(255, 90, 90, 0.14),
            0 0 18px rgba(255, 230, 120, 0.14),
            0 0 32px rgba(255, 70, 70, 0.12);
        }
      }

      @keyframes solarTempestSweep {
        0% {
          left: -65%;
          opacity: 0;
        }
        12% {
          opacity: 0.95;
        }
        55% {
          opacity: 0.95;
        }
        100% {
          left: 130%;
          opacity: 0;
        }
      }

      @keyframes solarTempestFlares {
        0%, 100% {
          transform: scale(1) translateX(0);
          opacity: 0.88;
        }
        50% {
          transform: scale(1.03) translateX(4px);
          opacity: 1;
        }
      }

      @keyframes solarTempestSparkles {
        0% {
          transform: translateX(-8px);
          opacity: 0.45;
        }
        50% {
          opacity: 0.95;
        }
        100% {
          transform: translateX(10px);
          opacity: 0.35;
        }
      }

      @keyframes solarTempestDrift {
        0% {
          transform: translateX(-6px) scale(1);
        }
        100% {
          transform: translateX(8px) scale(1.08);
        }
      }

      @keyframes solarTempestElectricFlicker {
        0%, 100% {
          opacity: 0.82;
        }
        35% {
          opacity: 1;
        }
        50% {
          opacity: 0.72;
        }
        75% {
          opacity: 1;
        }
      }

      @keyframes solarLightningMove {
        0% {
          stroke-dashoffset: 46;
          transform: translateX(-8px);
        }
        100% {
          stroke-dashoffset: 0;
          transform: translateX(8px);
        }
      }

      @keyframes solarLightningPulse {
        0%, 100% {
          opacity: 0.68;
        }
        50% {
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
repaintVerifiedGlows();
}

