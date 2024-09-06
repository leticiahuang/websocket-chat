// everytime html page loads, create websocket connection for client 
const ws = new WebSocket("ws://localhost:8765");
// let is changable variable, const in constant
let username = prompt("Create a username: ");
let userId = null; 
let currentRoom = null;
// Call the function to request permission
requestNotificationPermission();




// populate room select when ws connection successfully created
ws.onopen = () => {
    ws.send(JSON.stringify({ command: "newUserGetRooms" }));
};




// closes ws connection for user
function closeConnection() {
    const exit = confirm("End the session?");
	if(exit === "true") {
        ws.close();
    }
};




// event is when user recieves data from websocket (server) 
ws.onmessage = (event) => {
    const chatbox = document.getElementById("chatbox");
    // create new div for message box 
    var message = document.createElement("div"); 
    const data = JSON.parse(event.data);
    const senderId = data.user_id;
    var messageText = data.message;
    // following differ per event depending on type of message
    const addRoom = data.addRoom;
    const getRooms = data.getRooms; 
    const joinedRoom = data.joinedRoom;
    const leftRoom = data.leftRoom;
    const chatHistory = data.prevChats;

    // TODO create separate functions for each "if"
    // populate room select
    if (getRooms != null) {
        getRooms.forEach(element => {
            updateRoomSelect(element);
        });
        return;
    }

    // add room to room select
    if (addRoom != null) {
        updateRoomSelect(addRoom);
        return;
    } 

     // If userId is not set, this is first message, your message from joining group
    if (!userId) {
        userId = senderId;
    }

    // apply css styling depending on who the message is from 
    if(joinedRoom === true) {
        // console.log("messageText joinedroom: ", username, messageText);
        // if you are the user who joined, load chat history 
        if (userId === senderId) {
            loadChatHistory(chatHistory, chatbox);
        }
        message.classList.add('joined-left-room'); 
    } else if (leftRoom === true) {
        // display a user left the room 
        message.classList.add('joined-left-room');
    } else {
        // determine if message was yours or from another user
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
        // send the message user submitted to websocket 
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




// creates browser notification
function showNotification(body) {
    if (Notification.permission === "granted") {
        new Notification("Chat App", { body: body });
    }
};




// leaves room but ws connection still intact
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




// change room if user selects from drop down menu
function changeRoom() {
    const roomSelect = document.getElementById("select-room");
    joinRoom(roomSelect.value);
    document.getElementById('select-room').selectedIndex = 0;
};




// create and join room if user submits "create room"
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
    // console.log("info sent: ", JSON.stringify({ command: "join", room: roomName }))
    ws.send(JSON.stringify({ command: "join", room: roomName, username: username }));
    // console.log("joined room!")
};




// add inputted room name to room select
function updateRoomSelect(newRoomName) {
    const roomSelect = document.getElementById("select-room");
    const newOption = document.createElement("option");
    newOption.value = newRoomName;
    newOption.innerHTML = newRoomName;
    roomSelect.appendChild(newOption);
};




// when a user joins a group, load chat histroy of that group 
function loadChatHistory(chatHistory, chatbox) {
    // console.log("------------chatHistroy: ", chatHistory);
    // add each message one by one to the joined user's screen
    chatHistory.forEach(element => {
        const message = document.createElement("div");
        message.textContent = element;
        addMessageClass(message, element)
        chatbox.appendChild(message);
    });
};




// function to determine whether the message is to notify someone left/joined a room, message is from others or your own message. Applies design respectively. 
function addMessageClass(message, messageText) {
    // a usual message is "Leticia: Hello."
    const parsedText = messageText.split(":");
    if (parsedText.length === 1) {
        // message is notifying someone joined/left as message has no ":", meaning doesn't start with a name
        message.classList.add('joined-left-room');
    } else if (parsedText[0] === username) {
        // This is the user's own message
        message.classList.add('my-message'); 
    } else {
        // This is a message from another user
        showNotification(messageText);
        message.classList.add('others-message');
    }
    return message;
};