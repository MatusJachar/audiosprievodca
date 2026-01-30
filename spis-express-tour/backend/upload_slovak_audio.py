#!/usr/bin/env python3
"""
Script to upload Slovak audio files (.wav format)
"""

import os
import base64
from pymongo import MongoClient
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_audio_collection = db['tour_audio']
tour_stops_collection = db['tour_stops']

def upload_slovak_audio():
    """Upload Slovak audio files for tour stops"""
    
    print("🇸🇰 Slovak Audio Upload Script")
    print("=" * 50)
    
    uploaded_count = 0
    skipped_count = 0
    error_count = 0
    
    # List of available Slovak files
    slovak_files = [1, 3, 4, 5, 7]
    
    for stop_number in slovak_files:
        audio_file = f"{stop_number}.slovak.wav"
        
        # Find the stop in database
        stop = tour_stops_collection.find_one({'stop_number': stop_number})
        
        if not stop:
            print(f"⚠️  Stop {stop_number}: Not found in database")
            error_count += 1
            continue
        
        if not os.path.exists(audio_file):
            print(f"⚠️  Stop {stop_number}: File '{audio_file}' not found")
            skipped_count += 1
            continue
        
        stop_id = stop.get('id')
        
        try:
            # Read and encode audio file
            print(f"📤 Stop {stop_number}: Uploading {audio_file}...")
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            file_size_mb = len(audio_data) / (1024 * 1024)
            
            # Check if Slovak audio already exists
            existing = tour_audio_collection.find_one({
                'stop_id': stop_id,
                'language': 'sk'
            })
            
            if existing:
                # Update existing document
                tour_audio_collection.update_one(
                    {'stop_id': stop_id, 'language': 'sk'},
                    {
                        '$set': {
                            'audio_base64': audio_base64,
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                print(f"   ✅ Updated Slovak audio for stop {stop_number} ({file_size_mb:.2f} MB)")
            else:
                # Create new document
                tour_audio_collection.insert_one({
                    'id': str(uuid.uuid4()),
                    'stop_id': stop_id,
                    'language': 'sk',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                })
                print(f"   ✅ Created Slovak audio for stop {stop_number} ({file_size_mb:.2f} MB)")
            
            uploaded_count += 1
            
        except Exception as e:
            print(f"   ❌ Error uploading stop {stop_number}: {str(e)}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Upload Summary:")
    print(f"   ✅ Successfully uploaded: {uploaded_count}")
    print(f"   ⏭️  Skipped: {skipped_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📝 Total processed: {uploaded_count + skipped_count + error_count}")
    print("=" * 50)
    
    if uploaded_count > 0:
        print("\n🎉 Slovak audio files uploaded successfully!")
    
    if error_count > 0:
        print("\n⚠️  Some files had errors. Please check the logs above.")

if __name__ == "__main__":
    print("Starting Slovak audio upload...")
    print("Processing files: 1, 3, 4, 5, 7\n")
    
    upload_slovak_audio()
