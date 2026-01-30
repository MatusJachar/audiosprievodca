"""
Upload Spanish audio files for tour stops 6-10
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import base64
import urllib.request
import ssl
from datetime import datetime
import uuid

load_dotenv()

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Spanish audio files - Stops 6-10
SPANISH_AUDIO_FILES = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ysyo48r5_6.Spanish.mp3",
        "stop_number": 6,
        "filename": "6.Spanish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/7fg6kd7j_7.Spanish.mp3",
        "stop_number": 7,
        "filename": "7.Spanish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/j568co29_8.Spanish.mp3",
        "stop_number": 8,
        "filename": "8.Spanish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ia87a2l5_9.Spanish.mp3",
        "stop_number": 9,
        "filename": "9.Spanish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/tfmr2h4h_10.Spanish.mp3",
        "stop_number": 10,
        "filename": "10.Spanish.mp3"
    }
]

async def upload_spanish_audio():
    """Upload Spanish audio for stops 6-10"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🇪🇸 Uploading Spanish Audio - Batch 2 (Stops 6-10)\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    total_size_mb = 0
    
    for audio_file in SPANISH_AUDIO_FILES:
        try:
            stop_num = audio_file['stop_number']
            print(f"\n📥 Processing Stop {stop_num}")
            print(f"   File: {audio_file['filename']}")
            
            # Find the tour stop
            stop = await db.tour_stops.find_one({"stop_number": stop_num})
            
            if not stop:
                print(f"   ❌ Stop {stop_num} not found!")
                failed_count += 1
                continue
            
            print(f"   ✓ Found: {stop['content']['en']['title']}")
            
            # Download audio
            print(f"   ⬇️  Downloading...")
            req = urllib.request.Request(audio_file['url'])
            with urllib.request.urlopen(req, context=ssl_context) as response:
                audio_bytes = response.read()
            
            file_size_mb = len(audio_bytes) / (1024 * 1024)
            total_size_mb += file_size_mb
            print(f"   ✓ Downloaded: {file_size_mb:.2f} MB")
            
            # Convert to base64
            print(f"   🔄 Converting to base64...")
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Check if Spanish audio exists
            existing = await db.tour_audio.find_one({
                'stop_id': stop['id'],
                'language': 'es'
            })
            
            if existing:
                # Update
                await db.tour_audio.update_one(
                    {"stop_id": stop['id'], "language": "es"},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Updated Spanish audio for Stop {stop_num}")
            else:
                # Insert
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': stop['id'],
                    'language': 'es',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Created Spanish audio for Stop {stop_num}")
            
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Batch 2 completed!")
    print(f"   Successful: {success_count}/5")
    print(f"   Failed: {failed_count}")
    print(f"   Total size: {total_size_mb:.2f} MB")
    print("\n✅ Spanish audio stops 6-10 uploaded successfully!")

if __name__ == "__main__":
    asyncio.run(upload_spanish_audio())
