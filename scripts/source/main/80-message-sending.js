// --------------------------------------------------
// SEND MESSAGES
// --------------------------------------------------

async function sendMessage() {
  if (busy || switching || !currentRoomId) return;

  const content = sendArea.value.trim();
  if (!content) return;

  busy = true;

  try {
    
    // Step 131K: Global owner custom SERVER command.
    if (/^\.server(?:\s|$)/i.test(content)) {
      sendArea.value = "";

      const message = content
        .replace(/^\.server\b/i, "")
        .trim();

      if (!verifiedOwner) {
        privateWarning(
          "Only the global owner can use .server."
        );
        return;
      }

      if (!message || message.length > 500) {
        privateWarning(
          "Usage: .server MESSAGE (1-500 characters)"
        );
        return;
      }

      const { error } = await supabase.rpc(
        "send_custom_server_announcement",
        {
          p_room_id: currentRoomId,
          p_message: message
        }
      );

      if (error) {
        privateWarning(error.message);
      }

      return;
    }

    if (content.startsWith("/")) {
      sendArea.value = "";
      await handleCommand(content);
      return;
    }

    const { data, error } = await supabase.rpc(
      "send_chat_message_v2",
      {
        p_room_id: currentRoomId,
        p_content: content
      }
    );

    if (error) {
      privateWarning(error.message);
      return;
    }

    
if (data?.status === "cooldown") {
  cooldownWarning(data.wait_seconds);

  // Clear the rejected message, but don't erase
  // anything new typed while the request was pending.
  if (sendArea.value.trim() === content) {
    sendArea.value = "";
  } else if (sendArea.value.startsWith(content)) {
    sendArea.value = sendArea.value.slice(content.length);
  }

  return;
}



if (data?.status === "sent") {
  // Clear the submitted message, but preserve anything
  // the user typed while waiting for the server.
  if (sendArea.value.trim() === content) {
    sendArea.value = "";
  } else if (sendArea.value.startsWith(content)) {
    sendArea.value = sendArea.value.slice(content.length);
  }

  return;
}


    privateWarning("Unexpected message response.");

  } catch (error) {
    privateWarning(
      "Could not send message: " + error.message
    );

  } finally {
    busy = false;

    if (!sendArea.disabled) {
      sendArea.focus();
    }
  }
}

sendButton.addEventListener("click", sendMessage);

sendArea.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

