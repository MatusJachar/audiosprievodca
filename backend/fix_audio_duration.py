import asyncio
import base64
import subprocess
import tempfile
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_audio_files():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client.castle_tour
    
    # Get all audio files
    cursor = db.tour_audio.find({})
    fixed_count = 0
    error_count = 0
    
    async for doc in cursor:
        stop_id = doc['stop_id']
        language = doc['language']
        audio_b64 = doc.get('audio_base64', '')
        
        if not audio_b64:
            continue
            
        try:
            # Decode to temp file
            audio_bytes = base64.b64decode(audio_b64)
            
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_in:
                tmp_in.write(audio_bytes)
                tmp_in_path = tmp_in.name
            
            tmp_out_path = tmp_in_path + '_fixed.mp3'
            
            # Re-encode with ffmpeg to fix duration metadata
            result = subprocess.run([
                'ffmpeg', '-y', '-i', tmp_in_path,
                '-acodec', 'libmp3lame', '-ab', '128k',
                '-map_metadata', '0',
                tmp_out_path
            ], capture_output=True, timeout=60)
            
            if result.returncode == 0 and os.path.exists(tmp_out_path):
                # Read fixed file
                with open(tmp_out_path, 'rb') as f:
                    fixed_bytes = f.read()
                
                fixed_b64 = base64.b64encode(fixed_bytes).decode('utf-8')
                
                # Update database
                await db.tour_audio.update_one(
                    {'_id': doc['_id']},
                    {'$set': {'audio_base64': fixed_b64}}
                )
                fixed_count += 1
                print(f"Fixed: {stop_id} - {language}")
            else:
                print(f"FFmpeg error for {stop_id} - {language}")
                error_count += 1
                
            # Cleanup
            os.unlink(tmp_in_path)
            if os.path.exists(tmp_out_path):
                os.unlink(tmp_out_path)
                
        except Exception as e:
            print(f"Error processing {stop_id} - {language}: {e}")
            error_count += 1
    
    print(f"\nDone! Fixed: {fixed_count}, Errors: {error_count}")

asyncio.run(fix_audio_files())
