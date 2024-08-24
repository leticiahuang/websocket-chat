import asyncio 
import uuid
import json
from websockets.server import serve

# keep track of list of connected users 
connected_users = set()

# multiple handle_user running, each user gets one run
async def handle_user(websocket, path): 
    user_id = str(uuid.uuid4())
    connected_users.add(websocket)   
    try:
        # will keep running loop of list of messages while user connected, may send new messages
        async for message in websocket:
            message_with_id = json.dumps({"user_id": user_id, "message": message})
            for user in connected_users:
                # if user != websocket:
                # await allows us to handle other users while sending message to current user
                await user.send(message_with_id)

    # only gets to this line when user disconnects or error
    finally:
        connected_users.remove(websocket)

# creates websocket listening at localhost and runs handle_user
async def main():
    # creates server at localhost  
    async with serve(handle_user, "localhost", 8765, ):
        # await never resolved, keeps main running forever
        await asyncio.get_running_loop().create_future()

if __name__ == "__main__":
    asyncio.run(main())