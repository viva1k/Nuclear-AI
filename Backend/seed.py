import socket
# Force IPv4 getaddrinfo resolution to bypass Windows IPv6 timeout bugs
orig_getaddrinfo = socket.getaddrinfo
def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = patched_getaddrinfo

import asyncio
import os
# pyrefly: ignore [missing-import]
from prisma import Prisma
from security import get_password_hash

async def main():
    db = Prisma()
    await db.connect()
    print("Connected to database...")
    
    # Check if admin already exists
    admin_email = "admin@nuclear.ai"
    existing_admin = await db.user.find_unique(where={"email": admin_email})
    
    if not existing_admin:
        print(f"Seeding Admin user: {admin_email}")
        await db.user.create(
            data={
                "email": admin_email,
                "name": "System Administrator",
                "hashed_password": get_password_hash("Admin12345!"),
                "role": "ADMIN",
                "provider": "LOCAL"
            }
        )
        print("Admin user created.")
    else:
        print("Admin user already exists.")

    # Check if a test user already exists
    test_email = "test@nuclear.ai"
    existing_test = await db.user.find_unique(where={"email": test_email})
    if not existing_test:
        print(f"Seeding Test user: {test_email}")
        await db.user.create(
            data={
                "email": test_email,
                "name": "Test User",
                "hashed_password": get_password_hash("User12345!"),
                "role": "USER",
                "provider": "LOCAL"
            }
        )
        print("Test user created.")
    else:
        print("Test user already exists.")

    await db.disconnect()
    print("Database seeding completed.")

if __name__ == '__main__':
    asyncio.run(main())
