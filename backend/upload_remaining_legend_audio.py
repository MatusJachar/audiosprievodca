"""
Upload remaining German and Polish audio files for the 4 Legend stops
Now that we use separate audio collection, we can handle large files
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

# Create SSL context that doesn't verify certificates
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# All remaining legend audio files to upload
LEGEND_AUDIO_FILES = [
    # German L1 and L2 (failed before due to 16MB limit)
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/67by0r8t_L1.German.mp3",
        "legend_name": "Legend 1",
        "language": "de",
        "filename": "L1.German.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/9eeiu20b_L2.German.mp3",
        "legend_name": "Legend 2",
        "language": "de",
        "filename": "L2.German.mp3"
    },
    # Polish L1-L4
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/lh4j6yd0_L1.Polish.mp3",
        "legend_name": "Legend 1",
        "language": "pl",
        "filename": "L1.Polish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/599rdekp_L2.Polish.mp3",
        "legend_name": "Legend 2",
        "language": "pl",
        "filename": "L2.Polish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/c31buson_L.3Polish.mp3",
        "legend_name": "Legend 3",
        "language": "pl",
        "filename": "L3.Polish.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/t2mw4t66_L4Polish.mp3",
        "legend_name": "Legend 4",
        "language": "pl",
        "filename": "L4.Polish.mp3"
    }
]

async def download_and_upload_audio():
    """Download audio files and upload them to the tour_audio collection"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🎵 Starting Legend Audio Upload to Separate Collection\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    
    for audio_file in LEGEND_AUDIO_FILES:
        try:
            lang_name = "German" if audio_file['language'] == 'de' else "Polish"
            print(f"\n📥 Processing: {audio_file['legend_name']} - {lang_name}")
            print(f"   File: {audio_file['filename']}")
            
            # Find the legend stop in database
            legend_stop = await db.tour_stops.find_one({"stop_name": audio_file['legend_name']})
            
            if not legend_stop:
                print(f"   ❌ Legend stop '{audio_file['legend_name']}' not found in database!")
                failed_count += 1
                continue
            
            print(f"   ✓ Found stop ID: {legend_stop['id']}")
            
            # Check if audio already exists
            existing_audio = await db.tour_audio.find_one({
                'stop_id': legend_stop['id'],
                'language': audio_file['language']
            })
            
            if existing_audio:
                print(f"   ⏭️  {lang_name} audio already exists, skipping...")
                continue
            
            # Download the MP3 file
            print(f"   ⬇️  Downloading from: {audio_file['url'][:60]}...")
            
            req = urllib.request.Request(audio_file['url'])
            with urllib.request.urlopen(req, context=ssl_context) as response:
                audio_bytes = response.read()
            
            file_size_mb = len(audio_bytes) / (1024 * 1024)
            print(f"   ✓ Downloaded: {file_size_mb:.2f} MB")
            
            # Convert to base64
            print(f"   🔄 Converting to base64...")
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # Create audio document
            audio_doc = {
                'id': str(uuid.uuid4()),
                'stop_id': legend_stop['id'],
                'language': audio_file['language'],
                'audio_base64': audio_base64,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert into tour_audio collection
            print(f"   ⬆️  Uploading to tour_audio collection...")
            await db.tour_audio.insert_one(audio_doc)
            
            print(f"   ✅ Successfully uploaded {lang_name} audio for {audio_file['legend_name']}")
            success_count += 1
                
        except Exception as e:
            print(f"   ❌ Error processing {audio_file['legend_name']} {lang_name}: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Upload process completed!")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {failed_count}")
    
    # Verify the upload
    print("\n🔍 Verifying uploaded audio...\n")
    legend_stops = await db.tour_stops.find(
        {"stop_name": {"$regex": "^Legend [1-4]$"}}
    ).sort("stop_name", 1).to_list(None)
    
    print("Audio files per Legend stop:")
    for stop in legend_stops:
        audio_files = await db.tour_audio.find({'stop_id': stop['id']}).to_list(None)
        languages = [af['language'] for af in audio_files]
        
        # Check coverage
        has_en = 'en' in languages
        has_de = 'de' in languages
        has_pl = 'pl' in languages
        
        status = "✅" if (has_en and has_de and has_pl) else "⚠️"
        print(f"{status} {stop['stop_name']}: {len(languages)} files - {sorted(languages)}")
        
        if not has_en:
            print(f"     Missing: English")
        if not has_de:
            print(f"     Missing: German")
        if not has_pl:
            print(f"     Missing: Polish")
    
    print("\n✅ All legend audio files have been processed!")

if __name__ == "__main__":
    asyncio.run(download_and_upload_audio())
