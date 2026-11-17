/* ============================================
   SOLARERASER CHAT — STEP 6B
   PRISM LIGHT — VISIBLE USERNAME EFFECT
   ============================================ */

(() => {
  "use strict";

  // Exact holographic colors and movement
  // from the Store's Prism Light preview.
  if (!document.getElementById("solar-prism-light-css")) {
    const style = document.createElement("style");
    style.id = "solar-prism-light-css";

    style.textContent = `
      .right .name.solar-prism-username,
      .messages .nick.solar-prism-username {
        display: inline-block;

        background: linear-gradient(
          105deg,
          #5fffe6,
          #fff1fa,
          #f5a0ff,
          #73d8ff,
          #fff1fa
        );

        background-size: 250% 100%;

        -webkit-background-clip: text;
        background-clip: text;

        color: transparent !important;
        -webkit-text-fill-color: transparent !important;

        filter: drop-shadow(0 0 9px #b47aff);

        animation:
          solarPrismRainbow 5s linear infinite;
      }

      @keyframes solarPrismRainbow {
        to {
          background-position: 250% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .solar-prism-username {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Accounts confirmed to have Prism Light equipped.
  let prismAccounts = new Set();

  let fetching = false;
  let lastRoom = "";
  let lastSignature = "";
  let lastFetch = 0;

  // Collect account IDs from the online list
  // and displayed chat messages.
  function getVisibleAccountIds() {
    const ids = new Set();

    function add(element) {
      const id = element.dataset.accountId;

      if (id && ids.size < 200) {
        ids.add(String(id));
      }
    }

    userNames.querySelectorAll(
      ".name[data-account-id]"
    ).forEach(add);

    // Check newest messages first.
    const nicks = Array.from(
      messages.querySelectorAll(
        ".nick[data-account-id]"
      )
    ).reverse();

    nicks.forEach(add);

    return [...ids].sort();
  }

  // Update existing username elements.
  // Does not change their text, click handlers,
  // hover cards, or calling card backgrounds.
  function applyPrismLight() {
    const selectors = [
      ".right .name[data-account-id]",
      ".messages .nick[data-account-id]"
    ].join(", ");

    document.querySelectorAll(selectors)
      .forEach(element => {
        const id = String(
          element.dataset.accountId || ""
        );

        element.classList.toggle(
          "solar-prism-username",
          prismAccounts.has(id)
        );
      });
  }

  async function loadVisibleEffects(ids, room, signature) {
    if (fetching) return;

    fetching = true;
    lastRoom = room;
    lastSignature = signature;
    lastFetch = Date.now();

    try {
      const { data, error } = await supabase.rpc(
        "get_visible_chat_effects",
        {
          p_account_ids: ids
        }
      );

      if (error) throw error;

      // Ignore responses from rooms we've left.
      if (String(currentRoomId) !== room) {
        return;
      }

      const nextAccounts = new Set();

      for (const entry of
        (Array.isArray(data) ? data : [])) {

        if (
          entry.effect_type === "username" &&
          entry.effect_id === "prism_light"
        ) {
          nextAccounts.add(
            String(entry.account_id)
          );
        }
      }

      prismAccounts = nextAccounts;

      applyPrismLight();

    } catch (error) {
      console.warn(
        "[Prism Light] Could not sync effects:",
        error
      );

    } finally {
      fetching = false;

      // If the room or visible users changed
      // during the request, synchronize again.
      const latestRoom = String(currentRoomId);
      const latestSignature =
        getVisibleAccountIds().join("|");

      if (
        latestRoom !== room ||
        latestSignature !== signature
      ) {
        syncPrismLight();
      }
    }
  }

  function syncPrismLight() {
    applyPrismLight();

    if (
      !supabase ||
      !channel ||
      !presenceWorking ||
      !currentRoomId ||
      fetching
    ) {
      return;
    }

    const ids = getVisibleAccountIds();

    if (!ids.length) return;

    const room = String(currentRoomId);
    const signature = ids.join("|");

    // Refresh when someone joins or leaves,
    // when switching rooms, or every 12 seconds.
    if (
      room === lastRoom &&
      signature === lastSignature &&
      Date.now() - lastFetch < 12000
    ) {
      return;
    }

    void loadVisibleEffects(
      ids,
      room,
      signature
    );
  }

  // Reapply after the user list is rebuilt.
  const userObserver = new MutationObserver(
    syncPrismLight
  );

  userObserver.observe(userNames, {
    childList: true
  });

  // Apply to newly displayed chat nicknames.
  const messageObserver = new MutationObserver(
    syncPrismLight
  );

  messageObserver.observe(messages, {
    childList: true,
    subtree: true
  });

  // Keep equipment synchronized for everyone.
  setInterval(syncPrismLight, 4000);

  syncPrismLight();

  console.log(
    "[SolarEraser] Prism Light username effect ready."
  );
})();

