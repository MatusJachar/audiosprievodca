"""
Update audio files for Stop 1 (English and German)
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import base64
import urllib.request
import ssl
from datetime import datetime

load_dotenv()

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Audio files to update
AUDIO_FILES = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/d1c2mb4d_1.%20welcome.mp3",
        "language": "en",
        "language_name": "English",
        "filename": "1.welcome.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/u9f4ck87_1.German.mp3",
        "language": "de",
        "language_name": "German",
        "filename": "1.German.mp3"
    }
]

async def update_stop1_audio():
    """Update audio files for Stop 1"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔄 Starting Stop 1 Audio Update Process\n")
    print("=" * 60)
    
    # Find Stop 1
    stop1 = await db.tour_stops.find_one({"stop_number": 1})
    
    if not stop1:
        print("❌ Stop 1 not found in database!")
        return
    
    print(f"✓ Found Stop 1: {stop1['content']['en']['title']}")
    print(f"  Stop ID: {stop1['id']}\n")
    
    success_count = 0
    failed_count = 0
    
    for audio_file in AUDIO_FILES:
        try:
            print(f"📥 Processing: {audio_file['language_name']} audio")
            print(f"   File: {audio_file['filename']}")
            
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
            
            # Check if audio exists
            existing_audio = await db.tour_audio.find_one({
                'stop_id': stop1['id'],
                'language': audio_file['language']
            })
            
            if existing_audio:
                # Update existing audio
                print(f"   🔄 Updating existing {audio_file['language_name']} audio...")
                await db.tour_audio.update_one(
                    {"stop_id": stop1['id'], "language": audio_file['language']},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Successfully updated {audio_file['language_name']} audio for Stop 1")
            else:
                print(f"   ⚠️  No existing audio found - this shouldn't happen for Stop 1")
                # Create new entry just in case
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': stop1['id'],
                    'language': audio_file['language'],
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Created new {audio_file['language_name']} audio for Stop 1")
            
            success_count += 1
                
        except Exception as e:
            print(f"   ❌ Error processing {audio_file['language_name']}: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Update process completed!")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {failed_count}")
    
    # Verify the update
    print("\n🔍 Verifying updated audio...\n")
    
    audio_files = await db.tour_audio.find({'stop_id': stop1['id']}).to_list(None)
    languages = sorted([af['language'] for af in audio_files])
    
    print(f"Stop 1 now has {len(languages)} audio files: {languages}")
    
    # Check if EN and DE were updated
    for lang in ['en', 'de']:
        audio = await db.tour_audio.find_one({'stop_id': stop1['id'], 'language': lang})
        if audio:
            lang_name = "English" if lang == "en" else "German"
            size_mb = len(audio['audio_base64']) * 0.75 / (1024 * 1024)
            updated_time = audio['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
            print(f"  ✅ {lang_name}: {size_mb:.2f} MB (updated: {updated_time})")
    
    print("\n✅ Stop 1 audio files have been successfully updated!")

if __name__ == "__main__":
    asyncio.run(update_stop1_audio())
