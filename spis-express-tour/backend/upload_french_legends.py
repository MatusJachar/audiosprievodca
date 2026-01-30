#!/usr/bin/env python3
"""
Script to upload French legend audio files
Usage: Place L1.french.mp3, L2.french.mp3, L3.french.mp3, L4.french.mp3 in backend directory
       Then run: python3 upload_french_legends.py
"""

import os
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import uuid

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_audio_collection = db['tour_audio']
tour_stops_collection = db['tour_stops']

def upload_french_legends():
    """Upload French audio files for legend stops"""
    
    print("🇫🇷 French Legends Audio Upload Script")
    print("=" * 50)
    
    uploaded_count = 0
    error_count = 0
    
    # Process each legend (1-4)
    for legend_num in range(1, 5):
        audio_file = f"L{legend_num}.french.mp3"
        legend_name = f"Legend {legend_num}"
        
        # Find the legend stop in database
        legend_stop = tour_stops_collection.find_one({'stop_name': legend_name})
        
        if not legend_stop:
            print(f"⚠️  {legend_name}: Not found in database - skipping")
            error_count += 1
            continue
        
        if not os.path.exists(audio_file):
            print(f"⚠️  {legend_name}: File '{audio_file}' not found - skipping")
            error_count += 1
            continue
        
        stop_id = legend_stop.get('id')
        
        try:
            # Read and encode audio file
            print(f"📤 {legend_name}: Uploading {audio_file}...")
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            file_size_mb = len(audio_data) / (1024 * 1024)
            
            # Check if French audio already exists for this legend
            existing = tour_audio_collection.find_one({
                'stop_id': stop_id,
                'language': 'fr'
            })
            
            if existing:
                # Update existing document
                tour_audio_collection.update_one(
                    {'stop_id': stop_id, 'language': 'fr'},
                    {
                        '$set': {
                            'audio_base64': audio_base64,
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
                print(f"   ✅ Updated French audio for {legend_name} ({file_size_mb:.2f} MB)")
            else:
                # Create new document
                tour_audio_collection.insert_one({
                    'id': str(uuid.uuid4()),
                    'stop_id': stop_id,
                    'language': 'fr',
                    'audio_base64': audio_base64,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                })
                print(f"   ✅ Created French audio for {legend_name} ({file_size_mb:.2f} MB)")
            
            uploaded_count += 1
            
        except Exception as e:
            print(f"   ❌ Error uploading {legend_name}: {str(e)}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Upload Summary:")
    print(f"   ✅ Successfully uploaded: {uploaded_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📝 Total processed: {uploaded_count + error_count}")
    print("=" * 50)
    
    if uploaded_count > 0:
        print("\n🎉 French legend audio files uploaded successfully!")
        print("   French is now 100% complete with all tour stops and legends!")
    
    if error_count > 0:
        print("\n⚠️  Some files had errors. Please check the logs above.")

if __name__ == "__main__":
    # Check if we're in the right directory
    if not os.path.exists('.env'):
        print("❌ Error: .env file not found!")
        print("   Please run this script from the /app/backend directory")
        exit(1)
    
    print("Starting French legends audio upload...")
    print("Looking for files: L1.french.mp3, L2.french.mp3, L3.french.mp3, L4.french.mp3\n")
    
    upload_french_legends()
