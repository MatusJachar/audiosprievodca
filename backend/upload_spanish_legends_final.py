"""
Upload Spanish audio files for legends L3-L4
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

# Spanish legend audio files L3-L4
SPANISH_LEGENDS = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/p876sag8_L3.Spanish.mp3",
        "legend_name": "Legend 3",
        "filename": "L3.Spanish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/yev3k9g8_L4.Spanish.mp3",
        "legend_name": "Legend 4",
        "filename": "L4.Spanish.mp3"
    }
]

async def upload_spanish_legends():
    """Upload Spanish audio for legends 3-4"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🇪🇸 Uploading Spanish Legends L3-L4\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    total_size_mb = 0
    
    for audio_file in SPANISH_LEGENDS:
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
            
            # Check if Spanish audio exists
            existing = await db.tour_audio.find_one({
                'stop_id': legend['id'],
                'language': 'es'
            })
            
            if existing:
                await db.tour_audio.update_one(
                    {"stop_id": legend['id'], "language": "es"},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Updated Spanish audio for {audio_file['legend_name']}")
            else:
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': legend['id'],
                    'language': 'es',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Created Spanish audio for {audio_file['legend_name']}")
            
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Upload completed!")
    print(f"   Successful: {success_count}/2")
    print(f"   Failed: {failed_count}")
    print(f"   Total size: {total_size_mb:.2f} MB")
    
    # Verify Spanish legend coverage
    print("\n🔍 Verification - Spanish audio on legends:\n")
    
    legends = await db.tour_stops.find(
        {"stop_name": {"$regex": "^Legend [1-4]$"}}
    ).sort("stop_name", 1).to_list(None)
    
    for legend in legends:
        audio_files = await db.tour_audio.find({'stop_id': legend['id']}).to_list(None)
        languages = sorted([af['language'] for af in audio_files])
        has_es = 'es' in languages
        status = "✅" if has_es else "❌"
        print(f"{status} {legend['stop_name']}: {languages}")
    
    print("\n✅ Spanish legend audio upload complete!")

if __name__ == "__main__":
    asyncio.run(upload_spanish_legends())
