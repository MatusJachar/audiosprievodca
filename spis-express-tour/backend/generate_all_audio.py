import os
import sys
import asyncio
import requests
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAITextToSpeech
import subprocess
from language_data import GERMAN_CONTENT, HUNGARIAN_CONTENT, HUNGARIAN_AUDIO_URLS, GERMAN_AUDIO_URLS

load_dotenv()

# MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# Initialize TTS with Emergent LLM key
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
if not EMERGENT_LLM_KEY:
    print("Error: EMERGENT_LLM_KEY not found")
    sys.exit(1)

tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

# Storyteller voices for each language (best OpenAI voices for narration)
LANGUAGE_VOICES = {
    'hu': 'fable',    # Hungarian - expressive storytelling
    'sk': 'onyx',     # Slovak - deep, authoritative
    'ru': 'onyx',     # Russian - deep, authoritative
    'es': 'nova',     # Spanish - energetic, engaging
    'zh': 'shimmer',  # Chinese - bright, clear
}

def download_audio(url, path):
    try:
        print(f"  Downloading...")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        with open(path, 'wb') as f:
            f.write(r.content)
        print(f"  ✓ Downloaded ({len(r.content)} bytes)")
        return True
    except Exception as e:
        print(f"  ✗ Download error: {e}")
        return False

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
        print(f"  ✗ FFmpeg error")
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
    except Exception as e:
        print(f"  ✗ Base64 error: {e}")
        return None

async def generate_tts_audio(text, lang, stop_num):
    try:
        print(f"  Generating TTS ({lang})...")
        
        # Get appropriate storyteller voice for language
        voice = LANGUAGE_VOICES.get(lang, 'fable')
        
        # Limit text to 4096 characters (OpenAI limit)
        text_chunk = text[:4096] if len(text) > 4096 else text
        
        # Generate speech with storyteller voice
        audio_bytes = await tts.generate_speech(
            text=text_chunk,
            model="tts-1",  # Standard quality for faster generation
            voice=voice,
            speed=1.0
        )
        
        # Save to temporary file
        temp_file = f"/tmp/tts_{lang}_{stop_num}.mp3"
        with open(temp_file, 'wb') as f:
            f.write(audio_bytes)
        
        size = os.path.getsize(temp_file)
        print(f"  ✓ TTS generated ({size} bytes, voice: {voice})")
        return temp_file
    except Exception as e:
        print(f"  ✗ TTS error: {e}")
        return None

async def process_audio(stop_num, lang, audio_urls_dict, content_dict):
    print(f"\n  [{lang.upper()}] Stop {stop_num}")
    
    if stop_num in audio_urls_dict:
        # Download provided audio
        url = audio_urls_dict[stop_num]
        orig = f"/tmp/{lang}_{stop_num}_orig.mp3"
        comp = f"/tmp/{lang}_{stop_num}_comp.mp3"
        
        if download_audio(url, orig):
            if compress_audio(orig, comp):
                b64 = to_base64(comp)
                try:
                    os.remove(orig)
                    os.remove(comp)
                except:
                    pass
                return b64
    else:
        # Generate TTS
        if stop_num in content_dict:
            text = content_dict[stop_num]['description']
            tts_file = await generate_tts_audio(text, lang, stop_num)
            if tts_file:
                comp = f"/tmp/{lang}_{stop_num}_comp.mp3"
                if compress_audio(tts_file, comp):
                    b64 = to_base64(comp)
                    try:
                        os.remove(tts_file)
                        os.remove(comp)
                    except:
                        pass
                    return b64
    
    return None

async def main():
    print("\n" + "="*70)
    print("GENERATING AI STORYTELLER AUDIO FOR ALL LANGUAGES")
    print("="*70)
    print("\nVoice Selection:")
    for lang, voice in LANGUAGE_VOICES.items():
        print(f"  {lang.upper()}: {voice}")
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    print(f"\nFound {len(stops)} tour stops in database")
    
    # Languages that need TTS generation
    languages_to_process = {
        'hu': (HUNGARIAN_AUDIO_URLS, HUNGARIAN_CONTENT),  # Stops 6-13 need TTS
    }
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        
        print(f"\n{'='*70}")
        print(f"STOP {stop_num}: {stop['content'].get('en', {}).get('title', 'Unknown')}")
        print(f"{'='*70}")
        
        # Process each language
        for lang, (audio_urls, content) in languages_to_process.items():
            audio = await process_audio(stop_num, lang, audio_urls, content)
            if audio:
                print(f"  ✓ Saving {lang.upper()} audio to database...")
                tour_stops_collection.update_one(
                    {'_id': stop_id},
                    {'$set': {f'audio.{lang}': audio}}
                )
        
        print(f"\n  ✅ Stop {stop_num} completed!")
    
    print("\n" + "="*70)
    print("ALL AUDIO GENERATION COMPLETE!")
    print("="*70)
    
    # Summary
    print("\nSummary:")
    for stop in tour_stops_collection.find().sort('stop_number', 1):
        stop_num = stop['stop_number']
        has_hu = 'hu' in stop.get('audio', {})
        has_de = 'de' in stop.get('audio', {})
        has_en = 'en' in stop.get('audio', {})
        has_pl = 'pl' in stop.get('audio', {})
        print(f"  Stop {stop_num:2d}: EN={'✓' if has_en else '✗'}  PL={'✓' if has_pl else '✗'}  DE={'✓' if has_de else '✗'}  HU={'✓' if has_hu else '✗'}")

if __name__ == "__main__":
    asyncio.run(main())
