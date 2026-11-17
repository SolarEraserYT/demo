// --------------------------------------------------
// JOIN ROOMS
// --------------------------------------------------

async function joinRoom(roomName, roomType = "public") {
  if (
    chatAccountBanned ||
    !supabase ||
    !profile ||
    switching
  ) {
    return false;
  }

  if (
    roomType !== "public" &&
    roomType !== "private"
  ) return false;

  if (
    roomType === "public" &&
    !PUBLIC_ROOMS.includes(roomName)
  ) return false;

  if (roomType === "private") {
    roomName = roomName.trim().toLowerCase();

    if (!/^[a-z0-9_-]{1,32}$/.test(roomName)) {
      privateWarning(
        "Private room names must be 1–32 characters: " +
        "letters, numbers, underscores, or hyphens."
      );
      return false;
    }
  }

  if (
    currentRoom === roomName &&
    currentRoomType === roomType &&
    channel
  ) {
    updateRoomSelector();
    return true;
  }

  switching = true;
  setInputReady(false);

  const attempt = ++connectionNumber;

  try {
    const functionName =
      roomType === "private"
        ? "join_private_chat_room"
        : "join_public_chat_room";

    const { data: roomId, error: joinError } =
      await supabase.rpc(functionName, {
        requested_name: roomName
      });

    if (joinError) throw joinError;
    if (!roomId) {
      throw new Error("No room ID returned.");
    }

   

    await leaveChannel();
    messages.replaceChildren();

    currentRoom = null;
    currentRoomId = null;
    currentRoomType = null;

    glowRoomId = null;
    verifiedRoomGlows.clear();

    await refreshRealtimeAuth();

    const newChannel = supabase.channel(
      "chat-room:" + roomId,
      {
        config: {
          private: true,
          broadcast: { self: true },
          presence: { key: authUserId }
        }
      }
    );

    newChannel.on(
      "broadcast",
      { event: "chat_message" },
      ({ payload }) => {
        if (channel !== newChannel) return;
        displayMessage(payload);
      }
    );

    for (const event of ["sync", "join", "leave"]) {
      newChannel.on(
        "presence",
        { event },
        () => {
          if (channel === newChannel) {
            renderUsers();
          }
        }
      );
    }

    channel = newChannel;

   
    await new Promise((resolve, reject) => {
      let initiallySubscribed = false;

      newChannel.subscribe((state, error) => {
        if (channel !== newChannel) return;

        if (state === "SUBSCRIBED") {
          if (!initiallySubscribed) {
            initiallySubscribed = true;
            resolve();
          } else {
            // A re-subscription may reset server-side Presence.
            // Re-track instead of only redrawing the user list.
            recoverRoomPresence(newChannel);
          }

        } else if (
          state === "CHANNEL_ERROR" ||
          state === "TIMED_OUT" ||
          state === "CLOSED"
        ) {
          presenceWorking = false;
          userNames.replaceChildren();

          if (!initiallySubscribed) {
            reject(
              error ||
              new Error("Realtime subscription failed")
            );
          }
        }
      });
    });


    if (attempt !== connectionNumber) {
      return false;
    }

    currentRoom = roomName;
currentRoomId = roomId;
currentRoomType = roomType;

// STEP 136BN — Activate the remembrance theme.
document.body.classList.toggle(
  "room-remembrance",
  isRemembranceRoom()
);

updateRoomSelector();
    setInputReady(true);

    setStatus(
      "Connected to " +
      (roomType === "private" ? "private room " : "") +
      roomName
    );

    let result = "error";

    try {
      result = await trackMyPresence();
    } catch (error) {
      console.error("[Presence] Track:", error);
    }

    if (result === "ok") {
  presenceWorking = true;
  renderUsers();
  refreshBncUsers();
  scheduleGlowRefresh();

    } else {
      presenceWorking = false;
      userNames.replaceChildren();

      setStatus(
        "Chat connected; online list unavailable",
        true
      );
    }

    sendArea.focus();
    return true;

  } catch (error) {
    console.error("[Chat] Connection error:", error);

    setStatus(
      "Room connection failed: " + error.message,
      true
    );

    privateWarning(
      "Could not join room: " + error.message
    );

    if (!channel) {
      currentRoom = null;
      currentRoomId = null;
      currentRoomType = null;
    }

    return false;

  } finally {
    switching = false;
    setInputReady(Boolean(currentRoomId && channel));
    updateRoomSelector();
  }
}

roomSelector.addEventListener("change", () => {
  if (roomSelector.value === "__private_current__") {
    return;
  }

  joinRoom(roomSelector.value, "public");
});

