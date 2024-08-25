import asyncio 
import uuid
import json
from websockets.server import serve
import logging

# keep track of list of connected users 
connected_users = set()
rooms = {}

# multiple handle_user running, each user gets one run
async def handle_user(websocket, path): 
    user_id = str(uuid.uuid4())
    connected_users.add(websocket)   
    curr_room = None 
    print("-----------got to handle user ")
    try:
        # will keep running loop of list of messages while user connected, may send new messages
        async for message in websocket:
            print("-----------got to message ")
            json_message = json.loads(message)
            command = json_message["command"]
            print("-----------json_message: " + str(json_message))
            print("command: " + command)

            if command == "newUserGetRooms":
                return_message = json.dumps({"getRooms": list(rooms.keys())})
                print("-----------server to client get room: " + return_message)
                await websocket.send(return_message)

            elif command == "join":
                room_name = json_message["room"]
                rooms[room_name].add(websocket)
                print("users in room: " + str(list(rooms[room_name])))
                curr_room = room_name
                return_message = json.dumps({"user_id": user_id, "joinedRoom": True, "message": f"joined {room_name}"})
                for user in rooms[curr_room]:
                    await user.send(return_message)

            elif command == "leave":
                rooms[curr_room].remove(websocket)
                return_message = json.dumps({"user_id": user_id, "leftRoom": True, "message": f"left {json_message["room"]}"})
                for user in rooms[curr_room]:
                    await user.send(return_message)
                curr_room = None

            elif command == "message" and curr_room:
                message_text = json_message["message"]
                return_message = json.dumps({"user_id": user_id, "message": message_text})
                for user in rooms[curr_room]:
                    # if user != websocket:
                    # await allows us to handle other users while sending message to current user
                    await user.send(return_message)

            elif command == "createRoom":
                room_name = json_message["room"]
                rooms[room_name] = set()
                return_message = json.dumps({"addRoom": room_name})
                for user in connected_users:
                    await user.send(return_message)

    # only gets to this line when user disconnects or error
    finally:
        connected_users.remove(websocket)

# creates websocket listening at localhost and runs handle_user
async def main():
    # creates server at localhost  
    async with serve(handle_user, "localhost", 8765):
        # await never resolved, keeps main running forever
        await asyncio.get_running_loop().create_future()

if __name__ == "__main__":
    asyncio.run(main())