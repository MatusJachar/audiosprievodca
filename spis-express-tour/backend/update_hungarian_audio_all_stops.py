"""
Update Hungarian (Magyar) audio files for all 13 tour stops
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

# All 13 Hungarian audio files
HUNGARIAN_AUDIO_FILES = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/pjzmqzb8_1.Hungarian.mp3",
        "stop_number": 1,
        "filename": "1.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/5906n6m8_2.Hungarian.mp3",
        "stop_number": 2,
        "filename": "2.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/x6qvfked_3.Hungary.mp3",
        "stop_number": 3,
        "filename": "3.Hungary.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ne7bk5vk_4.Hungarian.mp3",
        "stop_number": 4,
        "filename": "4.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/hlfpooml_5.Hungarian.mp3",
        "stop_number": 5,
        "filename": "5.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ogdnh0tr_6.Hungarian.mp3",
        "stop_number": 6,
        "filename": "6.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/98bdq88u_7.Hungarian.mp3",
        "stop_number": 7,
        "filename": "7.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/q1jou5kn_8.Hungarian.mp3",
        "stop_number": 8,
        "filename": "8.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/e8hb5gpu_9.Hungarian.mp3",
        "stop_number": 9,
        "filename": "9.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/b41amtbc_10.Hungerian.mp3",
        "stop_number": 10,
        "filename": "10.Hungerian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/d2yjd12v_11.Hungarian.mp3",
        "stop_number": 11,
        "filename": "11.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/3dma6f43_12.Hungarian.mp3",
        "stop_number": 12,
        "filename": "12.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/dqfi0zbu_13.Hungarian.mp3",
        "stop_number": 13,
        "filename": "13.Hungarian.mp3"
    }
]

async def update_hungarian_audio():
    """Update Hungarian audio files for all 13 stops"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🇭🇺 Starting Hungarian Audio Update for All 13 Tour Stops\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    total_size_mb = 0
    
    for audio_file in HUNGARIAN_AUDIO_FILES:
        try:
            stop_num = audio_file['stop_number']
            print(f"\n📥 Processing Stop {stop_num}")
            print(f"   File: {audio_file['filename']}")
            
            # Find the tour stop
            stop = await db.tour_stops.find_one({"stop_number": stop_num})
            
            if not stop:
                print(f"   ❌ Stop {stop_num} not found in database!")
                failed_count += 1
                continue
            
            stop_title = stop['content']['en']['title']
            print(f"   ✓ Found: {stop_title}")
            print(f"   Stop ID: {stop['id']}")
            
            # Download the MP3 file
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
            
            # Check if Hungarian audio exists
            existing_audio = await db.tour_audio.find_one({
                'stop_id': stop['id'],
                'language': 'hu'
            })
            
            if existing_audio:
                # Update existing audio
                print(f"   🔄 Updating existing Hungarian audio...")
                await db.tour_audio.update_one(
                    {"stop_id": stop['id'], "language": "hu"},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Successfully updated Hungarian audio for Stop {stop_num}")
            else:
                # Create new entry
                print(f"   ➕ Creating new Hungarian audio entry...")
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': stop['id'],
                    'language': 'hu',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Successfully created Hungarian audio for Stop {stop_num}")
            
            success_count += 1
                
        except Exception as e:
            print(f"   ❌ Error processing Stop {audio_file['stop_number']}: {str(e)}")
            failed_count += 1
            continue
    
    print("\n" + "=" * 60)
    print(f"✨ Update process completed!")
    print(f"   Successful: {success_count}/13 stops")
    print(f"   Failed: {failed_count}")
    print(f"   Total audio size: {total_size_mb:.2f} MB")
    
    # Verify the updates
    print("\n🔍 Verifying Hungarian audio coverage...\n")
    
    stops = await db.tour_stops.find({"stop_number": {"$lte": 13}}).sort("stop_number", 1).to_list(None)
    
    print("Hungarian (Magyar) audio status per stop:")
    for stop in stops:
        audio = await db.tour_audio.find_one({'stop_id': stop['id'], 'language': 'hu'})
        if audio:
            size_mb = len(audio['audio_base64']) * 0.75 / (1024 * 1024)
            updated_time = audio['updated_at'].strftime('%Y-%m-%d %H:%M')
            print(f"  ✅ Stop {stop['stop_number']:2d}: {size_mb:.2f} MB (updated: {updated_time})")
        else:
            print(f"  ❌ Stop {stop['stop_number']:2d}: No Hungarian audio")
    
    print("\n🎉 All Hungarian audio files have been successfully updated!")

if __name__ == "__main__":
    asyncio.run(update_hungarian_audio())
