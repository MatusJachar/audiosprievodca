#!/usr/bin/env python3
"""Upload background image to the database"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def upload_background():
    # Read base64 image
    with open('/tmp/background_base64.txt', 'r') as f:
        image_base64 = f.read().strip()
    
    print(f"Background image size: {len(image_base64)} characters")
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Check if settings exist
    settings = await db.app_settings.find_one({"id": "app_settings"})
    
    if settings:
        print("Updating existing app settings...")
        await db.app_settings.update_one(
            {"id": "app_settings"},
            {"$set": {
                "background_image_base64": image_base64,
                "updated_at": datetime.utcnow()
            }}
        )
    else:
        print("Creating new app settings...")
        await db.app_settings.insert_one({
            "id": "app_settings",
            "background_image_base64": image_base64,
            "updated_at": datetime.utcnow()
        })
    
    print("✅ Background image uploaded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(upload_background())
