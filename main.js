
/*
  SolarEraser Chat
  Step 43: Supabase connection test

  This is a temporary connection-testing version.
  Chat messages and commands are not enabled yet.
*/

const SUPABASE_URL =
  "https://vebumdgtroqcpnvrlvhi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_CySjpyERFH6C4c6MQ4VmUg_dRueCRAF";

const messages = document.querySelector(".messages");
const sendArea = document.querySelector(".send_area");
const sendButton = document.querySelector(".send_button");

function showStatus(message) {
  const line = document.createElement("div");
  line.style.padding = "8px";
  line.style.lineHeight = "1.5";
  line.style.overflowWrap = "anywhere";
  line.textContent = message;

  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

function showError(error) {
  console.error(error);
  showStatus("❌ " + (error?.message || String(error)));
}

// Prevent sending messages until the secure chat
// messaging system is ready.
sendArea.disabled = true;
sendButton.disabled = true;
sendArea.placeholder = "Connecting to Supabase...";

async function startChat() {
  showStatus("🔄 Connecting to Supabase...");

  try {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );

    showStatus("✅ Supabase library loaded.");

    // Reuse an existing anonymous login if possible.
    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    let user = sessionData.session?.user;

    // New visitors receive a Supabase anonymous login.
    if (!user) {
      showStatus("🔄 Creating anonymous login...");

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInAnonymously();

      if (authError) {
        throw authError;
      }

      user = authData.user;
    }

    if (!user) {
      throw new Error("No user returned by Supabase.");
    }

    showStatus("✅ Anonymous login successful!");
    showStatus("🔐 Connected as an anonymous visitor.");

    // Check whether the chat account has been created.
    const {
      data: profile,
      error: profileError
    } = await supabase.rpc("my_chat_profile");

    if (profileError) {
      showStatus(
        "⚠️ Chat profile lookup: " +
        profileError.message
      );
    } else if (profile && (
      Array.isArray(profile)
        ? profile.length > 0
        : true
    )) {
      showStatus("✅ Chat profile found!");
    } else {
      showStatus(
        "⚠️ Anonymous login works, but this visitor " +
        "does not have a chat profile yet."
      );
    }

    showStatus(
      "🛠️ Connection test complete. " +
      "Live chat will be enabled in a later step."
    );

    sendArea.placeholder = "Chat setup in progress";

  } catch (error) {
    showError(error);
    sendArea.placeholder = "Connection test failed";
  }
}

startChat();
