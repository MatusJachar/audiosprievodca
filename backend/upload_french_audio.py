#!/usr/bin/env python3
"""
Script to upload French audio files to tour stops
Usage: Place all French audio files in the same directory as this script
       Files should be named: 1.french.mp3, 2.french.mp3, ..., 13.french.mp3
       Then run: python3 upload_french_audio.py
"""

import os
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client['tour_guide_db']
tour_audio_collection = db['tour_audio']
tour_stops_collection = db['tour_stops']

def upload_french_audio():
    """Upload French audio files for all tour stops"""
    
    # Get all tour stops sorted by stop_number
    tour_stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    print("🇫🇷 French Audio Upload Script")
    print("=" * 50)
    print(f"Found {len(tour_stops)} tour stops in database\n")
    
    uploaded_count = 0
    skipped_count = 0
    error_count = 0
    
    # Process each tour stop
    for stop in tour_stops:
        stop_number = stop.get('stop_number')
        stop_id = stop.get('id')  # Use 'id' field, not '_id'
        
        if not stop_id:
            print(f"⚠️  Stop has no 'id' field - skipping")
            skipped_count += 1
            continue
        
        # Skip legend stops (they don't have stop_number)
        if stop_number is None:
            print(f"⏭️  Skipping legend stop: {stop.get('stop_name', 'Unknown')}")
            skipped_count += 1
            continue
        
        # Look for French audio file
        audio_file = f"{stop_number}.french.mp3"
        
        if not os.path.exists(audio_file):
            print(f"⚠️  Stop {stop_number}: File '{audio_file}' not found - skipping")
            skipped_count += 1
            continue
        
        try:
            # Read and encode audio file
            print(f"📤 Stop {stop_number}: Uploading {audio_file}...")
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            file_size_mb = len(audio_data) / (1024 * 1024)
            
            # Find or create audio document
            audio_doc = tour_audio_collection.find_one({'tour_stop_id': stop_id})
            
            if audio_doc:
                # Update existing document
                tour_audio_collection.update_one(
                    {'tour_stop_id': stop_id},
                    {'$set': {'audio.fr': audio_base64}}
                )
                print(f"   ✅ Updated French audio for stop {stop_number} ({file_size_mb:.2f} MB)")
            else:
                # Create new document
                tour_audio_collection.insert_one({
                    'tour_stop_id': stop_id,
                    'audio': {'fr': audio_base64}
                })
                print(f"   ✅ Created French audio for stop {stop_number} ({file_size_mb:.2f} MB)")
            
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
        print("\n🎉 French audio files have been uploaded successfully!")
        print("   The app now supports 9 languages including French.")
    
    if error_count > 0:
        print("\n⚠️  Some files had errors. Please check the logs above.")

if __name__ == "__main__":
    # Check if we're in the right directory
    if not os.path.exists('.env'):
        print("❌ Error: .env file not found!")
        print("   Please run this script from the /app/backend directory")
        exit(1)
    
    print("Starting French audio upload...")
    print("Looking for files: 1.french.mp3, 2.french.mp3, ..., 13.french.mp3\n")
    
    upload_french_audio()
