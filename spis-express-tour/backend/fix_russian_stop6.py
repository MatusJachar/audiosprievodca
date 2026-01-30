"""
Compress and upload Russian Stop 6 audio
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

STOP6_URL = "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/6blyq1nr_6.Russian.mp3"

async def compress_and_upload():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Compressing and Uploading Russian Stop 6\n")
    
    stop6 = await db.tour_stops.find_one({"stop_number": 6})
    
    print(f"✓ Found: {stop6['content']['en']['title']}")
    
    # Download
    print("⬇️  Downloading...")
    req = urllib.request.Request(STOP6_URL)
    with urllib.request.urlopen(req, context=ssl_context) as response:
        audio_bytes = response.read()
    
    print(f"✓ Downloaded: {len(audio_bytes) / (1024*1024):.2f} MB")
    
    # Compress
    print("🔄 Compressing audio (64kbps mono)...")
    audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
    compressed_buffer = io.BytesIO()
    audio.export(compressed_buffer, format="mp3", bitrate="64k", parameters=["-ac", "1"])
    
    compressed_bytes = compressed_buffer.getvalue()
    print(f"✓ Compressed: {len(compressed_bytes) / (1024*1024):.2f} MB")
    
    # Convert to base64
    audio_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
    
    # Delete old, insert new
    await db.tour_audio.delete_one({'stop_id': stop6['id'], 'language': 'ru'})
    
    audio_doc = {
        'id': str(uuid.uuid4()),
        'stop_id': stop6['id'],
        'language': 'ru',
        'audio_base64': audio_base64,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    await db.tour_audio.insert_one(audio_doc)
    
    print("✅ Russian Stop 6 audio uploaded successfully!")

asyncio.run(compress_and_upload())
