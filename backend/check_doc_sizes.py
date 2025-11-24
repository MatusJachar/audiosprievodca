from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import bson

load_dotenv()

async def check_document_sizes():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    legend_stops = await db.tour_stops.find(
        {'stop_name': {'$regex': '^Legend [1-4]$'}}
    ).sort('stop_name', 1).to_list(None)
    
    print("Current Legend Document Sizes:")
    print("=" * 60)
    
    for stop in legend_stops:
        # Calculate document size
        doc_bytes = bson.BSON.encode(stop)
        size_mb = len(doc_bytes) / (1024 * 1024)
        audio_langs = list(stop.get('audio', {}).keys())
        
        print(f"\n{stop['stop_name']}:")
        print(f"  Document size: {size_mb:.2f} MB / 16.00 MB limit")
        print(f"  Audio languages: {audio_langs}")
        
        # Calculate audio sizes
        total_audio_mb = 0
        for lang in audio_langs:
            audio_b64 = stop['audio'][lang]
            audio_size_mb = len(audio_b64) * 0.75 / (1024 * 1024)  # base64 is ~1.33x larger
            total_audio_mb += audio_size_mb
            print(f"    {lang}: {audio_size_mb:.2f} MB")
        
        print(f"  Total audio: {total_audio_mb:.2f} MB")
        remaining = 16 - size_mb
        print(f"  Remaining space: {remaining:.2f} MB")

asyncio.run(check_document_sizes())
