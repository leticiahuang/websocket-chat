import asyncio 
from websockets.server import serve

connected_users = set()

async def handle_user(websocket, path): 
    connected_users.add(websocket)   
    try:
        async for message in websocket:
            for user in connected_users:
                if user != websocket:
                    await user.send(message)

    finally:
        connected_users.remove(websocket)

async def main():
    async with serve(handle_user, "localhost", 8765):
        await asyncio.Future() 

if __name__ == "__main__":
    asyncio.run(main())