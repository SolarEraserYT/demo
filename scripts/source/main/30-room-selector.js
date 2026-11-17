// --------------------------------------------------
// PUBLIC ROOM SELECTOR
// --------------------------------------------------

const roomSelector = document.createElement("select");

roomSelector.setAttribute(
  "aria-label",
  "Choose public room"
);

roomSelector.style.cssText = [
  "width:100%",
  "padding:9px",
  "background:#222637",
  "color:#e7e9f3",
  "border:1px solid #373b50",
  "border-radius:6px",
  "margin-bottom:12px",
  "cursor:pointer"
].join(";");

for (const roomName of PUBLIC_ROOMS) {
  const option = document.createElement("option");
  option.value = roomName;
  option.textContent = roomName;
  roomSelector.appendChild(option);
}

const userNames = document.createElement("div");
userList.replaceChildren(roomSelector, userNames);

function updateRoomSelector() {
  const oldPrivateOption =
    roomSelector.querySelector(
      'option[data-private-room="true"]'
    );

  if (oldPrivateOption) oldPrivateOption.remove();

  if (currentRoomType === "private") {
    const option = document.createElement("option");
    option.value = "__private_current__";
    option.textContent = "Private: " + currentRoom;
    option.dataset.privateRoom = "true";

    roomSelector.appendChild(option);
    roomSelector.value = "__private_current__";

  } else if (currentRoomType === "public") {
    roomSelector.value = currentRoom;
  }
}

