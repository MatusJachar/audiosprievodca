"""
Minimax Audio Speech 2.6 HD Integration
High-quality TTS with Captivating Storyteller voice
"""
import os
import sys
import asyncio
import aiohttp
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
import subprocess

load_dotenv()

# MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

# Minimax API Configuration
MINIMAX_API_KEY = os.getenv('MINIMAX_API_KEY')
MINIMAX_API_URL = "https://api.minimax.io/v1/audio/synthesis"

# Voice configurations for each language with Captivating Storyteller
LANGUAGE_VOICES = {
    'hu': {
        'voice_id': 'Captivating_Storyteller',  # Or similar expressive voice
        'emotion': 'fluent',
        'name': 'Hungarian',
        'speed': 1.0
    },
    'sk': {
        'voice_id': 'Wise_Woman',  # Deep, authoritative storyteller
        'emotion': 'calm',
        'name': 'Slovak',
        'speed': 1.0
    },
    'ru': {
        'voice_id': 'Wise_Woman',  # Deep, authoritative storyteller
        'emotion': 'calm',
        'name': 'Russian',
        'speed': 1.0
    },
    'es': {
        'voice_id': 'Lively_Girl',  # Energetic, engaging storyteller
        'emotion': 'happy',
        'name': 'Spanish',
        'speed': 1.0
    },
    'zh': {
        'voice_id': 'Inspirational_Girl',  # Bright, clear storyteller
        'emotion': 'fluent',
        'name': 'Chinese',
        'speed': 1.0
    }
}

def compress_audio(input_path, output_path):
    """Compress audio with ffmpeg"""
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
    """Convert file to base64"""
    try:
        with open(file_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        print(f"  ✓ Base64 ({len(b64)} chars)")
        return b64
    except:
        return None

async def generate_minimax_audio(text, lang, voice_config, stop_num):
    """Generate audio using Minimax Speech 2.6 HD"""
    try:
        print(f"  Generating with Minimax Speech 2.6 HD...")
        print(f"  Voice: {voice_config['voice_id']}, Emotion: {voice_config['emotion']}")
        
        # Limit text to 10,000 characters (Minimax limit)
        text_chunk = text[:10000] if len(text) > 10000 else text
        
        # Prepare request payload
        payload = {
            "model": "speech-2.6-hd",  # High-definition model
            "text": text_chunk,
            "voice_id": voice_config['voice_id'],
            "emotion": voice_config['emotion'],
            "speed": voice_config['speed'],
            "format": "mp3",
            "subtitle": False
        }
        
        headers = {
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Make API request
        async with aiohttp.ClientSession() as session:
            async with session.post(MINIMAX_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    # Check if we get audio_url or direct audio
                    if 'audio_url' in result:
                        # Download audio from URL
                        async with session.get(result['audio_url']) as audio_response:
                            if audio_response.status == 200:
                                audio_data = await audio_response.read()
                                temp_file = f"/tmp/minimax_{lang}_{stop_num}.mp3"
                                with open(temp_file, 'wb') as f:
                                    f.write(audio_data)
                                print(f"  ✓ Generated ({len(audio_data)} bytes)")
                                return temp_file
                    elif 'audio' in result:
                        # Direct base64 audio
                        audio_data = base64.b64decode(result['audio'])
                        temp_file = f"/tmp/minimax_{lang}_{stop_num}.mp3"
                        with open(temp_file, 'wb') as f:
                            f.write(audio_data)
                        print(f"  ✓ Generated ({len(audio_data)} bytes)")
                        return temp_file
                    else:
                        print(f"  ✗ Unexpected response format: {result}")
                        return None
                else:
                    error = await response.text()
                    print(f"  ✗ API Error ({response.status}): {error}")
                    return None
                    
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return None

async def process_language(stop_num, lang, voice_config, content):
    """Process audio generation for one language"""
    print(f"\n  [{voice_config['name'].upper()}]")
    
    if not content or 'description' not in content:
        print(f"  ✗ No content available")
        return None
    
    text = content['description']
    audio_file = await generate_minimax_audio(text, lang, voice_config, stop_num)
    
    if audio_file:
        comp = f"/tmp/{lang}_{stop_num}_comp.mp3"
        if compress_audio(audio_file, comp):
            b64 = to_base64(comp)
            try:
                os.remove(audio_file)
                os.remove(comp)
            except:
                pass
            return b64
    
    return None

async def main():
    """Main function to regenerate all audio with Minimax"""
    
    if not MINIMAX_API_KEY:
        print("\n" + "="*70)
        print("ERROR: MINIMAX_API_KEY not found in .env file")
        print("="*70)
        print("\nPlease:")
        print("1. Get your API key from https://www.minimax.io")
        print("2. Add it to /app/backend/.env:")
        print("   MINIMAX_API_KEY=your_api_key_here")
        print("="*70)
        sys.exit(1)
    
    print("\n" + "="*70)
    print("GENERATING PREMIUM AUDIO WITH MINIMAX SPEECH 2.6 HD")
    print("Captivating Storyteller Voices for Ultimate Quality")
    print("="*70)
    print("\nVoice Configuration:")
    for lang, config in LANGUAGE_VOICES.items():
        print(f"  {config['name']:10} ({lang}): {config['voice_id']:25} [Emotion: {config['emotion']}]")
    
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
        for lang, voice_config in LANGUAGE_VOICES.items():
            # Get content for the language
            content = stop['content'].get(lang, {})
            if not content:
                content = stop['content'].get('en', {})  # Fallback to English
            
            audio_b64 = await process_language(stop_num, lang, voice_config, content)
            
            if audio_b64:
                tour_stops_collection.update_one(
                    {'_id': stop_id},
                    {'$set': {f'audio.{lang}': audio_b64}}
                )
                print(f"  ✓ Saved to database")
        
        print(f"\n  ✅ Stop {stop_num} completed!")
    
    print("\n" + "="*70)
    print("ALL MINIMAX AUDIO GENERATION COMPLETE!")
    print("="*70)
    
    # Final summary
    print("\nFinal Audio Status:")
    for stop in tour_stops_collection.find().sort('stop_number', 1):
        num = stop['stop_number']
        audio = stop.get('audio', {})
        langs = {
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
