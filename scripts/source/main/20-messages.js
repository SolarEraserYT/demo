// --------------------------------------------------
// MESSAGES
// --------------------------------------------------


function displayMessage(data) {
  if (
    !data ||
    typeof data.content !== "string"
  ) return;

  const line = document.createElement("div");
  line.className = "message_item";

  const time = document.createElement("span");
  time.className = "time";

  time.textContent = new Date().toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

  // Convert a level into Roman numerals.
  function toRoman(number) {
    let n = Math.floor(Number(number));

    if (!Number.isFinite(n) || n < 1) {
      n = 1;
    }

    const values = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"]
    ];

    let result = "";

    for (const [value, symbol] of values) {
      while (n >= value) {
        result += symbol;
        n -= value;
      }
    }

    return result;
  }

  const level = document.createElement("span");
  level.className = "chat-level";
  level.textContent =
    "[" + toRoman(data.level) + "]";

  level.style.color = "#609dff";

  const nick = document.createElement("span");
  nick.className = "nick";

  nick.textContent =
    "[" + String(data.nickname || "Guest") + "]";

  applyGlow(
    nick,
    data.account_id,
    data.nickname_color
  );
  
  attachUsernameHoverCard(nick);
  
  
const content = document.createElement("span");
content.className = "message";
content.textContent = data.content;

// STEP 136CH — Remembrance message color glow
if (isRemembranceRoom()) {
  content.style.setProperty(
    "--remembrance-message-color",
    validColor(data.nickname_color)
  );
}

line.append(time, level, nick, content);

  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;

  if (
    data.account_id &&
    !verifiedRoomGlows.has(String(data.account_id))
  ) {
    scheduleGlowRefresh();
  }
}


