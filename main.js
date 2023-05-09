JavaScript (chat.js):

const socket = io();

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messages = document.getElementById("messages");

messageForm.addEventListener("submit", e => {
  e.preventDefault();
  const message = messageInput.value;
  if (message) {
    socket.emit("chatMessage", message);
    messageInput.value = "";
  }
});

socket.on("chatMessage", message => {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messages.appendChild(messageElement);
});


