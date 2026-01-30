import os
import sys
import requests
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI
import subprocess
from language_data import GERMAN_CONTENT, HUNGARIAN_CONTENT, HUNGARIAN_AUDIO_URLS, GERMAN_AUDIO_URLS

load_dotenv()

# MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# OpenAI
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
if not EMERGENT_LLM_KEY:
    print("Error: EMERGENT_LLM_KEY not found")
    sys.exit(1)

openai_client = OpenAI(api_key=EMERGENT_LLM_KEY)

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

def generate_tts(text, lang, stop_num):
    try:
        print(f"  Generating TTS...")
        # Use appropriate voice for language
        voice = "alloy" if lang == "hu" else "onyx"  # Female for Hungarian, Male for German
        
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text[:4096],
            speed=1.0
        )
        temp_file = f"/tmp/tts_{lang}_{stop_num}.mp3"
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_bytes():
                f.write(chunk)
        size = os.path.getsize(temp_file)
        print(f"  ✓ TTS generated ({size} bytes)")
        return temp_file
    except Exception as e:
        print(f"  ✗ TTS error: {e}")
        return None

def process_audio(stop_num, lang, audio_urls_dict, content_dict):
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
            tts_file = generate_tts(text, lang, stop_num)
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

def main():
    print("\n" + "="*70)
    print("PROCESSING GERMAN & HUNGARIAN AUDIO FOR ALL 13 STOPS")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    print(f"\nFound {len(stops)} tour stops in database")
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        
        print(f"\n{'='*70}")
        print(f"STOP {stop_num}: {stop['content'].get('en', {}).get('title', 'Unknown')}")
        print(f"{'='*70}")
        
        # Process Hungarian audio
        hu_audio = process_audio(stop_num, 'hu', HUNGARIAN_AUDIO_URLS, HUNGARIAN_CONTENT)
        if hu_audio:
            print(f"  ✓ Saving Hungarian audio to database...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {'audio.hu': hu_audio}}
            )
        
        # Process German audio
        de_audio = process_audio(stop_num, 'de', GERMAN_AUDIO_URLS, GERMAN_CONTENT)
        if de_audio:
            print(f"  ✓ Saving German audio to database...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {'audio.de': de_audio}}
            )
        
        print(f"\n  ✅ Stop {stop_num} completed!")
    
    print("\n" + "="*70)
    print("ALL AUDIO PROCESSING COMPLETE!")
    print("="*70)
    
    # Summary
    print("\nSummary:")
    for stop in tour_stops_collection.find().sort('stop_number', 1):
        stop_num = stop['stop_number']
        has_hu = 'hu' in stop.get('audio', {})
        has_de = 'de' in stop.get('audio', {})
        print(f"  Stop {stop_num:2d}: HU={'✓' if has_hu else '✗'}  DE={'✓' if has_de else '✗'}")

if __name__ == "__main__":
    main()
