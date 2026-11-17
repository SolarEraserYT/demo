// --------------------------------------------------
// SETTINGS GEAR
// --------------------------------------------------
// The separate Settings panel owns layout and theme controls.
// The existing color picker (and its server save logic) is preserved.
const settingsGear = document.querySelector(
  '.menu_button[data-target="settings"]'
);
if (settingsGear) {
  settingsGear.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    window.SolarSettingsPanel?.toggle();
  });
}

// --------------------------------------------------
// START CHAT
// --------------------------------------------------

async function startChat() {
  try {
    setStatus("Connecting to Supabase...");

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    supabase = createClient(
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

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session) {
      const { error: authError } =
        await supabase.auth.signInAnonymously();

      if (authError) throw authError;
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      throw new Error("Guest login failed.");
    }

    
    authUserId = user.id;

    // Load the account connected to this browser.
    const { data, error: profileError } =
      await supabase.rpc("my_chat_profile");

    if (profileError) throw profileError;

    profile = getProfile(data);

    // If the old anonymous login no longer has a chat
    // account (for example, after /recover on another
    // device), automatically create a fresh guest.
    if (!profile?.account_id) {

      console.warn(
        "[Chat] Login has no chat profile. " +
        "Creating a fresh guest account."
      );

      setStatus("Creating a new guest account...");

      // Keep non-anonymous logins untouched.
      if (user.is_anonymous !== true) {
        throw new Error(
          "Chat profile not found for this login."
        );
      }

      // Clear only this browser's old session.
      const { error: signOutError } =
        await supabase.auth.signOut({
          scope: "local"
        });

      if (signOutError) throw signOutError;

      // Create a completely new anonymous login.
      const {
        data: guestData,
        error: guestError
      } = await supabase.auth.signInAnonymously();

      if (guestError) throw guestError;

      const newUserId = guestData?.user?.id;

      if (!newUserId || newUserId === user.id) {
        throw new Error(
          "Could not create a new guest login."
        );
      }

      authUserId = newUserId;

      // Load the fresh guest's chat account.
      const {
        data: newProfileData,
        error: newProfileError
      } = await supabase.rpc("my_chat_profile");

      if (newProfileError) throw newProfileError;

      profile = getProfile(newProfileData);

      if (!profile?.nickname || !profile?.account_id) {
        throw new Error(
          "New guest profile could not be created."
        );
      }

      console.log(
        "[Chat] Fresh guest created:",
        profile.nickname
      );

      privateWarning(
        "Your previous login is no longer linked " +
        "to a chat account. A new guest account " +
        "has been created automatically."
      );
    }

    if (!profile?.nickname || !profile?.account_id) {
      throw new Error("Chat profile not found.");
    }

// STEP 117L-3 — Check account ban status on startup.
const { data: banStatus, error: banStatusError } =
  await supabase.rpc("my_chat_ban_status");

if (banStatusError) {
  throw banStatusError;
}

if (banStatus === true) {
  chatAccountBanned = true;

  setInputReady(false);
  setStatus("This account has been banned.", true);

  privateWarning(
    "Your account has been banned from SolarEraser Chat."
  );

  return;
}
    const {
      data: glowData,
      error: glowError
    } = await supabase.rpc(
      "my_chat_glow_profile"
    );

    if (glowError) throw glowError;

    const glowProfile = getProfile(glowData);

    verifiedOwner = Boolean(
      glowProfile &&
      String(glowProfile.account_id) ===
        String(profile.account_id) &&
      glowProfile.role === "owner"
    );

    if (glowProfile) {
  profile.nickname_color = validColor(
    glowProfile.nickname_color
  );
}

// Apply the logged-in account's global staff theme.
document.body.classList.remove(
  "staff-owner",
  "staff-admin",
  "staff-manager"
);

const staffRole = String(
  glowProfile?.role || "user"
).toLowerCase();

if (["owner", "admin", "manager"].includes(staffRole)) {
  document.body.classList.add("staff-" + staffRole);
}

    console.log(
      "[Chat] Logged in as:",
      profile.nickname,
      "| Verified owner:",
      verifiedOwner
    );

    await joinRoom("Main Room", "public");

  } catch (error) {
    console.error("[Chat] Startup failed:", error);

    setStatus(
      "Startup failed: " + error.message,
      true
    );
  }
}

// Periodically refresh server-verified permissions.
setInterval(() => {
  if (currentRoomId && channel) {
    refreshVerifiedGlows();
  }
}, 12000);

startChat();

console.log(
  "[SolarEraser Chat] Step 107 loaded!"
);

