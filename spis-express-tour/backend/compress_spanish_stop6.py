"""
Compress Spanish Stop 6 audio
Reduce bitrate to fit MongoDB limit while preserving full duration
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

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

STOP6_SPANISH_URL = "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ysyo48r5_6.Spanish.mp3"

async def compress_and_upload_spanish_stop6():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Compressing Spanish Stop 6 Audio\n")
    print("=" * 60)
    
    # Find Stop 6
    stop6 = await db.tour_stops.find_one({"stop_number": 6})
    
    if not stop6:
        print("❌ Stop 6 not found!")
        return
    
    print(f"✓ Found Stop 6: {stop6['content']['en']['title']}")
    print(f"  Stop ID: {stop6['id']}\n")
    
    try:
        # Download
        print(f"⬇️  Downloading Spanish audio...")
        req = urllib.request.Request(STOP6_SPANISH_URL)
        with urllib.request.urlopen(req, context=ssl_context) as response:
            audio_bytes = response.read()
        
        original_size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"✓ Downloaded: {original_size_mb:.2f} MB")
        
        # Load audio
        print(f"🎵 Loading audio for compression...")
        audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
        
        duration_seconds = len(audio) / 1000.0
        print(f"✓ Duration: {duration_seconds:.1f} seconds")
        print(f"✓ Original bitrate: ~{(original_size_mb * 8 * 1024) / duration_seconds:.0f} kbps")
        
        # Compress to 64kbps mono (optimized for voice)
        print(f"🔄 Compressing to 64kbps mono (preserving full duration)...")
        
        compressed_buffer = io.BytesIO()
        audio.export(
            compressed_buffer,
            format="mp3",
            bitrate="64k",
            parameters=["-ac", "1"]  # Mono
        )
        
        compressed_bytes = compressed_buffer.getvalue()
        compressed_size_mb = len(compressed_bytes) / (1024 * 1024)
        
        print(f"✓ Compressed: {compressed_size_mb:.2f} MB")
        print(f"✓ Reduction: {((original_size_mb - compressed_size_mb) / original_size_mb * 100):.1f}%")
        print(f"✓ New bitrate: ~{(compressed_size_mb * 8 * 1024) / duration_seconds:.0f} kbps")
        
        # Check if it fits
        base64_size_mb = (len(compressed_bytes) * 4 / 3) / (1024 * 1024)
        print(f"✓ Base64 size: {base64_size_mb:.2f} MB")
        
        if base64_size_mb > 15:
            print(f"⚠️  Still too large, reducing to 48kbps...")
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
            print(f"✓ Further compressed: {compressed_size_mb:.2f} MB (base64: {base64_size_mb:.2f} MB)")
        
        # Convert to base64
        print(f"🔄 Converting to base64...")
        audio_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
        
        # Delete old if exists
        await db.tour_audio.delete_one({'stop_id': stop6['id'], 'language': 'es'})
        
        # Insert new
        print(f"⬆️  Uploading to database...")
        audio_doc = {
            'id': str(uuid.uuid4()),
            'stop_id': stop6['id'],
            'language': 'es',
            'audio_base64': audio_base64,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.tour_audio.insert_one(audio_doc)
        
        print(f"✅ Successfully uploaded compressed Spanish audio for Stop 6")
        print(f"   Duration preserved: {duration_seconds:.1f} seconds")
        
        print("\n" + "=" * 60)
        print("✅ Spanish Stop 6 compression complete!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

asyncio.run(compress_and_upload_spanish_stop6())
