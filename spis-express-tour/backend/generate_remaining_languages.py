import os
import sys
import asyncio
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAITextToSpeech
import subprocess

load_dotenv()

# MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# Initialize TTS
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

# Best storyteller voices for each language
LANGUAGE_CONFIG = {
    'sk': {
        'voice': 'onyx',      # Slovak - deep, authoritative storyteller
        'name': 'Slovak'
    },
    'ru': {
        'voice': 'onyx',      # Russian - deep, authoritative storyteller
        'name': 'Russian'
    },
    'es': {
        'voice': 'nova',      # Spanish - energetic, engaging storyteller
        'name': 'Spanish'
    },
    'zh': {
        'voice': 'shimmer',   # Chinese - bright, clear storyteller
        'name': 'Chinese'
    }
}

def compress_audio(input_path, output_path):
    try:
        cmd = ['ffmpeg', '-y', '-i', input_path, '-codec:a', 'libmp3lame',
               '-b:a', '32k', '-ar', '22050', '-ac', '1', output_path,
               '-loglevel', 'error']
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        if result.returncode == 0:
            size = os.path.getsize(output_path)
            print(f"  ✓ Compressed ({size} bytes)")
            return True
        return False
    except Exception as e:
        print(f"  ✗ Compression error: {e}")
        return False

def to_base64(file_path):
    try:
        with open(file_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        print(f"  ✓ Base64 ({len(b64)} chars)")
        return b64
    except:
        return None

async def generate_tts_audio(text, lang, voice, stop_num):
    try:
        print(f"  Generating humanized storyteller audio...")
        
        # Limit text to 4096 characters
        text_chunk = text[:4096] if len(text) > 4096 else text
        
        # Generate with storyteller voice
        audio_bytes = await tts.generate_speech(
            text=text_chunk,
            model="tts-1-hd",  # Use HD model for better quality
            voice=voice,
            speed=1.0
        )
        
        temp_file = f"/tmp/tts_{lang}_{stop_num}.mp3"
        with open(temp_file, 'wb') as f:
            f.write(audio_bytes)
        
        size = os.path.getsize(temp_file)
        print(f"  ✓ Generated ({size} bytes, voice: {voice})")
        return temp_file
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

async def main():
    print("\n" + "="*70)
    print("GENERATING HUMANIZED STORYTELLER AUDIO")
    print("Using OpenAI TTS-1-HD for Premium Quality")
    print("="*70)
    print("\nVoice Selection:")
    for lang, config in LANGUAGE_CONFIG.items():
        print(f"  {config['name']:10} ({lang}): {config['voice']:10} - Storyteller voice")
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    print(f"\nProcessing {len(stops)} tour stops...")
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        title = stop['content'].get('en', {}).get('title', 'Unknown')
        
        print(f"\n{'='*70}")
        print(f"STOP {stop_num}: {title}")
        print(f"{'='*70}")
        
        # Process each language
        for lang, config in LANGUAGE_CONFIG.items():
            print(f"\n  [{config['name'].upper()}]")
            
            # Get text from content
            content = stop['content'].get(lang, {})
            if not content or 'description' not in content:
                # Fallback to English if language not available
                content = stop['content'].get('en', {})
            
            if content and 'description' in content:
                text = content['description']
                tts_file = await generate_tts_audio(text, lang, config['voice'], stop_num)
                
                if tts_file:
                    comp = f"/tmp/{lang}_{stop_num}_comp.mp3"
                    if compress_audio(tts_file, comp):
                        b64 = to_base64(comp)
                        if b64:
                            tour_stops_collection.update_one(
                                {'_id': stop_id},
                                {'$set': {f'audio.{lang}': b64}}
                            )
                            print(f"  ✓ Saved to database")
                        try:
                            os.remove(tts_file)
                            os.remove(comp)
                        except:
                            pass
            else:
                print(f"  ✗ No content available")
        
        print(f"\n  ✅ Stop {stop_num} completed!")
    
    print("\n" + "="*70)
    print("ALL LANGUAGES COMPLETE!")
    print("="*70)
    
    # Final summary
    print("\n" + "="*70)
    print("COMPLETE AUDIO STATUS - ALL 8 LANGUAGES")
    print("="*70)
    for stop in tour_stops_collection.find().sort('stop_number', 1):
        num = stop['stop_number']
        audio = stop.get('audio', {})
        langs = {
            'EN': '✓' if 'en' in audio else '✗',
            'PL': '✓' if 'pl' in audio else '✗',
            'DE': '✓' if 'de' in audio else '✗',
            'HU': '✓' if 'hu' in audio else '✗',
            'SK': '✓' if 'sk' in audio else '✗',
            'RU': '✓' if 'ru' in audio else '✗',
            'ES': '✓' if 'es' in audio else '✗',
            'ZH': '✓' if 'zh' in audio else '✗',
        }
        print(f'Stop {num:2d}: {" ".join([f"{k}={v}" for k, v in langs.items()])}')
    print("="*70)

if __name__ == "__main__":
    asyncio.run(main())
