// everytime html page is loaded, websocket connection created
const ws = new WebSocket("ws://localhost:8765");
// let is changable variable, const in constant
let username = prompt("Create a username: ");
let userId = null; // initialize user id

// Call the function to request permission
requestNotificationPermission();

// alert user when websocket connection created
ws.onopen = () => {
    console.log("Connected to the WebSocket server!");
    ws.send(`${username} has joined the chat!`);
    showNotification(`Welcome, ${username}! You have joined the chat.`);
    console.log(Notification.permission);
};

function closeConnection() {
    const exit = confirm("End the session?");
	if(exit === "true") {
        ws.send(`${username} has left the chat.`);
        ws.close();
    }
};

// event is when server sends user data
ws.onmessage = (event) => {
    const chatbox = document.getElementById("chatbox");
    const message = document.createElement("div");
    console.log(event.data);

    const data = JSON.parse(event.data);
    const senderId = data.user_id;
    const messageText = data.message;

    if (!userId) {
        // If userId is not set, the first message should be your own join message
        userId = senderId;
    }

    if (senderId === userId) {
        // This is the user's own message
        message.classList.add('my-message'); // Optional: Add a special class for styling
    } else {
        // This is a message from another user
        showNotification("Chat App", messageText);
        message.classList.add('others-message');
    }

    message.textContent = messageText;
    chatbox.appendChild(message);
    console.log(new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit" }));
};

// when user sends data to server at localhost
function sendMessage() {
    const input = document.getElementById("send-message");
    const message = `${username}: ${input.value}`;
    ws.send(message);
    input.value = "";
};

// request user for notif permission
async function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission != "granted") {
            console.log("Notification permission already granted or denied:", permission);
        }
        console.log("Notif granted:", permission);
    });
};

function showNotification(title, body) {
    if (Notification.permission === "granted") {
        console.log("hello");
        new Notification("Chat App", { body: body });
    }
};