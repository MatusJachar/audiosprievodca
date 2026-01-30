import os
import sys
import asyncio
import requests
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

# English audio URLs (from previous uploads)
ENGLISH_AUDIO_URLS = {
    1: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/2cwkxh99_1.%20welcome.mp3",
    2: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/85jtrs2i_2.%20in%20the%20front%20of%20the%20photography.%20.mp3",
    3: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/8cze30ec_3.%20At%20the%20castle%20model.mp3",
    4: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/dfnuxjhd_4.in%20the%20kitchen.mp3",
    5: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/e30beww3_5.%20on%20the%20lower%20terase.mp3",
    6: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/o3k3npob_6.%20on%20the%20romanesque%20foretrese.mp3",
    7: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/2a6mjwln_7.%20on%20the%20upper%20terase.mp3",
    8: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/i291gvzm_8.%20lower%20courtart.mp3",
    9: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/8zqu4k6h_9.%20torture%20chamber.mp3",
    10: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/hzpcgval_10.%20in%20Zapolski%20palace.mp3",
    11: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/qqbwgij7_11.%20tower.mp3",
    12: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/e458797r_12.%20romanesque%20palace.mp3",
    13: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/8gzwwuaz_13.%20from%20the%20window.mp3",
}

# Polish audio URLs
POLISH_AUDIO_URLS = {
    1: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/7yq32w05_1.Polish.mp3",
    2: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/grkqbira_2.Polish.mp3",
    3: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/6clyh8ni_3.Polish.mp3",
    4: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/2aur7uar_4.Polish.mp3",
    5: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/ixbq5zse_5.Polish.mp3",
    6: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/6j63p3o1_6.Polish.mp3",
    7: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/m6gh6e9k_7.Polish.mp3",
    8: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/rckm4fx0_8.Polish.mp3",
    9: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/j23ozl6g_9.Polish.mp3",
    10: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/ze5ouv4i_10.Polish.mp3",
    11: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/so74gcfu_11.Polish.mp3",
    12: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/ehwllzkh_12.Polish.mp3",
    13: "https://customer-assets.emergentagent.com/job_castle-voice-guide/artifacts/l7146ztm_13.Polish.mp3",
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
        print(f"  ✗ Error: {e}")
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
        return None

def main():
    print("\n" + "="*70)
    print("RESTORING ENGLISH & POLISH AUDIO")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    for stop in stops:
        stop_num = stop['stop_number']
        stop_id = stop['_id']
        
        print(f"\n{'='*70}")
        print(f"STOP {stop_num}")
        print(f"{'='*70}")
        
        # Process English
        if stop_num in ENGLISH_AUDIO_URLS:
            print("\n  [EN] Processing...")
            url = ENGLISH_AUDIO_URLS[stop_num]
            orig = f"/tmp/en_{stop_num}_orig.mp3"
            comp = f"/tmp/en_{stop_num}_comp.mp3"
            
            if download_audio(url, orig):
                if compress_audio(orig, comp):
                    b64 = to_base64(comp)
                    if b64:
                        tour_stops_collection.update_one(
                            {'_id': stop_id},
                            {'$set': {'audio.en': b64}}
                        )
                        print("  ✓ Saved to database")
                    try:
                        os.remove(orig)
                        os.remove(comp)
                    except:
                        pass
        
        # Process Polish
        if stop_num in POLISH_AUDIO_URLS:
            print("\n  [PL] Processing...")
            url = POLISH_AUDIO_URLS[stop_num]
            orig = f"/tmp/pl_{stop_num}_orig.mp3"
            comp = f"/tmp/pl_{stop_num}_comp.mp3"
            
            if download_audio(url, orig):
                if compress_audio(orig, comp):
                    b64 = to_base64(comp)
                    if b64:
                        tour_stops_collection.update_one(
                            {'_id': stop_id},
                            {'$set': {'audio.pl': b64}}
                        )
                        print("  ✓ Saved to database")
                    try:
                        os.remove(orig)
                        os.remove(comp)
                    except:
                        pass
        
        print(f"\n  ✅ Stop {stop_num} completed!")
    
    print("\n" + "="*70)
    print("RESTORATION COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    main()
