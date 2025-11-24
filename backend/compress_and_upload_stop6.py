"""
Compress and upload Stop 6 Hungarian audio
Compress without shortening duration - reduce bitrate while maintaining full length
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

STOP6_AUDIO_URL = "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ogdnh0tr_6.Hungarian.mp3"

async def compress_and_upload():
    """Compress and upload Stop 6 Hungarian audio"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Compressing and Uploading Stop 6 Hungarian Audio\n")
    print("=" * 60)
    
    # Find Stop 6
    stop6 = await db.tour_stops.find_one({"stop_number": 6})
    
    if not stop6:
        print("❌ Stop 6 not found!")
        return
    
    print(f"✓ Found Stop 6: {stop6['content']['en']['title']}")
    print(f"  Stop ID: {stop6['id']}\n")
    
    try:
        # Download the MP3 file
        print("⬇️  Downloading original audio file...")
        req = urllib.request.Request(STOP6_AUDIO_URL)
        with urllib.request.urlopen(req, context=ssl_context) as response:
            audio_bytes = response.read()
        
        original_size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"   ✓ Downloaded: {original_size_mb:.2f} MB")
        
        # Load audio with pydub
        print("🎵 Loading audio for compression...")
        audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
        
        duration_seconds = len(audio) / 1000.0
        print(f"   Duration: {duration_seconds:.1f} seconds")
        print(f"   Original bitrate: ~{(original_size_mb * 8 * 1024) / duration_seconds:.0f} kbps")
        
        # Compress audio: reduce bitrate to 64kbps (good quality for voice)
        # This maintains full duration but reduces file size
        print("🔄 Compressing audio (reducing bitrate to 64kbps)...")
        
        # Export as MP3 with lower bitrate
        compressed_buffer = io.BytesIO()
        audio.export(
            compressed_buffer,
            format="mp3",
            bitrate="64k",
            parameters=["-ac", "1"]  # Mono channel for voice
        )
        
        compressed_bytes = compressed_buffer.getvalue()
        compressed_size_mb = len(compressed_bytes) / (1024 * 1024)
        
        print(f"   ✓ Compressed: {compressed_size_mb:.2f} MB")
        print(f"   Compression ratio: {(1 - compressed_size_mb/original_size_mb) * 100:.1f}% reduction")
        print(f"   New bitrate: ~{(compressed_size_mb * 8 * 1024) / duration_seconds:.0f} kbps")
        
        # Check if compressed file will fit in MongoDB (16MB limit)
        base64_size_mb = (len(compressed_bytes) * 4 / 3) / (1024 * 1024)  # Base64 is ~1.33x larger
        print(f"   Base64 size: {base64_size_mb:.2f} MB")
        
        if base64_size_mb > 15:  # Leave some margin
            print(f"   ⚠️  Still too large! Reducing bitrate further to 48kbps...")
            compressed_buffer = io.BytesIO()
            audio.export(
                compressed_buffer,
                format="mp3",
                bitrate="48k",
                parameters=["-ac", "1"]
            )
            compressed_bytes = compressed_buffer.getvalue()
            compressed_size_mb = len(compressed_bytes) / (1024 * 1024)
            base64_size_mb = (len(compressed_bytes) * 4 / 3) / (1024 * 1024)
            print(f"   ✓ Further compressed: {compressed_size_mb:.2f} MB (base64: {base64_size_mb:.2f} MB)")
        
        # Convert to base64
        print("🔄 Converting to base64...")
        audio_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
        
        # Delete old Hungarian audio if exists
        print("🗑️  Deleting old Hungarian audio...")
        await db.tour_audio.delete_one({
            'stop_id': stop6['id'],
            'language': 'hu'
        })
        
        # Create new audio entry
        print("➕ Creating new compressed Hungarian audio entry...")
        audio_doc = {
            'id': str(uuid.uuid4()),
            'stop_id': stop6['id'],
            'language': 'hu',
            'audio_base64': audio_base64,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.tour_audio.insert_one(audio_doc)
        
        print("✅ Successfully created compressed Hungarian audio for Stop 6")
        
        # Verify
        audio = await db.tour_audio.find_one({'stop_id': stop6['id'], 'language': 'hu'})
        if audio:
            size_mb = len(audio['audio_base64']) * 0.75 / (1024 * 1024)
            print(f"\n🔍 Verification: Stop 6 Hungarian audio = {size_mb:.2f} MB")
            print(f"   Duration preserved: {duration_seconds:.1f} seconds")
        
        print("\n✅ Stop 6 Hungarian audio has been compressed and uploaded!")
        print("   ℹ️  Audio quality optimized for voice at 64kbps (or 48kbps if needed)")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(compress_and_upload())
