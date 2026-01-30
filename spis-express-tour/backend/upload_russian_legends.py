"""
Upload Russian audio files for Legend stops 1-4
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

# Russian legend audio files
RUSSIAN_LEGEND_AUDIO = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/c3owjqg0_L1.Russian.mp3",
        "legend_name": "Legend 1",
        "filename": "L1.Russian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/tktcjv2c_L2.Russian.mp3",
        "legend_name": "Legend 2",
        "filename": "L2.Russian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/jj86xb52_L3.Russian.mp3",
        "legend_name": "Legend 3",
        "filename": "L3.Russian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/txpykgxs_L4.Russian.mp3",
        "legend_name": "Legend 4",
        "filename": "L4.Russian.mp3"
    }
]

async def upload_russian_legends():
    """Upload Russian audio for all 4 legend stops"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🇷🇺 Uploading Russian Legend Audio Files\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    total_size_mb = 0
    
    for audio_file in RUSSIAN_LEGEND_AUDIO:
        try:
            print(f"\n📥 Processing {audio_file['legend_name']}")
            print(f"   File: {audio_file['filename']}")
            
            # Find the legend stop
            legend = await db.tour_stops.find_one({"stop_name": audio_file['legend_name']})
            
            if not legend:
                print(f"   ❌ {audio_file['legend_name']} not found!")
                failed_count += 1
                continue
            
            print(f"   ✓ Found stop ID: {legend['id']}")
            
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
            
            # Check if Russian audio exists
            existing = await db.tour_audio.find_one({
                'stop_id': legend['id'],
                'language': 'ru'
            })
            
            if existing:
                # Update
                await db.tour_audio.update_one(
                    {"stop_id": legend['id'], "language": "ru"},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Updated Russian audio for {audio_file['legend_name']}")
            else:
                # Insert
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': legend['id'],
                    'language': 'ru',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Created Russian audio for {audio_file['legend_name']}")
            
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Upload completed!")
    print(f"   Successful: {success_count}/4")
    print(f"   Failed: {failed_count}")
    print(f"   Total size: {total_size_mb:.2f} MB")
    
    # Verify
    print("\n🔍 Verification - Russian audio coverage:\n")
    
    legends = await db.tour_stops.find(
        {"stop_name": {"$regex": "^Legend [1-4]$"}}
    ).sort("stop_name", 1).to_list(None)
    
    for legend in legends:
        audio_files = await db.tour_audio.find({'stop_id': legend['id']}).to_list(None)
        languages = sorted([af['language'] for af in audio_files])
        has_ru = 'ru' in languages
        status = "✅" if has_ru else "❌"
        print(f"{status} {legend['stop_name']}: {languages}")
    
    print("\n🎉 Russian legend audio upload complete!")

if __name__ == "__main__":
    asyncio.run(upload_russian_legends())
