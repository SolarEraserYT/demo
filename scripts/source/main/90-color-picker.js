// --------------------------------------------------
// NICKNAME COLOR PICKER
// --------------------------------------------------

const pickerStyle = document.createElement("style");

pickerStyle.textContent = `
  .solar-color-menu {
    position: fixed;
    z-index: 9999;
    width: 226px;
    padding: 7px;
    background: #282828;
    border: 1px solid #555;
    box-shadow: 0 5px 18px #0009;
    color: #eee;
    font: 12px Arial, sans-serif;
    overflow: visible;
  }

  .solar-color-menu button,
  .solar-color-menu select {
    font: inherit;
  }

  .solar-color-menu button {
    cursor: pointer;
  }

  .solar-color-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
  }

  .solar-color-preview {
    width: 17px;
    height: 17px;
    border: 1px solid #999;
    flex: none;
    cursor: pointer;
  }

  .solar-color-preview:hover {
    outline: 1px solid #aaa;
  }

  .solar-color-select {
    flex: 1;
    min-width: 0;
    background: #333;
    color: #eee;
    border: 1px solid #666;
    padding: 4px;
  }

  .solar-color-popup {
    position: absolute;
    left: 0;
    top: calc(100% + 4px);
    bottom: auto;
    z-index: 10001;
    padding: 9px;
    background: #292929;
    border: 1px solid #666;
    box-shadow: 0 6px 18px #000a;
    display: none;
    width: 216px;
  }

  .solar-color-popup.open {
    display: block;
  }

  .solar-color-workspace {
    display: flex;
    gap: 6px;
  }

  .solar-color-square {
    position: relative;
    width: 174px;
    height: 174px;
    cursor: crosshair;
    background:
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, transparent);
    border: 1px solid #666;
    touch-action: none;
  }

  .solar-color-cursor {
    position: absolute;
    width: 9px;
    height: 9px;
    border: 1px solid white;
    border-radius: 50%;
    box-shadow: 0 0 2px #000;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .solar-hue-bar {
    position: relative;
    width: 22px;
    height: 174px;
    cursor: pointer;
    border: 1px solid #666;
    background: linear-gradient(
      to bottom,
      red 0%,
      yellow 16.67%,
      lime 33.33%,
      cyan 50%,
      blue 66.67%,
      magenta 83.33%,
      red 100%
    );
    touch-action: none;
  }

  .solar-hue-cursor {
    position: absolute;
    left: -3px;
    right: -3px;
    height: 3px;
    border: 1px solid white;
    background: #111;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .solar-color-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    margin-top: 9px;
  }

  .solar-color-actions button {
    border: 0;
    background: #383838;
    color: white;
    padding: 4px 7px;
  }

  .solar-color-actions .cancel {
    color: #ff5555;
  }

  .solar-color-actions .choose {
    background: #555;
  }

  .solar-color-error {
    color: #ff9b83;
    min-height: 13px;
    font-size: 11px;
  }
`;

document.head.appendChild(pickerStyle);

const colorMenu = document.createElement("div");
colorMenu.className = "solar-color-menu";
colorMenu.style.display = "none";

const colorRow = document.createElement("div");
colorRow.className = "solar-color-row";

const colorPreview = document.createElement("div");
colorPreview.className = "solar-color-preview";

const colorSelect = document.createElement("select");
colorSelect.className = "solar-color-select";

const newColorOption = document.createElement("option");
newColorOption.value = "new";
newColorOption.textContent = "New color!";
colorSelect.appendChild(newColorOption);

for (let i = 1; i <= 3; i++) {
  const option = document.createElement("option");
  option.value = "slot" + i;
  option.textContent = "Color " + i;
  colorSelect.appendChild(option);
}

colorRow.append(colorPreview, colorSelect);

const openColorButton = document.createElement("button");
openColorButton.textContent = "choose";
openColorButton.style.cssText =
  "background:#414141;color:#fff;" +
  "border:1px solid #666;padding:4px 8px;";

const colorPopup = document.createElement("div");
colorPopup.className = "solar-color-popup";

const colorWorkspace = document.createElement("div");
colorWorkspace.className = "solar-color-workspace";

const colorSquare = document.createElement("div");
colorSquare.className = "solar-color-square";

const squareCursor = document.createElement("div");
squareCursor.className = "solar-color-cursor";
colorSquare.appendChild(squareCursor);

const hueBar = document.createElement("div");
hueBar.className = "solar-hue-bar";

const hueCursor = document.createElement("div");
hueCursor.className = "solar-hue-cursor";
hueBar.appendChild(hueCursor);

colorWorkspace.append(colorSquare, hueBar);

const colorError = document.createElement("div");
colorError.className = "solar-color-error";

const colorActions = document.createElement("div");
colorActions.className = "solar-color-actions";

const cancelColorButton = document.createElement("button");
cancelColorButton.className = "cancel";
cancelColorButton.textContent = "cancel";

const chooseColorButton = document.createElement("button");
chooseColorButton.className = "choose";
chooseColorButton.textContent = "choose";

colorActions.append(
  cancelColorButton,
  chooseColorButton
);

colorPopup.append(
  colorWorkspace,
  colorActions,
  colorError
);

colorMenu.append(
  colorRow,
  openColorButton,
  colorPopup
);

document.body.appendChild(colorMenu);

let colorHue = 0;
let colorSat = 0;
let colorValue = 1;
let selectedHex = "#FFFFFF";

function hsvToHex(h, s, v) {
  const f = n => {
    const k = (n + h / 60) % 6;

    return v - v * s *
      Math.max(Math.min(k, 4 - k, 1), 0);
  };

  return "#" + [5, 3, 1]
    .map(n =>
      Math.round(f(n) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")
    .toUpperCase();
}

function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }

    h *= 60;

    if (h < 0) h += 360;
  }

  return {
    h,
    s: max === 0 ? 0 : d / max,
    v: max
  };
}

function updateColorPicker() {
  selectedHex = hsvToHex(
    colorHue,
    colorSat,
    colorValue
  );

  const pureHue = hsvToHex(colorHue, 1, 1);

  colorSquare.style.background =
    "linear-gradient(to top, #000, transparent), " +
    "linear-gradient(to right, #fff, " +
    pureHue + ")";

  squareCursor.style.left =
    (colorSat * 100) + "%";

  squareCursor.style.top =
    ((1 - colorValue) * 100) + "%";

  hueCursor.style.top =
    (colorHue / 360 * 100) + "%";

  colorPreview.style.background = selectedHex;
}

function setPickerHex(hex) {
  const hsv = hexToHsv(validColor(hex));

  colorHue = hsv.h;
  colorSat = hsv.s;
  colorValue = hsv.v;

  updateColorPicker();
}

function readColorSlots() {
  try {
    const value = JSON.parse(
      localStorage.getItem(SLOT_STORAGE_KEY) || "{}"
    );

    return value && typeof value === "object"
      ? value
      : {};

  } catch {
    return {};
  }
}

function saveColorSlot(slot, hex) {
  const slots = readColorSlots();
  slots[slot] = validColor(hex);

  try {
    localStorage.setItem(
      SLOT_STORAGE_KEY,
      JSON.stringify(slots)
    );
  } catch (error) {
    console.warn("[Colors] Local save failed:", error);
  }
}

function updateColorSlotOptions() {
  const slots = readColorSlots();

  for (let i = 1; i <= 3; i++) {
    const option = colorSelect.querySelector(
      'option[value="slot' + i + '"]'
    );

    if (option) {
      option.textContent =
        "Color " + i +
        (slots["slot" + i] ? " ✓" : "");
    }
  }
}

async function saveNicknameColor(hex) {
  if (!supabase || !profile) {
    throw new Error("Chat is still connecting.");
  }

  const { data, error } = await supabase.rpc(
    "change_chat_nickname_color",
    { p_color: validColor(hex) }
  );

  if (error) throw error;

  profile.nickname_color = validColor(data);

  if (channel && presenceWorking) {
    const result = await trackMyPresence();

    if (result !== "ok") {
      privateWarning(
        "Color saved, but the online list " +
        "may need a reconnect."
      );
    }
  }

  renderUsers();

  // Update messages belonging to this account.
  for (const nick of messages.querySelectorAll(
    ".message_item .nick[data-account-id]"
  )) {
    if (
      nick.dataset.accountId ===
      String(profile.account_id)
    ) {
      nick.style.color = profile.nickname_color;

      if (nick.classList.contains("chat-glow")) {
        nick.style.setProperty(
          "--glow-color",
          profile.nickname_color
        );
      }
    }
  }

  privateWarning(
    "Nickname color saved: " +
    profile.nickname_color
  );
}

function openColorPopup() {
  colorError.textContent = "";
  colorPopup.classList.add("open");
}

function closeColorPopup() {
  colorPopup.classList.remove("open");
}

function toggleColorPopup() {
  if (colorPopup.classList.contains("open")) {
    closeColorPopup();
  } else {
    openColorPopup();
  }
}

openColorButton.addEventListener(
  "click",
  toggleColorPopup
);

colorPreview.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  toggleColorPopup();
});

cancelColorButton.addEventListener("click", () => {
  closeColorPopup();
});

function chooseFromColorSelect() {
  const choice = colorSelect.value;
  const slots = readColorSlots();

  if (choice === "new") {
    setPickerHex(
      profile?.nickname_color || "#FFFFFF"
    );
  } else {
    setPickerHex(
      slots[choice] ||
      profile?.nickname_color ||
      "#FFFFFF"
    );
  }

  openColorPopup();
}

colorSelect.addEventListener(
  "change",
  chooseFromColorSelect
);

chooseColorButton.addEventListener(
  "click",
  async () => {
    chooseColorButton.disabled = true;
    colorError.textContent = "";

    try {
      const color = selectedHex;
      await saveNicknameColor(color);

      if (colorSelect.value === "new") {
        const slots = readColorSlots();

        const freeSlot =
          ["slot1", "slot2", "slot3"]
            .find(slot => !slots[slot]);

        if (freeSlot) {
          saveColorSlot(freeSlot, color);
        }

      } else {
        saveColorSlot(
          colorSelect.value,
          color
        );
      }

      updateColorSlotOptions();
      closeColorPopup();

    } catch (error) {
      colorError.textContent = error.message;

    } finally {
      chooseColorButton.disabled = false;
    }
  }
);

function attachColorPointer(element, update) {
  element.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();

      element.setPointerCapture(
        event.pointerId
      );

      update(event);
    }
  );

  element.addEventListener(
    "pointermove",
    event => {
      if (element.hasPointerCapture(event.pointerId)) {
        update(event);
      }
    }
  );
}

attachColorPointer(colorSquare, event => {
  const rect = colorSquare.getBoundingClientRect();

  colorSat = Math.min(
    1,
    Math.max(
      0,
      (event.clientX - rect.left) / rect.width
    )
  );

  colorValue = 1 - Math.min(
    1,
    Math.max(
      0,
      (event.clientY - rect.top) / rect.height
    )
  );

  updateColorPicker();
});

attachColorPointer(hueBar, event => {
  const rect = hueBar.getBoundingClientRect();

  colorHue = Math.min(
    359.99,
    Math.max(
      0,
      (event.clientY - rect.top) /
        rect.height * 360
    )
  );

  updateColorPicker();
});

