// STEP 108D — Restore original username-click behavior.
//
// Click: append nickname + copy nickname.
// Shift-click: append account ID + copy ID.
// NEVER erase existing input text.

(function fixUserClicks() {
  userNames.addEventListener("click", async event => {
    const name = event.target.closest(
      ".name[data-account-id]"
    );

    if (!name || !userNames.contains(name)) {
      return;
    }

    // Prevent the older username handler from running.
    event.stopPropagation();

    const value = event.shiftKey
      ? name.dataset.accountId
      : name.textContent;

    if (!value) return;

    // Preserve everything already typed.
    const existing = sendArea.value;

    // Add a space only when needed.
    const separator =
      existing.length > 0 && !/\s$/.test(existing)
        ? " "
        : "";

    
    sendArea.value = existing + separator + value + " ";


    // Put the cursor at the end.
    sendArea.focus();
    sendArea.setSelectionRange(
      sendArea.value.length,
      sendArea.value.length
    );

    // Copy the same value to clipboard.
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.warn("[Clipboard]", error);
    }
  }, true);

  console.log(
    "[Users] Append nickname/ID without replacing text!"
  );
})();

/*
  SolarEraser Chat — Step 109E
  /kick command and private moderation events

  Keep all existing code above this block.
*/

(function installKickSystem() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let checkingEvents = false;
  let kicking = false;

  async function kickUser(targetId) {
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /kick USER_ID (Shift-click a username)"
      );
      return;
    }

    if (!supabase || !currentRoomId) {
      privateWarning("You are not connected to a room.");
      return;
    }

    if (kicking) return;
    kicking = true;

    try {
      const { data, error } = await supabase.rpc(
        "kick_chat_user",
        {
          p_room_id: currentRoomId,
          p_target_account_id: targetId
        }
      );

      if (error) throw error;

      // Refresh server-verified room glow.
      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "Kick failed: " + error.message
      );
    } finally {
      kicking = false;
    }
  }

  async function checkKickEvents() {
    if (
      !supabase ||
      !profile ||
      switching ||
      checkingEvents
    ) {
      return;
    }

    checkingEvents = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        if (event.event_type !== "kick") {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const stillInKickedRoom =
          String(currentRoomId || "") === sourceRoom;

        if (stillInKickedRoom) {
          const moved = await joinRoom(
            "Main Room",
            "public"
          );

          if (!moved) {
            // Retry later if the room switch fails.
            break;
          }

          privateWarning(
            "You were kicked to Main Room."
          );
        }

        // Do not pull someone out of a different
        // room because of an old notification.

        const { error: ackError } = await supabase.rpc(
          "ack_chat_mod_event",
          { p_event_id: event.event_id }
        );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Kick] Event check failed:",
        error.message
      );
    } finally {
      checkingEvents = false;
    }
  }

  /*
    Intercept only /kick.

    All other commands continue through your
    existing command handler unchanged.
  */

  const originalHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const match = content.match(
      /^\/kick(?:\s+(.*))?$/i
    );

    if (match) {
      await kickUser((match[1] || "").trim());
      return;
    }

    return originalHandleCommand(content);
  };

  // Poll private moderation events every 2.5 seconds.
  // This does not create public chat messages.
  setInterval(checkKickEvents, 10000);

  // Check shortly after startup as well.
  setTimeout(checkKickEvents, 3000);

  console.log(
    "[SolarEraser Chat] Step 109E /kick loaded!"
  );
})();

/*
  SolarEraser Chat — Step 110D

  Adds:
    /timeout USER_ID
    /untimeout USER_ID

  Handles:
    timeout  -> Spam
    untimeout -> Main Room

  Keep ALL existing JavaScript above this block.
  Existing /kick remains unchanged.
*/

(function installTimeoutSystem() {
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let moderationBusy = false;
  let checkingTimeoutEvents = false;

  // ------------------------------------------
  // TIMEOUT COMMANDS
  // ------------------------------------------

  async function runTimeoutCommand(
    action,
    targetId
  ) {
    if (!UUID_PATTERN.test(targetId)) {
      privateWarning(
        "Usage: /" + action +
        " USER_ID (Shift-click a username)"
      );
      return;
    }

    if (!supabase || !profile || !currentRoomId) {
      privateWarning("Chat is not connected.");
      return;
    }

    if (moderationBusy) return;

    moderationBusy = true;

    try {
      const functionName =
        action === "timeout"
          ? "timeout_chat_user"
          : "untimeout_chat_user";

      const { data, error } = await supabase.rpc(
        functionName,
        {
          p_target_account_id: targetId
        }
      );

      if (error) throw error;

      scheduleGlowRefresh();

    } catch (error) {
      privateWarning(
        "/" + action + " failed: " +
        error.message
      );

    } finally {
      moderationBusy = false;
    }
  }

  // ------------------------------------------
  // PRIVATE MODERATION EVENTS
  // ------------------------------------------

  async function checkTimeoutEvents() {
    if (
      !supabase ||
      !profile ||
      switching ||
      checkingTimeoutEvents
    ) {
      return;
    }

    checkingTimeoutEvents = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        const type = event.event_type;
if (type === "ban") {
  chatAccountBanned = true;

  // Invalidate any pending room connection.
  connectionNumber++;

  // Disconnect from the current chat room.
  try {
    await leaveChannel();
  } catch (error) {
    console.warn("[Ban] Disconnect:", error);
  }

  currentRoom = null;
  currentRoomId = null;
  currentRoomType = null;
  presenceWorking = false;

  userNames.replaceChildren();
  messages.replaceChildren();

  // Prevent further messages and room changes.
  setInputReady(false);
  sendArea.placeholder = "Account banned";
  roomSelector.disabled = true;

  setStatus("This account has been banned.", true);

  privateWarning(
    "Your account has been banned from SolarEraser Chat."
  );

  // Mark the private moderation event as processed.
  const { error: ackError } = await supabase.rpc(
    "ack_chat_mod_event",
    { p_event_id: event.event_id }
  );

  if (ackError) {
    console.warn(
      "[Ban] Could not acknowledge event:",
      ackError.message
    );
  }

  break;
}
        // Leave kick events for the existing
        // Step 109E kick listener.
        if (
          type !== "timeout" &&
          type !== "untimeout"
        ) {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const inSourceRoom =
          String(currentRoomId || "") === sourceRoom;

        const destination =
          type === "timeout"
            ? "Spam"
            : "Main Room";

        // Only move automatically if the browser
        // is still showing the affected room.
        //
        // Old events should not pull the user
        // out of a room they joined later.

        if (inSourceRoom) {
          const moved = await joinRoom(
            destination,
            "public"
          );

          if (!moved) {
            // Do not acknowledge a failed move.
            // The next poll will retry.
            break;
          }

          if (type === "timeout") {
            privateWarning(
              "You have been timed out. " +
              "You cannot leave Spam until " +
              "a moderator releases you."
            );
          } else {
            privateWarning(
              "Your timeout has ended. " +
              "You have been moved to Main Room."
            );
          }
        }

        const { error: ackError } =
          await supabase.rpc(
            "ack_chat_mod_event",
            {
              p_event_id: event.event_id
            }
          );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Timeout] Event check failed:",
        error.message
      );

    } finally {
      checkingTimeoutEvents = false;
    }
  }

  // ------------------------------------------
  // COMMAND HANDLER
  // ------------------------------------------

  // Preserve the existing command handler,
  // including the working /kick command.

  const previousHandleCommand = handleCommand;

  handleCommand = async function(content) {
    const timeoutMatch = content.match(
      /^\/timeout(?:\s+(.*))?$/i
    );

    if (timeoutMatch) {
      await runTimeoutCommand(
        "timeout",
        (timeoutMatch[1] || "").trim()
      );
      return;
    }

    const untimeoutMatch = content.match(
      /^\/untimeout(?:\s+(.*))?$/i
    );

    if (untimeoutMatch) {
      await runTimeoutCommand(
        "untimeout",
        (untimeoutMatch[1] || "").trim()
      );
      return;
    }

    return previousHandleCommand(content);
  };

  // ------------------------------------------
  // AUTOMATIC EVENT CHECKING
  // ------------------------------------------

  setInterval(checkTimeoutEvents, 10000);

  setTimeout(checkTimeoutEvents, 3500);

  console.log(
    "[SolarEraser Chat] " +
    "Step 110D timeout system loaded!"
  );
})();

/*
  SolarEraser Chat — Step 110E
  Timeout refresh recovery

  Paste at the very bottom of main.js.
  Keep all existing code.
*/

(function installTimeoutRefreshRecovery() {
  let recoveryRunning = false;

  const originalJoinRoom = joinRoom;

  joinRoom = async function(roomName, roomType = "public") {
    const result = await originalJoinRoom(
      roomName,
      roomType
    );

    if (
      result ||
      recoveryRunning ||
      !supabase ||
      !profile ||
      roomName !== "Main Room" ||
      roomType !== "public"
    ) {
      return result;
    }

    recoveryRunning = true;

    try {
      // A failed Main Room join might mean the
      // account is timed out. Let the server decide
      // whether Spam is allowed.

      const spamResult = await originalJoinRoom(
        "Spam",
        "public"
      );

      if (spamResult) {
        privateWarning(
          "You are timed out. " +
          "You must remain in Spam until " +
          "a moderator releases you."
        );

        return true;
      }

      return false;

    } finally {
      recoveryRunning = false;
    }
  };

  // startChat() may already be running when
  // this block loads, so check once afterward.
  setTimeout(async () => {
    if (
      supabase &&
      profile &&
      !currentRoomId &&
      !switching
    ) {
      await joinRoom("Main Room", "public");
    }
  }, 4000);

  console.log(
    "[SolarEraser Chat] " +
    "Step 110E refresh recovery loaded!"
  );
})();

/*
  SolarEraser Chat — Step 111C-4
  Private Realtime moderation notifications

  Keep all existing code above this block.
  Existing polling remains as backup.
*/

(function installRealtimeModeration() {
  let moderationChannel = null;
  let connecting = false;
  let processing = false;

  async function processModerationEvents() {
    if (
      processing ||
      !supabase ||
      !profile ||
      !currentRoomId ||
      switching
    ) return;

    processing = true;

    try {
      const { data, error } = await supabase.rpc(
        "my_chat_mod_events"
      );

      if (error) throw error;

      for (const event of data || []) {
        if (switching) break;

        const type = event.event_type;

        if (
  type !== "kick" &&
  type !== "timeout" &&
  type !== "untimeout" &&
  type !== "ban"
) {
  continue;
}

        // Ban events must be handled by the existing
        // ban listener, not treated as an untimeout.
        if (type === "ban") {
          continue;
        }

        const sourceRoom = String(
          event.source_room_id || ""
        );

        const stillInSource =
          String(currentRoomId || "") === sourceRoom;

        if (stillInSource) {
          const destination =
            type === "timeout" ? "Spam" : "Main Room";

          const moved = await joinRoom(
            destination,
            "public"
          );

          if (!moved) break;

          if (type === "kick") {
            privateWarning(
              "You were kicked to Main Room."
            );
          } else if (type === "timeout") {
            privateWarning(
              "You have been timed out. " +
              "You cannot leave Spam until " +
              "a moderator releases you."
            );
          } else {
            privateWarning(
              "Your timeout has ended. " +
              "You have been moved to Main Room."
            );
          }
        }

        const { error: ackError } =
          await supabase.rpc(
            "ack_chat_mod_event",
            { p_event_id: event.event_id }
          );

        if (ackError) throw ackError;
      }

    } catch (error) {
      console.warn(
        "[Realtime moderation]",
        error.message
      );
    } finally {
      processing = false;
    }
  }

  async function connectModerationChannel() {
    if (
      connecting ||
      moderationChannel ||
      !supabase ||
      !authUserId ||
      !profile
    ) return;

    connecting = true;

    try {
      const { data: sessionData } =
        await supabase.auth.getSession();

      const token =
        sessionData.session?.access_token;

      if (!token) {
        throw new Error("No auth token.");
      }

      await supabase.realtime.setAuth(token);

      const topic = "chat-mod:" + authUserId;

      const newChannel = supabase.channel(
        topic,
        {
          config: {
            private: true
          }
        }
      );

      newChannel.on(
        "broadcast",
        { event: "moderation_changed" },
        () => {
          processModerationEvents();
        }
      );

      moderationChannel = newChannel;

      newChannel.subscribe(status => {
        if (status === "SUBSCRIBED") {
          console.log(
            "[Moderation] Private Realtime connected!"
          );

          processModerationEvents();
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          console.warn(
            "[Moderation] Channel status:",
            status
          );

          if (moderationChannel === newChannel) {
            moderationChannel = null;
          }
        }
      });

    } catch (error) {
      console.warn(
        "[Moderation] Connection failed:",
        error.message
      );
    } finally {
      connecting = false;
    }
  }

  // Wait until anonymous login and profile load.
  const startupTimer = setInterval(() => {
    if (!supabase || !authUserId || !profile) {
      return;
    }

    clearInterval(startupTimer);
    connectModerationChannel();
  }, 1000);

  // Retry connection occasionally if necessary.
  setInterval(() => {
    if (
      supabase &&
      authUserId &&
      profile &&
      !moderationChannel
    ) {
      connectModerationChannel();
    }
  }, 30000);

  console.log(
    "[SolarEraser Chat] " +
    "Step 111C Realtime moderation loaded!"
  );
})();

/*
  SolarEraser Chat — Step 113A
  Electric-blue SERVER announcements

  Presentation only.
  Trusted server event integration comes in Step 113B.
*/

(function installBlueServerAnnouncements() {
  const style = document.createElement("style");

  style.textContent = `
    .solar-server-name {
      color: #38A8FF !important;
      font-weight: 700;
      text-shadow:
        0 0 4px #38A8FF,
        0 0 9px #168AFF,
        0 0 16px #006DFF;
    }

    .solar-server-text {
      color: #B9E0FF !important;
      text-shadow:
        0 0 4px rgba(56,168,255,.65),
        0 0 9px rgba(56,168,255,.25);
    }

    .solar-server-target {
      color: #D5EEFF;
      cursor: pointer;
      text-decoration: none;
    }

    .solar-server-target:hover {
      text-decoration: underline;
    }
  `;

  document.head.appendChild(style);

  function displayServerAnnouncement(event) {
    if (!event || typeof event !== "object") return;

    const messagesContainer =
      document.querySelector(".messages");

    if (!messagesContainer) return;

    const allowedTypes = {
      kick: "was kicked to Main Room.",
      timeout: "was timed out and moved to Spam.",
      untimeout: "was released from timeout.",
      ban: "was permanently banned from the server."
    };

    // Custom SERVER announcements.
    if (event.type === "custom") {
      const text = String(event.message_text || "");

      if (!text.trim()) return;

      const line = document.createElement("div");
      line.className = "message_item solar-server-line";

      const time = document.createElement("span");
      time.className = "time";
      time.textContent = new Date().toLocaleTimeString(
        "en-GB",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }
      );

      const server = document.createElement("span");
      server.className = "nick solar-server-name";
      server.textContent = "SERVER";

      const message = document.createElement("span");
      message.className = "message solar-server-text";
      message.textContent = text;

      line.append(time, server, message);
      messagesContainer.appendChild(line);

      messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

      return;
    }

    const action = allowedTypes[event.type];

    if (!action) return;

    const nickname = String(
      event.nickname || "Unknown user"
    );

    const line = document.createElement("div");
    line.className = "message_item solar-server-line";

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = new Date().toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );

    const server = document.createElement("span");
    server.className = "nick solar-server-name";
    server.textContent = "SERVER";

    const message = document.createElement("span");
    message.className = "message solar-server-text";

    const target = document.createElement("span");
    target.className = "solar-server-target";
    target.textContent = nickname;

    const accountId = String(event.account_id || "");

    if (accountId) {
      target.title = "Click to copy account ID";

      target.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(accountId);
        } catch (error) {
          console.warn("[SERVER] Copy failed:", error);
        }
      });
    } else {
      target.style.cursor = "default";
    }

    message.append(
      target,
      document.createTextNode(" " + action)
    );

    line.append(time, server, message);

    messagesContainer.appendChild(line);

    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  }

  // Internal renderer only. Step 113B will connect
  // this to authenticated, server-generated events.
  window.solarRenderServerAnnouncement =
    displayServerAnnouncement;

  console.log(
    "[SolarEraser Chat] Step 113A blue SERVER ready!"
  );
})();

/*
  SolarEraser Chat — Step 113B-7
  Trusted SERVER announcement polling
*/


/*
  SolarEraser Chat — Step 113C-2
  Database-cursor SERVER announcement listener
*/


/*
  SolarEraser Chat — Step 113C-3D
  Room-session-aware SERVER announcement listener
*/


/*
  SolarEraser Chat — Step 113C-2
  Database-cursor SERVER announcement listener
*/
(function installServerAnnouncementListener() {
  let trackedRoomId = null;
  let lastAnnouncementId = 0;
  let initialized = false;
  let checking = false;
  let generation = 0;

  async function checkServerAnnouncements() {
    if (
      !supabase ||
      !currentRoomId ||
      switching ||
      typeof window.solarRenderServerAnnouncement !== "function"
    ) return;

    const roomId = String(currentRoomId);

    if (trackedRoomId !== roomId) {
      trackedRoomId = roomId;
      lastAnnouncementId = 0;
      initialized = false;
      generation++;
    }

    if (checking) return;
    checking = true;

    const requestGeneration = generation;

    try {
      if (!initialized) {
        const { data, error } = await supabase.rpc(
          "get_chat_server_announcement_cursor",
          { p_room_id: roomId }
        );

        if (error) throw error;

        if (
          switching ||
          String(currentRoomId) !== roomId ||
          requestGeneration !== generation
        ) return;

        lastAnnouncementId = Number(data) || 0;
        initialized = true;
        return;
      }

      const { data, error } = await supabase.rpc(
        "get_chat_server_announcements",
        {
          p_room_id: roomId,
          p_after_id: lastAnnouncementId
        }
      );

      if (error) throw error;

      if (
        switching ||
        String(currentRoomId) !== roomId ||
        requestGeneration !== generation
      ) return;

      for (const announcement of data || []) {
        const id = Number(announcement.id);

        if (!Number.isSafeInteger(id)) continue;
        if (id <= lastAnnouncementId) continue;

        lastAnnouncementId = id;

        
window.solarRenderServerAnnouncement({
  type: announcement.event_type,
  nickname: announcement.target_nickname,
  account_id: announcement.target_account_id,
  message_text: announcement.message_text
});

      }

    } catch (error) {
      console.warn(
        "[SERVER] Announcement check failed:",
        error.message
      );
    } finally {
      checking = false;
    }
  }

  setInterval(checkServerAnnouncements, 2000);
  setTimeout(checkServerAnnouncements, 500);

  console.log(
    "[SolarEraser Chat] Step 113C cursor listener loaded!"
  );
})();

