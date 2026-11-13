
/* SolarEraser Chat — Store layout v2
   Visual-only storefront. No purchases, wallet, or random rewards yet.
   Inherits Aflac's CSS theme variables from the existing Settings system.
*/
(() => {
  "use strict";

  if (window.SolarStorePanel) return;

  const settingsButton = document.querySelector('.menu_button[data-target="settings"]');
  if (!settingsButton) {
    console.warn("[Store] Could not find Settings button.");
    return;
  }

  const css = document.createElement("style");
  css.textContent = `
    .solar-store-trigger svg, .solar-store-trigger svg * {
      fill: none !important;
      stroke: var(--text-muted) !important;
    }
    .solar-store-trigger:hover svg * { stroke: var(--accent) !important; }
    .solar-store-screen[hidden], .solar-store-preview[hidden] { display: none !important; }
    .solar-store-screen, .solar-store-screen * { box-sizing: border-box; }
    .solar-store-screen {
      position: fixed; inset: 0; z-index: 12000;
      display: flex; flex-direction: column;
      color: var(--text-main); background: var(--bg-main);
      font: 13px/1.5 Inter, "Segoe UI", Arial, sans-serif;
    }
    .solar-store-screen button { font: inherit; }
    .solar-store-topbar {
      flex: none; min-height: 51px; display: flex; align-items: center;
      padding: 8px clamp(12px, 2vw, 28px); gap: 10px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-panel);
    }
    .solar-store-home, .solar-store-close {
      display: grid; place-items: center; flex: none;
      width: 35px; height: 35px; padding: 0;
      color: var(--text-main); background: var(--bg-hover);
      border: 1px solid var(--border-subtle); border-radius: 6px;
    }
    .solar-store-home:hover, .solar-store-close:hover {
      border-color: var(--accent); color: var(--accent);
    }
    .solar-store-heading { flex: 1; min-width: 0; }
    .solar-store-heading strong { display: block; font-size: 17px; letter-spacing: .055em; }
    .solar-store-heading small { display: block; color: var(--text-muted); font-size: 10px; }
    .solar-store-navbar {
      flex: none; display: flex; gap: 7px; padding: 9px clamp(12px, 2vw, 28px);
      border-bottom: 1px solid var(--border-subtle); background: var(--bg-panel);
      overflow-x: auto; scrollbar-width: thin;
    }
    .solar-store-navbar button {
      flex: none; padding: 6px 11px; border-radius: 6px;
      border: 1px solid var(--border-subtle);
      color: var(--text-main); background: var(--bg-hover);
      cursor: pointer;
    }
    .solar-store-navbar button:hover, .solar-store-navbar button:focus-visible {
      color: var(--accent); border-color: var(--accent);
    }
    .solar-store-scroll {
      flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
      scrollbar-color: var(--border-subtle) transparent;
    }
    .solar-store-content {
      width: min(1160px, calc(100% - 32px)); margin: 0 auto;
      padding: 24px 0 70px;
    }
    .solar-store-intro {
      display: flex; justify-content: space-between; align-items: center;
      gap: 15px; margin-bottom: 17px;
    }
    .solar-store-kicker { color: var(--accent); font-size: 10px; letter-spacing: .15em; font-weight: 700; }
    .solar-store-intro h2 { font-size: clamp(19px, 3vw, 28px); margin: 3px 0; }
    .solar-store-intro p { color: var(--text-muted); font-size: 12px; margin: 0; }
    .solar-store-demo {
      color: var(--text-muted); border: 1px solid var(--border-subtle);
      background: var(--bg-panel); padding: 8px 10px; border-radius: 7px;
      max-width: 260px; text-align: right; font-size: 11px;
    }
    .solar-store-heading-row {
      display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
      margin: 30px 0 12px;
    }
    .solar-store-heading-row h2 { margin: 0; font-size: 19px; }
    .solar-store-heading-row span { font-size: 11px; color: var(--text-muted); }
    .solar-store-featured {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px;
    }
    .solar-store-feature {
      --tone: var(--accent);
      display: flex; flex-direction: column; min-height: 290px; padding: 0;
      color: var(--text-main); text-align: left; overflow: hidden; cursor: pointer;
      background: var(--bg-panel); border: 1px solid var(--border-subtle);
      border-radius: 10px; box-shadow: 0 6px 16px #0002;
      transition: transform .15s ease, border-color .15s ease;
    }
    .solar-store-feature:hover { transform: translateY(-3px); border-color: var(--tone); }
    .solar-store-feature:nth-child(2) { --tone: #65bbff; }
    .solar-store-feature:nth-child(3) { --tone: #f3b952; }
    .solar-store-feature-top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 10px 15px; background: color-mix(in srgb, var(--tone) 19%, var(--bg-panel));
      border-bottom: 1px solid color-mix(in srgb, var(--tone) 30%, var(--border-subtle));
    }
    .solar-store-feature-top strong { font-size: 14px; }
    .solar-store-chip { font-size: 9px; border: 1px solid currentColor; padding: 2px 6px; border-radius: 999px; opacity: .9; }
    .solar-store-feature-art {
      display: flex; flex: 1; align-items: center; justify-content: center;
      min-height: 165px; position: relative; overflow: hidden;
      background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--tone) 36%, transparent), transparent 55%),
                  linear-gradient(155deg, color-mix(in srgb, var(--tone) 17%, var(--bg-main)), var(--bg-panel));
    }
    .solar-store-feature-art::before {
      content: ""; position: absolute; inset: -15%; opacity: .35;
      background: repeating-conic-gradient(from 0deg, transparent 0deg 25deg, color-mix(in srgb, var(--tone) 32%, transparent) 28deg 33deg);
      -webkit-mask-image: radial-gradient(circle, black, transparent 70%);
      mask-image: radial-gradient(circle, black, transparent 70%);
    }
    .solar-store-feature-glyph {
      position: relative; font-weight: 900; font-size: clamp(60px, 8vw, 96px); line-height: 1;
      color: var(--tone); text-shadow: 0 0 18px color-mix(in srgb, var(--tone) 58%, transparent), 0 6px 20px #0006;
      transform: rotate(-9deg);
    }
    .solar-store-feature-foot {
      display: flex; justify-content: space-between; align-items: center;
      gap: 8px; padding: 12px 15px; border-top: 1px solid var(--border-subtle);
    }
    .solar-store-feature-foot small { color: var(--text-muted); font-size: 11px; }
    .solar-store-feature-foot b { color: var(--accent); font-size: 11px; }
    .solar-store-banners { display: grid; grid-template-columns: 1.55fr 1fr; gap: 15px; }
    .solar-store-banner {
      display: flex; flex-direction: column; justify-content: space-between;
      gap: 40px; min-height: 180px; padding: 21px;
      border-radius: 11px; overflow: hidden; border: 1px solid var(--border-subtle);
      background: linear-gradient(120deg, var(--bg-panel), color-mix(in srgb, var(--accent) 24%, var(--bg-main)));
    }
    .solar-store-banner:nth-child(2) {
      background: linear-gradient(120deg, var(--bg-panel), color-mix(in srgb, #e9a952 23%, var(--bg-main)));
    }
    .solar-store-banner .badge { color: var(--accent); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
    .solar-store-banner h3 { margin: 7px 0 3px; font-size: 23px; }
    .solar-store-banner p { color: var(--text-muted); font-size: 12px; margin: 0; }
    .solar-store-banner-preview {
      align-self: flex-end; padding: 9px 15px; border-radius: 7px;
      color: var(--accent); font-size: clamp(16px, 2.5vw, 25px); font-weight: 750;
      text-shadow: 0 0 7px var(--accent), 0 0 23px var(--accent);
      background: color-mix(in srgb, var(--bg-main) 65%, transparent);
      border: 1px solid var(--border-subtle);
    }
    .solar-store-items { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
    .solar-store-item {
      display: flex; flex-direction: column; min-height: 164px;
      padding: 15px; gap: 12px; text-align: left;
      border-radius: 9px; border: 1px solid var(--border-subtle);
      background: var(--bg-panel); color: var(--text-main); cursor: pointer;
    }
    .solar-store-item:hover { border-color: var(--accent); background: var(--bg-hover); }
    .solar-store-item small { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: .1em; }
    .solar-store-item .solar-store-sample { margin: auto 0; font-size: clamp(16px, 2.3vw, 23px); font-weight: 750; color: var(--accent); }
    .solar-store-sample.glow { text-shadow: 0 0 5px var(--accent), 0 0 14px var(--accent); }
    .solar-store-sample.outline { -webkit-text-stroke: 1px var(--accent); color: transparent; filter: drop-shadow(0 0 5px var(--accent)); }
    .solar-store-sample.plaque { background: var(--bg-hover); border: 1px solid var(--accent); border-radius: 6px; padding: 8px; width: fit-content; }
    .solar-store-item footer { color: var(--text-muted); font-size: 11px; display: flex; justify-content: space-between; }
    .solar-store-item footer b { color: var(--accent); }
    .solar-store-wallet {
      display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 13px;
    }
    .solar-store-wallet > div {
      background: var(--bg-panel); padding: 18px; border-radius: 9px;
      border: 1px solid var(--border-subtle);
    }
    .solar-store-wallet strong { font-size: 15px; }
    .solar-store-wallet p { color: var(--text-muted); font-size: 12px; margin: 7px 0 0; }
    .solar-store-note { font-size: 11px; color: var(--text-muted); margin: 22px 0 0; }
    .solar-store-preview {
      position: fixed; inset: 0; z-index: 1; display: grid; place-items: center;
      padding: 16px; background: #000b;
    }
    .solar-store-preview-card {
      width: min(440px, 100%); padding: 22px; border: 1px solid var(--accent);
      border-radius: 11px; background: var(--bg-panel); box-shadow: 0 16px 50px #0008;
    }
    .solar-store-preview-card strong { font-size: 19px; }
    .solar-store-preview-card p { color: var(--text-muted); line-height: 1.65; }
    .solar-store-preview-dismiss {
      padding: 9px 15px; border: 1px solid var(--border-subtle); border-radius: 6px;
      background: var(--bg-hover); color: var(--text-main);
    }
    @media (max-width: 750px) {
      .solar-store-content { padding-top: 15px; }
      .solar-store-featured { gap: 8px; }
      .solar-store-feature { min-height: 214px; }
      .solar-store-feature-art { min-height: 115px; }
      .solar-store-feature-top, .solar-store-feature-foot { padding: 8px; }
      .solar-store-feature-top strong { font-size: 11px; }
      .solar-store-feature-foot small { font-size: 10px; }
      .solar-store-banners { grid-template-columns: 1fr; }
      .solar-store-items { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .solar-store-intro { flex-direction: column; align-items: flex-start; }
      .solar-store-demo { text-align: left; max-width: none; }
    }
    @media (max-width: 490px) {
      .solar-store-content { width: calc(100% - 22px); }
      .solar-store-featured { grid-template-columns: 1fr; }
      .solar-store-feature { min-height: 160px; }
      .solar-store-feature-art { min-height: 92px; }
      .solar-store-feature-glyph { font-size: 62px; }
      .solar-store-feature-foot { padding: 10px 12px; }
      .solar-store-items, .solar-store-wallet { grid-template-columns: 1fr; }
      .solar-store-banners { gap: 10px; }
      .solar-store-heading-row { margin-top: 24px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .solar-store-feature { transition: none; }
    }
  `;
  document.head.appendChild(css);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "menu_button solar-store-trigger";
  button.title = "Store";
  button.setAttribute("aria-label", "Open store");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "solar-store-screen");
  button.innerHTML = `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h18l-1 12H4L3 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>`;
  settingsButton.after(button);

  const panel = document.createElement("section");
  panel.id = "solar-store-screen";
  panel.className = "solar-store-screen";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "SolarEraser Store");
  panel.hidden = true;
  panel.innerHTML = `
    <header class="solar-store-topbar">
      <button type="button" class="solar-store-home" aria-label="Back to top" title="Store home">⌂</button>
      <div class="solar-store-heading"><strong>STORE</strong><small>SolarEraser marketplace</small></div>
      <button type="button" class="solar-store-close" aria-label="Close store" title="Return to chat">×</button>
    </header>
    <nav class="solar-store-navbar" aria-label="Store sections">
      <button type="button" data-store-jump="featured">Featured</button>
      <button type="button" data-store-jump="collections">Collections</button>
      <button type="button" data-store-jump="solarcoins">SolarCoins</button>
      <button type="button" data-store-jump="premium">Premium</button>
      <button type="button" data-store-jump="events">Events</button>
      <button type="button" data-store-jump="wallet">Wallet</button>
    </nav>
    <div class="solar-store-scroll">
      <main class="solar-store-content">
        <div class="solar-store-intro">
          <div><div class="solar-store-kicker">CUSTOMIZE YOUR PRESENCE</div>
          <h2>Make every message yours.</h2>
          <p>Collect namecards, effects and themes. Your chat keeps running while you browse.</p></div>
          <div class="solar-store-demo">Store preview · Items and concept prices are not available for purchase.</div>
        </div>

        <section id="solar-store-featured">
          <div class="solar-store-heading-row"><h2>Featured</h2><span>Featured cosmetic concepts</span></div>
          <div class="solar-store-featured">
            <button type="button" class="solar-store-feature" data-preview="Electric Pulse">
              <div class="solar-store-feature-top"><strong>Electric Pulse</strong><span class="solar-store-chip">NAMECARD</span></div>
              <div class="solar-store-feature-art"><span class="solar-store-feature-glyph">ϟ</span></div>
              <div class="solar-store-feature-foot"><small>SolarCoin cosmetic</small><b>PREVIEW</b></div>
            </button>
            <button type="button" class="solar-store-feature" data-preview="Frostbite">
              <div class="solar-store-feature-top"><strong>Frostbite</strong><span class="solar-store-chip">TEXT FX</span></div>
              <div class="solar-store-feature-art"><span class="solar-store-feature-glyph">❄</span></div>
              <div class="solar-store-feature-foot"><small>Premium cosmetic</small><b>PREVIEW</b></div>
            </button>
            <button type="button" class="solar-store-feature" data-preview="Golden Hour">
              <div class="solar-store-feature-top"><strong>Golden Hour</strong><span class="solar-store-chip">THEME</span></div>
              <div class="solar-store-feature-art"><span class="solar-store-feature-glyph">✦</span></div>
              <div class="solar-store-feature-foot"><small>Concept collection</small><b>PREVIEW</b></div>
            </button>
          </div>
        </section>

        <section id="solar-store-collections">
          <div class="solar-store-heading-row"><h2>Collections</h2><span>Browse complete visual styles</span></div>
          <div class="solar-store-banners">
            <div class="solar-store-banner"><div><span class="badge">Namecard collection</span><h3>Midnight Signals</h3><p>Glowing accents and sharp electric outlines.</p></div><div class="solar-store-banner-preview">[ SolarEraser ]</div></div>
            <div class="solar-store-banner"><div><span class="badge">Cosmetic collection</span><h3>Golden Era</h3><p>Warm halos, brilliant text and luminous details.</p></div><div class="solar-store-banner-preview">✧ NEW ✧</div></div>
          </div>
        </section>

        <section id="solar-store-solarcoins">
          <div class="solar-store-heading-row"><h2>SolarCoin Cosmetics 🪙</h2><span>Earnable currency · planned</span></div>
          <div class="solar-store-items">
            <button type="button" class="solar-store-item" data-preview="Neon Outline"><small>Username effect</small><span class="solar-store-sample outline">[ NeonUser ]</span><footer><span>Neon Outline</span><b>VIEW</b></footer></button>
            <button type="button" class="solar-store-item" data-preview="Blue Ember"><small>Text shadow</small><span class="solar-store-sample glow">Blue Ember</span><footer><span>Blue Ember</span><b>VIEW</b></footer></button>
            <button type="button" class="solar-store-item" data-preview="Signal Card"><small>Namecard style</small><span class="solar-store-sample plaque">✦ Signal ✦</span><footer><span>Signal Card</span><b>VIEW</b></footer></button>
          </div>
        </section>

        <section id="solar-store-premium">
          <div class="solar-store-heading-row"><h2>Premium Cosmetics 💎</h2><span>Premium currency · planned</span></div>
          <div class="solar-store-items">
            <button type="button" class="solar-store-item" data-preview="Prism Light"><small>Animated namecard concept</small><span class="solar-store-sample glow">✧ Prism ✧</span><footer><span>Prism Light</span><b>VIEW</b></footer></button>
            <button type="button" class="solar-store-item" data-preview="Void Signature"><small>Signature effect concept</small><span class="solar-store-sample outline">VOID</span><footer><span>Void Signature</span><b>VIEW</b></footer></button>
            <button type="button" class="solar-store-item" data-preview="Celestial Frame"><small>Namecard concept</small><span class="solar-store-sample plaque">☾ Celestial ☽</span><footer><span>Celestial Frame</span><b>VIEW</b></footer></button>
          </div>
        </section>

        <section id="solar-store-events">
          <div class="solar-store-heading-row"><h2>Limited Editions</h2><span>Special event releases</span></div>
          <div class="solar-store-banner"><div><span class="badge">Seasonal events</span><h3>Only here for the occasion.</h3><p>Halloween, Christmas, New Year and more. Event-exclusive cosmetics will appear here when released.</p></div><div class="solar-store-banner-preview">✦ EVENT ✦</div></div>
        </section>

        <section id="solar-store-wallet">
          <div class="solar-store-heading-row"><h2>Wallet & Currency</h2><span>Economy coming later</span></div>
          <div class="solar-store-wallet">
            <div><strong>🪙 SolarCoins</strong><p>Earned from participation. Balances, earning rates and pricing are not connected yet.</p></div>
            <div><strong>💎 Premium Currency</strong><p>Future premium and giveaway currency. No payments or purchases are active.</p></div>
          </div>
        </section>
        <p class="solar-store-note">This page is a visual prototype. Store items, ownership, balances, and prices are not yet implemented.</p>
      </main>
    </div>
    <div class="solar-store-preview" hidden>
      <div class="solar-store-preview-card" role="dialog" aria-modal="true" aria-label="Cosmetic preview">
        <strong class="solar-store-preview-name"></strong>
        <p>This is a design preview only. Cosmetic ownership and purchases will be connected when the economy is ready.</p>
        <button type="button" class="solar-store-preview-dismiss">Back to store</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const scrollBox = panel.querySelector(".solar-store-scroll");
  const preview = panel.querySelector(".solar-store-preview");
  const previewDismiss = panel.querySelector(".solar-store-preview-dismiss");
  let previousFocus = null;
  let itemFocus = null;

  function closePreview() {
    if (preview.hidden) return;
    preview.hidden = true;
    if (itemFocus?.isConnected) itemFocus.focus();
    itemFocus = null;
  }

  function open() {
    if (!panel.hidden) return;
    window.SolarSettingsPanel?.close();
    previousFocus = document.activeElement;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    panel.querySelector(".solar-store-close").focus();
  }
  function close() {
    if (panel.hidden) return;
    closePreview();
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    (previousFocus?.isConnected ? previousFocus : button).focus();
  }
  function toggle() { panel.hidden ? open() : close(); }

  button.addEventListener("click", toggle);
  panel.querySelector(".solar-store-close").addEventListener("click", close);
  panel.querySelector(".solar-store-home").addEventListener("click", () => {
    scrollBox.scrollTo({ top: 0, behavior: "smooth" });
  });
  panel.querySelectorAll("[data-store-jump]").forEach(jump => {
    jump.addEventListener("click", () => {
      const target = panel.querySelector("#solar-store-" + jump.dataset.storeJump);
      if (target) scrollBox.scrollTo({ top: target.offsetTop - scrollBox.offsetTop, behavior: "smooth" });
    });
  });
  panel.querySelectorAll("[data-preview]").forEach(item => {
    item.addEventListener("click", () => {
      itemFocus = item;
      panel.querySelector(".solar-store-preview-name").textContent = item.dataset.preview;
      preview.hidden = false;
      previewDismiss.focus();
    });
  });
  previewDismiss.addEventListener("click", closePreview);
  preview.addEventListener("click", event => { if (event.target === preview) closePreview(); });
  document.addEventListener("keydown", event => {
    if (panel.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      preview.hidden ? close() : closePreview();
    }
    if (event.key === "Tab") {
      const scope = preview.hidden ? panel : preview;
      const focusable = [...scope.querySelectorAll("button:not([disabled])")]
        .filter(element => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.SolarStorePanel = { open, close, toggle };
  console.log("[SolarEraser] Store layout v2 ready.");
})();
