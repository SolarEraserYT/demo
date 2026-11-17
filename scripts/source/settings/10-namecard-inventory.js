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
  : "/iridescent_damascus_calling_card.gif";

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
if (!isBlasted) {
  preview.style.borderRadius = "12px";
}
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

          // EQUIP / UNEQUIP FOR ANIMATED CARDS
          const equipped = data.equipped === cardId;

          const actions = document.createElement("div");
          actions.className = "tempest-actions";

          const equip = document.createElement("button");
          equip.type = "button";
          equip.className = "tempest-action";
          equip.textContent = equipped
            ? "Equipped ✓"
            : "Equip";
          equip.disabled = equipped;

          const unequip = document.createElement("button");
          unequip.type = "button";
          unequip.className = "tempest-action secondary";
          unequip.textContent = "Unequip";
          unequip.disabled = !equipped;

          const message = document.createElement("div");
          message.className = "tempest-status";
          message.textContent = equipped
            ? "Currently equipped"
            : "Owned — not equipped";

          actions.append(equip, unequip);
          item.append(actions, message);

          async function saveCard(nextCard) {
            equip.disabled = true;
            unequip.disabled = true;
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
            saveCard(cardId);
          });

          unequip.addEventListener("click", () => {
            saveCard(null);
          });

          content.appendChild(item);
          continue;

        }

        if (cardId === "red_void") {
          const equipped = data.equipped === "red_void";
          const item = document.createElement("div");
          item.className = "tempest-inventory-item";

          // Preview uses the SAME Red Void CSS as the live user list.
          // The preview wrapper has its own CSS scope, without sidebar layout.
          const previewHost = document.createElement("div");
          previewHost.className = "solar-red-void-preview";
          const preview = document.createElement("div");
          preview.className = "user_item nameplate-red-void";
          preview.style.cssText =
            "min-height:68px;display:flex;align-items:center;padding:12px;";
          const embers = document.createElement("div");
          embers.className = "red-void-particles";
          embers.setAttribute("aria-hidden", "true");
          for (let i = 0; i < 18; i++) {
            const ember = document.createElement("span");
            ember.style.setProperty("--x", `${5 + (i * 29) % 91}%`);
            ember.style.setProperty("--drift", `${(i % 2 ? 1 : -1) * (9 + (i % 5) * 5)}px`);
            ember.style.setProperty("--duration", `${1.7 + (i % 5) * 0.24}s`);
            ember.style.setProperty("--delay", `${-i * 0.29}s`);
            ember.style.setProperty("--size", `${2 + (i % 3)}px`);
            embers.appendChild(ember);
          }
          const sampleName = document.createElement("div");
          sampleName.className = "name";
          sampleName.textContent = String(profile?.nickname || "Red Void");
          preview.append(embers, sampleName);
          previewHost.appendChild(preview);

          const info = document.createElement("div");
          info.className = "tempest-info";
          const title = document.createElement("strong");
          title.textContent = "Red Void — Exclusive";
          title.style.color = "#ff526b";
          const description = document.createElement("small");
          description.textContent = "Your original red-black smoke and ember namecard.";
          info.append(title, description);

          const actions = document.createElement("div");
          actions.className = "tempest-actions";
          const equip = document.createElement("button");
          equip.className = "tempest-action";
          equip.type = "button";
          equip.textContent = equipped ? "Equipped ✓" : "Equip";
          equip.disabled = equipped;
          const unequip = document.createElement("button");
          unequip.className = "tempest-action secondary";
          unequip.type = "button";
          unequip.textContent = "Unequip";
          unequip.disabled = !equipped;
          const message = document.createElement("div");
          message.className = "tempest-status";
          message.textContent = equipped ? "Currently equipped" : "Owned — not equipped";
          actions.append(equip, unequip);
          item.append(previewHost, info, actions, message);

          async function saveRedVoid(nextCard) {
            equip.disabled = true;
            unequip.disabled = true;
            message.textContent = "Saving...";
            try {
              const { error } = await supabase.rpc("set_my_chat_namecard", {
                p_card_id: nextCard
              });
              if (error) throw error;
              await refreshInventory();
              // Other clients will see the change on the next namecard refresh.
              if (typeof renderUsers === "function") {
                void renderUsers.solarCardState?.fetch?.();
              }
            } catch (error) {
              console.warn("[Red Void inventory]", error);
              message.textContent = "Could not save: " + error.message;
              equip.disabled = equipped;
              unequip.disabled = !equipped;
            }
          }
          equip.addEventListener("click", () => saveRedVoid("red_void"));
          unequip.addEventListener("click", () => saveRedVoid(null));
          content.appendChild(item);
          continue;
        }

        // AFLAC — AURA MONSTER ANIMATED NAMECARD (exclusive inventory item)
        if (cardId === "aura_monster") {
          const equipped = data.equipped === cardId;
          const item = document.createElement("div");
          item.className = "tempest-inventory-item";

          // Uses the same WebP + name placement as the real user list.
          const previewHost = document.createElement("div");
          previewHost.className = "solar-aura-monster-preview";
          const preview = document.createElement("div");
          preview.className = "user_item nameplate-aura-monster";
          const sampleName = document.createElement("div");
          sampleName.className = "name";
          sampleName.textContent = String(profile?.nickname || "Aflac");
          preview.appendChild(sampleName);
          previewHost.appendChild(preview);

          const info = document.createElement("div");
          info.className = "tempest-info";
          const title = document.createElement("strong");
          title.textContent = "Aura Monster — Exclusive";
          title.style.color = "#b6efb5";
          const description = document.createElement("small");
          description.textContent = "Subaru's ominous grin, original animated atmosphere, and a shifted nickname.";
          info.append(title, description);

          const actions = document.createElement("div");
          actions.className = "tempest-actions";
          const equip = document.createElement("button");
          equip.className = "tempest-action";
          equip.type = "button";
          equip.textContent = equipped ? "Equipped ✓" : "Equip";
          equip.disabled = equipped;
          const unequip = document.createElement("button");
          unequip.className = "tempest-action secondary";
          unequip.type = "button";
          unequip.textContent = "Unequip";
          unequip.disabled = !equipped;
          const message = document.createElement("div");
          message.className = "tempest-status";
          message.textContent = equipped ? "Currently equipped" : "Owned — not equipped";
          actions.append(equip, unequip);
          item.append(previewHost, info, actions, message);

          async function saveAuraMonster(nextCard) {
            equip.disabled = true;
            unequip.disabled = true;
            message.textContent = "Saving...";
            try {
              const { error } = await supabase.rpc("set_my_chat_namecard", {
                p_card_id: nextCard
              });
              if (error) throw error;
              await refreshInventory();
              // Refresh local sidebar; remote viewers use existing 12s sync.
              if (typeof renderUsers === "function") {
                void renderUsers.solarCardState?.fetch?.();
              }
            } catch (error) {
              console.warn("[Aura Monster inventory]", error);
              message.textContent = "Could not save: " + error.message;
              equip.disabled = equipped;
              unequip.disabled = !equipped;
            }
          }
          equip.addEventListener("click", () => saveAuraMonster("aura_monster"));
          unequip.addEventListener("click", () => saveAuraMonster(null));
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

