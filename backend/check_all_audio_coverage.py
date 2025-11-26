from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check_all_audio():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print('COMPLETE AUDIO COVERAGE REPORT')
    print('=' * 70)
    
    languages = {
        'sk': '🇸🇰 Slovak',
        'en': '🇬🇧 English',
        'de': '🇩🇪 German',
        'pl': '🇵🇱 Polish',
        'ru': '🇷🇺 Russian',
        'es': '🇪🇸 Spanish',
        'hu': '🇭🇺 Hungarian',
        'zh': '🇨🇳 Chinese'
    }
    
    # Get all stops
    all_stops = await db.tour_stops.find().to_list(100)
    
    print(f'\nTotal Tour Stops: {len(all_stops)} (13 main + 4 legends)\n')
    
    # Check each language
    for lang_code, lang_name in languages.items():
        audio_count = 0
        missing_stops = []
        
        for stop in all_stops:
            audio = await db.tour_audio.find_one({'stop_id': stop['id'], 'language': lang_code})
            if audio:
                audio_count += 1
            else:
                stop_name = stop.get('stop_name') or f"Stop {stop.get('stop_number')}"
                missing_stops.append(stop_name)
        
        status = '✅' if audio_count == 17 else '⚠️'
        print(f'{status} {lang_name}: {audio_count}/17 stops')
        if missing_stops:
            print(f'   Missing: {", ".join(missing_stops)}')
    
    print('\n' + '=' * 70)
    
    # Summary
    total_audio = await db.tour_audio.count_documents({})
    print(f'\nTotal Audio Files in Database: {total_audio}')
    
    # Calculate completion percentage
    complete_languages = 0
    for lang_code in languages.keys():
        count = 0
        for stop in all_stops:
            audio = await db.tour_audio.find_one({'stop_id': stop['id'], 'language': lang_code})
            if audio:
                count += 1
        if count == 17:
            complete_languages += 1
    
    print(f'Complete Languages: {complete_languages}/8 ({complete_languages/8*100:.1f}%)')

asyncio.run(check_all_audio())
