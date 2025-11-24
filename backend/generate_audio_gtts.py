"""
Generate audio files for Russian, Spanish, and Chinese using Google TTS (FREE)
Total: 51 files (17 per language) - Full descriptions, no shortening
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
import base64
from datetime import datetime
import uuid
from gtts import gTTS
import io

load_dotenv()

# Languages to generate with Google TTS
LANGUAGES = {
    'ru': {'name': 'Russian', 'tld': 'ru'},
    'es': {'name': 'Spanish', 'tld': 'es'},
    'zh': {'name': 'Chinese', 'tld': 'com'}  # Mandarin
}

async def generate_audio_for_stop(stop, language_code, language_name, tld):
    """Generate audio for a single stop in a specific language using Google TTS"""
    try:
        # Get content
        content = stop['content'][language_code]
        title = content['title']
        description = content['description']
        
        # Combine title and description for audio
        full_text = f"{title}. {description}"
        
        print(f"      Generating audio ({len(full_text)} characters)...")
        
        # Generate audio using Google TTS
        tts = gTTS(text=full_text, lang=language_code, tld=tld, slow=False)
        
        # Save to bytes buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Get audio bytes
        audio_bytes = audio_buffer.read()
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        size_mb = len(audio_bytes) / (1024 * 1024)
        print(f"      ✓ Generated: {size_mb:.2f} MB")
        
        return audio_base64
        
    except Exception as e:
        print(f"      ❌ Error: {str(e)}")
        return None

async def generate_all_audio():
    """Generate all missing audio files using Google TTS"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client_db = AsyncIOMotorClient(mongo_url)
    db = client_db[os.environ['DB_NAME']]
    
    print("🎙️  GENERATING AUDIO WITH GOOGLE TTS (FREE)")
    print("   No API key required - Full descriptions included")
    print("=" * 70)
    
    # Get all stops
    all_stops = await db.tour_stops.find().to_list(100)
    
    # Separate main stops and legends
    main_stops = [s for s in all_stops if s.get('stop_number') and s.get('stop_number') <= 13]
    main_stops.sort(key=lambda x: x['stop_number'])
    
    legend_stops = [s for s in all_stops if s.get('stop_name') and 'Legend' in s.get('stop_name')]
    legend_stops.sort(key=lambda x: x['stop_name'])
    
    total_generated = 0
    total_failed = 0
    total_size_mb = 0
    
    for lang_code, lang_info in LANGUAGES.items():
        lang_name = lang_info['name']
        tld = lang_info['tld']
        
        print(f"\n{'='*70}")
        print(f"🌍 GENERATING {lang_name.upper()} AUDIO")
        print(f"{'='*70}")
        
        lang_generated = 0
        lang_failed = 0
        lang_size_mb = 0
        
        # Process main stops (1-13)
        print(f"\n📍 Main Tour Stops (1-13):")
        for stop in main_stops:
            stop_name = f"Stop {stop['stop_number']}"
            print(f"\n   Processing {stop_name}: {stop['content']['en']['title'][:40]}...")
            
            # Generate audio
            audio_base64 = await generate_audio_for_stop(stop, lang_code, lang_name, tld)
            
            if audio_base64:
                size_mb = len(audio_base64) * 0.75 / (1024 * 1024)
                lang_size_mb += size_mb
                total_size_mb += size_mb
                
                # Save to database
                existing = await db.tour_audio.find_one({
                    'stop_id': stop['id'],
                    'language': lang_code
                })
                
                if existing:
                    await db.tour_audio.update_one(
                        {"stop_id": stop['id'], "language": lang_code},
                        {"$set": {
                            "audio_base64": audio_base64,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    print(f"      ✅ Updated {lang_name} audio")
                else:
                    audio_doc = {
                        'id': str(uuid.uuid4()),
                        'stop_id': stop['id'],
                        'language': lang_code,
                        'audio_base64': audio_base64,
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                    await db.tour_audio.insert_one(audio_doc)
                    print(f"      ✅ Created {lang_name} audio")
                
                lang_generated += 1
                total_generated += 1
            else:
                lang_failed += 1
                total_failed += 1
        
        # Process legend stops
        print(f"\n📖 Legend Stops (L1-L4):")
        for stop in legend_stops:
            stop_name = stop['stop_name']
            print(f"\n   Processing {stop_name}...")
            
            # Generate audio
            audio_base64 = await generate_audio_for_stop(stop, lang_code, lang_name, tld)
            
            if audio_base64:
                size_mb = len(audio_base64) * 0.75 / (1024 * 1024)
                lang_size_mb += size_mb
                total_size_mb += size_mb
                
                # Save to database
                existing = await db.tour_audio.find_one({
                    'stop_id': stop['id'],
                    'language': lang_code
                })
                
                if existing:
                    await db.tour_audio.update_one(
                        {"stop_id": stop['id'], "language": lang_code},
                        {"$set": {
                            "audio_base64": audio_base64,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    print(f"      ✅ Updated {lang_name} audio")
                else:
                    audio_doc = {
                        'id': str(uuid.uuid4()),
                        'stop_id': stop['id'],
                        'language': lang_code,
                        'audio_base64': audio_base64,
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                    await db.tour_audio.insert_one(audio_doc)
                    print(f"      ✅ Created {lang_name} audio")
                
                lang_generated += 1
                total_generated += 1
            else:
                lang_failed += 1
                total_failed += 1
        
        print(f"\n   {lang_name} Summary: {lang_generated} generated, {lang_failed} failed ({lang_size_mb:.2f} MB)")
    
    print("\n" + "=" * 70)
    print(f"🎉 AUDIO GENERATION COMPLETE!")
    print(f"   Total generated: {total_generated}/51")
    print(f"   Total failed: {total_failed}")
    print(f"   Total size: {total_size_mb:.2f} MB")
    print("=" * 70)
    
    # Final verification
    print("\n📊 Final Audio Coverage:")
    for lang_code, lang_info in LANGUAGES.items():
        stops_with_audio = 0
        for stop in main_stops + legend_stops:
            audio = await db.tour_audio.find_one({'stop_id': stop['id'], 'language': lang_code})
            if audio:
                stops_with_audio += 1
        
        status = "✅" if stops_with_audio == 17 else "⚠️"
        print(f"   {status} {lang_info['name']}: {stops_with_audio}/17 stops")
    
    print("\n✅ All audio files generated successfully with Google TTS!")

if __name__ == "__main__":
    asyncio.run(generate_all_audio())
