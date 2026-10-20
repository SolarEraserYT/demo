
/*
  SolarEraser Chat
  Step 46: Guest profile and public room joining
*/

const SUPABASE_URL =
  "https://vebumdgtroqcpnvrlvhi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_CySjpyERFH6C4c6MQ4VmUg_dRueCRAF";

const messages = document.querySelector(".messages");
const sendArea = document.querySelector(".send_area");
const sendButton = document.querySelector(".send_button");
const roomList = document.querySelector(".left");
const userList = document.querySelector(".right");

let supabase;
let myProfile = null;
let currentRoom = null;
let switchingRoom = false;

const publicRooms = ["Main Room", "Spam"];

sendArea.disabled = true;
sendButton.disabled = true;
sendArea.placeholder = "Connecting...";

function status(text, color = "#bfc3d9") {
  const line = document.createElement("div");
  line.textContent = text;
  line.style.padding = "5px 10px";
  line.style.color = color;
  line.style.overflowWrap = "anywhere";

  messages.appendChild(line);
  messages.scrollTop = messages.scrollHeight;
}

function clearMessages() {
  messages.replaceChildren();
}

function getProfileRow(data) {
  if (Array.isArray(data)) {
    return data[0] || null;
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}

function renderProfile() {
  userList.replaceChildren();

  if (!myProfile) return;

  const user = document.createElement("div");
  user.className = "user_item";
  user.style.padding = "10px";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = myProfile.nickname;
  name.style.color =
    myProfile.nickname_color || "#ffffff";

  user.appendChild(name);
  userList.appendChild(user);
}

function renderRooms() {
  roomList.replaceChildren();

  for (const roomName of publicRooms) {
    const item = document.createElement("div");
    item.className = "room_item";
    item.style.padding = "10px";
    item.style.cursor = "pointer";

    const label = document.createElement("div");
    label.className = "name";
    label.textContent = roomName;

    if (currentRoom === roomName) {
      label.style.color = "#9a8cff";
      label.style.fontWeight = "bold";
    }

    item.appendChild(label);

    item.addEventListener("click", () => {
      joinPublicRoom(roomName);
    });

    roomList.appendChild(item);
  }
}

async function joinPublicRoom(roomName) {
  if (!supabase || switchingRoom) return;

  if (!publicRooms.includes(roomName)) return;

  if (currentRoom === roomName) return;

  switchingRoom = true;
  clearMessages();

  status("Joining " + roomName + "...");

  try {
    const { data, error } = await supabase.rpc(
      "join_public_chat_room",
      { requested_name: roomName }
    );

    if (error) throw error;

    if (!data) {
      throw new Error("No room ID was returned.");
    }

    currentRoom = roomName;
    renderRooms();

    status(
      "✓ Joined " + roomName,
      "#80e6a3"
    );

    status(
      "Signed in as " + myProfile.nickname,
      myProfile.nickname_color || "#ffffff"
    );

    status(
      "Live messaging is not enabled yet."
    );

    sendArea.placeholder =
      roomName + " — messaging coming soon";

  } catch (error) {
    console.error("Room join failed:", error);

    status(
      "✗ Could not join " + roomName +
      ": " + error.message,
      "#ff8585"
    );
  } finally {
    switchingRoom = false;
  }
}

async function startChat() {
  status("Connecting to Supabase...");

  try {
    const library = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    supabase = library.createClient(
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
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    let user = sessionData.session?.user;

    if (!user) {
      status("Creating your guest login...");

      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInAnonymously();

      if (authError) throw authError;

      user = authData.user;
    }

    if (!user) {
      throw new Error("Anonymous login failed.");
    }

    status("✓ Guest login successful!", "#80e6a3");

    const {
      data: profileData,
      error: profileError
    } = await supabase.rpc("my_chat_profile");

    if (profileError) throw profileError;

    myProfile = getProfileRow(profileData);

    if (!myProfile || !myProfile.nickname) {
      throw new Error(
        "No chat profile found for this guest."
      );
    }

    status(
      "✓ Welcome, " + myProfile.nickname + "!",
      "#80e6a3"
    );

    renderProfile();
    renderRooms();

    await joinPublicRoom("Main Room");

  } catch (error) {
    console.error("Chat startup failed:", error);

    status(
      "✗ " + error.message,
      "#ff8585"
    );

    sendArea.placeholder = "Connection failed";
  }
}

// Message sending stays disabled until the
// server-side live messaging system is ready.

startChat();
