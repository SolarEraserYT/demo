/* ==========================================
   SOLARERASER CHAT — STEP 7
   GLOBAL TEXT SHADOW SETTING
   ========================================== */

(() => {
  "use strict";

  const section = document.getElementById(
    "solar-settings-advanced"
  );

  const content = section?.querySelector(
    ".solar-settings-section-content"
  );

  if (!content) return;

  const storageKey = "solar_chat_text_shadow_v1";

  // Global, inherited shadow.
  // Existing special effects with their own
  // text-shadow remain untouched.
  const style = document.createElement("style");
  style.id = "solar-global-text-shadow-css";

  style.textContent = `
    

/* SolarEraser — Dark text depth, no glow */

html.solar-text-shadow-enabled body {
  text-shadow:
    -1px -1px 0 rgba(0, 0, 0, .65),
    1px 1px 0 #000000,
    2px 2px 1px rgba(0, 0, 0, .95),
    3px 3px 2px rgba(0, 0, 0, .75);
}


    .solar-text-shadow-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-subtle, #343444);
      border-radius: 8px;
      background: var(--bg-hover, #171923);
      cursor: pointer;
    }

    .solar-text-shadow-toggle strong {
      display: block;
      font-size: 13px;
    }

    .solar-text-shadow-toggle small {
      display: block;
      margin-top: 4px;
      color: var(--text-muted, #a4a4b2);
      font-size: 11px;
      line-height: 1.5;
    }

    .solar-text-shadow-toggle input[type="checkbox"] {
      appearance: auto;
      width: 18px;
      height: 18px;
      min-width: 18px;
      margin: 0;
      padding: 0;
      cursor: pointer;
      accent-color: #9185ff;
    }
  `;

  if (!document.getElementById(style.id)) {
    document.head.appendChild(style);
  }

  // Remove the old Advanced placeholder only.
  const placeholder = content.querySelector(
    ".solar-settings-coming"
  );

  if (
    placeholder &&
    placeholder.textContent.includes(
      "More appearance and performance"
    )
  ) {
    placeholder.remove();
  }

  const label = document.createElement("label");
  label.className = "solar-text-shadow-toggle";

  label.innerHTML = `
    <span>
      <strong>Text Shadow</strong>
      <small>
        Adds EmuChat-style dark shadow to text.
        Existing special effects keep their own glow.
      </small>
    </span>

    <input
      type="checkbox"
      aria-label="Enable text shadow"
    >
  `;

  content.appendChild(label);

  const checkbox = label.querySelector("input");

  let enabled = true;

  try {
    enabled = localStorage.getItem(storageKey) !== "0";
  } catch (error) {
    console.warn("[Text Shadow] Storage unavailable.");
  }

  function applyTextShadow(value) {
    document.documentElement.classList.toggle(
      "solar-text-shadow-enabled",
      value
    );

    try {
      localStorage.setItem(
        storageKey,
        value ? "1" : "0"
      );
    } catch (error) {
      console.warn("[Text Shadow] Could not save.");
    }
  }

  checkbox.checked = enabled;
  applyTextShadow(enabled);

  checkbox.addEventListener("change", () => {
    applyTextShadow(checkbox.checked);
  });

  console.log(
    "[SolarEraser] Global text shadow ready."
  );
})();
