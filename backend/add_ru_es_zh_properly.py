"""
Add Russian, Spanish, and Chinese with proper translations and audio
"""
import os
import sys
import asyncio
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from emergentintegrations.llm.openai import OpenAI, OpenAITextToSpeech
import subprocess

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
openai_client = OpenAI(api_key=EMERGENT_LLM_KEY)
tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)

LANGUAGE_CONFIG = {
    'ru': {'voice': 'onyx', 'name': 'Russian', 'lang_name': 'Russian'},
    'es': {'voice': 'nova', 'name': 'Spanish', 'lang_name': 'Spanish'},
    'zh': {'voice': 'shimmer', 'name': 'Chinese', 'lang_name': 'Chinese (Simplified)'}
}

def compress_audio(input_path, output_path):
    try:
        cmd = ['ffmpeg', '-y', '-i', input_path, '-codec:a', 'libmp3lame',
               '-b:a', '32k', '-ar', '22050', '-ac', '1', output_path,
               '-loglevel', 'error']
        subprocess.run(cmd, capture_output=True, timeout=120, check=True)
        return True
    except:
        return False

def to_base64(file_path):
    try:
        with open(file_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except:
        return None

async def translate_text(text, target_lang):
    """Translate text to target language"""
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "system",
                "content": f"You are a professional translator. Translate the following historical tour guide text to {target_lang}. Maintain the storytelling tone and historical accuracy. Only return the translation, no explanations."
            }, {
                "role": "user",
                "content": text
            }],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"  ✗ Translation error: {e}")
        return None

async def generate_audio(text, lang, voice, stop_num):
    """Generate TTS audio"""
    try:
        audio_bytes = await tts.generate_speech(
            text=text[:4096],
            model="tts-1-hd",
            voice=voice,
            speed=1.0
        )
        
        temp_file = f"/tmp/tts_{lang}_{stop_num}.mp3"
        with open(temp_file, 'wb') as f:
            f.write(audio_bytes)
        
        comp = f"/tmp/{lang}_{stop_num}_comp.mp3"
        if compress_audio(temp_file, comp):
            b64 = to_base64(comp)
            os.remove(temp_file)
            os.remove(comp)
            return b64
        return None
    except Exception as e:
        print(f"  ✗ Audio error: {e}")
        return None

async def main():
    print("\n" + "="*70)
    print("ADDING RUSSIAN, SPANISH, CHINESE - PROPERLY")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        en_content = stop['content']['en']
        
        print(f"\nStop {stop_num}: {en_content['title']}")
        
        for lang, config in LANGUAGE_CONFIG.items():
            print(f"  [{config['name']}]")
            
            # Translate title and description
            print(f"    Translating...")
            title_translated = await translate_text(en_content['title'], config['lang_name'])
            desc_translated = await translate_text(en_content['description'], config['lang_name'])
            
            if title_translated and desc_translated:
                # Save translated text
                tour_stops_collection.update_one(
                    {'_id': stop_id},
                    {'$set': {
                        f'content.{lang}': {
                            'title': title_translated,
                            'description': desc_translated
                        }
                    }}
                )
                print(f"    ✓ Text saved")
                
                # Generate audio
                print(f"    Generating audio...")
                audio_b64 = await generate_audio(desc_translated, lang, config['voice'], stop_num)
                if audio_b64:
                    tour_stops_collection.update_one(
                        {'_id': stop_id},
                        {'$set': {f'audio.{lang}': audio_b64}}
                    )
                    print(f"    ✓ Audio saved")
        
        print(f"  ✅ Stop {stop_num} complete")
    
    print("\n" + "="*70)
    print("ALL LANGUAGES COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(main())
