// everytime html page is loaded, websocket connection created
const ws = new WebSocket("ws://localhost:8765");
// let is changable variable, const in constant
let username = prompt("Create a username: ");
let userId = null; // initialize user id
let currentRoom = null;

// Call the function to request permission
requestNotificationPermission();
ws.onopen = () => {
    console.log("Connected to the WebSocket server!");
    ws.send(JSON.stringify({ command: "newUserGetRooms" }));
};

// alert user when websocket connection created
// ws.onopen = () => {
//     console.log("Connected to the WebSocket server!");
//     ws.send(JSON.stringify({ message: `${username} has joined the chat!` }));

// };


function closeConnection() {
    const exit = confirm("End the session?");
	if(exit === "true") {
        ws.close();
    }
};

// event is when server sends user data
ws.onmessage = (event) => {
    const chatbox = document.getElementById("chatbox");
    var message = document.createElement("div");
    const data = JSON.parse(event.data);
    console.log("parsed json data: ", data)
    const senderId = data.user_id;
    var messageText = data.message;
    const addRoom = data.addRoom;
    const getRooms = data.getRooms; //for when users first sign in and have to populate room selection
    const joinedRoom = data.joinedRoom;
    const leftRoom = data.leftRoom;
    const chatHistory = data.prevChats;

    if (getRooms != null) {
        getRooms.forEach(element => {
            updateRoomSelect(element);
        });
        return;
    }

    if (addRoom != null) {
        updateRoomSelect(addRoom);
        return;
    } 

    if (!userId) {
        // If userId is not set, the first message should be your own join message
        userId = senderId;
    }

    if(joinedRoom === true) {
        console.log("messageText joinedroom: ", username, messageText);
        if (userId === senderId) {
            loadChatHistory(chatHistory, chatbox);
        }
        message.classList.add('joined-left-room'); // Optional: Add a special class for styling
    } else if (leftRoom === true) {
        console.log("messageText joinedroom: ", messageText);
        message.classList.add('joined-left-room');
    } else {
        message = addMessageClass(message, messageText);
    }

    message.textContent = messageText;
    chatbox.appendChild(message);
};

// when user sends data to server at localhost
function sendMessage() {
    const input = document.getElementById("send-message");
    const message = `${username}: ${input.value}`;
    if (currentRoom) {
        ws.send(JSON.stringify({ command: "message", message: message }))
    } else {
        alert("Please join a room first.");
    }
    input.value = "";
};

// request user for notif permission
async function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission != "granted") {
        }
    });
};

function showNotification(body) {
    if (Notification.permission === "granted") {
        new Notification("Chat App", { body: body });
    }
};

function leaveRoom() {
    if (currentRoom) {
        ws.send(JSON.stringify({ command: "leave", username: username, room: currentRoom }));
        currentRoom = null;
        const chatbox = document.getElementById("chatbox");
        chatbox.innerHTML = "";
    } else {
        alert("You are not in a room.");
    }
};

function changeRoom() {
    const roomSelect = document.getElementById("select-room");
    joinRoom(roomSelect.value);
    document.getElementById('select-room').selectedIndex = 0;
};

function createRoom() {
    const newRoomName = document.getElementById("new-room-name").value.trim();
    ws.send(JSON.stringify({ command: "createRoom", room: newRoomName }));
    joinRoom(newRoomName);
};

function joinRoom(roomName) {
    if (currentRoom) {
        leaveRoom();
    }
    currentRoom = roomName;
    console.log("info sent: ", JSON.stringify({ command: "join", room: roomName }))
    ws.send(JSON.stringify({ command: "join", room: roomName, username: username }));
    // alert(`Joined room '${roomName}'.`);
    console.log("joined room!")
};

function updateRoomSelect(newRoomName) {
    const roomSelect = document.getElementById("select-room");
    const newOption = document.createElement("option");
    newOption.value = newRoomName;
    newOption.innerHTML = newRoomName;
    roomSelect.appendChild(newOption);
};

function loadChatHistory(chatHistory, chatbox) {
    console.log("------------chatHistroy: ", chatHistory);
    chatHistory.forEach(element => {
        const message = document.createElement("div");
        message.textContent = element;
        addMessageClass(message, element)
        chatbox.appendChild(message);
    });
};

function addMessageClass(message, messageText) {
    const parsedText = messageText.split(":");
    if (parsedText.length === 1) {
        message.classList.add('joined-left-room');
    } else if (parsedText[0] === username) {
        // This is the user's own message
        message.classList.add('my-message'); // Optional: Add a special class for styling
    } else {
        // This is a message from another user
        showNotification(messageText);
        message.classList.add('others-message');
    }
    return message;
};