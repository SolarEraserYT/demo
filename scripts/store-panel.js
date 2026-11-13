
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

/* SolarEraser Store — Glitch Collection preview add-on.
   Visual concepts only: no balances, purchases, or ownership yet.
   Safe to append after the Store V2's final })();
*/
(() => {
  "use strict";

  const store = document.getElementById("solar-store-screen");
  if (!store || document.getElementById("solar-glitch-collection")) return;

  const css = document.createElement("style");
  css.id = "solar-glitch-collection-css";
  css.textContent = `
    #solar-glitch-collection { scroll-margin-top: 12px; }
    .solar-glitch-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    .solar-glitch-product {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      min-height: 230px;
      padding: 14px;
      text-align: left;
      cursor: pointer;
      overflow: hidden;
      color: var(--text-main);
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      transition: border-color .2s, transform .2s;
    }
    .solar-glitch-product:hover,
    .solar-glitch-product:focus-visible {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .solar-glitch-product-header,
    .solar-glitch-product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .solar-glitch-product-header strong { font-size: 13px; }
    .solar-glitch-product-header small {
      font-size: 9px;
      letter-spacing: .06em;
      color: var(--accent);
      text-transform: uppercase;
    }
    .solar-glitch-product-footer {
      margin-top: auto;
      font-size: 11px;
      color: var(--text-muted);
    }
    .solar-glitch-product-footer b { color: var(--accent); }
    .solar-glitch-art {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      min-width: 0;
      overflow: hidden;
      padding: 22px 10px;
      border-radius: 7px;
      background: radial-gradient(ellipse at center,
        color-mix(in srgb, var(--accent) 17%, var(--bg-main)),
        var(--bg-main) 85%);
    }
    .solar-glitch-product.bundle {
      grid-column: 1 / -1;
      min-height: 192px;
      background: linear-gradient(110deg,
        var(--bg-panel),
        color-mix(in srgb, var(--accent) 12%, var(--bg-panel)));
    }
    .solar-glitch-product.bundle .solar-glitch-art {
      padding: 15px 20px;
    }
    .solar-store-feature-art .solar-glitch-stack {
      width: min(260px, 90%);
    }
    .solar-store-feature-art .solar-glitch-frame {
      min-height: 52px;
    }
    .solar-store-feature-art .solar-glitch-message {
      font-size: 10px;
      padding: 6px 8px;
    }
    .solar-store-feature-art .solar-glitch-message .solar-glitch-shift {
      font-size: 10px;
    }
    .solar-glitch-product.bundle .solar-glitch-stack {
      width: min(440px, 100%);
    }
    .solar-glitch-stack { width: 100%; min-width: 0; }
    .solar-glitch-frame {
      position: relative;
      isolation: isolate;
      width: 100%;
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 12px 14px;
      border: 1px solid #6bbfff;
      border-radius: 8px;
      background:
        repeating-linear-gradient(0deg,
          transparent 0px 3px,
          rgba(136, 94, 255, .12) 4px,
          transparent 5px),
        linear-gradient(115deg, #101c30, #211735 56%, #101e37);
      box-shadow:
        inset 0 0 0 2px rgba(137, 106, 255, .09),
        inset 0 0 12px rgba(63, 154, 255, .24),
        0 0 13px rgba(104, 131, 255, .2);
    }
    .solar-glitch-frame::after {
      content: "";
      position: absolute;
      z-index: 0;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(180deg,
        transparent 0%, rgba(78, 168, 255, .14) 47%, transparent 60%);
      transform: translateY(-100%);
      animation: solarGlitchCardScan 4s linear infinite;
    }
    .solar-glitch-frame .solar-glitch-steady,
    .solar-glitch-frame .solar-glitch-shift {
      position: relative;
      z-index: 1;
    }
    .solar-glitch-steady {
      font-size: clamp(14px, 1.6vw, 19px);
      font-weight: 800;
      color: #f0f7ff;
      text-shadow: 0 0 5px #8fcfff, 0 0 13px #7372ff;
    }
    .solar-glitch-shift {
      display: inline-block;
      position: relative;
      max-width: 100%;
      font-size: clamp(14px, 1.5vw, 20px);
      font-weight: 800;
      color: #f5f9ff;
      text-shadow: 0 0 7px rgba(102, 194, 255, .68);
      overflow-wrap: anywhere;
    }
    .solar-glitch-shift::before,
    .solar-glitch-shift::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      white-space: inherit;
    }
    .solar-glitch-shift::before {
      color: #62e0ff;
      text-shadow: -2px 0 #62e0ff;
      animation: solarGlitchSplitA 3.2s steps(1, end) infinite;
    }
    .solar-glitch-shift::after {
      color: #eb72ff;
      text-shadow: 2px 0 #eb72ff;
      animation: solarGlitchSplitB 3.2s steps(1, end) infinite;
    }
    .solar-glitch-message {
      margin-top: 10px;
      padding: 9px 11px;
      color: var(--text-main);
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent);
      border-radius: 5px;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .solar-glitch-message .solar-glitch-shift {
      font-size: 12px;
      font-weight: 600;
    }
    .solar-glitch-message .solar-glitch-prefix {
      color: var(--text-muted);
      margin-right: 5px;
      font-size: 10px;
    }
    .solar-glitch-modal-art { margin: 18px 0; }
    .solar-glitch-modal-art[hidden] { display: none !important; }
    .solar-glitch-modal-art .solar-glitch-frame { min-height: 85px; }
    .solar-glitch-modal-art .solar-glitch-stack {
      margin: auto;
      width: min(360px, 100%);
    }
    .solar-glitch-username-only { text-align: center; }
    @keyframes solarGlitchCardScan {
      from { transform: translateY(-100%); }
      to { transform: translateY(100%); }
    }
    @keyframes solarGlitchSplitA {
      0%, 9%, 13%, 56%, 59%, 100% {
        opacity: 0;
        transform: translate(0);
      }
      10%, 12% {
        opacity: .85;
        transform: translate(-3px, -1px);
        clip-path: inset(0 0 55% 0);
      }
      57%, 58% {
        opacity: .8;
        transform: translate(2px, 1px);
        clip-path: inset(62% 0 0 0);
      }
    }
    @keyframes solarGlitchSplitB {
      0%, 9%, 13%, 56%, 59%, 100% {
        opacity: 0;
        transform: translate(0);
      }
      10%, 12% {
        opacity: .85;
        transform: translate(3px, 1px);
        clip-path: inset(62% 0 0 0);
      }
      57%, 58% {
        opacity: .8;
        transform: translate(-2px, -1px);
        clip-path: inset(0 0 55% 0);
      }
    }
    @media (max-width: 760px) {
      .solar-glitch-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .solar-glitch-product.bundle { grid-column: 1 / -1; }
    }
    @media (max-width: 490px) {
      .solar-glitch-grid { grid-template-columns: 1fr; }
      .solar-glitch-product.bundle { grid-column: auto; }
    }
    @media (prefers-reduced-motion: reduce) {
      .solar-glitch-frame::after,
      .solar-glitch-shift::before,
      .solar-glitch-shift::after {
        animation: none !important;
      }
      .solar-glitch-product { transition: none !important; }
    }
  `;
  document.head.appendChild(css);

  const glitchName = `<span class="solar-glitch-shift" data-text="SolarEraser">SolarEraser</span>`;
  const steadyName = `<span class="solar-glitch-steady">SolarEraser</span>`;
  const glitchMessage = `<div class="solar-glitch-message"><span class="solar-glitch-prefix">03:36 [XXV]</span><span class="solar-glitch-shift" data-text="connection established">connection established</span></div>`;

  const art = {
    username: `<div class="solar-glitch-username-only">${glitchName}</div>`,
    card: `<div class="solar-glitch-stack"><div class="solar-glitch-frame">${steadyName}</div></div>`,
    text: `<div class="solar-glitch-stack">${glitchMessage}</div>`,
    bundle: `<div class="solar-glitch-stack"><div class="solar-glitch-frame">${glitchName}</div>${glitchMessage}</div>`
  };
  const products = [
    ["username", "Glitch Username", "Username effect", "Name only"],
    ["card", "Glitch Calling Card", "Namecard effect", "Card only"],
    ["text", "Glitch Text", "Message effect", "Messages only"],
    ["bundle", "Glitch Bundle", "All three cosmetics", "3-in-1 preview"]
  ];

  const section = document.createElement("section");
  section.id = "solar-glitch-collection";
  section.innerHTML = `
    <div class="solar-store-heading-row">
      <h2>Glitch Collection</h2>
      <span>Three individual effects + complete bundle</span>
    </div>
    <div class="solar-glitch-grid">
      ${products.map(([id, name, type, footer]) => `
        <button type="button" class="solar-glitch-product ${id === "bundle" ? "bundle" : ""}"
                data-glitch-product="${id}" aria-label="Preview ${name}">
          <div class="solar-glitch-product-header"><strong>${name}</strong><small>${type}</small></div>
          <div class="solar-glitch-art">${art[id]}</div>
          <div class="solar-glitch-product-footer"><span>${footer} · Coming soon</span><b>PREVIEW</b></div>
        </button>
      `).join("")}
    </div>
  `;

  // Insert immediately before the normal collections section.
  const collections = store.querySelector("#solar-store-collections");
  if (!collections) return;
  collections.before(section);

  // Add a category shortcut to the existing Store toolbar.
  const nav = store.querySelector(".solar-store-navbar");
  const shortcut = document.createElement("button");
  shortcut.type = "button";
  shortcut.textContent = "Glitch";
  const collectionsShortcut = nav?.querySelector('[data-store-jump="collections"]');
  if (collectionsShortcut) collectionsShortcut.before(shortcut);
  else nav?.appendChild(shortcut);
  const scrollBox = store.querySelector(".solar-store-scroll");
  shortcut.addEventListener("click", () => {
    const destination = section.getBoundingClientRect().top - scrollBox.getBoundingClientRect().top + scrollBox.scrollTop - 10;
    scrollBox.scrollTo({ top: destination, behavior: "smooth" });
  });

  // Use the Store V2 preview dialog for each standalone effect or the bundle.
  const preview = store.querySelector(".solar-store-preview");
  const previewCard = store.querySelector(".solar-store-preview-card");
  const previewTitle = store.querySelector(".solar-store-preview-name");
  const previewDescription = previewCard?.querySelector("p");
  const previewDismiss = store.querySelector(".solar-store-preview-dismiss");
  if (!preview || !previewCard || !previewTitle || !previewDismiss) return;

  const enlarged = document.createElement("div");
  enlarged.className = "solar-glitch-modal-art";
  enlarged.hidden = true;
  previewTitle.after(enlarged);
  const originalDescription = previewDescription?.textContent || "";
  const descriptions = {
    username: "Animated glitch for your username only. No calling card or message effect included.",
    card: "A futuristic blue-purple namecard frame. Username and message glitch effects sold separately.",
    text: "Animated glitch on your chat messages only. Does not change your username or card.",
    bundle: "Includes the Glitch Username, Glitch Calling Card, and Glitch Text effects together."
  };
  let lastGlitchButton = null;

  function showEffect(id, clickedButton) {
    if (!art[id]) return;
    lastGlitchButton = clickedButton || null;
    previewTitle.textContent = products.find(p => p[0] === id)?.[1] || "Glitch Preview";
    enlarged.innerHTML = art[id];
    enlarged.hidden = false;
    if (previewDescription) previewDescription.textContent = descriptions[id] + " Preview only — purchasing is not available yet.";
    preview.hidden = false;
    previewDismiss.focus();
  }

  section.querySelectorAll("[data-glitch-product]").forEach(item => {
    item.addEventListener("click", () => showEffect(item.dataset.glitchProduct, item));
  });

  // Give the Glitch Bundle a spot in the top Featured row, too.
  const featured = store.querySelector('.solar-store-feature[data-preview="Electric Pulse"]');
  if (featured) {
    featured.dataset.preview = "Glitch Bundle";
    featured.querySelector(".solar-store-feature-top strong").textContent = "Glitch Bundle";
    featured.querySelector(".solar-store-chip").textContent = "3 EFFECTS";
    featured.querySelector(".solar-store-feature-art").innerHTML = art.bundle;
    featured.querySelector(".solar-store-feature-foot small").textContent = "Complete glitch set";
  }

  // Existing product previews should keep their original content.
  store.querySelectorAll("[data-preview]").forEach(item => {
    item.addEventListener("click", () => {
      enlarged.hidden = true;
      lastGlitchButton = null;
      if (previewDescription) previewDescription.textContent = originalDescription;
    });
  });

  if (featured) {
    featured.addEventListener("click", () => showEffect("bundle", featured));
  }

  previewDismiss.addEventListener("click", () => {
    if (lastGlitchButton?.isConnected) lastGlitchButton.focus();
    lastGlitchButton = null;
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !store.hidden && preview.hidden && lastGlitchButton?.isConnected) {
      lastGlitchButton.focus();
      lastGlitchButton = null;
    }
  });

  console.log("[Store] Glitch Collection: 3 effects + bundle loaded.");
})();

/* SolarEraser Store — Visual Showcase V3
   APPEND BELOW the existing Store V2 + Glitch Collection code.
   CSS/HTML previews only: no real items, balances or purchases.
*/
(() => {
  "use strict";
  const store = document.getElementById("solar-store-screen");
  if (!store || document.getElementById("svfx-v3-styles")) return;

  const style = document.createElement("style");
  style.id = "svfx-v3-styles";
  style.textContent = `
    .svfx-scene, .svfx-scene * { box-sizing: border-box; }
    .svfx-scene {
      --fx: var(--accent);
      position: relative; isolation: isolate; width: 100%; min-width: 0;
      min-height: 140px; overflow: hidden; display: flex; align-items: center;
      justify-content: center; border-radius: 8px; padding: 14px;
      background: radial-gradient(ellipse at 50% 50%,
        color-mix(in srgb, var(--fx) 16%, var(--bg-main)), var(--bg-main) 78%);
      color: var(--text-main);
    }
    .svfx-scene > * { position: relative; z-index: 1; }
    .svfx-scene::before { content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(0deg, transparent 0 5px, #ffffff05 6px 7px);
      z-index: 0; pointer-events: none; }
    .svfx-label { position: absolute; left: 12px; bottom: 10px; z-index: 3;
      color: var(--text-muted); font: 700 9px/1.2 ui-monospace, monospace;
      letter-spacing: .17em; text-transform: uppercase; text-shadow: 0 1px 3px #0009; }
    .svfx-featured { min-height: 176px; border-radius: 0; flex: 1; }
    .svfx-featured.svfx-glitch { min-height: 190px; }
    .svfx-tile { min-height: 125px; padding: 9px; }
    .svfx-wide { min-height: 175px; }
    .svfx-large { min-height: 270px; border: 1px solid var(--border-subtle); }
    .solar-store-feature .solar-store-feature-art { padding: 0; }
    .solar-store-feature .solar-store-feature-art > .svfx-scene { height: 100%; }
    .solar-store-item { padding: 12px; }
    .solar-store-item > .svfx-scene { flex: 1 1 auto; }
    .solar-glitch-product .solar-glitch-art { padding: 0; }
    .solar-glitch-product .solar-glitch-art .svfx-scene { min-height: 140px; }
    .solar-glitch-product.bundle .svfx-scene { min-height: 180px; }
    .solar-store-banner.svfx-banner {
      cursor: pointer; padding: 14px; gap: 8px; min-width: 0;
      text-align: left; color: var(--text-main); transition: border-color .2s, transform .2s;
    }
    .solar-store-banner.svfx-banner:hover,
    .solar-store-banner.svfx-banner:focus-visible {
      border-color: var(--accent); transform: translateY(-2px); outline: 0;
    }
    .solar-store-banner.svfx-banner > .svfx-scene { min-height: 190px; }
    .svfx-banner .svfx-banner-caption { font-size: 11px; color: var(--text-muted); }
    .svfx-banner .svfx-banner-title { font-size: 22px; font-weight: 850; }
    .svfx-scene.svfx-glitch { --fx: #6c9bff;
      background: linear-gradient(120deg, #0b1525, #1e1735 65%, #081727); }
    .svfx-card {
      position: relative; width: min(96%, 320px); min-height: 62px;
      display: flex; align-items: center; justify-content: center;
      padding: 11px; border: 1px solid #6db7ff; border-radius: 8px;
      background: repeating-linear-gradient(0deg, transparent 0 3px, #b694ff15 4px 5px),
                  linear-gradient(125deg, #10182c, #241532, #102033);
      box-shadow: inset 0 0 12px #469bff3e, 0 0 15px #659dff58;
      overflow: hidden; isolation: isolate;
      animation: svfx-card-flicker 4.4s steps(1) infinite;
    }
    .svfx-card::before { content: ''; position: absolute; inset: -35% -10%; z-index: 0;
      background: linear-gradient(180deg, transparent 36%, #7edcff35 49%, #ac66ff35 52%, transparent 64%);
      transform: translateY(-75%); animation: svfx-scan 3.1s linear infinite; }
    .svfx-card::after { content: ''; position: absolute; inset: 2px; z-index: 0;
      border: 1px solid #b287ff2b; border-radius: 5px; pointer-events: none; }
    .svfx-break { position: relative; z-index: 2; display: inline-block;
      font: 900 clamp(15px,2.4vw,24px)/1.25 ui-monospace, Consolas, monospace;
      letter-spacing: -.04em; color: white; text-shadow: 0 0 4px #a8e6ff, 0 0 11px #6e80ff;
      animation: svfx-jolt 4s steps(1) infinite; }
    .svfx-break::before, .svfx-break::after {
      content: attr(data-text); position: absolute; inset: 0;
      width: 100%; white-space: nowrap; pointer-events: none; opacity: 0;
    }
    .svfx-break::before { color: #3dffec; text-shadow: -3px 0 #3dffec;
      animation: svfx-slice-left 2.4s steps(1) infinite; }
    .svfx-break::after { color: #ff4dbd; text-shadow: 3px 0 #ff4dbd;
      animation: svfx-slice-right 2.4s steps(1) infinite; }
    .svfx-noise { position: absolute; inset: 0; z-index: 3; pointer-events: none;
      opacity: .35; mix-blend-mode: screen;
      background: repeating-linear-gradient(0deg, transparent 0 7px, #86e7ff44 8px, transparent 9px),
        repeating-linear-gradient(90deg, transparent 0 31px, #db56ff1c 32px, transparent 34px);
      animation: svfx-static 2.1s steps(2) infinite; }
    .svfx-message { position: relative; display: block; margin-top: 9px; width: 100%;
      background: #101b2a; border-left: 3px solid #6fcaff; border-radius: 4px;
      padding: 9px 10px; color: #b9cadd; font-size: 10px; white-space: normal; }
    .svfx-message .svfx-break { font-size: clamp(10px,1.3vw,15px); }
    .svfx-stack { width: min(94%, 350px); }
    .svfx-microcopy { position: absolute; top: 10px; right: 11px;
      color: #a7b8d2a8; font: 9px ui-monospace,monospace; letter-spacing: .08em; }
    @keyframes svfx-slice-left {
      0%,8%,12%,30%,35%,60%,63%,81%,84%,100% {opacity:0; transform:none;}
      9% {opacity:1; transform:translate(-9px,-2px);clip-path:inset(3% 0 63% 0);}
      10% {opacity:1; transform:translate(5px,2px);clip-path:inset(41% 0 39% 0);}
      31% {opacity:1; transform:translate(-6px,1px);clip-path:inset(70% 0 3% 0);}
      32% {opacity:1; transform:translate(8px,-1px);clip-path:inset(25% 0 52% 0);}
      61%,62% {opacity:.9; transform:translate(-4px,1px);clip-path:inset(6% 0 72% 0);}
      82% {opacity:1;transform:translate(10px,0);clip-path:inset(50% 0 28% 0);}
    }
    @keyframes svfx-slice-right {
      0%,8%,12%,30%,35%,60%,63%,81%,84%,100% {opacity:0; transform:none;}
      9% {opacity:1;transform:translate(7px,2px);clip-path:inset(64% 0 4% 0);}
      11% {opacity:1;transform:translate(-5px,-2px);clip-path:inset(21% 0 59% 0);}
      31% {opacity:1;transform:translate(9px,1px);clip-path:inset(10% 0 61% 0);}
      33% {opacity:1;transform:translate(-7px,0);clip-path:inset(68% 0 8% 0);}
      61% {opacity:1;transform:translate(8px,-1px);clip-path:inset(33% 0 42% 0);}
      82%,83% {opacity:1;transform:translate(-6px,1px);clip-path:inset(76% 0 0 0);}
    }
    @keyframes svfx-jolt {0%,8%,11%,30%,34%,60%,63%,81%,84%,100% {transform:translate(0);filter:none;}
      9% {transform:translate(4px,-1px);filter:contrast(2);}
      10% {transform:translate(-3px,1px);}
      31%,61% {transform:translate(-2px,0);}
      82% {transform:translate(3px,-1px);}}
    @keyframes svfx-card-flicker {0%,30%,32%,60%,62%,100% {filter:none;}
      31%,61% {filter:brightness(1.5) hue-rotate(9deg);}}
    @keyframes svfx-static {0%,100% {transform:translateY(-5%);opacity:.19;}
      10%,32%,61%,82% {transform:translateY(5%);opacity:.66;}}
    @keyframes svfx-scan {to {transform:translateY(75%);}}
    .svfx-frost { --fx: #71cfff; background: radial-gradient(circle at 50% 70%,#16476a,#081c33 72%); }
    .svfx-ice { font-size: clamp(50px,7vw,100px); color:#b1f0ff; text-shadow:0 0 9px #8be8ff,0 0 36px #63b7ff;
      animation:svfx-breathe 3s ease-in-out infinite; }
    .svfx-snow {position:absolute!important;z-index:2!important;top:-12%;left:var(--x);
      color:#c9f4ff;font-size:var(--size,14px);opacity:.8;
      animation:svfx-fall var(--time,5s) linear infinite;animation-delay:var(--delay,0s);}
    @keyframes svfx-fall {to {transform:translate(var(--drift,10px),260px) rotate(120deg);opacity:0;}}
    .svfx-evergold { --fx:#f3ca52; background:radial-gradient(circle at 52% 70%,#5b4420,#141d19 72%); }
    .svfx-tree {width:min(280px,94%);height:160px;filter:drop-shadow(0 0 12px #ffbf4390);}
    .svfx-petal {position:absolute!important;z-index:3!important;left:var(--x);top:-10%;
      width:7px;height:12px;border-radius:85% 0 85% 0;transform:rotate(35deg);
      background:linear-gradient(135deg,#fff3b4,#ffc343 65%,#d8a43c);
      box-shadow:0 0 9px #ffe17b;
      animation:svfx-petals var(--time,5s) ease-in infinite;
      animation-delay:var(--delay,0s);}
    @keyframes svfx-petals {0%{transform:translate(0,0) rotate(0);opacity:0;}
      12%{opacity:1;}90%{opacity:.9;}100%{transform:translate(var(--drift,38px),250px) rotate(540deg);opacity:0;}}
    .svfx-gold-mist {position:absolute!important;inset:auto -10% -10% -10%;height:48%;z-index:2!important;
      background:radial-gradient(ellipse,#f3bb4d45,transparent 68%);filter:blur(13px);
      animation:svfx-drift 7s ease-in-out infinite alternate;}
    .svfx-nebula {--fx:#a567ff;background:radial-gradient(ellipse at 40% 55%,#17194c,#080c23 80%);}
    .svfx-cloud {position:absolute!important;inset:-35%;z-index:0!important;
      background:radial-gradient(ellipse at 35% 52%,#58bafc88,transparent 35%),
        radial-gradient(ellipse at 60% 42%,#9a47dfb0,transparent 34%),
        radial-gradient(ellipse at 70% 70%,#f174ab55,transparent 28%);
      filter:blur(25px);animation:svfx-cloudflow 12s ease-in-out infinite alternate;}
    .svfx-stars {position:absolute!important;inset:0;z-index:1!important;
      background-image:radial-gradient(circle,#fff 1px,transparent 2px),radial-gradient(circle,#8ddfff 1px,transparent 2px);
      background-size:37px 42px,59px 63px;background-position:4px 10px,17px 24px;
      animation:svfx-drift 15s linear infinite alternate;}
    .svfx-nebula::after, .svfx-evergold::after {content:'';position:absolute;inset:10px 12px;z-index:1;
      border:1px solid #a59cff70;border-radius:8px;box-shadow:inset 0 0 12px #9c7cff30,0 0 13px #7ab6ff22;pointer-events:none;}
    .svfx-evergold::after {border-color:#f6d07375;box-shadow:inset 0 0 15px #e8aa3e28,0 0 12px #ffd46f22;}
    .svfx-nebula-word {z-index:2;position:relative;font-weight:900;font-size:clamp(20px,3vw,37px);
      letter-spacing:.16em;color:#fff;text-shadow:0 0 13px #b588ff,0 0 27px #5eaaff;}
    @keyframes svfx-cloudflow {to {transform:translate(19%,-11%) rotate(13deg) scale(1.13);filter:blur(20px);}}
    @keyframes svfx-drift {to {transform:translateX(20px);}}
    @keyframes svfx-breathe {50%{filter:brightness(1.5);transform:scale(1.07);}}
    .svfx-ember {--fx:#ff8b43;background:radial-gradient(circle at 50% 80%,#52271b,#17101b 72%);}
    .svfx-firetext {font:900 clamp(22px,3vw,40px)/1.1 sans-serif;
      color:#ffd69a;text-shadow:0 0 5px #ffcd66,0 0 22px #ff742b;letter-spacing:.08em;}
    .svfx-spark {position:absolute!important;z-index:1!important;left:var(--x);bottom:-10%;width:4px;height:7px;
      border-radius:50%;background:#ffba4c;box-shadow:0 0 10px 3px #ff7c35;
      animation:svfx-sparks var(--time,4s) ease-out infinite;animation-delay:var(--delay,0s);}
    @keyframes svfx-sparks {to {transform:translate(var(--drift,18px),-240px) scale(.25);opacity:0;}}
    .svfx-acid {--fx:#7bff42;background:radial-gradient(ellipse,#163a1b,#08190f 75%);}
    .svfx-acid-text {position:relative;font:900 clamp(19px,3vw,35px)/1.3 system-ui,sans-serif;
      letter-spacing:.06em;color:#b6ff73;text-shadow:0 0 4px #60ff39,0 0 16px #28eb0b,
      0 0 28px #12a922;animation:svfx-corrosion 3.5s ease-in-out infinite;}
    .svfx-drips {position:absolute!important;top:57%;left:25%;width:50%;height:45%;z-index:2!important;
      background:repeating-linear-gradient(90deg,transparent 0 15%,#76ff32 17% 21%,transparent 23% 38%);
      clip-path:polygon(0 0,100% 0,100% 25%,82% 25%,82% 90%,77% 90%,77% 20%,51% 20%,51% 64%,47% 64%,47% 15%,25% 15%,25% 75%,21% 75%,21% 25%,0 25%);
      opacity:.66;filter:drop-shadow(0 0 6px #79ff33);animation:svfx-melt 3s ease-in-out infinite alternate;}
    @keyframes svfx-corrosion {50%{filter:hue-rotate(22deg) brightness(1.35);}}
    @keyframes svfx-melt {to {transform:translateY(13px) scaleY(1.2);opacity:.35;}}
    .svfx-radar {--fx:#61f9cc;background:radial-gradient(circle,#123d3d,#061b24 75%);}
    .svfx-radar-disc {width:118px;height:118px;border:1px solid #75ffe288;border-radius:50%;position:relative;
      box-shadow:inset 0 0 28px #51ecaa27,0 0 13px #51ecaa3d;
      background:repeating-radial-gradient(circle,transparent 0 18px,#68ffd828 19px 20px);}
    .svfx-radar-disc::after {content:'';position:absolute;inset:0;border-radius:50%;
      background:conic-gradient(from 0deg,transparent 0deg 280deg,#70ffe150 345deg,#84fff0 360deg);
      animation:svfx-rotate 3.5s linear infinite;}
    .svfx-radar-dot {position:absolute!important;width:9px;height:9px;border-radius:50%;background:#b1ffe4;top:26%;left:59%;box-shadow:0 0 11px #44ffcc;}
    @keyframes svfx-rotate {to {transform:rotate(360deg);}}
    .svfx-neon {--fx:#a18cff;background:radial-gradient(circle,#2b1b53,#100d27 80%);}
    .svfx-neon-tag {padding:13px 18px;border:2px solid #b8a1ff;border-radius:10px;
      font:900 clamp(16px,2.3vw,27px) ui-monospace,monospace;color:#f0e5ff;
      box-shadow:inset 0 0 12px #8d73ff88,0 0 22px #9c75ff99;
      text-shadow:0 0 12px #d8b8ff;animation:svfx-breathe 3s infinite;}
    .svfx-prism {--fx:#ec8bff;background:linear-gradient(135deg,#141b47,#261445,#0b2e47);}
    .svfx-prism-gem {width:104px;height:118px;clip-path:polygon(50% 0,100% 35%,83% 90%,50% 100%,17% 90%,0 35%);
      background:conic-gradient(from 0deg,#75dcff,#fa7dff,#bd8eff,#78f8d4,#75dcff);
      box-shadow:0 0 20px #c990ff;animation:svfx-prism-shine 6s linear infinite;}
    .svfx-prism-gem::after {content:'';position:absolute;inset:8px;
      clip-path:inherit;background:linear-gradient(130deg,#ffffffb0,#423d9eaa 42%,#bfe7ffcc);}
    @keyframes svfx-prism-shine {to {filter:hue-rotate(360deg);transform:rotate(6deg);}}
    .svfx-void {--fx:#a44dff;background:radial-gradient(circle,#29134e,#090516 70%);}
    .svfx-vortex {width:132px;height:132px;border-radius:50%;position:relative;
      border:2px solid #9a5eff;box-shadow:0 0 22px #9a50ffa3,inset 0 0 25px #9748ff78;
      background:repeating-conic-gradient(from 0deg,#6f37e833 0 12deg,#0a0614 20deg 42deg);
      animation:svfx-rotate 7s linear infinite;}
    .svfx-vortex::after {content:'';position:absolute;inset:23px;border:2px solid #e9a1ff;border-radius:50%;
      box-shadow:0 0 13px #d888ff,inset 0 0 20px #000;}
    .svfx-moon {--fx:#d7ddff;background:radial-gradient(circle,#303653,#101323 75%);}
    .svfx-crescent {width:105px;height:105px;border-radius:50%;background:#e0e4ff;
      box-shadow:0 0 22px #bbccff;
      transform:rotate(-20deg);position:relative;}
    .svfx-crescent::before {content:'';position:absolute;inset:-10px -12px 10px 31px;border-radius:50%;background:#202742;}
    .svfx-crescent::after {content:'✦  ·  ✧';position:absolute;top:-20px;left:105px;font-size:18px;color:#dae6ff;
      text-shadow:0 0 8px #b5cfff;white-space:nowrap;animation:svfx-breathe 3s infinite;}
    .svfx-eclipse {--fx:#f54b62;background:radial-gradient(circle at 50% 55%,#591a2e,#130b1c 70%);}
    .svfx-sun {width:120px;height:120px;border-radius:50%;position:relative;background:#f26057;
      box-shadow:0 0 20px #ef5366,0 0 48px #ef385c8a;}
    .svfx-sun::before {content:'';position:absolute;inset:1px;transform:translate(23px,-13px);border-radius:50%;
      background:#211129;animation:svfx-eclipse-slide 7s ease-in-out infinite alternate;}
    @keyframes svfx-eclipse-slide {to {transform:translate(4px,-3px);}}
    .svfx-wallet-coin {--fx:#ffbe4b;background:radial-gradient(circle,#5c4124,#19181c 75%);}
    .svfx-coins {display:flex;align-items:flex-end;gap:-4px;filter:drop-shadow(0 0 12px #ffcc58a6);}
    .svfx-coin {display:grid;place-items:center;width:55px;height:55px;margin-left:-10px;border-radius:50%;
      border:5px solid #ffda72;background:radial-gradient(circle at 36% 25%,#fff1aa,#f5a31c 60%,#a8670a);
      color:#97530d;font-size:27px;font-weight:900;box-shadow:inset 0 0 0 2px #b47e16,0 4px 10px #0007;}
    .svfx-coin:nth-child(2){transform:translateY(-15px)}
    .svfx-wallet-gem {--fx:#60d9ff;background:radial-gradient(circle,#174f71,#10212a 75%);}
    .svfx-gems {display:flex;align-items:flex-end;gap:4px;filter:drop-shadow(0 0 15px #65d9ff9c);}
    .svfx-gem {width:54px;height:57px;background:linear-gradient(140deg,#fff,#6bf2ff 34%,#2a84c0 78%);
      clip-path:polygon(50% 0,92% 20%,100% 55%,50% 100%,0 55%,8% 20%);
      animation:svfx-breathe 3s infinite;}
    .svfx-gem:nth-child(2){transform:translateY(-16px);animation-delay:-1s;}
    .svfx-gem:nth-child(3){animation-delay:-2s;}
    .svfx-modal-art {margin:15px 0;}
    .svfx-modal-art .svfx-scene {min-height:260px;}
    @media(max-width:760px){.svfx-featured {min-height:125px}.svfx-tile{min-height:110px}
      .solar-store-banner.svfx-banner>.svfx-scene{min-height:140px}}
    @media(prefers-reduced-motion:reduce){
      .svfx-scene *, .svfx-scene::before, .svfx-scene::after,
      .svfx-scene *::before, .svfx-scene *::after{animation:none!important;transition:none!important;}
    }
  `;
  document.head.appendChild(style);

  // All artwork is original HTML/CSS/SVG; no external images or services.
  const shards = (cls, total) => Array.from({length:total},(_,i) =>
    `<i class="${cls}" style="--x:${(i*31+7)%94}%;--delay:-${(i*0.79).toFixed(2)}s;--time:${3.1+(i%5)*.85}s;--drift:${((i%2)?-1:1)*(15+i*2)}px;--size:${9+i%4*3}px">${cls==='svfx-snow'?'✳':''}</i>`).join('');
  const glitch = (value) => `<span class="svfx-break" data-text="${value}">${value}</span>`;
  const card = (glitched) => `<div class="svfx-card">${glitched ? glitch('SolarEraser') : '<span class="svfx-break" style="animation:none">SolarEraser</span>'}<i class="svfx-noise"></i></div>`;
  const message = (glitched) => `<div class="svfx-message">03:36 <span style="color:#89c7ff">[XXV]</span> ${glitched ? glitch('signal compromised') : 'signal stable'}</div>`;
  const tree = `<svg class="svfx-tree" viewBox="0 0 260 160" aria-hidden="true">
    <path d="M130 163 Q127 113 132 87 M132 117 Q91 85 65 71 M131 102 Q157 76 194 60 M131 94 Q110 64 102 48 M134 89 Q148 56 161 40"
      fill="none" stroke="#aa7931" stroke-width="9" stroke-linecap="round"/>
    <path d="M130 161 Q129 129 130 96 M130 114 Q107 89 79 78 M130 100 Q165 75 189 66"
      fill="none" stroke="#f0bf63" stroke-width="2" stroke-linecap="round"/>
    ${Array.from({length:24},(_,i)=>{const a=i*2.399,r=18+Math.sqrt(i/24)*88;
      const x=130+Math.cos(a)*r,y=71+Math.sin(a)*r*.47;
      const color=['#ffd874','#fff0af','#ffb92c','#e8a93b'][i%4];
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${6+i%4}" ry="${10+i%3}" fill="${color}" opacity=".89" transform="rotate(${i*31%160} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('')}
  </svg>`;

  const visuals = {
    bundle: `<div class="svfx-stack">${card(true)}${message(true)}<span class="svfx-microcopy">3-IN-1 // GLITCH</span></div>`,
    glitchName: `<div>${glitch('SolarEraser')}</div><i class="svfx-noise"></i>`,
    glitchCard: `<div class="svfx-stack">${card(false)}</div>`,
    glitchText: `<div class="svfx-stack">${message(true)}<i class="svfx-noise"></i></div>`,
    frost: `${shards('svfx-snow',13)}<span class="svfx-ice">❄</span><span class="svfx-label">FROSTBITE</span>`,
    evergold: `<i class="svfx-gold-mist"></i>${tree}${shards('svfx-petal',15)}<span class="svfx-label">EVERGOLD · GOLDEN PETALS</span>`,
    nebula: `<i class="svfx-cloud"></i><i class="svfx-stars"></i><span class="svfx-nebula-word">ASTRAL DRIFT</span><span class="svfx-label">COSMIC NAMECARD</span>`,
    ember: `${shards('svfx-spark',17)}<span class="svfx-firetext">EMBERFORGE</span><span class="svfx-label">LIVING EMBERS</span>`,
    neon: `<span class="svfx-neon-tag">✦ NEON ✦</span><span class="svfx-label">NEON OUTLINE</span>`,
    acid: `<div><span class="svfx-acid-text">VENOM SCRIPT</span><i class="svfx-drips"></i></div><span class="svfx-label">ACID FLOW TEXT EFFECT</span>`,
    radar: `<div class="svfx-radar-disc"><i class="svfx-radar-dot"></i></div><span class="svfx-label">ECHO RADAR</span>`,
    prism: `<div class="svfx-prism-gem"></div><span class="svfx-label">PRISM LIGHT</span>`,
    void: `<div class="svfx-vortex"></div><span class="svfx-label">VOID SIGNATURE</span>`,
    moon: `<div class="svfx-crescent"></div><span class="svfx-label">CELESTIAL FRAME</span>`,
    eclipse: `<div class="svfx-sun"></div><span class="svfx-label">ECLIPSE VEIL · EVENT CONCEPT</span>`,
    coins: `<div class="svfx-coins"><span class="svfx-coin">✦</span><span class="svfx-coin">✦</span><span class="svfx-coin">✦</span></div><span class="svfx-label">SOLARCOINS</span>`,
    gems: `<div class="svfx-gems"><span class="svfx-gem"></span><span class="svfx-gem"></span><span class="svfx-gem"></span></div><span class="svfx-label">PREMIUM CURRENCY</span>`
  };
  const tones = {
    bundle:['glitch','Glitch Bundle','3 COSMETICS'],
    glitchName:['glitch','Glitch Username','USERNAME EFFECT'],
    glitchCard:['glitch','Glitch Calling Card','NAMECARD'],
    glitchText:['glitch','Glitch Text','TEXT EFFECT'],
    frost:['frost','Frostbite','FROST EFFECT'],
    evergold:['evergold','Evergold','GOLDEN TREE NAMECARD'],
    nebula:['nebula','Astral Drift','NEBULA NAMECARD'],
    ember:['ember','Emberforge','FIRE COLLECTION'],
    neon:['neon','Neon Outline','USERNAME OUTLINE'],
    acid:['acid','Venom Script','ACID TEXT EFFECT'],
    radar:['radar','Echo Radar','RADAR NAMECARD'],
    prism:['prism','Prism Light','HOLOGRAPHIC EFFECT'],
    void:['void','Void Signature','VORTEX SIGNATURE'],
    moon:['moon','Celestial Frame','MOONLIT NAMECARD'],
    eclipse:['eclipse','Eclipse Veil','EVENT EXCLUSIVE CONCEPT'],
    coins:['wallet-coin','SolarCoins','EARNABLE CURRENCY'],
    gems:['wallet-gem','Premium Currency','FUTURE PREMIUM CURRENCY']
  };
  function scene(key, size='tile') {
    const effect = tones[key];
    return `<div class="svfx-scene svfx-${effect[0]} svfx-${size}" aria-hidden="true">${visuals[key]}</div>`;
  }
  function decorate(el,key,slot,large=false) {
    if(!el || !tones[key]) return;
    el.dataset.svfx=key;
    const target=el.querySelector(slot);
    if(target) target.innerHTML=scene(key,large?'wide':'tile');
  }
  // Three featured cards: all now show distinct moving artwork.
  const featured=[...store.querySelectorAll('.solar-store-feature')];
  [['bundle','Glitch Bundle','3 EFFECTS'],['frost','Frostbite','FROST EFFECT'],['evergold','Evergold','CALLING CARD']]
    .forEach(([key,name,type],i)=>{
      const el=featured[i];if(!el)return;
      el.dataset.svfx=key;el.dataset.preview=name;
      const heading=el.querySelector('.solar-store-feature-top strong');if(heading)heading.textContent=name;
      const chip=el.querySelector('.solar-store-chip');if(chip)chip.textContent=type;
      const foot=el.querySelector('.solar-store-feature-foot small');if(foot)foot.textContent='Animated visual concept';
      const art=el.querySelector('.solar-store-feature-art');if(art)art.innerHTML=scene(key,'featured');
    });
  // Each Glitch cosmetic has its own, accurate separate preview.
  const glitchProducts=store.querySelectorAll('[data-glitch-product]');
  glitchProducts.forEach(el=>{
    const map={username:'glitchName',card:'glitchCard',text:'glitchText',bundle:'bundle'};
    const key=map[el.dataset.glitchProduct];
    decorate(el,key,'.solar-glitch-art',true);
  });
  // Collection banners: Astral Drift nebula and Emberforge sparks.
  const collections=[...store.querySelectorAll('#solar-store-collections .solar-store-banner')];
  [['nebula','Astral Drift','A nebula flowing across the calling card.'],
   ['ember','Emberforge','Living embers, radiant edges and heat.']].forEach(([key,name,desc],i)=>{
     const el=collections[i];if(!el)return;
     el.classList.add('svfx-banner');el.dataset.svfx=key;
     el.innerHTML=`<div class="svfx-banner-title">${name}</div>${scene(key,'wide')}<div class="svfx-banner-caption">${desc} · Preview</div>`;
     el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Preview ${name}`);
   });
  // Three uniquely animated items in each cosmetic shelf.
  const shelves=[
    ['#solar-store-solarcoins',[['neon','Neon Outline'],['acid','Venom Script'],['radar','Echo Radar']]],
    ['#solar-store-premium',[['prism','Prism Light'],['void','Void Signature'],['moon','Celestial Frame']]]
  ];
  shelves.forEach(([selector,products])=>{
    const cards=store.querySelectorAll(selector+' .solar-store-item');
    products.forEach(([key,name],i)=>{
      const el=cards[i];if(!el)return;
      el.dataset.svfx=key;el.dataset.preview=name;
      el.innerHTML=`<small>${tones[key][2]}</small>${scene(key)}<footer><span>${name}</span><b>VIEW</b></footer>`;
    });
  });
  // Event banner: red eclipse with a slow moving shadow.
  const event=store.querySelector('#solar-store-events .solar-store-banner');
  if(event){event.classList.add('svfx-banner');event.dataset.svfx='eclipse';
    event.innerHTML=`<div class="svfx-banner-title">Eclipse Veil</div>${scene('eclipse','wide')}<div class="svfx-banner-caption">Limited-edition event concept · Not currently for sale</div>`;
    event.tabIndex=0;event.setAttribute('role','button');event.setAttribute('aria-label','Preview Eclipse Veil');}
  // Even the placeholder wallet boxes have different animated artwork.
  const wallets=store.querySelectorAll('#solar-store-wallet .solar-store-wallet > div');
  [['coins','🪙 SolarCoins'],['gems','💎 Premium Currency']].forEach(([key,name],i)=>{
    const el=wallets[i];if(!el)return;el.dataset.svfx=key;
    el.innerHTML=`<strong>${name}</strong>${scene(key)}<p>Concept artwork only — balances and payment systems are not connected.</p>`;
  });
  // One enlarged live preview dialog shared by all visual showcases.
  const modal=store.querySelector('.solar-store-preview');
  const modalCard=store.querySelector('.solar-store-preview-card');
  const title=modalCard?.querySelector('.solar-store-preview-name');
  const desc=modalCard?.querySelector('p');
  const close=modalCard?.querySelector('.solar-store-preview-dismiss');
  if(!modal || !modalCard || !title || !close)return;
  const oldArt=modalCard.querySelector('.solar-glitch-modal-art');
  if(oldArt)oldArt.hidden=true;
  const modalArt=document.createElement('div');modalArt.className='svfx-modal-art';
  title.after(modalArt);
  let opener=null;
  function openPreview(key,el){
    if(!tones[key])return;
    opener=el;title.textContent=tones[key][1];
    modalArt.innerHTML=scene(key,'large');
    if(oldArt)oldArt.hidden=true;
    if(desc)desc.textContent=tones[key][2]+' — animated concept preview only. No purchases or inventory are enabled yet.';
    modal.hidden=false;close.focus();
  }
  // Capture clicks before the earlier V2/Glitch click handlers run.
  store.addEventListener('click',e=>{
    const el=e.target.closest('[data-svfx]');
    if(!el || !store.contains(el) || !modal.hidden)return;
    if(el.closest('.solar-store-wallet'))return; // Wallet is informational.
    e.preventDefault();e.stopPropagation();
    openPreview(el.dataset.svfx,el);
  },true);
  store.querySelectorAll('.svfx-banner').forEach(el=>{
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openPreview(el.dataset.svfx,el);}
    });
  });
  close.addEventListener('click',()=>{if(opener?.isConnected)opener.focus();opener=null;});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !store.hidden && !modal.hidden){
      e.preventDefault();e.stopImmediatePropagation();modal.hidden=true;
      if(opener?.isConnected)opener.focus();opener=null;
    }
  },true);
  console.log('[SolarEraser] V3 animated visual showcase loaded.');
})();

/* SolarEraser Store V4 — animated cosmetic previews.
   ADD BELOW the existing Store V2, Glitch Collection and V3.
   Visual previews only. No purchases or account changes.
*/
(() => {
  "use strict";

  const store = document.getElementById("solar-store-screen");
  if (!store || document.getElementById("sv4-style")) return;

  // Generate the golden tree once and reuse it in every preview.
  function random(seed) {
    let value = seed >>> 0;
    return () => (
      (value = (1664525 * value + 1013904223) >>> 0)
      / 4294967296
    );
  }

  const r = random(2067);
  const groups = [
    [176, 119, 79, 38, 215],
    [237, 79, 87, 47, 245],
    [326, 65, 103, 50, 320],
    [414, 85, 88, 48, 275],
    [486, 117, 79, 36, 205],
    [330, 121, 109, 43, 300]
  ];

  const colors = [
    "#ffe75a", "#ffd72d", "#ffb919", "#fff49c",
    "#ff9c12", "#ffca37", "#eb9c14", "#ffdf69"
  ];

  let leaves = "";

  for (const [cx, cy, rx, ry, count] of groups) {
    leaves += `
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
        fill="#8e4309" opacity=".42"/>
    `;

    for (let i = 0; i < count; i++) {
      const angle = r() * Math.PI * 2;
      const dist = Math.sqrt(r());

      const x = cx + Math.cos(angle) * dist * rx;
      const y = cy + Math.sin(angle) * dist * ry;
      const width = 1.15 + r() * 2.7;
      const height = 1.7 + r() * 3.8;
      const color = colors[Math.floor(r() * colors.length)];

      leaves += `
        <ellipse
          cx="${x.toFixed(1)}"
          cy="${y.toFixed(1)}"
          rx="${width.toFixed(1)}"
          ry="${height.toFixed(1)}"
          fill="${color}"
          opacity="${(.60 + r() * .4).toFixed(2)}"
          transform="rotate(
            ${Math.floor(r() * 130 - 65)}
            ${x.toFixed(1)}
            ${y.toFixed(1)}
          )"
        />
      `;
    }
  }

  const art = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  art.setAttribute("width", "0");
  art.setAttribute("height", "0");
  art.setAttribute("aria-hidden", "true");

  art.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";

  art.innerHTML = `
    <defs>
      <linearGradient id="sv4-sky" x2="0" y2="1">
        <stop stop-color="#160819"/>
        <stop offset=".63" stop-color="#611a18"/>
        <stop offset="1" stop-color="#a23c15"/>
      </linearGradient>

      <radialGradient id="sv4-halo">
        <stop stop-color="#ffde58" stop-opacity=".78"/>
        <stop offset=".40" stop-color="#ff921e"
          stop-opacity=".23"/>
        <stop offset="1" stop-color="#ff7e16"
          stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="sv4-bark" x2="1" y2="0">
        <stop stop-color="#190f14"/>
        <stop offset=".32" stop-color="#6d3920"/>
        <stop offset=".60" stop-color="#432016"/>
        <stop offset="1" stop-color="#150e12"/>
      </linearGradient>

      <symbol id="sv4-tree-landscape" viewBox="0 0 640 275">
        <rect width="640" height="275" fill="url(#sv4-sky)"/>

        <ellipse cx="327" cy="100" rx="335" ry="225"
          fill="url(#sv4-halo)"/>

        <g stroke="#ffe180" stroke-width="2" opacity=".16">
          <path d="
            M325 95 L80 -30
            M325 95 L0 28
            M325 95 L620 -22
            M325 95 L680 54
            M325 95 L170 0
            M325 95 L480 -10
          "/>
        </g>

        <path d="
          M0 213 L72 179 120 190 196 166 250 189
          313 176 374 188 458 160 527 183
          640 156 V275 H0Z
        " fill="#361018"/>

        <path d="
          M0 228 Q85 194 162 216
          Q235 184 315 212
          Q399 185 481 214
          Q561 191 640 215 V275 H0Z
        " fill="#220e15"/>

        <path d="
          M303 277 Q311 228 306 190
          Q304 149 309 113
          L331 107
          Q323 157 332 196
          Q340 230 344 277 Z
        " fill="url(#sv4-bark)"/>

        <g fill="none" stroke-linecap="round">
          <path d="
            M320 190 Q290 150 245 122 Q200 110 167 103
            M318 170 Q353 134 397 112 Q447 98 485 110
            M316 147 Q307 103 278 75
            M319 138 Q354 104 381 77
            M316 208 Q279 159 222 153
          " stroke="#442013" stroke-width="13"/>

          <path d="
            M320 190 Q291 155 244 123
            M317 169 Q351 137 400 111
            M316 146 Q310 112 277 78
            M319 140 Q352 109 379 80
          " stroke="#be7731" stroke-width="3" opacity=".65"/>
        </g>

        <g>${leaves}</g>

        <path d="
          M0 255 Q170 230 318 241
          Q450 226 640 252 V275 H0Z
        " fill="#120c13"/>

        <path d="
          M315 275 L322 220
          M326 265 L327 201
        " stroke="#df9150" opacity=".3" stroke-width="2"/>
      </symbol>
    </defs>
  `;

  document.body.appendChild(art);

  // Shared styling for every live cosmetic demonstration.
  const css = document.createElement("style");
  css.id = "sv4-style";

  css.textContent = `
    .sv4-stage,
    .sv4-stage * {
      box-sizing: border-box;
    }

    .sv4-stage {
      position: relative;
      isolation: isolate;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-width: 0;
      min-height: 148px;
      padding: 14px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-main);
      color: #edf5ff;
    }

    .sv4-stage::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        145deg,
        #ffffff08,
        transparent 45%,
        #0005
      );
      z-index: 1;
    }

    .sv4-stage > * {
      position: relative;
      z-index: 2;
    }

    .solar-store-feature-art > .sv4-stage {
      min-height: 205px;
      flex: 1;
      height: 100%;
      border-radius: 0;
    }

    .solar-glitch-art > .sv4-stage {
      min-height: 150px;
    }

    .solar-store-banner.svfx-banner > .sv4-stage {
      min-height: 205px;
    }

    .solar-store-item > .sv4-stage {
      min-height: 145px;
      flex: 1 1 auto;
    }

    .solar-store-wallet > div > .sv4-stage {
      min-height: 135px;
      margin: 14px 0;
    }

    /* Shared calling-card frame */
    .sv4-card {
      width: min(96%, 390px);
      min-height: 62px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 13px;
      border: 1px solid #ffffff85;
      border-radius: 8px;
      background: linear-gradient(
        180deg,
        transparent 30%,
        #05070db9
      );
      box-shadow:
        0 5px 18px #0007,
        inset 0 0 17px #ffffff0a;
      overflow: hidden;
    }

    .sv4-card-name {
      position: relative;
      z-index: 5;
      max-width: 100%;
      font-weight: 900;
      font-size: clamp(14px, 2vw, 24px);
      line-height: 1.1;
      color: white;
      text-shadow:
        0 2px 3px #000,
        0 0 10px #ffffff85;
    }

    /* Standalone username effects */
    .sv4-name {
      display: inline-block;
      font-weight: 950;
      line-height: 1.2;
      font-size: clamp(18px, 2.5vw, 35px);
      white-space: nowrap;
      max-width: 100%;
    }

    /* Realistic chat-message sample */
    .sv4-chat {
      width: min(96%, 440px);
      padding: 13px 14px;
      background: #0b1324c7;
      border: 1px solid #7799d233;
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      box-shadow: 0 5px 25px #0008;
    }

    .sv4-chat-head {
      font: 10px ui-monospace, monospace;
      color: #91a3bf;
      margin-bottom: 6px;
    }

    .sv4-chat-head b {
      color: #dfeaff;
      font-weight: 750;
    }

    .sv4-chat-text {
      font-size: clamp(12px, 1.7vw, 17px);
      font-weight: 750;
      overflow-wrap: anywhere;
    }

    /* EVERGOLD — ANIMATED GOLDEN TREE */

    .sv4-tree {
      background: #210c15;
      padding: 0;
    }

    .sv4-tree-view {
      position: absolute !important;
      inset: 0;
      z-index: 0 !important;
    }

    .sv4-tree-view svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .sv4-tree .sv4-card {
      position: absolute;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      width: min(79%, 320px);
      min-height: 45px;
      padding: 8px 12px;
      border-color: #ffdb8970;
      background: linear-gradient(
        180deg,
        #160d1b70,
        #130b16d9
      );
      box-shadow: 0 0 20px #ff9d2730;
    }

    .sv4-tree .sv4-card-name {
      color: #fff8c8;
      text-shadow:
        0 1px 3px #281000,
        0 0 12px #ffcf42;
    }

    .sv4-tree-haze {
      position: absolute !important;
      inset: auto -15% -18%;
      height: 65%;
      z-index: 2 !important;
      background: radial-gradient(
        ellipse at 45% 85%,
        #ffbe4e49,
        transparent 65%
      );
      filter: blur(15px);
      animation: sv4-haze 8s ease-in-out infinite alternate;
    }

    .sv4-petal {
      position: absolute !important;
      z-index: 3 !important;
      left: var(--left);
      top: var(--top);
      width: var(--size);
      height: calc(var(--size) * 1.65);
      border-radius: 75% 0 70% 0;
      background: linear-gradient(
        140deg,
        #fffbc1,
        #ffd52a 58%,
        #d9800b
      );
      box-shadow: 0 0 5px #ffd8449c;
      opacity: 0;
      pointer-events: none;
      animation: sv4-petals var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-petals {
      0% {
        transform: translate3d(-80px, -25px, 0) rotate(-50deg);
        opacity: 0;
      }

      12% { opacity: 1; }
      80% { opacity: .92; }

      100% {
        transform: translate3d(
          250px,
          var(--drift),
          0
        ) rotate(520deg);
        opacity: 0;
      }
    }

    @keyframes sv4-haze {
      to {
        transform: translateX(50px);
        opacity: .58;
      }
    }

    /* GLITCH — STRONGER RGB SPLITTING */

    .sv4-glitch {
      background: linear-gradient(
        125deg,
        #050d1c,
        #1b1235,
        #09172b
      );
    }

    .sv4-glitch::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent 0 4px,
        #76dcff1f 5px,
        transparent 7px
      );
      animation: sv4-tearing 3.8s steps(1, end) infinite;
    }

    .sv4-broken {
      position: relative;
      display: inline-block;
      font:
        900 clamp(16px, 2.5vw, 31px)/1.2
        ui-monospace, Consolas, monospace;
      letter-spacing: -.06em;
      color: #f7f8ff;
      text-shadow: 0 0 9px #9ce7ff;
      animation: sv4-jump 3s steps(1, end) infinite;
    }

    .sv4-broken::before,
    .sv4-broken::after {
      content: attr(data-t);
      position: absolute;
      inset: 0;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
    }

    .sv4-broken::before {
      color: #3dffea;
      text-shadow: -4px 0 #30f5fd;
      animation: sv4-chroma-a 3s steps(1, end) infinite;
    }

    .sv4-broken::after {
      color: #ff3a9d;
      text-shadow: 4px 0 #f56ddd;
      animation: sv4-chroma-b 3s steps(1, end) infinite;
    }

    .sv4-glitch .sv4-card {
      border-color: #8fc2ff;
      background: repeating-linear-gradient(
        0deg,
        #10172d 0 4px,
        #191733 5px 6px
      );
      box-shadow:
        0 0 15px #7c9fff67,
        inset 0 0 16px #a081ff45;
    }

    .sv4-glitch .sv4-card .sv4-broken {
      font-size: clamp(15px, 2vw, 24px);
    }

    .sv4-glitch .sv4-chat {
      border-color: #8ac5ff7c;
      border-left: 3px solid #81dafa;
    }

    .sv4-glitch-stack {
      width: min(100%, 390px);
      display: grid;
      gap: 10px;
    }

    .sv4-glitch-stack .sv4-card,
    .sv4-glitch-stack .sv4-chat {
      width: 100%;
    }

    .sv4-glitch .sv4-chat-text .sv4-broken {
      font-size: clamp(12px, 1.7vw, 17px);
    }

    @keyframes sv4-chroma-a {
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

    @keyframes sv4-chroma-b {
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

    @keyframes sv4-jump {
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

    @keyframes sv4-tearing {
      0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
        opacity: .24;
        transform: none;
      }

      9%, 28%, 49%, 79% {
        opacity: .95;
        transform: translateY(7px);
      }
    }

    /* ASTRAL DRIFT — COSMIC NAMECARD */

    .sv4-nebula {
      background: #070e25;
    }

    .sv4-cloud {
      position: absolute !important;
      inset: -30%;
      z-index: 0 !important;
      background:
        radial-gradient(
          ellipse at 30% 50%,
          #58bafca8,
          transparent 35%
        ),
        radial-gradient(
          ellipse at 63% 40%,
          #b050f7ad,
          transparent 34%
        ),
        radial-gradient(
          ellipse at 72% 75%,
          #fe80c15c,
          transparent 36%
        );
      filter: blur(19px);
      animation: sv4-space-drift 12s ease-in-out infinite alternate;
    }

    .sv4-stars {
      position: absolute !important;
      inset: 0;
      z-index: 1 !important;
      background:
        radial-gradient(circle, #fff 1px, transparent 2px)
        3px 7px / 41px 37px,
        radial-gradient(circle, #91d8ff 1px, transparent 2px)
        17px 23px / 59px 73px;
      opacity: .7;
      animation: sv4-space-drift 19s linear infinite alternate;
    }

    @keyframes sv4-space-drift {
      to {
        transform: translateX(13%) translateY(-5%) scale(1.1);
      }
    }

    /* FROSTBITE — SNOWING CALLING CARD */

    .sv4-frost {
      background: radial-gradient(
        ellipse,
        #1c5176,
        #081c32 75%
      );
    }

    .sv4-ice {
      position: absolute !important;
      inset: 0;
      z-index: 0 !important;
      background: repeating-conic-gradient(
        from 21deg at 45% 115%,
        #9eeeff32 0 12deg,
        transparent 12deg 27deg
      );
    }

    .sv4-flake {
      position: absolute !important;
      left: var(--left);
      top: -12%;
      z-index: 2 !important;
      color: #e4faff;
      font-size: var(--size);
      animation: sv4-snow var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-snow {
      to {
        transform: translate(33px, 255px) rotate(240deg);
        opacity: 0;
      }
    }

    /* EMBERFORGE — FIRE AND SPARKS */

    .sv4-ember {
      background: radial-gradient(
        ellipse at 50% 100%,
        #772a1b,
        #170b18 75%
      );
    }

    .sv4-flame {
      position: absolute !important;
      inset: auto -10% -25%;
      height: 90%;
      z-index: 0 !important;
      background:
        radial-gradient(
          ellipse at 30% 90%,
          #ffb13e89,
          transparent 57%
        ),
        radial-gradient(
          ellipse at 75% 95%,
          #fa572a94,
          transparent 60%
        );
      filter: blur(12px);
      animation: sv4-flame 4s ease-in-out infinite alternate;
    }

    .sv4-spark {
      position: absolute !important;
      left: var(--left);
      bottom: -5%;
      z-index: 2 !important;
      width: 3px;
      height: 5px;
      border-radius: 50%;
      background: #ffe7a4;
      box-shadow: 0 0 8px #ff8432;
      animation: sv4-ash var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-flame {
      to { transform: translateX(8%) scale(1.15); }
    }

    @keyframes sv4-ash {
      to {
        transform: translate(33px, -240px);
        opacity: 0;
      }
    }

    /* VENOM SCRIPT — GREEN ACID CHAT MESSAGES */

    .sv4-acid {
      background: radial-gradient(
        ellipse,
        #154226,
        #071910 80%
      );
    }

    .sv4-acid .sv4-chat {
      border-color: #64e86d8a;
      border-left-color: #93ff43;
      background: #091c0ecf;
    }

    .sv4-acid .sv4-chat-text {
      color: #b3ff6c;
      text-shadow:
        0 0 5px #40ff59,
        0 0 13px #32d915;
      animation: sv4-acid-sheen 3s ease-in-out infinite;
    }

    .sv4-acid .sv4-chat-text::after {
      content: "";
      display: block;
      margin-top: 0;
      width: 75%;
      height: 10px;
      background: repeating-linear-gradient(
        90deg,
        #8cff44 0 3px,
        transparent 4px 17px
      );
      clip-path: polygon(
        0 0, 100% 0, 100% 15%,
        75% 15%, 75% 100%, 71% 100%,
        71% 15%, 40% 15%, 40% 85%,
        35% 85%, 35% 15%, 8% 15%,
        8% 60%, 0 60%
      );
      filter: drop-shadow(0 0 5px #88ff44);
      animation: sv4-drip 2.8s ease-in-out infinite alternate;
    }

    @keyframes sv4-drip {
      to {
        transform: translateY(8px) scaleY(1.3);
        opacity: .5;
      }
    }

    @keyframes sv4-acid-sheen {
      50% {
        filter: hue-rotate(20deg) brightness(1.2);
      }
    }

    /* ECHO RADAR — SCANNING NAMECARD */

    .sv4-radar {
      background: radial-gradient(
        ellipse,
        #144c4b,
        #061b29 80%
      );
    }

    .sv4-radar-disc {
      position: absolute !important;
      width: 170px;
      height: 170px;
      border: 1px solid #70f8d2;
      border-radius: 50%;
      background: repeating-radial-gradient(
        circle,
        transparent 0 20px,
        #6af9d934 22px 23px
      );
      box-shadow:
        inset 0 0 30px #63e9d73b,
        0 0 15px #44f9de43;
    }

    .sv4-radar-disc::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        transparent 0 275deg,
        #51ffd232 335deg,
        #94ffe5 360deg
      );
      animation: sv4-radar-spin 4s linear infinite;
    }

    @keyframes sv4-radar-spin {
      to { transform: rotate(360deg); }
    }

    /* CELESTIAL FRAME — MOONLIGHT */

    .sv4-moon {
      background: radial-gradient(
        ellipse,
        #2e355c,
        #0c1028 75%
      );
    }

    .sv4-moon-disc {
      position: absolute !important;
      width: 100px;
      height: 100px;
      left: 53%;
      top: 7%;
      border-radius: 50%;
      background: radial-gradient(
        circle at 25% 25%,
        white,
        #c0d0ff
      );
      box-shadow:
        0 0 22px #c6ddff85,
        0 0 60px #b4beff3c;
    }

    .sv4-moon-disc::after {
      content: "";
      position: absolute;
      inset: -5px -10px 8px 32px;
      border-radius: 50%;
      background: #1b2144;
    }

    /* NEON OUTLINE — USERNAME EFFECT */

    .sv4-neon {
      background: radial-gradient(
        ellipse,
        #2c205c,
        #0b0c20 85%
      );
    }

    .sv4-neon .sv4-name {
      color: #faf0ff;
      text-shadow:
        0 0 4px white,
        0 0 15px #b181ff,
        0 0 32px #845aff;
      -webkit-text-stroke: .65px #d9bcff;
      animation: sv4-glow 3s ease-in-out infinite;
    }

    @keyframes sv4-glow {
      50% {
        filter: brightness(1.4);
        text-shadow:
          0 0 8px white,
          0 0 24px #af76ff;
      }
    }

    /* PRISM LIGHT — HOLOGRAPHIC USERNAME */

    .sv4-prism {
      background: linear-gradient(
        125deg,
        #1a1746,
        #153153,
        #3e164d
      );
    }

    .sv4-prism .sv4-name {
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
      color: transparent;
      filter: drop-shadow(0 0 9px #b47aff);
      animation: sv4-rainbow 5s linear infinite;
    }

    @keyframes sv4-rainbow {
      to { background-position: 250% 0; }
    }

    /* VOID SIGNATURE — PURPLE VORTEX */

    .sv4-void {
      background: radial-gradient(
        ellipse,
        #3a1658,
        #0b071b 70%
      );
    }

    .sv4-vortex {
      position: absolute !important;
      width: 175px;
      height: 175px;
      border: 2px solid #b06dff;
      border-radius: 50%;
      box-shadow:
        0 0 25px #ac63ffb0,
        inset 0 0 30px #a04bff55;
      background: repeating-conic-gradient(
        from 0deg,
        #6025cf30 0 12deg,
        #070419 19deg 36deg
      );
      animation: sv4-radar-spin 8s linear infinite;
    }

    /* ECLIPSE VEIL — LIMITED EVENT */

    .sv4-eclipse {
      background: radial-gradient(
        ellipse,
        #741e37,
        #160d22 75%
      );
    }

    .sv4-eclipse-disc {
      position: absolute !important;
      width: 123px;
      height: 123px;
      border-radius: 50%;
      background: #ff7349;
      box-shadow:
        0 0 25px #ff4c69,
        0 0 57px #c8385a66;
    }

    .sv4-eclipse-disc::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #210e21;
      transform: translate(20px, -12px);
      animation: sv4-eclipse 6s ease-in-out infinite alternate;
    }

    @keyframes sv4-eclipse {
      to { transform: translate(0, -2px); }
    }

    /* CURRENCY PREVIEWS */

    .sv4-currency {
      background: radial-gradient(
        ellipse,
        #463926,
        #121827 80%
      );
    }

    .sv4-currency-label {
      font-size: clamp(16px, 2vw, 23px);
      font-weight: 900;
      letter-spacing: .02em;
      color: #ffd886;
      text-shadow: 0 0 17px #ffab3f87;
    }

    .sv4-gems {
      background: radial-gradient(
        ellipse,
        #183b5c,
        #0c182b 80%
      );
    }

    .sv4-gems .sv4-currency-label {
      color: #9ceeff;
      text-shadow: 0 0 17px #4ecaff8a;
    }

    .sv4-visual-caption {
      position: absolute !important;
      z-index: 5 !important;
      right: 10px;
      top: 10px;
      font: 9px/1.1 ui-monospace, monospace;
      letter-spacing: .11em;
      opacity: .7;
      color: #dceaff;
    }

    /* FULL-SIZE LIVE PREVIEW WINDOW */

    .sv4-overlay[hidden] {
      display: none !important;
    }

    .sv4-overlay {
      position: fixed;
      inset: 0;
      z-index: 15000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #000c;
      backdrop-filter: blur(5px);
    }

    .sv4-panel {
      width: min(640px, 100%);
      max-height: 95dvh;
      overflow: auto;
      border-radius: 12px;
      border: 1px solid var(--accent);
      background: var(--bg-panel);
      box-shadow: 0 25px 70px #000a;
      padding: 18px;
    }

    .sv4-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .sv4-panel-title {
      font-weight: 800;
      font-size: 20px;
    }

    .sv4-panel-close {
      min-width: 36px;
      min-height: 36px;
      padding: 0;
      border: 1px solid var(--border-subtle);
      border-radius: 7px;
      background: var(--bg-hover);
      color: var(--text-main);
      font-size: 22px;
    }

    .sv4-panel .sv4-stage {
      min-height: 300px;
      margin: 16px 0;
    }

    .sv4-panel p {
      margin: 0 0 8px;
      font-size: 12px;
      color: var(--text-muted);
    }

    @media (max-width: 760px) {
      .sv4-stage {
        min-height: 125px;
        padding: 10px;
      }

      .solar-store-feature-art > .sv4-stage {
        min-height: 145px;
      }

      .solar-store-banner.svfx-banner > .sv4-stage {
        min-height: 165px;
      }

      .sv4-tree .sv4-card {
        min-height: 38px;
      }

      .sv4-petal:nth-of-type(n+62) {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sv4-stage *,
      .sv4-stage::before,
      .sv4-stage::after,
      .sv4-stage *::before,
      .sv4-stage *::after {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(css);

  // Build animated petals and snowflakes.
  const petalRandom = random(339);

  function particles(type, count) {
    let html = "";

    for (let i = 0; i < count; i++) {
      const p = petalRandom();

      const left = type === "petal"
        ? (petalRandom() * 100 - 10)
        : (petalRandom() * 100);

      const top = petalRandom() * 79;
      const speed = (3.2 + petalRandom() * 6.5).toFixed(2);
      const delay = -(petalRandom() * 10).toFixed(2);

      const size = (
        type === "petal"
          ? 2.7 + p * 4
          : 8 + p * 7
      ).toFixed(1);

      const drift = ((petalRandom() - .5) * 130).toFixed(1);

      html += `
        <i
          class="${type === "petal" ? "sv4-petal" : "sv4-flake"}"
          aria-hidden="true"
          style="
            --left:${left.toFixed(1)}%;
            --top:${top.toFixed(1)}%;
            --speed:${speed}s;
            --delay:${delay}s;
            --size:${size}px;
            --drift:${drift}px;
          "
        >${type === "snow" ? "✳" : ""}</i>
      `;
    }

    return html;
  }

  // Generate examples that look like actual chat cosmetics.
  function broken(value) {
    return `
      <span class="sv4-broken" data-t="${value}">
        ${value}
      </span>
    `;
  }

  const clean = `<span class="sv4-card-name">SolarEraser</span>`;
  const glitchName = broken("SolarEraser");

  function card(inner = clean) {
    return `<div class="sv4-card">${inner}</div>`;
  }

  function chat(inner) {
    return `
      <div class="sv4-chat">
        <div class="sv4-chat-head">
          03:36 [XXV] <b>SolarEraser</b>
        </div>
        <div class="sv4-chat-text">${inner}</div>
      </div>
    `;
  }

  // Each cosmetic has its OWN visual demonstration.
  const examples = {
    bundle: [
      "glitch",
      `
        <div class="sv4-glitch-stack">
          ${card(glitchName)}
          ${chat(broken("Connection corrupted..."))}
        </div>
      `,
      "Username + calling card + message glitch"
    ],

    glitchName: [
      "glitch",
      `<span class="sv4-name">${glitchName}</span>`,
      "Username only — RGB split and screen tearing"
    ],

    glitchCard: [
      "glitch",
      card(),
      "Calling card only — animated signal distortion"
    ],

    glitchText: [
      "glitch",
      chat(broken("Connection corrupted...")),
      "Messages only — broken, shifting text"
    ],

    evergold: [
      "tree",
      `
        <div class="sv4-tree-view">
          <svg
            viewBox="0 0 640 275"
            preserveAspectRatio="xMidYMid slice"
          >
            <use href="#sv4-tree-landscape"/>
          </svg>
        </div>
        <i class="sv4-tree-haze"></i>
        ${particles("petal", 110)}
        ${card()}
      `,
      "Evergold — golden anime-style tree and flying petals"
    ],

    nebula: [
      "nebula",
      `
        <i class="sv4-cloud"></i>
        <i class="sv4-stars"></i>
        ${card()}
      `,
      "Astral Drift — living cosmic calling card"
    ],

    frost: [
      "frost",
      `
        <i class="sv4-ice"></i>
        ${particles("snow", 26)}
        ${card()}
      `,
      "Frostbite — crystalline snow calling card"
    ],

    ember: [
      "ember",
      `
        <i class="sv4-flame"></i>
        ${
          Array.from({ length: 16 }, (_, i) => `
            <i class="sv4-spark" style="
              --left:${(i * 17) % 100}%;
              --speed:${3 + i % 4}s;
              --delay:-${i * .38}s;
            "></i>
          `).join("")
        }
        ${card()}
      `,
      "Emberforge — drifting sparks and glowing embers"
    ],

    radar: [
      "radar",
      `<i class="sv4-radar-disc"></i>${card()}`,
      "Echo Radar — sweeping scan calling card"
    ],

    moon: [
      "moon",
      `
        <i class="sv4-stars"></i>
        <i class="sv4-moon-disc"></i>
        ${card()}
      `,
      "Celestial Frame — moonlit calling card"
    ],

    eclipse: [
      "eclipse",
      `
        <i class="sv4-eclipse-disc"></i>
        ${card()}
      `,
      "Eclipse Veil — red eclipse event calling card"
    ],

    neon: [
      "neon",
      `<span class="sv4-name">SolarEraser</span>`,
      "Neon Outline — luminous username only"
    ],

    acid: [
      "acid",
      chat("The venom is spreading..."),
      "Venom Script — flowing poisonous green messages"
    ],

    prism: [
      "prism",
      `<span class="sv4-name">SolarEraser</span>`,
      "Prism Light — moving holographic username"
    ],

    void: [
      "void",
      `<i class="sv4-vortex"></i>${card()}`,
      "Void Signature — spinning dark vortex namecard"
    ],

    coins: [
      "currency",
      `<span class="sv4-currency-label">SolarCoins</span>`,
      "SolarCoins — wallet placeholder, no real balance"
    ],

    gems: [
      "gems",
      `<span class="sv4-currency-label">Premium Currency</span>`,
      "Premium currency — wallet placeholder, no real balance"
    ]
  };

  function stage(key) {
    const item = examples[key];
    if (!item) return "";

    return `
      <div
        class="sv4-stage sv4-${item[0]}"
        role="img"
        aria-label="${item[2]}"
      >
        ${item[1]}
        <span class="sv4-visual-caption">LIVE PREVIEW</span>
      </div>
    `;
  }

  // Update every existing Store V3 display.
  // Names, categories, and overall Store layout stay intact.
  store.querySelectorAll("[data-svfx]").forEach(holder => {
    const key = holder.dataset.svfx;
    const old = holder.querySelector(".svfx-scene");

    if (old && examples[key]) {
      old.outerHTML = stage(key);
    }
  });

  // Enlarged live-preview window.
  const overlay = document.createElement("div");
  overlay.className = "sv4-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div
      class="sv4-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Store cosmetic preview"
    >
      <div class="sv4-panel-header">
        <strong class="sv4-panel-title"></strong>
        <button
          type="button"
          class="sv4-panel-close"
          aria-label="Close preview"
        >×</button>
      </div>

      <div class="sv4-panel-body"></div>
      <p class="sv4-panel-note"></p>
      <p>
        Visual concept only. Nothing is available
        for purchase or equipping yet.
      </p>
    </div>
  `;

  store.appendChild(overlay);

  const closeButton = overlay.querySelector(
    ".sv4-panel-close"
  );

  let opener = null;

  function close() {
    overlay.hidden = true;

    if (opener && opener.isConnected) {
      opener.focus();
    }

    opener = null;
  }

  function show(key, element) {
    if (!examples[key]) return;

    opener = element;

    const label = element.querySelector(
      ".svfx-banner-title, " +
      ".solar-store-feature-top strong, " +
      ".solar-glitch-product-header strong, " +
      "footer span"
    )?.textContent;

    overlay.querySelector(
      ".sv4-panel-title"
    ).textContent = label || examples[key][2].split(" — ")[0];

    overlay.querySelector(
      ".sv4-panel-body"
    ).innerHTML = stage(key);

    overlay.querySelector(
      ".sv4-panel-note"
    ).textContent = examples[key][2];

    overlay.hidden = false;
    closeButton.focus();
  }

  // Intercept previews before the older Store handlers.
  document.addEventListener("click", event => {
    if (store.hidden || !overlay.hidden) return;

    const target = event.target.closest("[data-svfx]");

    if (
      !target ||
      !store.contains(target) ||
      target.closest("#solar-store-wallet")
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    show(target.dataset.svfx, target);
  }, true);

  closeButton.addEventListener("click", close);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });

  document.addEventListener("keydown", event => {
    if (store.hidden || overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus();
    }
  }, true);

  // Support keyboard activation on collection banners.
  document.addEventListener("keydown", event => {
    if (store.hidden || !overlay.hidden) return;

    const target = event.target.closest(
      ".svfx-banner[data-svfx]"
    );

    if (
      !target ||
      !store.contains(target) ||
      !["Enter", " "].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    show(target.dataset.svfx, target);
  }, true);

  console.log(
    "[SolarEraser] V4 animated cosmetic previews loaded."
  );
})();
