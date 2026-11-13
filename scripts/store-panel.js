
/* SolarEraser Chat — Store interface v1
   Independent of Supabase and the Settings system.
   Currency and purchases will be connected later. */

(() => {
  "use strict";

  if (window.SolarStorePanel) return;

  const settingsButton = document.querySelector(
    '.menu_button[data-target="settings"]'
  );

  if (!settingsButton) {
    console.warn("[Store] Settings button not found.");
    return;
  }

  // Store styles automatically inherit the selected chat theme.
  const styles = document.createElement("style");
  styles.textContent = `
    .solar-store-trigger svg,
    .solar-store-trigger svg path {
      fill: none !important;
      stroke: var(--text-muted) !important;
    }

    .solar-store-trigger:hover svg path {
      stroke: var(--accent) !important;
    }

    .solar-store-screen[hidden] {
      display: none !important;
    }

    .solar-store-screen {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: flex;
      flex-direction: column;
      background: var(--bg-main);
      color: var(--text-main);
      font-family: Inter, "Segoe UI", Arial, sans-serif;
      overflow-y: auto;
    }

    .solar-store-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 17px 25px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-subtle);
    }

    .solar-store-eyebrow {
      color: var(--accent);
      font-size: 10px;
      letter-spacing: 2px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .solar-store-title {
      margin: 3px 0 0;
      font-size: 22px;
      font-weight: 750;
    }

    .solar-store-close {
      width: 34px;
      height: 34px;
      border: 1px solid var(--border-subtle);
      border-radius: 7px;
      background: var(--bg-hover);
      color: var(--text-main);
      font-size: 22px;
      line-height: 1;
    }

    .solar-store-close:hover {
      background: var(--accent);
      color: var(--bg-main);
    }

    .solar-store-content {
      width: min(1100px, calc(100% - 32px));
      margin: 0 auto;
      padding: 35px 0 60px;
    }

    .solar-store-hero {
      padding: 30px;
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
    }

    .solar-store-hero h2 {
      margin: 0 0 10px;
      font-size: clamp(22px, 4vw, 35px);
      color: var(--text-main);
    }

    .solar-store-hero p {
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.7;
      margin: 0;
    }

    .solar-store-section-title {
      font-size: 17px;
      margin: 30px 0 14px;
    }

    .solar-store-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 15px;
    }

    .solar-store-card {
      padding: 23px;
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      background: var(--bg-panel);
    }

    .solar-store-card-icon {
      font-size: 25px;
      margin-bottom: 12px;
    }

    .solar-store-card h3 {
      margin: 0 0 8px;
      font-size: 17px;
      color: var(--accent);
    }

    .solar-store-card p {
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.7;
      margin: 0;
    }

    .solar-store-empty {
      border: 1px dashed var(--border-subtle);
      border-radius: 10px;
      padding: 35px 20px;
      text-align: center;
      color: var(--text-muted);
      background: var(--bg-panel);
      font-size: 13px;
    }

    @media (max-width: 600px) {
      .solar-store-header {
        padding: 13px 15px;
      }

      .solar-store-content {
        padding-top: 20px;
      }

      .solar-store-hero {
        padding: 20px;
      }

      .solar-store-grid {
        grid-template-columns: 1fr;
      }

      .solar-store-card {
        padding: 18px;
      }
    }
  `;
  document.head.appendChild(styles);

  // Add Store button beside Settings.
  const storeButton = document.createElement("button");
  storeButton.type = "button";
  storeButton.className = "menu_button solar-store-trigger";
  storeButton.title = "Store";
  storeButton.setAttribute("aria-label", "Open store");
  storeButton.setAttribute("aria-controls", "solar-store-screen");
  storeButton.setAttribute("aria-expanded", "false");

  storeButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="19" height="19"
         fill="none" stroke="currentColor"
         stroke-width="1.8" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <path d="M3 9h18l-1 12H4L3 9Z"/>
      <path d="M8 9V7a4 4 0 0 1 8 0v2"/>
    </svg>
  `;

  settingsButton.after(storeButton);

  // Full-screen Store interface.
  const panel = document.createElement("section");
  panel.id = "solar-store-screen";
  panel.className = "solar-store-screen";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "SolarEraser Store");
  panel.hidden = true;

  panel.innerHTML = `
    <header class="solar-store-header">
      <div>
        <div class="solar-store-eyebrow">SolarEraser Chat</div>
        <h1 class="solar-store-title">Store</h1>
      </div>
      <button type="button" class="solar-store-close"
              aria-label="Close store">×</button>
    </header>

    <main class="solar-store-content">
      <section class="solar-store-hero">
        <h2>Make your name unforgettable.</h2>
        <p>
          Discover namecards, chat effects, themes,
          and exclusive cosmetics.
        </p>
      </section>

      <h2 class="solar-store-section-title">Explore the Store</h2>

      <div class="solar-store-grid">
        <section class="solar-store-card">
          <div class="solar-store-card-icon">🪙</div>
          <h3>SolarCoins</h3>
          <p>
            Earn coins through chat activity and unlock
            cosmetics without spending real money.
          </p>
        </section>

        <section class="solar-store-card">
          <div class="solar-store-card-icon">💎</div>
          <h3>Premium Store</h3>
          <p>
            Premium cosmetics, special styles,
            and more customization options.
          </p>
        </section>
      </div>

      <h2 class="solar-store-section-title">Cosmetics</h2>

      <div class="solar-store-empty">
        Store items are coming soon.
        The currency and inventory systems
        aren't connected yet.
      </div>
    </main>
  `;

  document.body.appendChild(panel);

  const closeButton = panel.querySelector(".solar-store-close");
  let previousFocus = null;

  function open() {
    if (!panel.hidden) return;

    window.SolarSettingsPanel?.close();

    previousFocus = document.activeElement;
    panel.hidden = false;
    storeButton.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  function close() {
    if (panel.hidden) return;

    panel.hidden = true;
    storeButton.setAttribute("aria-expanded", "false");

    if (previousFocus?.isConnected) {
      previousFocus.focus();
    } else {
      storeButton.focus();
    }
  }

  function toggle() {
    panel.hidden ? open() : close();
  }

  storeButton.addEventListener("click", toggle);
  closeButton.addEventListener("click", close);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });

  window.SolarStorePanel = { open, close, toggle };

  console.log("[SolarEraser] Store interface ready.");
})();
