/* SolarEraser Chat — Step 5: Cosmetic Effect Inventories */

(() => {
  "use strict";

  const style = document.createElement("style");
  style.id = "solar-effect-inventory-css";

  style.textContent = `
    .solar-effect-inventory-card {
      padding: 11px;
      border: 1px solid var(--border-subtle, #343444);
      border-radius: 10px;
      background: var(--bg-hover, #171923);
      margin-bottom: 12px;
    }

    .solar-effect-inventory-card .sv4-stage {
      min-height: 110px;
      height: 110px;
    }

    .solar-effect-inventory-card .sv4-name {
      font-size: 23px;
    }

    .solar-effect-glitch-preview {
      min-height: 100px;
      padding: 16px 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background: linear-gradient(
        125deg, #050d1c, #1b1235, #09172b
      );
      overflow: hidden;
    }

    .solar-effect-glitch-preview .solar-glitch-stack {
      width: 100%;
    }

    .solar-effect-glitch-preview .solar-glitch-message {
      margin: 0;
    }

    .solar-effect-info {
      padding: 11px 0;
    }

    .solar-effect-info strong {
      display: block;
      font-size: 14px;
      color: var(--text-main, #fff);
    }

    .solar-effect-info small {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      line-height: 1.5;
      color: var(--text-muted, #a4a4b2);
    }

    .solar-effect-actions {
      display: flex;
      gap: 8px;
    }

    .solar-effect-action {
      flex: 1;
      min-width: 0;
      padding: 9px;
      border-radius: 7px;
      border: 1px solid #8273e8;
      background: #41368c;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }

    .solar-effect-action.secondary {
      background: var(--bg-panel, #161720);
      border-color: var(--border-subtle, #41414d);
      color: var(--text-main, #fff);
    }

    .solar-effect-action:disabled {
      opacity: .5;
      cursor: default;
    }

    .solar-effect-status {
      margin-top: 9px;
      font-size: 11px;
      color: var(--text-muted, #a4a4b2);
    }

    @media (prefers-reduced-motion: reduce) {
      .solar-effect-inventory-card *,
      .solar-effect-inventory-card *::before,
      .solar-effect-inventory-card *::after {
        animation: none !important;
      }
    }
  `;

  if (!document.getElementById(style.id)) {
    document.head.appendChild(style);
  }

  const effects = [
    {
      type: "username",
      section: "solar-settings-username-effects",
      id: "prism_light",
      name: "Prism Light",
      description:
        "Moving holographic username with cyan, pink, " +
        "purple and white light.",
      preview: `
        <div class="sv4-stage sv4-prism">
          <span class="sv4-name">SolarEraser</span>
          <span class="sv4-visual-caption">
            LIVE PREVIEW
          </span>
        </div>
      `
    },
    {
      type: "text",
      section: "solar-settings-text-effects",
      id: "glitch_text",
      name: "Glitch Text",
      description:
        "Animated RGB glitch effect on your chat messages.",
      preview: `
        <div class="solar-effect-glitch-preview">
          <div class="solar-glitch-stack">
            <div class="solar-glitch-message">
              <span class="solar-glitch-prefix">
                03:36 [XXV]
              </span>
              <span
                class="solar-glitch-shift"
                data-text="connection established"
              >connection established</span>
            </div>
          </div>
        </div>
      `
    }
  ];

  for (const effect of effects) {
    const section = document.getElementById(
      effect.section
    );

    const content = section?.querySelector(
      ".solar-settings-section-content"
    );

    if (!section || !content) continue;

    let requestNumber = 0;

    async function refreshEffects() {
      const request = ++requestNumber;

      const loading = document.createElement("div");
      loading.className = "solar-settings-coming";
      loading.textContent = "Loading effects...";

      content.replaceChildren(loading);

      try {
        if (!supabase || !profile) {
          throw new Error("Chat is still connecting.");
        }

        const { data, error } = await supabase.rpc(
          "get_my_chat_effects"
        );

        if (error) throw error;

        if (request !== requestNumber || !section.open) {
          return;
        }

        const category = data?.[effect.type] || {};
        const owned = Array.isArray(category.owned)
          ? category.owned
          : [];

        content.replaceChildren();

        if (!owned.length) {
          loading.textContent = "No effects owned yet.";
          content.appendChild(loading);
          return;
        }

        for (const effectId of owned) {
          if (effectId !== effect.id) {
            const other = document.createElement("div");
            other.className = "solar-settings-coming";
            other.textContent = String(effectId)
              .replaceAll("_", " ");
            content.appendChild(other);
            continue;
          }

          const equipped = category.equipped === effect.id;

          const item = document.createElement("div");
          item.className = "solar-effect-inventory-card";

          item.innerHTML = `
            ${effect.preview}

            <div class="solar-effect-info">
              <strong>${effect.name}</strong>
              <small>${effect.description}</small>
            </div>

            <div class="solar-effect-actions">
              <button type="button"
                class="solar-effect-action effect-equip">
                ${equipped ? "Equipped ✓" : "Equip"}
              </button>

              <button type="button"
                class="solar-effect-action secondary effect-unequip">
                Unequip
              </button>
            </div>

            <div class="solar-effect-status">
              ${equipped
                ? "Currently equipped"
                : "Owned — not equipped"}
            </div>
          `;

          const equip = item.querySelector(
            ".effect-equip"
          );

          const unequip = item.querySelector(
            ".effect-unequip"
          );

          const message = item.querySelector(
            ".solar-effect-status"
          );

          equip.disabled = equipped;
          unequip.disabled = !equipped;

          async function changeEffect(nextId) {
            equip.disabled = true;
            unequip.disabled = true;
            message.textContent = "Saving...";

            try {
              const { error } = await supabase.rpc(
                "set_my_chat_effect",
                {
                  p_effect_type: effect.type,
                  p_effect_id: nextId
                }
              );

              if (error) throw error;

              await refreshEffects();

            } catch (error) {
              console.warn("[Effect Inventory]", error);

              message.textContent =
                "Could not save: " + error.message;

              equip.disabled = equipped;
              unequip.disabled = !equipped;
            }
          }

          equip.addEventListener("click", () => {
            changeEffect(effect.id);
          });

          unequip.addEventListener("click", () => {
            changeEffect(null);
          });

          content.appendChild(item);
        }

      } catch (error) {
        if (request !== requestNumber || !section.open) {
          return;
        }

        console.warn("[Effect Inventory]", error);

        loading.textContent =
          "Could not load effects: " + error.message;

        content.replaceChildren(loading);
      }
    }

    section.addEventListener("toggle", () => {
      if (section.open) {
        refreshEffects();
      } else {
        requestNumber++;
      }
    });
  }

  console.log(
    "[SolarEraser] Cosmetic effect inventories ready."
  );
})();

