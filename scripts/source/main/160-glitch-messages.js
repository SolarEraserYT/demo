/* ============================================
   SOLARERASER CHAT — STEP 6C
   GLITCH TEXT — LIVE MESSAGE EFFECT
   ============================================ */

(() => {
  "use strict";

  if (!document.getElementById("solar-live-glitch-css")) {
    const style = document.createElement("style");
    style.id = "solar-live-glitch-css";

    // Same RGB colors and animation timings
    // as the Store's Glitch Text preview.
    style.textContent = `
      .messages .message_item > .message.solar-live-glitch {
        position: relative;
        display: inline-block;
        max-width: 100%;

        font-family: ui-monospace, Consolas, monospace;
        font-weight: 900;
        line-height: 1.2;
        letter-spacing: -.06em;

        color: #f7f8ff !important;
        text-shadow: 0 0 9px #9ce7ff;

        white-space: pre-wrap;
        overflow-wrap: anywhere;

        animation: solarGlitchJump 3s steps(1, end) infinite;
      }

      .solar-live-glitch::before,
      .solar-live-glitch::after {
        content: attr(data-solar-glitch-text);
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;

        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font: inherit;
        letter-spacing: inherit;
      }

      .solar-live-glitch::before {
        color: #3dffea;
        text-shadow: -4px 0 #30f5fd;
        animation:
          solarGlitchChromaA 3s steps(1, end) infinite;
      }

      .solar-live-glitch::after {
        color: #ff3a9d;
        text-shadow: 4px 0 #f56ddd;
        animation:
          solarGlitchChromaB 3s steps(1, end) infinite;
      }

      @keyframes solarGlitchChromaA {
        0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
          opacity: 0;
          transform: translate(0);
        }

        9% {
          opacity: 1;
          transform: translate(-11px, -2px);
          clip-path: inset(0 0 66% 0);
        }

        10% {
          opacity: 1;
          transform: translate(8px, 1px);
          clip-path: inset(36% 0 40% 0);
        }

        28% {
          opacity: .95;
          transform: translate(-8px, 0);
          clip-path: inset(72% 0 0 0);
        }

        29% {
          opacity: 1;
          transform: translate(4px, 2px);
          clip-path: inset(22% 0 55% 0);
        }

        49% {
          opacity: 1;
          transform: translate(-7px, -2px);
          clip-path: inset(46% 0 26% 0);
        }

        79%, 80% {
          opacity: 1;
          transform: translate(12px, 0);
          clip-path: inset(7% 0 70% 0);
        }
      }

      @keyframes solarGlitchChromaB {
        0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
          opacity: 0;
          transform: translate(0);
        }

        9% {
          opacity: 1;
          transform: translate(9px, 2px);
          clip-path: inset(67% 0 0 0);
        }

        10% {
          opacity: 1;
          transform: translate(-6px, -1px);
          clip-path: inset(10% 0 64% 0);
        }

        28% {
          opacity: .9;
          transform: translate(12px, 1px);
          clip-path: inset(0 0 76% 0);
        }

        29% {
          opacity: 1;
          transform: translate(-6px, -2px);
          clip-path: inset(49% 0 21% 0);
        }

        49% {
          opacity: 1;
          transform: translate(10px, 2px);
          clip-path: inset(80% 0 0 0);
        }

        79%, 80% {
          opacity: 1;
          transform: translate(-12px, 1px);
          clip-path: inset(42% 0 34% 0);
        }
      }

      @keyframes solarGlitchJump {
        0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
          transform: none;
        }

        9%, 28%, 79% {
          transform: translate(4px, -1px) skewX(-8deg);
        }

        10%, 29%, 49% {
          transform: translate(-4px, 1px) skewX(5deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .solar-live-glitch {
          animation: none !important;
        }

        .solar-live-glitch::before,
        .solar-live-glitch::after {
          display: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Only Supabase-confirmed equipment is used.
  let glitchAccounts = new Set();

  let fetching = false;
  let lastRoom = "";
  let lastSignature = "";
  let lastFetch = 0;

  // Collect account IDs from chat messages.
  function getMessageAccountIds() {
    const ids = new Set();

    const nicks = messages.querySelectorAll(
      ".message_item > .nick[data-account-id]"
    );

    // Newest messages first, maximum 200 accounts.
    for (
      let i = nicks.length - 1;
      i >= 0 && ids.size < 200;
      i--
    ) {
      const id = nicks[i].dataset.accountId;

      if (id) {
        ids.add(String(id));
      }
    }

    return [...ids].sort();
  }

  // Apply the effect to the message body ONLY.
  function applyGlitchText() {
    const nicks = messages.querySelectorAll(
      ".message_item > .nick[data-account-id]"
    );

    for (const nick of nicks) {
      const line = nick.parentElement;

      if (
        line.classList.contains("solar-server-line") ||
        line.classList.contains("solar-private-notice") ||
        line.dataset.solarWelcome === "true"
      ) {
        continue;
      }

      const content = line.querySelector(
        ":scope > .message"
      );

      if (!content) continue;

      const accountId = String(
        nick.dataset.accountId || ""
      );

      const equipped = glitchAccounts.has(accountId);

      content.classList.toggle(
        "solar-live-glitch",
        equipped
      );

      if (equipped) {
        // Copies are only visual. Original message
        // content and database records stay unchanged.
        content.dataset.solarGlitchText =
          content.textContent || "";
      } else {
        delete content.dataset.solarGlitchText;
      }
    }
  }

  async function loadGlitchEffects(
    ids, room, signature
  ) {
    if (fetching) return;

    fetching = true;
    lastRoom = room;
    lastSignature = signature;
    lastFetch = Date.now();

    try {
      const { data, error } = await supabase.rpc(
        "get_visible_chat_effects",
        { p_account_ids: ids }
      );

      if (error) throw error;

      // Ignore results from an old room.
      if (String(currentRoomId) !== room) return;

      const nextAccounts = new Set();

      for (const entry of
        (Array.isArray(data) ? data : [])) {

        if (
          entry.effect_type === "text" &&
          entry.effect_id === "glitch_text"
        ) {
          nextAccounts.add(
            String(entry.account_id)
          );
        }
      }

      glitchAccounts = nextAccounts;

      applyGlitchText();

    } catch (error) {
      console.warn(
        "[Glitch Text] Sync failed:",
        error
      );

      // Allow a retry on the next interval.
      lastFetch = 0;

    } finally {
      fetching = false;

      // Handle room switches or new users
      // while the request was running.
      if (
        String(currentRoomId) !== room ||
        getMessageAccountIds().join("|") !== signature
      ) {
        syncGlitchText();
      }
    }
  }

  function syncGlitchText() {
    applyGlitchText();

    if (
      !supabase ||
      !channel ||
      !presenceWorking ||
      !currentRoomId ||
      fetching
    ) {
      return;
    }

    const ids = getMessageAccountIds();
    if (!ids.length) return;

    const room = String(currentRoomId);
    const signature = ids.join("|");

    // Check on room change, new account,
    // or after twelve seconds.
    if (
      room === lastRoom &&
      signature === lastSignature &&
      Date.now() - lastFetch < 12000
    ) {
      return;
    }

    void loadGlitchEffects(
      ids, room, signature
    );
  }

  // Newly displayed messages get the effect.
  const observer = new MutationObserver(
    syncGlitchText
  );

  observer.observe(messages, {
    childList: true,
    subtree: true
  });

  // Sync equipment changes for all viewers.
  setInterval(syncGlitchText, 4000);

  syncGlitchText();

  console.log(
    "[SolarEraser] Live Glitch Text effect ready."
  );
})();
