import asyncio 
import uuid
import json
from websockets.server import serve
import logging

# set of all users connected to ws
connected_users = set()
# map of rooms and the users in each room 
room_users = {}
# map of rooms and each room's chat history. 
chat_history = {}




# each connection with ws (each user) has their own handle_user() running 
async def handle_user(websocket, path): 
    # creates distinct user id for user
    user_id = str(uuid.uuid4())
    connected_users.add(websocket)   
    curr_room = None 
    # try loop will run until ws connection closed, keep listening to new messages delivered to websocket 

    try:
        async for message in websocket:
            # message received in json form, parse it.
            json_message = json.loads(message)
            # command specifies what kind of message this is
            command = json_message["command"]
            # print("-----------json_message: " + str(json_message))
            # print("command: " + command)


            # returns list of rooms to populate room select
            if command == "newUserGetRooms":
                return_message = json.dumps({"getRooms": list(room_users.keys())})
                print("-----------server to client get room: " + return_message)
                await websocket.send(return_message)

            elif command == "join":
                room_name = json_message["room"]
                curr_room = room_name
                sender_of_message = json_message["username"]
                room_users[room_name].add(websocket)
                # print("users in room: " + str(list(room_users[room_name])))
                
                message_text = f"{sender_of_message} joined {room_name}"
                return_message = json.dumps({"user_id": user_id, "joinedRoom": True, "message": message_text, "prevChats": chat_history[room_name]})
                chat_history[curr_room].append(message_text) 
                
                # send message to every ws connection in the room 
                for user in room_users[curr_room]:
                    await user.send(return_message)

            elif command == "leave":
                room_users[curr_room].remove(websocket)
                sender_of_message = json_message["username"]

                message_text = f"{sender_of_message} left {curr_room}"
                return_message = json.dumps({"user_id": user_id, "leftRoom": True, "message": message_text})
                chat_history[curr_room].append(message_text) 

                # notify other users in room that user left
                for user in room_users[curr_room]:
                    await user.send(return_message)
                
                curr_room = None

            elif command == "message" and curr_room:
                message_text = json_message["message"]
                return_message = json.dumps({"user_id": user_id, "message": message_text})
                chat_history[curr_room].append(message_text) 

                # send message ws received to other users connected to ws
                for user in room_users[curr_room]:
                # await allows us to handle other users while sending message to current user
                    await user.send(return_message)

            elif command == "createRoom":
                room_name = json_message["room"]
                # create set to track users in room created
                room_users[room_name] = set()
                # create list to document chats sent in room
                chat_history[room_name] = list()

                return_message = json.dumps({"addRoom": room_name})

                # tell all users connected in ws to add new room to room select
                for user in connected_users:
                    await user.send(return_message)

    # only gets to this line when user disconnects or error
    finally:
        connected_users.remove(websocket)




# creates websocket listening at localhost and runs handle_user() forever
async def main():
    # creates server at localhost  
    async with serve(handle_user, "localhost", 8765):
        # await never resolved, keeps main running forever
        await asyncio.get_running_loop().create_future()




if __name__ == "__main__":
    asyncio.run(main())