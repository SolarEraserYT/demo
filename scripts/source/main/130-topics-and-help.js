/*
  STEP 121B — Scrolling room topics

  Main Room: welcome instructions
  Spam: timeout explanation
  Private rooms: ownership and /topic

  /topic will be implemented later.
*/

(function installScrollingRoomTopics() {
  const MAIN_TOPIC =
    "Welcome to SolarEraser Chat! " +
    "To change your nickname type /nick and your new nickname. " +
    "To join a room type /join and the room name. " +
    "If you experience any lag, try disabling some options " +
    "in the ⚙️ settings panel.";

  const SPAM_TOPIC =
    "If you were moved here, that means you have been " +
    "temporarily timed out. Spamming is allowed here.";

  const PRIVATE_TOPIC =
    "If your nickname glows, you are the current owner " +
    "of the room. You can change this topic by typing " +
    "/topic and the new room topic.";

  // STEP 136CI — Secret Remembrance topic
  const REMEMBRANCE_TOPIC =
    "this is a hidden test room";

  const topicBar = document.createElement("div");
  topicBar.id = "solar-room-topic";

  const topicText = document.createElement("span");
  topicText.id = "solar-room-topic-text";

  topicBar.appendChild(topicText);

  const topicStyle = document.createElement("style");

  topicStyle.textContent = `
    #solar-room-topic {
      width: 100%;
      height: 22px;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
      background: #292929;
      border-bottom: 1px solid #555;
      color: #ff76ca;
      font: 12px Arial, sans-serif;
      display: flex;
      align-items: center;
    }

    #solar-room-topic-text {
      display: inline-block;
      white-space: nowrap;
      flex: none;
      padding-left: 100%;
      animation: solarTopicScroll 28s linear infinite;
      will-change: transform;
    }

    @keyframes solarTopicScroll {
      from {
        transform: translateX(0);
      }

      to {
        transform: translateX(-100%);
      }
    }
  `;

  document.head.appendChild(topicStyle);

  // Place topic bar above the chat messages.
  messages.parentNode.insertBefore(topicBar, messages);

  
  let displayedTopic = "";
  let topicRequestRunning = false;
  let lastTopicCheck = 0;

  function showTopic(topic) {
    if (topic === displayedTopic) return;

    displayedTopic = topic;
    topicText.textContent = topic;

    // Restart scrolling when the topic changes.
    topicText.style.animation = "none";
    void topicText.offsetWidth;
    topicText.style.animation = "";
  }

  async function updateTopic() {
    
    // STEP 136CI — Use the secret room topic
    if (isRemembranceRoom()) {
      showTopic(REMEMBRANCE_TOPIC);
      return;
    }

    if (currentRoomType !== "private") {
      showTopic(
        currentRoom === "Spam"
          ? SPAM_TOPIC
          : MAIN_TOPIC
      );
      return;
    }

    if (!supabase || !currentRoomId) {
      showTopic(PRIVATE_TOPIC);
      return;
    }

    const roomId = String(currentRoomId);

    // Show default instructions while loading.
    if (displayedTopic === "" ||
        topicText.dataset.roomId !== roomId) {
      showTopic(PRIVATE_TOPIC);
    }

    topicText.dataset.roomId = roomId;

    // Avoid overlapping requests.
    if (topicRequestRunning) return;

    // Check for changes every 3 seconds.
    if (Date.now() - lastTopicCheck < 3000) return;

    topicRequestRunning = true;
    lastTopicCheck = Date.now();

    try {
      const { data, error } = await supabase.rpc(
        "get_chat_room_topic",
        { p_room_id: roomId }
      );

      if (error) throw error;

      // Ignore responses from a previous room.
      if (String(currentRoomId) !== roomId) return;

      const savedTopic =
        typeof data === "string" && data.trim()
          ? data
          : PRIVATE_TOPIC;

      showTopic(savedTopic);

    } catch (error) {
      console.warn(
        "[Topic] Refresh failed:",
        error.message
      );

    } finally {
      topicRequestRunning = false;
    }
  }


  // Update immediately after switching rooms.
  const originalJoinRoom = joinRoom;

  joinRoom = async function(...args) {
    const result = await originalJoinRoom(...args);

    if (result === true) {
      updateTopic();
    }

    return result;
  };

  // Show the appropriate topic on startup.
  updateTopic();

  // Catch initial connection and moderation moves.
  setInterval(() => {
    if (currentRoomId && !switching) {
      updateTopic();
    }
  }, 500);

  console.log(
    "[Step 121B] Three scrolling room topics installed!"
  );
})();

/*
  STEP 121C — Move scrolling topic into toolbar

  Keep existing room topics and animation.
  Use a dark blue background.
*/

(function moveScrollingTopicToToolbar() {
  const topicBar = document.getElementById(
    "solar-room-topic"
  );

  const settingsButton = document.querySelector(
    '.menu_button[data-target="settings"]'
  );

  if (!topicBar || !settingsButton) {
    console.warn(
      "[Step 121C] Topic bar or settings button missing."
    );
    return;
  }

  const toolbar = settingsButton.parentElement;

  // Place topic alongside the toolbar controls.
  toolbar.appendChild(topicBar);

  // Make toolbar items sit side by side.
  toolbar.style.display = "flex";
  toolbar.style.alignItems = "center";

  // Allow topic to occupy remaining toolbar width.
  topicBar.style.flex = "1 1 0";
  topicBar.style.minWidth = "0";
  topicBar.style.width = "auto";
  topicBar.style.height = "24px";
  topicBar.style.marginLeft = "12px";

  // Darker blue than the main chat background.
  topicBar.style.background = "#0c1323";
  topicBar.style.border = "1px solid #202c46";
  topicBar.style.borderRadius = "4px";

  // Keep the existing pink scrolling text.
  topicBar.style.color = "#ff76ca";

  console.log(
    "[Step 121C] Topic moved into toolbar!"
  );
})();

/*
  STEP 122A — Dynamic input hint + connecting screen

  Shows the current nickname in the input bar.
  Shows a yellow connection notice until joined.
  Keeps the scrolling topic visible throughout.
*/

(function installChatVisualPolish() {
  const CONNECTING_TEXT = "Trying to connect...";

  // ------------------------------------------
  // 1. Dynamic nickname hint
  // ------------------------------------------

  function updateInputHint() {
    if (chatAccountBanned) return;

    const nickname = profile?.nickname || "Guest";

    if (!sendArea.disabled) {
      sendArea.placeholder =
        'You are typing as "' + nickname +
        '". To change nick, type /nick and your new nickname.';
    }
  }

  // Keep the hint updated after nickname changes,
  // reconnects and room switches.
  setInterval(updateInputHint, 500);

  // ------------------------------------------
  // 2. Connection message
  // ------------------------------------------

  let connectingNotice = null;

  function showConnectingNotice() {
    if (connectingNotice || chatAccountBanned) return;

    const line = document.createElement("div");
    line.className = "message_item";
    line.id = "solar-connecting-notice";

    const time = document.createElement("span");
    time.className = "time";
    time.textContent =
      "[" + new Date().toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      ) + "]";

    const text = document.createElement("span");
    text.className = "message";
    text.textContent = CONNECTING_TEXT;
    text.style.color = "#ffd447";
    text.style.fontWeight = "bold";

    line.append(time, text);

    messages.prepend(line);
    connectingNotice = line;
  }

  function removeConnectingNotice() {
    if (connectingNotice) {
      connectingNotice.remove();
      connectingNotice = null;
    }
  }

  // Display while the initial room is connecting.
  if (!currentRoomId && !chatAccountBanned) {
    showConnectingNotice();
  }

  // Monitor connection state without changing
  // the existing room or Realtime logic.
  setInterval(() => {
    if (chatAccountBanned) {
      removeConnectingNotice();
      return;
    }

    if (currentRoomId && channel && !switching) {
      removeConnectingNotice();
      updateInputHint();
    } else if (!currentRoomId && !switching) {
      showConnectingNotice();
    }
  }, 250);

  // ------------------------------------------
  // 3. Visual styling
  // ------------------------------------------

  const style = document.createElement("style");

  style.textContent = `
    .send_area::placeholder {
      color: #a6a9b8;
      opacity: 1;
      font-size: 12px;
    }

    #solar-connecting-notice .time {
      color: #ffd447;
      margin-right: 5px;
    }

    #solar-connecting-notice .message {
      color: #ffd447;
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 122A] Input hint and connection screen installed!"
  );
})();

/*
  STEP 123B — Mobile long-press account IDs

  Tap: existing nickname behavior.
  Hold: copy and append account ID.
  Works in user list and chat messages.
*/

(function installMobileLongPressIDs() {
  const HOLD_MS = 500;

  let holdTimer = null;
  let holdTarget = null;
  let holdStartX = 0;
  let holdStartY = 0;
  let suppressClick = false;

  const SELECTOR =
    ".right .name[data-account-id], " +
    ".messages .nick[data-account-id]";

  function cancelHold() {
    clearTimeout(holdTimer);
    holdTimer = null;
  }

  function getName(target) {
    return target.closest?.(SELECTOR);
  }

  document.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;

    const name = getName(event.target);
    if (!name) return;

    cancelHold();

    holdTarget = name;
    holdStartX = event.clientX;
    holdStartY = event.clientY;
    suppressClick = false;

    holdTimer = setTimeout(async () => {
      holdTimer = null;

      if (!holdTarget || !holdTarget.isConnected) return;

      const id = holdTarget.dataset.accountId;
      if (!id) return;

      suppressClick = true;

      // Preserve existing text.
      const existing = sendArea.value;
      const separator =
        existing && !/\s$/.test(existing) ? " " : "";

      sendArea.value = existing + separator + id;

      // Copy the account ID.
      try {
        await navigator.clipboard.writeText(id);
      } catch (error) {
        console.warn("[Long press copy]", error);
      }

      // Avoid forcing the mobile keyboard open.
      privateWarning("Account ID copied.");
    }, HOLD_MS);
  }, true);

  document.addEventListener("pointermove", event => {
    if (!holdTimer) return;

    const distanceX = Math.abs(
      event.clientX - holdStartX
    );

    const distanceY = Math.abs(
      event.clientY - holdStartY
    );

    // Scrolling should cancel a pending hold.
    if (distanceX > 12 || distanceY > 12) {
      cancelHold();
    }
  }, true);

  document.addEventListener("pointerup", cancelHold, true);
  document.addEventListener("pointercancel", cancelHold, true);

  // Stop the normal nickname click after a long hold.
  document.addEventListener("click", event => {
    if (!suppressClick) return;

    const name = getName(event.target);
    if (!name) return;

    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  // Prevent mobile text selection on usernames.
  const style = document.createElement("style");

  style.textContent = `
    @media (pointer: coarse) {
      .right .name[data-account-id],
      .messages .nick[data-account-id] {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-y;
      }
    }
  `;

  document.head.appendChild(style);

  console.log(
    "[Step 123B] Mobile long-press IDs installed!"
  );
})();

/*
  STEP 124H — /admin_authority

  /admin_authority USER_ID
    Grants admin authority.

  /admin_authority remove USER_ID
    Removes admin authority.

  Database verifies all permissions.
  Existing commands remain unchanged.
*/

(function installAdminAuthorityCommand() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let authorityBusy = false;

  async function runAdminAuthority(rawArgs) {
    if (!supabase || !profile) {
      privateWarning("Chat is not connected.");
      return;
    }

    // Check staff access before revealing usage.
    const { error: staffError } = await supabase.rpc(
      "get_admin_active_rooms"
    );

    if (staffError) {
      privateWarning("Invalid command");
      return;
    }

    const args = rawArgs.trim().split(/\s+/);

    let grant = true;
    let targetId = "";

    if (args[0]?.toLowerCase() === "remove") {
      grant = false;
      targetId = args[1] || "";

      if (args.length !== 2) targetId = "";
    } else {
      targetId = args[0] || "";

      if (args.length !== 1) targetId = "";
    }

    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /admin_authority USER_ID " +
        "or /admin_authority remove USER_ID"
      );
      return;
    }

    if (authorityBusy) return;
    authorityBusy = true;

    try {
      const { data, error } = await supabase.rpc(
        "set_chat_admin_authority",
        {
          p_target_account_id: targetId,
          p_grant: grant
        }
      );

      if (error) {
        if (
          error.message === "Permission denied" ||
          error.message === "Not authenticated"
        ) {
          privateWarning("Invalid command");
        } else {
          privateWarning(
            "Admin authority failed: " + error.message
          );
        }
        return;
      }

      privateWarning(
        data || "Admin authority updated successfully."
      );

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "Admin authority failed: " + error.message
      );

    } finally {
      authorityBusy = false;
    }
  }

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/admin_authority(?:\s+(.*))?$/i
    );

    if (match) {
      await runAdminAuthority(match[1] || "");
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 124H /admin_authority loaded!"
  );
})();

/*
  STEP 125B — SOLARERASER CHAT UPDATE NOTIFIER

  Checks version.json every 30 seconds.
  Shows a top-right popup when a new version
  becomes available.

  Does not automatically refresh the page.
*/

(function installUpdateNotifier() {
  const VERSION_URL = "./version.json";
  const CHECK_INTERVAL = 30000;

  let currentVersion = null;
  let updateAvailable = false;
  let checking = false;

  const notification = document.createElement("div");

  notification.id = "solar-update-notification";

  notification.style.cssText = [
    "position:fixed",
    "top:15px",
    "right:15px",
    "z-index:99999",
    "width:min(310px,calc(100vw - 30px))",
    "box-sizing:border-box",
    "background:#171a24",
    "border:1px solid #7774e8",
    "border-radius:8px",
    "padding:13px",
    "color:#f1f1f7",
    "font:13px Arial,sans-serif",
    "box-shadow:0 6px 25px #0009",
    "display:none"
  ].join(";");

  const heading = document.createElement("div");

  heading.textContent = "🔄 New version available!";

  heading.style.cssText =
    "font-weight:bold;color:#ff76ca;" +
    "font-size:14px;margin-bottom:8px;";

  const description = document.createElement("div");

  description.textContent =
    "A new version of SolarEraser Chat is available. " +
    "Refresh to get the latest features.";

  description.style.cssText =
    "line-height:1.5;margin-bottom:12px;";

  const refreshButton = document.createElement("button");

  refreshButton.textContent = "Refresh";

  refreshButton.style.cssText =
    "background:#7774e8;color:white;border:0;" +
    "border-radius:5px;padding:7px 15px;" +
    "font-weight:bold;cursor:pointer;";

  const actions = document.createElement("div");

  actions.style.cssText =
    "display:flex;justify-content:flex-end;";

  actions.appendChild(refreshButton);

  notification.append(
    heading,
    description,
    actions
  );

  document.body.appendChild(notification);

  refreshButton.addEventListener("click", () => {
    // Reload with a unique URL to bypass page caching.
    const url = new URL(window.location.href);

    url.searchParams.set(
      "v",
      String(Date.now())
    );

    window.location.replace(url.toString());
  });

  async function checkForUpdates() {
    if (checking || updateAvailable) return;

    checking = true;

    try {
      const response = await fetch(
        VERSION_URL + "?t=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Version check failed: " + response.status
        );
      }

      const data = await response.json();

      const latestVersion = String(
        data.version || ""
      ).trim();

      if (!latestVersion) return;

      if (currentVersion === null) {
        currentVersion = latestVersion;

        console.log(
          "[Updates] Current version:",
          currentVersion
        );

        return;
      }

      if (latestVersion !== currentVersion) {
        updateAvailable = true;

        notification.style.display = "block";

        console.log(
          "[Updates] New version detected:",
          latestVersion
        );
      }

    } catch (error) {
      console.warn(
        "[Updates] Could not check version:",
        error.message
      );

    } finally {
      checking = false;
    }
  }

  // Check immediately, then every 30 seconds.
  checkForUpdates();

  setInterval(
    checkForUpdates,
    CHECK_INTERVAL
  );

  console.log(
    "[SolarEraser Chat] Step 125B update notifier loaded!"
  );
})();

 // STEP 125F — Automatic deployment test

/*
  SolarEraser Chat — Step 129A
  Permission-aware /help command.

  /glow and /g intentionally remain secret.
*/


/*
  SolarEraser Chat — Step 129B
  Pink, clickable, permission-aware /help.
*/

(function installChatHelp() {
  const previousHandleCommand = handleCommand;

  async function showChatHelp() {
    if (!supabase || !currentRoomId) {
      privateWarning("Connect to a room first.");
      return;
    }

    try {
      const requestedRoom = String(currentRoomId);

      const { data, error } = await supabase.rpc(
        "get_chat_help_permissions",
        { p_room_id: requestedRoom }
      );

      if (error) throw error;

      if (String(currentRoomId) !== requestedRoom) {
        return;
      }

      const permissions = Array.isArray(data)
        ? data[0]
        : data;

      if (!permissions) {
        privateWarning("Help is unavailable in this room.");
        return;
      }

      const role = String(
        permissions.global_role || "user"
      ).toLowerCase();

      const isOwner = role === "owner";
      const isStaff = [
        "owner", "admin", "manager"
      ].includes(role);

      const isPrivateOwner =
        permissions.is_private_owner === true;

      const commands = [
        "/nick",
        "/join",
        "/recover",
        "/recover_code"
      ];

      if (isPrivateOwner) {
  commands.push("/kick", "/topic");
} else if (isStaff) {
  commands.push("/kick");
}

      if (isStaff) {
  commands.push(
    "/ban",
    "/timeout",
    "/untimeout",
    "/kick",
    "/rooms",
    "/find",
    "/bnc",
    "/unbnc"
  );
}

      if (isOwner) {
        commands.push(
          "/admin_authority",
          ".server"
        );
      }

      // /glow and /g are intentionally hidden.

      const line = document.createElement("div");
      line.className = "chat-help-line";

      const timestamp = document.createElement("span");
      timestamp.className = "chat-help-time";
      timestamp.textContent =
        "[" + new Date().toLocaleTimeString(
          "en-US",
          { hour12: false }
        ) + "] ";

      const heading = document.createElement("span");
      heading.className = "chat-help-heading";
      heading.textContent = "COMMANDS";

      line.append(timestamp, heading);

      for (const command of commands) {
        const item = document.createElement("span");
        item.className = "chat-help-command";
        item.textContent = command;
        item.title = "Insert " + command;

        item.addEventListener("click", () => {
          // Use the existing chat input.
          sendArea.value = command + " ";
          sendArea.dispatchEvent(
            new Event("input", { bubbles: true })
          );
          sendArea.focus();
        });

        line.appendChild(item);
      }

      messages.appendChild(line);

      line.scrollIntoView({
        block: "end",
        behavior: "smooth"
      });

    } catch (error) {
      privateWarning(
        "Help failed: " + error.message
      );
    }
  }

  handleCommand = async function(content) {
    if (/^\/help\s*$/i.test(content)) {
      await showChatHelp();
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 129B /help loaded!"
  );
})();

/*
  SolarEraser Chat — Step 130A
  /topic command for private rooms.
*/

(function installTopicCommand() {
  const previousHandleCommand = handleCommand;

  async function changeRoomTopic(rawTopic) {
    if (!supabase || !currentRoomId) {
      privateWarning("Connect to a room first.");
      return;
    }

    if (currentRoomType !== "private") {
      privateWarning(
        "/topic can only be used in private rooms."
      );
      return;
    }

    const topic = rawTopic.trim();

    if (!topic || topic.length > 150) {
      privateWarning(
        "Usage: /topic MESSAGE (1-150 characters)"
      );
      return;
    }

    try {
      const roomId = currentRoomId;

      const { data, error } = await supabase.rpc(
        "set_chat_room_topic",
        {
          p_room_id: roomId,
          p_topic: topic
        }
      );

      if (error) throw error;

      privateWarning("Room topic updated!");

    } catch (error) {
      privateWarning(
        "Topic failed: " + error.message
      );
    }
  }

  handleCommand = async function(content) {
    const match = content.match(
      /^\/topic(?:\s+([\s\S]*))?$/i
    );

    if (match) {
      await changeRoomTopic(match[1] || "");
      return;
    }

    return previousHandleCommand(content);
  };

  console.log(
    "[SolarEraser Chat] Step 130A /topic loaded!"
  );
})();


