// --------------------------------------------------
// NICKNAME COMMANDS
// --------------------------------------------------

async function changeNickname(rawNickname) {
  const nickname = rawNickname.trim();

  if (!nickname) {
    privateWarning("Usage: /nick YOUR NAME");
    return;
  }

  const { data, error } = await supabase.rpc(
    "change_chat_nickname",
    { p_nickname: nickname }
  );

  if (error) {
    privateWarning(error.message);
    return;
  }

  profile.nickname =
    typeof data === "string" ? data : nickname;

  if (channel && presenceWorking) {
    try {
      const result = await trackMyPresence();

      if (result !== "ok") {
        privateWarning(
          "Nickname saved, but the online list " +
          "may need a reconnect."
        );
      }

    } catch (error) {
      console.warn(
        "[Presence] Nickname update:",
        error
      );
    }
  }

  renderUsers();

  privateWarning(
    "Your nickname is now " + profile.nickname + "."
  );
}

// --------------------------------------------------
// /G AND /GLOW COMMANDS
// --------------------------------------------------

async function grantRoomGlow(targetId) {
  if (!currentRoomId || !supabase) {
    privateWarning("You are not connected to a room.");
    return;
  }

  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!validId.test(targetId)) {
    privateWarning("Usage: /g USER_ID");
    return;
  }

  const roomId = currentRoomId;

  const { data, error } = await supabase.rpc(
    "grant_chat_room_glow",
    {
      p_room_id: roomId,
      p_target_account_id: targetId
    }
  );

  if (error) {
    privateWarning(error.message);
    return;
  }

  privateWarning(data || "Glow granted.");

  if (currentRoomId === roomId) {
    await refreshVerifiedGlows();
  }
}
// --------------------------------------------------
// BNC COMMANDS — GLOBAL STAFF ONLY
// --------------------------------------------------

async function manageChatBnc(targetId, enabled) {
  if (!supabase || !profile) {
    privateWarning("Chat is not connected.");
    return;
  }

  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!validId.test(targetId)) {
    privateWarning(
      enabled
        ? "Usage: /bnc USER_ID"
        : "Usage: /unbnc USER_ID"
    );
    return;
  }

  const { data, error } = await supabase.rpc(
    "set_chat_bnc",
    {
      p_target_account_id: targetId,
      p_enabled: enabled
    }
  );

  if (error) {
    privateWarning(error.message);
    return;
  }

  privateWarning(
    data || (enabled ? "BNC enabled." : "BNC disabled.")
  );

  // Update the user list after changing BNC.
  await refreshBncUsers();
}
// --------------------------------------------------
// COMMAND HANDLER
// --------------------------------------------------

async function handleCommand(content) {
  
  // ACCOUNT RECOVERY
  const recoverMatch = content.match(
    /^\/recover(?:\s+(.*))?$/i
  );

  if (recoverMatch) {
    const code = (recoverMatch[1] || "").trim();

    if (!/^[0-9a-f]{48}$/.test(code)) {
      privateWarning("Usage: /recover YOUR_RECOVERY_CODE");
      return;
    }

    privateWarning("Attempting account recovery...");

    const { data, error } = await supabase.rpc(
      "recover_chat_account_v2",
      { p_code: code }
    );

    if (error) {
      privateWarning("Recovery failed: " + error.message);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result?.success === true) {
      privateWarning(
        "Account recovered! Reloading your chat..."
      );
      window.location.reload();
      return;
    }

    if (result?.status === "rate_limited") {
      privateWarning(
        "Too many recovery attempts. Try again later."
      );
      return;
    }

    privateWarning(
      result?.status === "invalid_code"
        ? "Invalid or already-used recovery code."
        : "Recovery failed: " +
          (result?.status || "unknown error")
    );

    return;
  }

    // GLOBAL STAFF — BNC COMMANDS
  const bncMatch = content.match(
    /^\/(bnc|unbnc)(?:\s+(.*))?$/i
  );

  if (bncMatch) {
    const enabled = bncMatch[1].toLowerCase() === "bnc";
    const targetId = (bncMatch[2] || "").trim();

    await manageChatBnc(targetId, enabled);
    return;
  }
  const nicknameMatch = content.match(
    /^\/(?:nick|n)(?:\s+(.*))?$/i
  );

  if (nicknameMatch) {
    await changeNickname(nicknameMatch[1] || "");
    return;
  }

  const joinMatch = content.match(
    /^\/(?:j|join)(?:\s+(.*))?$/i
  );

  if (joinMatch) {
    const requestedRoom =
      (joinMatch[1] || "").trim();

    if (!requestedRoom) {
      privateWarning("Usage: /j ROOM or /join ROOM");
      return;
    }

    await joinRoom(requestedRoom, "private");
    return;
  }

  const glowMatch = content.match(
    /^\/(?:g|glow)(?:\s+(.*))?$/i
  );

  if (glowMatch) {
    await grantRoomGlow(
      (glowMatch[1] || "").trim()
    );
    return;
  }

  privateWarning(
    "Unknown command. Available: " +
    "/nick, /n, /j, /join, /g, /glow."
  );
}

