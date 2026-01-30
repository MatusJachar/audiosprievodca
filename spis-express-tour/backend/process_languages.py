import os
import sys
import requests
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI
import subprocess
from language_data import GERMAN_CONTENT, HUNGARIAN_CONTENT, HUNGARIAN_AUDIO_URLS

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# OpenAI client
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
if not EMERGENT_LLM_KEY:
    print("Error: EMERGENT_LLM_KEY not found")
    sys.exit(1)

openai_client = OpenAI(api_key=EMERGENT_LLM_KEY)

def download_audio(url, path):
    """Download audio from URL"""
    try:
        print(f"Downloading: {url}")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        with open(path, 'wb') as f:
            f.write(r.content)
        print(f"✓ Downloaded to {path}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def compress_audio(input_path, output_path):
    """Compress audio with ffmpeg"""
    try:
        cmd = ['ffmpeg', '-y', '-i', input_path, '-codec:a', 'libmp3lame',
               '-b:a', '32k', '-ar', '22050', '-ac', '1', output_path]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        if result.returncode == 0:
            print(f"✓ Compressed to {output_path}")
            return True
        print(f"✗ FFmpeg error: {result.stderr.decode()}")
        return False
    except Exception as e:
        print(f"✗ Compression error: {e}")
        return False

def to_base64(file_path):
    """Convert file to base64"""
    try:
        with open(file_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        print(f"✓ Base64: {len(b64)} chars")
        return b64
    except Exception as e:
        print(f"✗ Base64 error: {e}")
        return None

def generate_tts(text, stop_num):
    """Generate TTS audio"""
    try:
        print(f"Generating TTS for stop {stop_num}...")
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text[:4096],  # Limit text length
            speed=1.0
        )
        temp_file = f"/tmp/tts_hu_{stop_num}.mp3"
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_bytes():
                f.write(chunk)
        print(f"✓ Generated TTS")
        return temp_file
    except Exception as e:
        print(f"✗ TTS error: {e}")
        return None

def process_hungarian_audio(stop_num):
    """Process Hungarian audio - download or generate"""
    print(f"\n{'='*50}")
    print(f"Hungarian Audio - Stop {stop_num}")
    print(f"{'='*50}")
    
    if stop_num in HUNGARIAN_AUDIO_URLS:
        # Download provided audio
        url = HUNGARIAN_AUDIO_URLS[stop_num]
        orig = f"/tmp/hu_{stop_num}_orig.mp3"
        comp = f"/tmp/hu_{stop_num}_comp.mp3"
        
        if download_audio(url, orig):
            if compress_audio(orig, comp):
                b64 = to_base64(comp)
                os.remove(orig)
                os.remove(comp)
                return b64
    else:
        # Generate TTS for stops 6-13
        if stop_num in HUNGARIAN_CONTENT:
            text = HUNGARIAN_CONTENT[stop_num]['description']
            tts_file = generate_tts(text, stop_num)
            if tts_file:
                comp = f"/tmp/hu_{stop_num}_comp.mp3"
                if compress_audio(tts_file, comp):
                    b64 = to_base64(comp)
                    os.remove(tts_file)
                    os.remove(comp)
                    return b64
    
    return None

def main():
    """Main processing function"""
    print("\n" + "="*60)
    print("ADDING GERMAN & HUNGARIAN CONTENT")
    print("="*60)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    print(f"\nFound {len(stops)} tour stops")
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        
        print(f"\n{'='*60}")
        print(f"STOP {stop_num}: {stop['content'].get('en', {}).get('title', 'Unknown')}")
        print(f"{'='*60}")
        
        # Add German content
        if stop_num in GERMAN_CONTENT:
            german = GERMAN_CONTENT[stop_num]
            print("✓ Adding German text...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.de': {
                        'title': german['title'],
                        'description': german['description']
                    }
                }}
            )
        
        # Add Hungarian content
        if stop_num in HUNGARIAN_CONTENT:
            hungarian = HUNGARIAN_CONTENT[stop_num]
            print("✓ Adding Hungarian text...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.hu': {
                        'title': hungarian['title'],
                        'description': hungarian['description']
                    }
                }}
            )
        
        # Process Hungarian audio
        hu_audio = process_hungarian_audio(stop_num)
        if hu_audio:
            print("✓ Adding Hungarian audio...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {'audio.hu': hu_audio}}
            )
        
        print(f"✓ Stop {stop_num} completed!")
    
    print("\n" + "="*60)
    print("ALL CONTENT ADDED SUCCESSFULLY!")
    print("="*60)

if __name__ == "__main__":
    main()
