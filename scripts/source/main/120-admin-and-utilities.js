// ==================================================
// STEP 114N — Live presence heartbeat for /rooms
// ==================================================

(function installChatLivePresenceHeartbeat() {
  let heartbeatRunning = false;

  async function sendPresenceHeartbeat() {
    if (
      !supabase ||
      !profile ||
      !currentRoomId ||
      !channel ||
      switching ||
      heartbeatRunning
    ) {
      return;
    }

    // Only report presence while our Realtime
    // channel is successfully connected.
    if (channel.state !== "joined") return;

    heartbeatRunning = true;

    const roomId = String(currentRoomId);

    try {
      const { error } = await supabase.rpc(
        "heartbeat_chat_presence",
        { p_room_id: roomId }
      );

      if (error) throw error;

    } catch (error) {
      console.warn(
        "[Rooms] Presence heartbeat failed:",
        error.message
      );

    } finally {
      heartbeatRunning = false;
    }
  }

  // Update every 15 seconds.
  setInterval(sendPresenceHeartbeat, 15000);

  // First heartbeat shortly after connecting.
  setTimeout(sendPresenceHeartbeat, 3000);

  console.log(
    "[SolarEraser Chat] Step 114N heartbeat loaded!"
  );
})();
// ==================================================
// STEP 114O — Admin-only /rooms popup
// ==================================================

(function installAdminRoomsCommand() {
  const previousHandleCommand = handleCommand;

  // Create popup.
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100000",
    "background:rgba(0,0,0,.65)",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:16px"
  ].join(";");

  const popup = document.createElement("div");
  popup.style.cssText = [
    "background:#202431",
    "color:#e9eaf5",
    "border:1px solid #41475c",
    "border-radius:8px",
    "padding:18px",
    "width:min(420px,100%)",
    "max-height:75vh",
    "overflow-y:auto",
    "font:13px Arial,sans-serif"
  ].join(";");

  const heading = document.createElement("div");
  heading.style.cssText =
    "display:flex;justify-content:space-between;" +
    "align-items:center;margin-bottom:14px;";

  const title = document.createElement("strong");
  title.textContent = "Active Rooms";
  title.style.fontSize = "16px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";
  closeButton.style.cssText =
    "background:none;border:0;color:#aaa;" +
    "font-size:18px;cursor:pointer;";

  closeButton.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  heading.append(title, closeButton);

  const content = document.createElement("div");
  popup.append(heading, content);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      overlay.style.display = "none";
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      overlay.style.display = "none";
    }
  });

  async function showActiveRooms() {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }
    try {
      const { data, error } = await supabase.rpc(
        "get_admin_active_rooms"
      );

      if (error) {
        privateWarning("Invalid command");
        return;
      }

      const rooms = Array.isArray(data) ? data : [];

      // Only show the popup AFTER Supabase
      // has successfully authorized the request.
      content.replaceChildren();
      overlay.style.display = "flex";

      if (!rooms.length) {
        content.textContent = "No active rooms.";
        return;
      }

      let totalUsers = 0;

      for (const room of rooms) {
        const count = Number(room.online_users) || 0;
        totalUsers += count;

        const row = document.createElement("div");
        row.style.cssText =
          "display:flex;justify-content:space-between;" +
          "gap:12px;padding:10px 0;" +
          "border-bottom:1px solid #353a4b;";

        const roomName = document.createElement("span");
        roomName.textContent =
          (room.room_type === "private" ? "🔒 " : "🌐 ") +
          room.room_name;

        const users = document.createElement("span");
        users.style.whiteSpace = "nowrap";
        users.style.color = "#aaaec7";
        users.textContent =
          count + (count === 1 ? " user" : " users");

        row.append(roomName, users);
        content.appendChild(row);
      }

      const footer = document.createElement("div");
      footer.style.cssText =
        "margin-top:14px;font-weight:bold;" +
        "display:flex;justify-content:space-between;gap:10px;";

      const totalRooms = document.createElement("span");
      totalRooms.textContent = rooms.length + " active rooms";

      const total = document.createElement("span");
      total.textContent = totalUsers + " users";

      footer.append(totalRooms, total);
      content.appendChild(footer);

       } catch (error) {
      console.warn("[Rooms] Request failed:", error);
      privateWarning("Invalid command");
    }
  }

  handleCommand = async function(content) {
    if (/^\/rooms(?:\s*)$/i.test(content)) {
      await showActiveRooms();
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 114O /rooms loaded!"
  );
})();
// ==================================================
// STEP 115C — Admin-only /find USER_ID
// ==================================================

(function installAdminFindCommand() {
  const previousHandleCommand = handleCommand;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Private popup, matching the /rooms design.
  const overlay = document.createElement("div");

  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:100001",
    "background:rgba(0,0,0,.65)",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "padding:16px"
  ].join(";");

  const popup = document.createElement("div");

  popup.style.cssText = [
    "background:#202431",
    "color:#e9eaf5",
    "border:1px solid #41475c",
    "border-radius:8px",
    "padding:18px",
    "width:min(420px,100%)",
    "max-height:75vh",
    "overflow-y:auto",
    "font:13px Arial,sans-serif"
  ].join(";");

  const heading = document.createElement("div");

  heading.style.cssText =
    "display:flex;justify-content:space-between;" +
    "align-items:center;margin-bottom:14px;";

  const title = document.createElement("strong");
  title.textContent = "Find User";
  title.style.fontSize = "16px";

  const closeButton = document.createElement("button");
  closeButton.textContent = "✕";

  closeButton.style.cssText =
    "background:none;border:0;color:#aaa;" +
    "font-size:18px;cursor:pointer;";

  const content = document.createElement("div");

  function closePopup() {
    overlay.style.display = "none";
  }

  closeButton.addEventListener("click", closePopup);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closePopup();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePopup();
  });

  heading.append(title, closeButton);
  popup.append(heading, content);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  function addResultRow(label, value) {
    const row = document.createElement("div");

    row.style.cssText =
      "display:flex;justify-content:space-between;" +
      "gap:12px;padding:10px 0;" +
      "border-bottom:1px solid #353a4b;";

    const name = document.createElement("span");
    name.textContent = label;
    name.style.color = "#aaaec7";

    const result = document.createElement("span");
    result.textContent = String(value);
    result.style.textAlign = "right";
    result.style.overflowWrap = "anywhere";

    row.append(name, result);
    content.appendChild(row);
  }

  async function findUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Never show a popup before server authorization.
    // A malformed ID gets the same generic response
    // as an unrecognized command.
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Invalid command");
      return;
    }

    try {
      const { data, error } = await supabase.rpc(
        "admin_find_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        privateWarning("Invalid command");
        return;
      }

      // Authorization succeeded.
      const user = Array.isArray(data) ? data[0] : data;

      content.replaceChildren();

      if (!user) {
        content.textContent = "User not found.";
        overlay.style.display = "flex";
        return;
      }

      addResultRow("Username", user.nickname || "Unknown");
      addResultRow("Account ID", user.account_id);
      addResultRow(
        "Status",
        user.online_status === "Online" ? "Online" : "Offline"
      );
      addResultRow(
        "Room",
        user.online_status === "Online"
          ? (user.room_name || "Unknown")
          : "None"
      );
      addResultRow(
        "Room Type",
        user.online_status === "Online"
          ? (
              user.room_type === "private"
                ? "Private"
                : "Public"
            )
          : "None"
      );

      overlay.style.display = "flex";

    } catch (error) {
      console.warn("[Find] Request failed:", error);
      privateWarning("Invalid command");
    }
  }

  // Intercept only /find.
  // Every other command continues working unchanged.
  handleCommand = async function(content) {
    const match = content.match(
      /^\/find(?:\s+(.*))?$/i
    );

    if (match) {
      await findUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 115C /find loaded!"
  );
})();

/*
  STEP 117O — Global staff /ban command
  Preserves all existing commands.
*/

(function installBanCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let banning = false;

  async function banUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Verify staff permissions on the server before
    // revealing command-specific usage or errors.
    const { data: staffData, error: staffError } =
      await supabase.rpc("get_admin_active_rooms");

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Usage: /ban USER_ID");
      return;
    }

    if (banning) return;
    banning = true;

    try {
      const { error } = await supabase.rpc(
        "ban_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        if (error.message === "Invalid command") {
          privateWarning("Invalid command");
        } else {
          privateWarning("Ban failed: " + error.message);
        }
        return;
      }

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning("Ban failed: " + error.message);

    } finally {
      banning = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/ban(?:\s+(.*))?$/i
    );

    if (match) {
      await banUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 117O /ban loaded!"
  );
})();

/*
  STEP 118C — Silent /unban command
  Global staff only.
  Preserves all existing commands.
*/

(function installUnbanCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let unbanning = false;

  async function unbanUser(targetId) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Verify global staff authorization first.
    const { error: staffError } = await supabase.rpc(
      "get_admin_active_rooms"
    );

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning("Usage: /unban USER_ID");
      return;
    }

    if (unbanning) return;
    unbanning = true;

    try {
      const { error } = await supabase.rpc(
        "unban_chat_user",
        {
          p_target_account_id: targetId
        }
      );

      if (error) {
        if (error.message === "Invalid command") {
          privateWarning("Invalid command");
        } else {
          privateWarning(
            "Unban failed: " + error.message
          );
        }
        return;
      }

      // Silent success: no SERVER announcement,
      // no public message, no popup.
      // The user can reconnect after refreshing.

    } catch (error) {
      privateWarning(
        "Unban failed: " + error.message
      );

    } finally {
      unbanning = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/unban(?:\s+(.*))?$/i
    );

    if (match) {
      await unbanUser((match[1] || "").trim());
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 118C /unban loaded!"
  );
})();

/*
  STEP 119A — Clickable chat usernames

  Normal click: copy and append nickname.
  Shift-click: copy and append account ID.
  Works on old messages, even after users leave.
*/

(function installChatUsernameClicks() {
  messages.addEventListener("click", async event => {
    const name = event.target.closest(
      ".nick[data-account-id]"
    );

    if (!name || !messages.contains(name)) {
      return;
    }

    
    const value = event.shiftKey
      ? name.dataset.accountId
      : name.textContent.trim().replace(/^\[|\]$/g, "");


    if (!value) return;

    // Keep existing text in the message input.
    const existing = sendArea.value;

    const separator =
      existing.length > 0 && !/\s$/.test(existing)
        ? " "
        : "";

    
    sendArea.value =
      existing + separator + value + " ";


    sendArea.focus();
    sendArea.setSelectionRange(
      sendArea.value.length,
      sendArea.value.length
    );

    // Copy nickname or account ID.
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.warn("[Chat username copy]", error);
    }
  });

  // Show users that chat usernames are clickable.
  const style = document.createElement("style");

  style.textContent = `
    .messages .nick[data-account-id] {
      cursor: pointer;
    }

    .messages .nick[data-account-id]:hover {
      text-decoration: underline;
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 119A] Chat usernames are clickable!"
  );
})();

/*
  STEP 120B — SolarEraser Chat welcome messages

  Pink: welcome
  Green: instructions
  Yellow: safety reminder

  Displayed once per room entry.
  Scrolls naturally with chat messages.
*/

(function installWelcomeMessages() {
  const originalJoinRoom = joinRoom;

  const welcomeLines = [
    {
      color: "#ff76ca",
      text: "Welcome to SolarEraser Chat!"
    },
    {
      color: "#60df73",
      text: "Type /help to see available commands."
    },
    {
      color: "#60df73",
      text: "To change your nickname, type /nick followed by your new name."
    },
    {
      color: "#60df73",
      text: "To join a private room, type /join followed by the room name."
    },
    {
      color: "#ffd447",
      text: "Please respect other users and avoid sharing personal information."
    }
  ];

  function showWelcomeMessages() {
    if (chatAccountBanned || !currentRoomId) return;

    const time = new Date().toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );

    const fragment = document.createDocumentFragment();

    for (const item of welcomeLines) {
      const line = document.createElement("div");
      line.className = "message_item";
line.dataset.solarWelcome = "true";
      const content = document.createElement("span");
      content.className = "message";
      content.style.color = item.color;
      content.textContent = "[" + time + "] " + item.text;

      line.appendChild(content);
      fragment.appendChild(line);
    }

    messages.prepend(fragment);
  }

  joinRoom = async function(...args) {
    const previousRoomId = currentRoomId;
    const result = await originalJoinRoom(...args);

    if (
      result === true &&
      currentRoomId &&
      currentRoomId !== previousRoomId
    ) {
      showWelcomeMessages();
    }

    return result;
  };

  // Startup can begin before this block is installed.
  // Detect the initial room connection as well.
  let initialWelcomeShown = false;

  const initialCheck = setInterval(() => {
    if (initialWelcomeShown || chatAccountBanned) {
      clearInterval(initialCheck);
      return;
    }

    if (currentRoomId && channel && !switching) {
      initialWelcomeShown = true;
      clearInterval(initialCheck);

      // Avoid displaying twice if the join wrapper
      // already inserted the welcome messages.
      if (!messages.querySelector(
        '[data-solar-welcome="true"]'
      )) {
        showWelcomeMessages();
      }
    }
  }, 250);

  console.log("[Step 120B] Welcome messages loaded!");
})();

