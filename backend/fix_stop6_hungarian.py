"""
Fix Stop 6 Hungarian audio by deleting old and inserting new
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

STOP6_AUDIO_URL = "https://customer-assets.emergentagent.com/job_audio-castle-1/artifacts/ogdnh0tr_6.Hungarian.mp3"

async def fix_stop6_hungarian():
    """Fix Stop 6 Hungarian audio"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔧 Fixing Stop 6 Hungarian Audio\n")
    print("=" * 60)
    
    # Find Stop 6
    stop6 = await db.tour_stops.find_one({"stop_number": 6})
    
    if not stop6:
        print("❌ Stop 6 not found!")
        return
    
    print(f"✓ Found Stop 6: {stop6['content']['en']['title']}")
    print(f"  Stop ID: {stop6['id']}\n")
    
    try:
        # Delete old Hungarian audio if exists
        print("🗑️  Deleting old Hungarian audio...")
        result = await db.tour_audio.delete_one({
            'stop_id': stop6['id'],
            'language': 'hu'
        })
        print(f"   Deleted {result.deleted_count} old audio entry")
        
        # Download the MP3 file
        print("⬇️  Downloading new audio file...")
        req = urllib.request.Request(STOP6_AUDIO_URL)
        with urllib.request.urlopen(req, context=ssl_context) as response:
            audio_bytes = response.read()
        
        file_size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"   ✓ Downloaded: {file_size_mb:.2f} MB")
        
        # Convert to base64
        print("🔄 Converting to base64...")
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Create new audio entry
        print("➕ Creating new Hungarian audio entry...")
        audio_doc = {
            'id': str(uuid.uuid4()),
            'stop_id': stop6['id'],
            'language': 'hu',
            'audio_base64': audio_base64,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        await db.tour_audio.insert_one(audio_doc)
        
        print("✅ Successfully created new Hungarian audio for Stop 6")
        
        # Verify
        audio = await db.tour_audio.find_one({'stop_id': stop6['id'], 'language': 'hu'})
        if audio:
            size_mb = len(audio['audio_base64']) * 0.75 / (1024 * 1024)
            print(f"\n🔍 Verification: Stop 6 Hungarian audio = {size_mb:.2f} MB")
        
        print("\n✅ Stop 6 Hungarian audio has been fixed!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(fix_stop6_hungarian())
