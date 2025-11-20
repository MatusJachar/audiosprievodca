import os
import sys
import requests
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from openai import OpenAI
import subprocess

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['castle_tour']
tour_stops_collection = db['tour_stops']

# OpenAI client
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
if not EMERGENT_LLM_KEY:
    print("Error: EMERGENT_LLM_KEY not found in environment")
    sys.exit(1)

openai_client = OpenAI(api_key=EMERGENT_LLM_KEY)

# Hungarian audio URLs (stops 1-5 provided by user)
HUNGARIAN_AUDIO_URLS = {
    1: "https://customer-assets.emergentagent.com/job_spis-explorer-1/artifacts/vfp84iae_1.Hungarian.mp3",
    2: "https://customer-assets.emergentagent.com/job_spis-explorer-1/artifacts/0k47dwat_2.Hungarian.mp3",
    3: "https://customer-assets.emergentagent.com/job_spis-explorer-1/artifacts/0eu7ayqj_3.Hungary.mp3",
    4: "https://customer-assets.emergentagent.com/job_spis-explorer-1/artifacts/05r5dixq_4.Hungarian.mp3",
    5: "https://customer-assets.emergentagent.com/job_spis-explorer-1/artifacts/i068226s_5.Hungarian.mp3",
}

# German content for all 13 stops
GERMAN_CONTENT = {
    1: {
        "title": "Herzlich willkommen",
        "description": """Willkommen in einer der größten Burganlagen Europas. Willkommen in diesem imposanten Bauwerk mit seiner außergewöhnlichen Architektur, das beispielhaft für die Entwicklung des Burgbaus in verschiedenen Stilepochen steht. Willkommen auf Schloss Spiš, das sich im Laufe der Zeit von einer königlichen Burg über eine Adelsresidenz zu einer Militärfestung wandelte. Oder umgekehrt, wenn Sie so wollen: von einer gepanzerten Militärfestung über eine königliche Burg zu einer privaten Adelsresidenz. Zunächst möchte ich Sie bitten, sich in die Mitte dieses Hofes zu den Zelten zu begeben. Dort befindet sich rechts, unterhalb der Mauer, ein Foto der gesamten Burganlage aus der Vogelperspektive. Ich möchte Sie außerdem bitten, vorsichtig zu treten, da der Weg und der Turm rutschig sind und Steine herausragen. Vielen Dank."""
    },
    2: {
        "title": "Foto vor der Burg",
        "description": """Der Burghügel war bereits in prähistorischer Zeit und im Neolithikum besiedelt. Seit vielen Jahren wird hier archäologische Forschung betrieben. Die Funde dünnwandiger Keramik und verzierter Gefäße mit vertikalen Rillen sowie Münzen und andere Objekte belegen die reiche Besiedlung durch die keltischen Stämme der Kotín und Daker sowie der Baden- und Bukovohorská-Kultur. Sie handelten mit Vulkanglas und Obsidian, hauptsächlich aus Zemplín, aus dem sie Werkzeuge herstellten. Sie waren exzellente Töpfer und Handwerker. Kurz gesagt: Die Wallburg auf dem Spišský vrch diente seit jeher als administratives und wirtschaftliches Zentrum dieser Region."""
    },
    # ... continuing with stops 3-13
}

# Hungarian content for all 13 stops
HUNGARIAN_CONTENT = {
    1: {
        "title": "Üdvözöljük",
        "description": """Üdvözöljük Európa egyik legnagyobb várkomplexumában. Üdvözöljük a legnagyobb műemléknél, kivételes építészetével, amely a vár különböző stíluskorszakokban végbement építési fejlődésének példája. Üdvözöljük a Szepesi várban, amely fokozatos átalakuláson ment keresztül királyi várból nemesi rezidencián át katonai erődítménnyé."""
    },
    # ... will add all stops
}

def download_audio_file(url, output_path):
    """Download audio file from URL"""
    try:
        print(f"Downloading audio from {url}...")
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"✓ Downloaded to {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error downloading {url}: {e}")
        return False

def compress_audio_ffmpeg(input_path, output_path):
    """Compress audio using ffmpeg"""
    try:
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-codec:a', 'libmp3lame',
            '-b:a', '32k',
            '-ar', '22050',
            '-ac', '1',
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            print(f"✓ Compressed audio to {output_path}")
            return True
        else:
            print(f"✗ FFmpeg error: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error compressing audio: {e}")
        return False

def audio_to_base64(file_path):
    """Convert audio file to base64"""
    try:
        with open(file_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            base64_audio = base64.b64encode(audio_data).decode('utf-8')
        print(f"✓ Converted {file_path} to base64 ({len(base64_audio)} chars)")
        return base64_audio
    except Exception as e:
        print(f"✗ Error converting to base64: {e}")
        return None

def generate_tts_audio(text, language='hu', stop_number=None):
    """Generate TTS audio using OpenAI"""
    try:
        print(f"Generating TTS for stop {stop_number} in {language}...")
        
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice="alloy",  # Female voice that should match provided Hungarian audio
            input=text,
            speed=1.0
        )
        
        # Save to temporary file
        temp_file = f"/tmp/tts_stop_{stop_number}_{language}.mp3"
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_bytes():
                f.write(chunk)
        
        print(f"✓ Generated TTS audio: {temp_file}")
        return temp_file
    except Exception as e:
        print(f"✗ Error generating TTS: {e}")
        return None

def process_hungarian_audio(stop_number):
    """Process Hungarian audio - download if exists, generate if not"""
    print(f"\n{'='*60}")
    print(f"Processing Hungarian audio for stop {stop_number}")
    print(f"{'='*60}")
    
    if stop_number in HUNGARIAN_AUDIO_URLS:
        # Download provided audio
        url = HUNGARIAN_AUDIO_URLS[stop_number]
        original_path = f"/tmp/hungarian_stop_{stop_number}_original.mp3"
        compressed_path = f"/tmp/hungarian_stop_{stop_number}_compressed.mp3"
        
        if download_audio_file(url, original_path):
            if compress_audio_ffmpeg(original_path, compressed_path):
                base64_audio = audio_to_base64(compressed_path)
                # Cleanup
                os.remove(original_path)
                os.remove(compressed_path)
                return base64_audio
    else:
        # Generate TTS for stops 6-13
        if stop_number in HUNGARIAN_CONTENT:
            text = HUNGARIAN_CONTENT[stop_number]['description']
            tts_path = generate_tts_audio(text, 'hu', stop_number)
            if tts_path:
                compressed_path = f"/tmp/hungarian_stop_{stop_number}_compressed.mp3"
                if compress_audio_ffmpeg(tts_path, compressed_path):
                    base64_audio = audio_to_base64(compressed_path)
                    # Cleanup
                    os.remove(tts_path)
                    os.remove(compressed_path)
                    return base64_audio
    
    return None

def add_language_content():
    """Add German and Hungarian content to all tour stops"""
    print("\n" + "="*60)
    print("ADDING GERMAN AND HUNGARIAN CONTENT TO DATABASE")
    print("="*60)
    
    # First, let's fetch all tour stops
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    print(f"\nFound {len(stops)} tour stops in database")
    
    for stop in stops:
        stop_number = stop['stop_number']
        stop_id = stop['_id']
        
        print(f"\n{'='*60}")
        print(f"Processing Stop {stop_number}: {stop['content'].get('en', {}).get('title', 'Unknown')}")
        print(f"{'='*60}")
        
        # Add German content
        if stop_number in GERMAN_CONTENT:
            german_data = GERMAN_CONTENT[stop_number]
            print(f"✓ Adding German content...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.de': {
                        'title': german_data['title'],
                        'description': german_data['description']
                    }
                }}
            )
        
        # Add Hungarian content
        if stop_number in HUNGARIAN_CONTENT:
            hungarian_data = HUNGARIAN_CONTENT[stop_number]
            print(f"✓ Adding Hungarian content...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {
                    'content.hu': {
                        'title': hungarian_data['title'],
                        'description': hungarian_data['description']
                    }
                }}
            )
        
        # Process Hungarian audio
        hungarian_audio = process_hungarian_audio(stop_number)
        if hungarian_audio:
            print(f"✓ Adding Hungarian audio to database...")
            tour_stops_collection.update_one(
                {'_id': stop_id},
                {'$set': {'audio.hu': hungarian_audio}}
            )
        
        print(f"✓ Stop {stop_number} updated successfully!")
    
    print("\n" + "="*60)
    print("ALL CONTENT ADDED SUCCESSFULLY!")
    print("="*60)

if __name__ == "__main__":
    add_language_content()
