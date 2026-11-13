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


/* SolarEraser — Namecard Inventory: Step 3A */

(() => {
  const section = document.getElementById(
    "solar-settings-inventory"
  );

  const content = section?.querySelector(
    ".solar-settings-section-content"
  );

  if (!content) return;

  const status = document.createElement("div");
  status.className = "solar-settings-coming";
  status.textContent = "Open to view your namecards.";

  content.replaceChildren(status);

  section.addEventListener("toggle", async () => {
    if (!section.open) return;

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
      if (!section.open) return;

      content.replaceChildren();

      const owned = Array.isArray(data?.owned)
        ? data.owned
        : [];

      if (!owned.length) {
        status.textContent = "No namecards owned yet.";
        content.appendChild(status);
        return;
      }

      for (const cardId of owned) {
        const item = document.createElement("div");
        item.className = "solar-settings-coming";

        const name = cardId === "solar_tempest"
          ? "⚡ Solar Tempest"
          : cardId.replaceAll("_", " ");

        item.textContent = name + (
          data.equipped === cardId
            ? " — Equipped"
            : " — Owned"
        );

        content.appendChild(item);
      }

    } catch (error) {
      console.warn("[Inventory]", error);

      status.textContent =
        "Could not load inventory: " + error.message;

      content.replaceChildren(status);
    }
  });
})();

