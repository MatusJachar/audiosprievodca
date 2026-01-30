"""
Migrate audio storage to separate collection to handle MongoDB 16MB document limit
This moves all audio data from tour_stops.audio to a new tour_audio collection
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import base64
from datetime import datetime
import uuid

load_dotenv()

async def migrate_audio_to_separate_collection():
    """Migrate all audio data to separate collection"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔄 Starting Audio Migration to Separate Collection\n")
    print("=" * 60)
    
    # Get all tour stops
    stops = await db.tour_stops.find({}).to_list(None)
    
    print(f"Found {len(stops)} tour stops to process\n")
    
    migrated_audio_count = 0
    skipped_stops = 0
    
    for stop in stops:
        stop_name = stop.get('stop_name') or f"Stop {stop.get('stop_number', 'Unknown')}"
        audio_dict = stop.get('audio', {})
        
        if not audio_dict:
            print(f"⏭️  Skipping {stop_name} - No audio data")
            skipped_stops += 1
            continue
        
        print(f"\n📦 Processing: {stop_name}")
        print(f"   Audio languages: {list(audio_dict.keys())}")
        
        for lang, audio_base64 in audio_dict.items():
            try:
                # Check if this audio already exists in tour_audio collection
                existing = await db.tour_audio.find_one({
                    'stop_id': stop['id'],
                    'language': lang
                })
                
                if existing:
                    print(f"   ⏭️  {lang} audio already in tour_audio collection")
                    continue
                
                size_mb = len(audio_base64) * 0.75 / (1024 * 1024)
                
                # Create new audio document
                audio_doc = {
                    'id': str(uuid.uuid4()),
                    'stop_id': stop['id'],
                    'language': lang,
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                # Insert into tour_audio collection
                await db.tour_audio.insert_one(audio_doc)
                
                print(f"   ✅ Migrated {lang} audio ({size_mb:.2f} MB) to tour_audio collection")
                migrated_audio_count += 1
                
            except Exception as e:
                print(f"   ❌ Error migrating {lang} audio: {str(e)}")
                continue
        
        # Remove audio field from tour_stop (keep the document lightweight)
        await db.tour_stops.update_one(
            {"id": stop['id']},
            {"$unset": {"audio": ""}}
        )
        print(f"   🗑️  Removed audio field from {stop_name} document")
    
    print("\n" + "=" * 60)
    print(f"✨ Migration completed!")
    print(f"   Migrated audio files: {migrated_audio_count}")
    print(f"   Skipped stops (no audio): {skipped_stops}")
    
    # Create index for faster queries
    print("\n📊 Creating indexes...")
    await db.tour_audio.create_index([("stop_id", 1), ("language", 1)], unique=True)
    print("   ✅ Created compound index on stop_id + language")
    
    print("\n🔍 Verifying migration...\n")
    
    # Verify migration
    audio_count = await db.tour_audio.count_documents({})
    print(f"Total audio files in tour_audio collection: {audio_count}")
    
    # Group by stop
    pipeline = [
        {"$group": {
            "_id": "$stop_id",
            "languages": {"$push": "$language"},
            "count": {"$sum": 1}
        }},
        {"$lookup": {
            "from": "tour_stops",
            "localField": "_id",
            "foreignField": "id",
            "as": "stop_info"
        }}
    ]
    
    results = await db.tour_audio.aggregate(pipeline).to_list(None)
    
    print("\nAudio files per stop:")
    for result in results:
        if result['stop_info']:
            stop_info = result['stop_info'][0]
            stop_name = stop_info.get('stop_name') or f"Stop {stop_info.get('stop_number')}"
            print(f"  {stop_name}: {result['count']} files - {sorted(result['languages'])}")
    
    print("\n✅ Migration successful! Audio data moved to separate collection.")

if __name__ == "__main__":
    asyncio.run(migrate_audio_to_separate_collection())
