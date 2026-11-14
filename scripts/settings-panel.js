/* SolarEraser Chat — standalone Settings Panel, preserving legacy color logic.
   Loaded AFTER main.js. Does not query Supabase or alter account information. */
(() => {
  "use strict";

  const gear = document.querySelector('.menu_button[data-target="settings"]');
  const colorMenu = document.querySelector('.solar-color-menu');
  if (!gear || !colorMenu) {
    console.warn("[Settings] Gear or existing color picker is missing.");
    return;
  }

  const storageKey = "solareraser_chat_theme_v1";
  const validThemes = new Set(["default", "midnight", "forest", "monochrome"]);
  const themes = [
    ["default", "Original", "Classic SolarEraser", "#11131b", "#171a24", "#9185ff"],
    ["midnight", "Midnight", "Navy and electric blue", "#07111f", "#101e30", "#69adff"],
    ["forest", "Forest", "Muted green and emerald", "#0a1712", "#13221a", "#7bd7a4"],
    ["monochrome", "Monochrome", "Black, gray and silver", "#0b0b0c", "#19191b", "#d4d4da"]
  ];

  const panel = document.createElement("aside");
  panel.className = "solar-settings-panel";
  panel.id = "solar-settings-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat settings");
  panel.hidden = true;

  panel.innerHTML = `
    <header class="solar-settings-header">
      <div>
        <div class="solar-settings-eyebrow">SolarEraser Chat</div>
        <div class="solar-settings-title">Settings</div>
        <div class="solar-settings-subtitle">Make the chat feel like yours.</div>
      </div>
      <button type="button" class="solar-settings-close" aria-label="Close settings">×</button>
    </header>
    <div class="solar-settings-body">
      <details class="solar-settings-section" id="solar-settings-colors">
        <summary><span class="solar-settings-icon" aria-hidden="true">◈</span>
          <span class="solar-settings-label"><strong>Username Color</strong><small>Pick and save your nickname color</small></span>
          <span class="solar-settings-chevron" aria-hidden="true">›</span></summary>
        <div class="solar-settings-section-content">
          <p class="solar-settings-note">Your nickname color is saved to your chat account.</p>
          <div id="solar-settings-color-slot"></div>
        </div>
      </details>
      <details class="solar-settings-section" id="solar-settings-themes">
        <summary><span class="solar-settings-icon" aria-hidden="true">▦</span>
          <span class="solar-settings-label"><strong>Chat Themes</strong><small>Change the interface palette</small></span>
          <span class="solar-settings-chevron" aria-hidden="true">›</span></summary>
        <div class="solar-settings-section-content">
          <p class="solar-settings-note">Applies only to your browser. Other users see their own theme.</p>
          <div class="solar-settings-theme-list"></div>
        </div>
      </details>
      <details class="solar-settings-section" id="solar-settings-inventory">
        <summary><span class="solar-settings-icon" aria-hidden="true">▣</span>
          <span class="solar-settings-label"><strong>Namecard Inventory</strong><small>Collect and equip cosmetics in the future</small></span>
          <span class="solar-settings-chevron" aria-hidden="true">›</span></summary>
        <div class="solar-settings-section-content"><div class="solar-settings-coming">Coming later — no inventory system is connected yet.</div></div>
      </details>
      <details class="solar-settings-section" id="solar-settings-advanced">
        <summary><span class="solar-settings-icon" aria-hidden="true">⚙</span>
          <span class="solar-settings-label"><strong>Advanced</strong><small>More customization over time</small></span>
          <span class="solar-settings-chevron" aria-hidden="true">›</span></summary>
        <div class="solar-settings-section-content"><div class="solar-settings-coming">More appearance and performance options can go here.</div></div>
      </details>
    </div>

  `;
  document.body.appendChild(panel);

  const colorSlot = panel.querySelector("#solar-settings-color-slot");
  colorSlot.appendChild(colorMenu);
  colorMenu.style.display = "block";
  colorMenu.style.left = "";
  colorMenu.style.top = "";

  const themeList = panel.querySelector(".solar-settings-theme-list");
  const themeButtons = new Map();
  for (const [id, title, description, bg, surface, accent] of themes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "solar-settings-theme-choice";
    button.dataset.themeId = id;
    button.innerHTML = `<span class="solar-settings-theme-swatch" aria-hidden="true">
      <span style="background:${bg}"></span><span style="background:${surface}"></span><span style="background:${accent}"></span></span>
      <span class="solar-settings-theme-description"><strong>${title}</strong><small>${description}</small></span>
      <span class="solar-settings-theme-selected" aria-hidden="true"></span>`;
    button.addEventListener("click", () => setTheme(id));
    themeList.appendChild(button);
    themeButtons.set(id, button);
  }

  function savedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return validThemes.has(value) ? value : "default";
    } catch { return "default"; }
  }

  function setTheme(id) {
    if (!validThemes.has(id)) return;
    document.documentElement.dataset.solarTheme = id;
    try { localStorage.setItem(storageKey, id); }
    catch (error) { console.warn("[Settings] Theme preference could not be saved:", error); }
    for (const [key, button] of themeButtons) {
      const selected = key === id;
      button.setAttribute("aria-pressed", String(selected));
      button.querySelector(".solar-settings-theme-selected").textContent = selected ? "✓" : "";
    }
  }
  setTheme(savedTheme());

  function placePanel() {
    const rect = gear.getBoundingClientRect();
    const width = Math.min(386, window.innerWidth - 20);
    const left = Math.max(10, Math.min(rect.left, window.innerWidth - width - 10));
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.min(rect.bottom + 7, Math.max(10, window.innerHeight - 115))}px`;
  }
  function open() {
    placePanel();
    panel.hidden = false;
    gear.setAttribute("aria-expanded", "true");
  }
  function close() {
    panel.hidden = true;
    gear.setAttribute("aria-expanded", "false");
    panel.querySelector(".solar-color-popup")?.classList.remove("open");
  }
  function toggle() { panel.hidden ? open() : close(); }
  gear.setAttribute("aria-controls", panel.id);
  gear.setAttribute("aria-expanded", "false");
  panel.querySelector(".solar-settings-close").addEventListener("click", close);
  document.addEventListener("pointerdown", event => {
    if (!panel.hidden && !panel.contains(event.target) && !gear.contains(event.target)) close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) close();
  });
  window.addEventListener("resize", () => { if (!panel.hidden) placePanel(); });
  panel.querySelector("#solar-settings-colors").addEventListener("toggle", event => {
    if (event.target.open) {
      // These existing functions live in the classic main.js script.
      if (typeof updateColorSlotOptions === "function") updateColorSlotOptions();
      if (typeof setPickerHex === "function") setPickerHex(profile?.nickname_color || "#FFFFFF");
    } else {
      panel.querySelector(".solar-color-popup")?.classList.remove("open");
    }
  });

  window.SolarSettingsPanel = { open, close, toggle };
})();


/* SolarEraser — Solar Tempest Inventory: Step 3B */

(() => {
  "use strict";

  const section = document.getElementById(
    "solar-settings-inventory"
  );

  const content = section?.querySelector(
    ".solar-settings-section-content"
  );

  if (!content) return;

  const style = document.createElement("style");
  style.textContent = `
    .tempest-inventory {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 4px 0;
    }

    .tempest-inventory-item {
      padding: 11px;
      border: 1px solid var(--border-subtle, #343444);
      border-radius: 10px;
      background: var(--bg-hover, #171923);
    }

    .tempest-preview {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      display: flex;
      align-items: center;
      width: 100%;
      height: 85px;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #ffc848;
      background:
        radial-gradient(ellipse at 20% 65%, #9b570f, transparent 55%),
        linear-gradient(110deg, #150d0a, #40220a 45%, #24080d);
      box-shadow:
        inset 0 0 20px #ffca3547,
        0 0 12px #ffb82c40;
      animation: tempest-border 3.4s ease-in-out infinite;
    }

    /* Flowing yellow energy */
    .tempest-preview::before {
      content: "";
      position: absolute;
      z-index: 0;
      inset: -60%;
      pointer-events: none;
      background:
        radial-gradient(ellipse at 22% 48%, #ffe057aa, transparent 23%),
        radial-gradient(ellipse at 53% 55%, #fff5ae80, transparent 18%),
        radial-gradient(ellipse at 76% 46%, #ffba26a6, transparent 22%),
        radial-gradient(ellipse at 87% 65%, #e829426b, transparent 13%);
      filter: blur(9px);
      animation: tempest-flow 6s ease-in-out infinite alternate;
    }

    /* Pulsing white light */
    .tempest-preview::after {
      content: "";
      position: absolute;
      z-index: 1;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse at 35% 55%, #ffffff70, transparent 29%),
        linear-gradient(110deg,
          transparent 22%,
          #fff2a640 43%,
          #ffffff60 49%,
          #ffd44835 55%,
          transparent 75%);
      background-size: 100%, 250% 100%;
      animation: tempest-white 3.4s ease-in-out infinite;
    }

    /* Red flare particles */
    .tempest-flares {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background:
        radial-gradient(circle at 12% 26%, #ff4357 0 2px, transparent 5px),
        radial-gradient(circle at 48% 73%, #ff6246 0 2px, transparent 6px),
        radial-gradient(circle at 80% 24%, #ff2744 0 3px, transparent 7px),
        radial-gradient(circle at 92% 65%, #ff5d36 0 2px, transparent 6px);
      filter: drop-shadow(0 0 5px red);
      animation: tempest-flares 4.2s steps(1) infinite;
    }

    /* Electricity occasionally strikes across the card */
    .tempest-electricity {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
      opacity: 0;
      filter: drop-shadow(0 0 4px #fff)
              drop-shadow(0 0 8px #ffdc65);
      animation: tempest-lightning 5.3s steps(1) infinite;
    }

    .tempest-preview-name {
      position: relative;
      z-index: 4;
      font-size: 17px;
      font-weight: 900;
      color: #fff9d2;
      text-shadow:
        0 0 4px #fff,
        0 0 11px #ffdf66,
        0 0 20px #ffb023;
    }

    .tempest-info {
      margin: 11px 0;
    }

    .tempest-info strong {
      display: block;
      font-size: 14px;
      color: #ffdc70;
    }

    .tempest-info small {
      display: block;
      margin-top: 4px;
      color: var(--text-muted, #9b9eaf);
      font-size: 11px;
      line-height: 1.5;
    }

    .tempest-actions {
      display: flex;
      gap: 8px;
    }

    .tempest-action {
      flex: 1;
      border: 1px solid #bd8e2d;
      background: #593c10;
      color: #fff2bf;
      border-radius: 7px;
      padding: 9px 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .tempest-action:hover:not(:disabled) {
      background: #78521a;
    }

    .tempest-action:disabled {
      opacity: .55;
      cursor: default;
    }

    .tempest-action.secondary {
      background: var(--bg-panel, #161720);
      border-color: var(--border-subtle, #41414d);
      color: var(--text-main, #fff);
    }

    .tempest-status {
      margin-top: 9px;
      color: var(--text-muted, #a4a4b2);
      font-size: 11px;
    }

    @keyframes tempest-flow {
      from {
        transform: translate(-13%, -3%) rotate(-8deg);
      }
      to {
        transform: translate(14%, 5%) rotate(9deg);
      }
    }

    @keyframes tempest-border {
      0%, 100% {
        box-shadow: inset 0 0 15px #ffca3540,
                    0 0 7px #ffc94e4a;
      }
      50% {
        box-shadow: inset 0 0 28px #fff0a760,
                    0 0 18px #ffd66291;
      }
    }

    @keyframes tempest-white {
      0%, 100% {
        opacity: .35;
        background-position: center, 100% 0;
      }
      50% {
        opacity: .9;
        background-position: center, 0% 0;
      }
    }

    @keyframes tempest-flares {
      0%, 100% { opacity: .18; }
      13% { opacity: .9; }
      15% { opacity: .25; }
      39% { opacity: .7; }
      42% { opacity: .16; }
      76% { opacity: 1; }
      79% { opacity: .2; }
    }

    @keyframes tempest-lightning {
      0%, 19%, 22%, 51%, 54%, 85%, 88%, 100% {
        opacity: 0;
      }
      20%, 52%, 86% { opacity: 1; }
      21%, 53%, 87% { opacity: .35; }
    }

    @media (prefers-reduced-motion: reduce) {
      .tempest-preview,
      .tempest-preview::before,
      .tempest-preview::after,
      .tempest-flares,
      .tempest-electricity {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  const status = document.createElement("div");
  status.className = "solar-settings-coming";
  status.textContent = "Open to view your namecards.";

  content.replaceChildren(status);

  let requestNumber = 0;

  async function refreshInventory() {
    const request = ++requestNumber;

    status.textContent = "Loading inventory...";
    content.replaceChildren(status);

    try {
      if (!supabase || !profile) {
        throw new Error("Chat is still connecting.");
      }

      const { data, error } = await supabase.rpc(
        "get_my_chat_namecards"
      );

      if (error) throw error;
      if (request !== requestNumber || !section.open) return;

      const owned = Array.isArray(data?.owned)
        ? data.owned
        : [];

      content.replaceChildren();

      if (!owned.length) {
        status.textContent = "No namecards owned yet.";
        content.appendChild(status);
        return;
      }

      for (const cardId of owned) {
         
        // BLASTED + HTTP TACTICAL
        // Display their original animated WebP files.
        if (
          cardId === "blasted" ||
          cardId === "http_tactical"
        ) {
          const isBlasted = cardId === "blasted";

          const item = document.createElement("div");
          item.className = "tempest-inventory-item";

          const preview = document.createElement("img");

          preview.src = isBlasted
            ? "/blasted.webp"
            : "/http-tactical.webp";

          preview.alt = isBlasted
            ? "Blasted animated calling card"
            : "HTTP Tactical animated calling card";

          // Preserve the full original animation.
          preview.style.cssText = `
            display: block;
            width: 100%;
            height: auto;
            object-fit: contain;
          `;

          const info = document.createElement("div");
          info.className = "tempest-info";

          const title = document.createElement("strong");
          title.textContent = isBlasted
            ? "💎 Blasted"
            : "🪙 HTTP Tactical";

          const description = document.createElement("small");
          description.textContent = isBlasted
            ? "Owned — Premium animated calling card"
            : "Owned — SolarCoin animated calling card";

          info.append(title, description);
          item.append(preview, info);

          content.appendChild(item);
          continue;
        }

        if (cardId !== "solar_tempest") {
          const other = document.createElement("div");
          other.className = "solar-settings-coming";
          other.textContent = String(cardId).replaceAll("_", " ");
          content.appendChild(other);
          continue;
        }

        const equipped = data.equipped === cardId;

        const item = document.createElement("div");
        item.className = "tempest-inventory-item";

        item.innerHTML = `
          
<div class="nameplate-solar-tempest"
     style="
       position: relative;
       isolation: isolate;
       overflow: hidden;
       display: flex;
       align-items: center;
       width: 100%;
       min-height: 85px;
       padding: 15px;
       box-sizing: border-box;
       border-radius: 12px;
     ">

  <!-- Exactly the same effect layers as the live card -->
  <div class="solar-tempest-effects"
       aria-hidden="true">

    <div class="solar-tempest-flares"></div>

    <svg class="solar-tempest-electricity"
         viewBox="0 0 300 50"
         preserveAspectRatio="none"
         aria-hidden="true">

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

  </div>

  <span class="name"
        style="
          position: relative;
          z-index: 3;
          font-size: 17px;
          font-weight: 900;
          color: #fff9d2;
          text-shadow:
            0 0 4px #fff,
            0 0 11px #ffdf66,
            0 0 20px #ffb023;
        ">
    SolarEraser
  </span>

</div>

          <div class="tempest-info">
            <strong>⚡ Solar Tempest</strong>
            <small>
              Flowing golden energy, pulsing white light,
              red flares and electric sparks.
            </small>
          </div>

          <div class="tempest-actions">
            <button type="button"
                    class="tempest-action tempest-equip">
              ${equipped ? "Equipped ✓" : "Equip"}
            </button>

            <button type="button"
                    class="tempest-action secondary tempest-unequip">
              Unequip
            </button>
          </div>

          <div class="tempest-status">
            ${equipped
              ? "Currently equipped"
              : "Owned — not equipped"}
          </div>
        `;

        const equip = item.querySelector(".tempest-equip");
        const unequip = item.querySelector(".tempest-unequip");

        equip.disabled = equipped;
        unequip.disabled = !equipped;

        async function changeCard(nextCard) {
          equip.disabled = true;
          unequip.disabled = true;

          const message = item.querySelector(".tempest-status");
          message.textContent = "Saving...";

          try {
            const { error } = await supabase.rpc(
              "set_my_chat_namecard",
              { p_card_id: nextCard }
            );

            if (error) throw error;

            await refreshInventory();

          } catch (error) {
            console.warn("[Namecards]", error);
            message.textContent =
              "Could not save: " + error.message;

            equip.disabled = equipped;
            unequip.disabled = !equipped;
          }
        }

        equip.addEventListener("click", () => {
          changeCard("solar_tempest");
        });

        unequip.addEventListener("click", () => {
          changeCard(null);
        });

        content.appendChild(item);
      }

    } catch (error) {
      console.warn("[Namecard Inventory]", error);

      status.textContent =
        "Could not load inventory: " + error.message;

      content.replaceChildren(status);
    }
  }

  section.addEventListener("toggle", () => {
    if (section.open) {
      refreshInventory();
    } else {
      requestNumber++;
    }
  });
})();
