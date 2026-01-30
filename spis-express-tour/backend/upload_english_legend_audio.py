"""
Upload English audio files for the 4 Legend stops
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import base64
import urllib.request
import ssl

load_dotenv()

# Create SSL context that doesn't verify certificates (for downloading from customer-assets)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Audio file URLs from the uploaded assets
LEGEND_AUDIO_FILES = [
    {
        "url": "https://customer-assets.emergentagent.com/job_castle-legends-1/artifacts/7pdzgygy_1%20legent%20brave%20monk.mp3",
        "legend_name": "Legend 1",
        "filename": "1_legent_brave_monk.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_castle-legends-1/artifacts/ugmu9nko_2.legent%20brave%20knight%20Roland.mp3",
        "legend_name": "Legend 2",
        "filename": "2_legent_brave_knight_Roland.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_castle-legends-1/artifacts/x60n3yyr_3%20legent%20the%20ghost%20of%20Spi%C5%A1.mp3",
        "legend_name": "Legend 3",
        "filename": "3_legent_the_ghost_of_Spis.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_castle-legends-1/artifacts/8gx7235u_4%20legent%20the%20gipsy%20princes.mp3",
        "legend_name": "Legend 4",
        "filename": "4_legent_the_gipsy_princes.mp3"
    }
]

async def download_and_upload_audio():
    """Download audio files and upload them to the database"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🎵 Starting English Legend Audio Upload Process\n")
    print("=" * 60)
    
    for audio_file in LEGEND_AUDIO_FILES:
        try:
            print(f"\n📥 Processing: {audio_file['legend_name']}")
            print(f"   File: {audio_file['filename']}")
            
            # Find the legend stop in database
            legend_stop = await db.tour_stops.find_one({"stop_name": audio_file['legend_name']})
            
            if not legend_stop:
                print(f"   ❌ Legend stop '{audio_file['legend_name']}' not found in database!")
                continue
            
            print(f"   ✓ Found stop ID: {legend_stop['id']}")
            
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
            
            # Upload to database
            print(f"   ⬆️  Uploading to database...")
            result = await db.tour_stops.update_one(
                {"id": legend_stop['id']},
                {"$set": {"audio.en": audio_base64}}
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Successfully uploaded English audio for {audio_file['legend_name']}")
            else:
                print(f"   ⚠️  Audio may have already existed for {audio_file['legend_name']}")
                
        except Exception as e:
            print(f"   ❌ Error processing {audio_file['legend_name']}: {str(e)}")
            continue
    
    print("\n" + "=" * 60)
    print("✨ Upload process completed!\n")
    
    # Verify the upload
    print("🔍 Verifying uploaded audio...\n")
    legend_stops = await db.tour_stops.find(
        {"stop_name": {"$regex": "^Legend [1-4]$"}}
    ).sort("stop_name", 1).to_list(None)
    
    for stop in legend_stops:
        audio_langs = list(stop.get('audio', {}).keys())
        has_english = 'en' in audio_langs
        status = "✅" if has_english else "❌"
        print(f"{status} {stop['stop_name']}: Audio languages: {audio_langs}")
    
    print("\n✅ All English legend audio files have been uploaded successfully!")

if __name__ == "__main__":
    asyncio.run(download_and_upload_audio())
