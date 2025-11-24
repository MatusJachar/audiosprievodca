"""
Upload Hungarian audio files for the 4 Legend stops
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
from pydub import AudioSegment
import io

load_dotenv()

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Hungarian legend audio files
HUNGARIAN_LEGEND_AUDIO = [
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/yq6jtgdd_L1.Hungarian.mp3",
        "legend_name": "Legend 1",
        "filename": "L1.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ztjcyuae_L2.Hungarian.mp3",
        "legend_name": "Legend 2",
        "filename": "L2.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/4vtruo6g_L3.Hungarian.mp3",
        "legend_name": "Legend 3",
        "filename": "L3.Hungarian.mp3"
    },
    {
        "url": "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/jakr0rrk_L4.Hungarian.mp3",
        "legend_name": "Legend 4",
        "filename": "L4.Hungarian.mp3"
    }
]

async def compress_audio_if_needed(audio_bytes, max_size_mb=11):
    """Compress audio if it exceeds size limit"""
    size_mb = len(audio_bytes) / (1024 * 1024)
    base64_size_mb = (len(audio_bytes) * 4 / 3) / (1024 * 1024)
    
    if base64_size_mb <= max_size_mb:
        return audio_bytes, False
    
    print(f"      Audio too large ({base64_size_mb:.2f} MB base64), compressing...")
    
    # Load and compress
    audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
    duration_seconds = len(audio) / 1000.0
    
    # Compress to 64kbps mono
    compressed_buffer = io.BytesIO()
    audio.export(
        compressed_buffer,
        format="mp3",
        bitrate="64k",
        parameters=["-ac", "1"]
    )
    
    compressed_bytes = compressed_buffer.getvalue()
    compressed_size_mb = len(compressed_bytes) / (1024 * 1024)
    base64_compressed_mb = (len(compressed_bytes) * 4 / 3) / (1024 * 1024)
    
    print(f"      Compressed: {compressed_size_mb:.2f} MB (base64: {base64_compressed_mb:.2f} MB)")
    print(f"      Duration preserved: {duration_seconds:.1f} seconds")
    
    return compressed_bytes, True

async def upload_hungarian_legends():
    """Upload Hungarian audio for all 4 legend stops"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🇭🇺 Uploading Hungarian Legend Audio Files\n")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    total_size_mb = 0
    
    for audio_file in HUNGARIAN_LEGEND_AUDIO:
        try:
            print(f"\n📥 Processing: {audio_file['legend_name']}")
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
            
            original_size_mb = len(audio_bytes) / (1024 * 1024)
            print(f"   ✓ Downloaded: {original_size_mb:.2f} MB")
            
            # Compress if needed
            print(f"   🔄 Checking size...")
            final_audio_bytes, was_compressed = await compress_audio_if_needed(audio_bytes)
            
            final_size_mb = len(final_audio_bytes) / (1024 * 1024)
            total_size_mb += final_size_mb
            
            if was_compressed:
                reduction = ((original_size_mb - final_size_mb) / original_size_mb) * 100
                print(f"   ✅ Size reduced by {reduction:.1f}%")
            else:
                print(f"   ✅ No compression needed")
            
            # Convert to base64
            print(f"   🔄 Converting to base64...")
            audio_base64 = base64.b64encode(final_audio_bytes).decode('utf-8')
            
            # Check if Hungarian audio exists
            existing = await db.tour_audio.find_one({
                'stop_id': legend['id'],
                'language': 'hu'
            })
            
            if existing:
                # Update
                await db.tour_audio.update_one(
                    {"stop_id": legend['id'], "language": "hu"},
                    {"$set": {
                        "audio_base64": audio_base64,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"   ✅ Updated Hungarian audio for {audio_file['legend_name']}")
            else:
                # Insert
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': legend['id'],
                    'language': 'hu',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                await db.tour_audio.insert_one(audio_doc)
                print(f"   ✅ Created Hungarian audio for {audio_file['legend_name']}")
            
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
    print("\n🔍 Verification - Hungarian audio coverage:\n")
    
    legends = await db.tour_stops.find(
        {"stop_name": {"$regex": "^Legend [1-4]$"}}
    ).sort("stop_name", 1).to_list(None)
    
    for legend in legends:
        audio_files = await db.tour_audio.find({'stop_id': legend['id']}).to_list(None)
        languages = sorted([af['language'] for af in audio_files])
        has_hu = 'hu' in languages
        status = "✅" if has_hu else "❌"
        print(f"{status} {legend['stop_name']}: {languages}")
    
    print("\n🎉 Hungarian legend audio upload complete!")

if __name__ == "__main__":
    asyncio.run(upload_hungarian_legends())
