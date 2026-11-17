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

