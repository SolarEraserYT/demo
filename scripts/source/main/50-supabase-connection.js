// --------------------------------------------------
// SUPABASE CONNECTION
// --------------------------------------------------

function setInputReady(ready) {
  sendArea.disabled = !ready;
  sendButton.disabled = !ready;

  sendArea.placeholder = ready
    ? "Type a message..."
    : "Connecting to room...";
}

async function refreshRealtimeAuth() {
  const { data, error } =
    await supabase.auth.refreshSession();

  if (error) throw error;

  if (!data.session?.access_token) {
    throw new Error("Could not refresh login.");
  }

  await supabase.realtime.setAuth(
    data.session.access_token
  );

  return data.session;
}

async function leaveChannel() {
  if (!channel || !supabase) return;

  const oldChannel = channel;

    channel = null;
  presenceWorking = false;
  bncUsers.clear();
  userNames.replaceChildren();

  try {
    await oldChannel.untrack();
  } catch (error) {
    console.warn("[Presence] Untrack:", error);
  }

  await supabase.removeChannel(oldChannel);
}

async function trackMyPresence() {
  if (!channel || !profile) return "error";

  return await channel.track({
    account_id: profile.account_id,
    nickname: profile.nickname,
    nickname_color: validColor(profile.nickname_color)
  });
}

 // STEP 111D — Recover room Presence after Realtime reconnects.
let presenceRecoveryRunning = false;
let lastPresenceRecoveryAttempt = 0;

async function recoverRoomPresence(expectedChannel = channel) {
  if (
    presenceRecoveryRunning ||
    switching ||
    !profile ||
    !currentRoomId ||
    !expectedChannel ||
    channel !== expectedChannel ||
    expectedChannel.state !== "joined"
  ) return;

  // Avoid hammering Realtime if a Presence sync is delayed.
  const now = Date.now();
  if (now - lastPresenceRecoveryAttempt < 8000) return;
  lastPresenceRecoveryAttempt = now;
  presenceRecoveryRunning = true;

  try {
    const result = await expectedChannel.track({
      account_id: profile.account_id,
      nickname: profile.nickname,
      nickname_color: validColor(profile.nickname_color)
    });

    if (channel !== expectedChannel) return;

    if (result === "ok") {
      presenceWorking = true;
      renderUsers();
      console.log("[Presence] Re-tracked after reconnect/check.");
    } else {
      console.warn("[Presence] Recovery track result:", result);
    }
  } catch (error) {
    console.warn("[Presence] Recovery failed:", error);
  } finally {
    presenceRecoveryRunning = false;
  }
}

// A lost Presence entry can also happen without a fresh SUBSCRIBED event.
// Verify our own account is still in the current channel's Presence state.
setInterval(() => {
  if (
    !channel ||
    !profile ||
    !currentRoomId ||
    switching ||
    channel.state !== "joined"
  ) return;

  const state = channel.presenceState();
  const myAccountId = String(profile.account_id);
  const found = Object.values(state).some(entries =>
    Array.isArray(entries) && entries.some(entry =>
      String(entry?.account_id || "") === myAccountId
    )
  );

  if (!found) recoverRoomPresence(channel);
}, 12000);

