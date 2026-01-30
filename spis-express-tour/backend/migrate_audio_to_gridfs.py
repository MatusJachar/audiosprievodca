"""
Migrate audio storage to GridFS to handle files larger than 16MB MongoDB document limit
This script moves all audio data from tour_stops collection to GridFS
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import asyncio
import os
from dotenv import load_dotenv
import base64
import gridfs
from bson.objectid import ObjectId

load_dotenv()

async def migrate_to_gridfs():
    """Migrate all audio data to GridFS"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    fs = AsyncIOMotorGridFSBucket(db)
    
    print("🔄 Starting Audio Migration to GridFS\n")
    print("=" * 60)
    
    # Get all tour stops
    stops = await db.tour_stops.find({}).to_list(None)
    
    print(f"Found {len(stops)} tour stops to process\n")
    
    migrated_count = 0
    skipped_count = 0
    
    for stop in stops:
        stop_name = stop.get('stop_name') or f"Stop {stop.get('stop_number', 'Unknown')}"
        audio_dict = stop.get('audio', {})
        
        if not audio_dict:
            print(f"⏭️  Skipping {stop_name} - No audio data")
            skipped_count += 1
            continue
        
        print(f"\n📦 Processing: {stop_name}")
        print(f"   Audio languages: {list(audio_dict.keys())}")
        
        # Create audio references dictionary
        audio_refs = {}
        
        for lang, audio_base64 in audio_dict.items():
            try:
                # Decode base64 to bytes
                audio_bytes = base64.b64decode(audio_base64)
                size_mb = len(audio_bytes) / (1024 * 1024)
                
                # Upload to GridFS
                filename = f"{stop['id']}_{lang}.mp3"
                file_id = await fs.upload_from_stream(
                    filename,
                    audio_bytes,
                    metadata={
                        'stop_id': stop['id'],
                        'language': lang,
                        'content_type': 'audio/mpeg'
                    }
                )
                
                audio_refs[lang] = str(file_id)
                print(f"   ✓ Uploaded {lang} audio to GridFS ({size_mb:.2f} MB) - ID: {file_id}")
                
            except Exception as e:
                print(f"   ❌ Error migrating {lang} audio: {str(e)}")
                continue
        
        # Update tour stop with GridFS references instead of base64 data
        if audio_refs:
            await db.tour_stops.update_one(
                {"id": stop['id']},
                {
                    "$set": {"audio_gridfs": audio_refs},
                    "$unset": {"audio": ""}  # Remove old base64 audio field
                }
            )
            print(f"   ✅ Updated {stop_name} with GridFS references")
            migrated_count += 1
    
    print("\n" + "=" * 60)
    print(f"✨ Migration completed!")
    print(f"   Migrated: {migrated_count} stops")
    print(f"   Skipped: {skipped_count} stops")
    print("\n🔍 Verifying migration...\n")
    
    # Verify migration
    stops_after = await db.tour_stops.find({}).to_list(None)
    for stop in stops_after:
        stop_name = stop.get('stop_name') or f"Stop {stop.get('stop_number', 'Unknown')}"
        audio_gridfs = stop.get('audio_gridfs', {})
        old_audio = stop.get('audio', {})
        
        if audio_gridfs:
            print(f"✅ {stop_name}: {len(audio_gridfs)} audio files in GridFS")
        elif old_audio:
            print(f"⚠️  {stop_name}: Still has old base64 audio!")
        else:
            print(f"⏭️  {stop_name}: No audio")

if __name__ == "__main__":
    asyncio.run(migrate_to_gridfs())
