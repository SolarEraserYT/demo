/* ==========================================
   SOLARERASER — REAL ANIMATED CALLING CARDS
   Blasted: Premium
   HTTP Tactical: SolarCoins
   Original WebP animations — unchanged.
   ========================================== */

(() => {
  "use strict";

  const store = document.querySelector(
    "#solar-store-screen"
  );

  if (!store) return;

  if (store.querySelector("[data-real-calling-card]")) {
    return;
  }

  const cards = [
    {
      id: "blasted",
      name: "Blasted",
      image: "/blasted.webp",
      section: "solar-store-premium",
      category: "PREMIUM CALLING CARD",
      price: "Premium price coming soon"
    },
    {
      id: "http_tactical",
      name: "HTTP Tactical",
      image: "/iridescent_damascus_calling_card.gif",
      section: "solar-store-solarcoins",
      category: "SOLARCOIN CALLING CARD",
      price: "High coin price coming soon"
    }
  ];

  const style = document.createElement("style");

  style.textContent = `
    .solar-store-item.real-calling-card {
      gap: 10px;
      min-width: 0;
      overflow: hidden;
    }

    .real-calling-card .real-card-image {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 1;
      object-fit: contain;
      border-radius: 6px;
      background: #08090d;
      margin: auto 0;
    }

    .real-calling-card footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .real-calling-card footer span {
      color: var(--text-main);
      font-weight: 700;
    }

    .real-calling-card .real-card-price {
      color: var(--text-muted);
      font-size: 10px;
    }

    .solar-real-card-dialog {
      position: fixed;
      box-sizing: border-box;
      width: min(650px, 92vw);
      max-width: 92vw;
      padding: 22px;
      border-radius: 12px;
      border: 1px solid var(--border-subtle, #45465a);
      background: var(--bg-panel, #161720);
      color: var(--text-main, #fff);
      box-shadow: 0 20px 65px #000a;
    }

    .solar-real-card-dialog::backdrop {
      background: rgba(0, 0, 0, .82);
    }

    .solar-real-card-dialog img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 1;
      object-fit: contain;
      margin: 16px 0;
      border-radius: 7px;
    }

    .solar-real-card-dialog p {
      color: var(--text-muted, #aaa);
      font-size: 12px;
      margin: 10px 0;
    }

    .solar-real-card-dialog button {
      padding: 9px 16px;
      background: var(--bg-hover, #272938);
      border: 1px solid var(--border-subtle, #45465a);
      border-radius: 6px;
      color: var(--text-main, #fff);
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);

  // Dedicated preview for the REAL animated cards.
  const dialog = document.createElement("dialog");
  dialog.className = "solar-real-card-dialog";

  dialog.innerHTML = `
    <strong class="real-card-dialog-title"></strong>
    <img class="real-card-dialog-image" alt="">
    <p class="real-card-dialog-price"></p>
    <p>
      Original animated calling card.
      Purchases and pricing are coming later.
    </p>
    <button type="button">Close Preview</button>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector("button").addEventListener(
    "click",
    () => dialog.close()
  );

  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  // Prevent Escape from closing the entire store
  // when only the card preview should close.
  document.addEventListener("keydown", event => {
    if (dialog.open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dialog.close();
    }
  }, true);

  for (const card of cards) {
    const shelf = store.querySelector(
      "#" + card.section + " .solar-store-items"
    );

    if (!shelf) continue;

    const item = document.createElement("button");

    item.type = "button";
    item.className = "solar-store-item real-calling-card";
    item.dataset.realCallingCard = card.id;

    item.innerHTML = `
      <small>${card.category}</small>

      <img
        class="real-card-image"
        src="${card.image}"
        alt="${card.name} animated calling card"
        loading="lazy"
      >

      <footer>
        <span>${card.name}</span>
        <b>VIEW</b>
      </footer>

      <div class="real-card-price">
        ${card.price}
      </div>
    `;

    item.addEventListener("click", () => {
      dialog.querySelector(
        ".real-card-dialog-title"
      ).textContent = card.name;

      const image = dialog.querySelector(
        ".real-card-dialog-image"
      );

      image.src = card.image;
      image.alt = card.name + " animated calling card";

      dialog.querySelector(
        ".real-card-dialog-price"
      ).textContent = card.price;

      dialog.showModal();
    });

    shelf.appendChild(item);
  }

  console.log(
    "[SolarEraser] Real animated store cards loaded."
  );
})();

