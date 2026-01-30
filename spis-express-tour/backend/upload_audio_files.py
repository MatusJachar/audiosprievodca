#!/usr/bin/env python3
"""
Script to upload custom audio files to tour stops
Processes audio files named: 1. welcome.mp3, 2. castle.mp3, etc.
"""
import requests
import base64
import sys
import os
from pathlib import Path

API_URL = "http://localhost:8001"
AUDIO_DIR = "/tmp/audio_files"

# Expected audio file names mapped to tour stop numbers
AUDIO_FILES = {
    1: "1. welcome.mp3",
    2: "2. castle photography.mp3",  # or whatever the actual names are
    3: "3. castle model.mp3",
    4: "4. kitchen.mp3",
    5: "5. lower terrace.mp3",
    6: "6. romanesque forecourt.mp3",
    7: "7. upper terrace.mp3",
    8: "8. lower courtyard.mp3",
    9: "9. torture chamber.mp3",
    10: "10. zapolsky palace.mp3",
    11: "11. tower.mp3",
    12: "12. romanesque palace.mp3",
    13: "13. window.mp3",
}

def get_tour_stops():
    """Fetch all tour stops from API"""
    response = requests.get(f"{API_URL}/api/tour-stops")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching tour stops: {response.status_code}")
        return []

def upload_audio(stop_id, language, audio_base64):
    """Upload audio to a specific tour stop"""
    response = requests.post(
        f"{API_URL}/api/audio/upload",
        json={
            "stop_id": stop_id,
            "language": language,
            "audio_base64": audio_base64
        }
    )
    return response.status_code == 200

def process_audio_file(file_path, stop_number, stop_id):
    """Convert audio file to base64 and upload"""
    try:
        # Read and convert to base64
        with open(file_path, 'rb') as f:
            audio_bytes = f.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Upload
        if upload_audio(stop_id, "en", audio_base64):
            size_mb = len(audio_bytes) / (1024 * 1024)
            print(f"  ✓ Stop {stop_number}: {Path(file_path).name} ({size_mb:.2f} MB)")
            return True
        else:
            print(f"  ✗ Stop {stop_number}: Upload failed")
            return False
    except Exception as e:
        print(f"  ✗ Stop {stop_number}: Error - {e}")
        return False

def main():
    print("=== Audio File Upload Script ===")
    print(f"Looking for audio files in: {AUDIO_DIR}")
    print("")
    
    # Get tour stops
    tour_stops = get_tour_stops()
    if not tour_stops:
        print("Error: Could not fetch tour stops")
        return
    
    # Create stop_number to ID mapping
    stop_map = {stop['stop_number']: stop['id'] for stop in tour_stops}
    
    # Process each audio file
    success_count = 0
    total_count = 0
    
    # Find all audio files in directory
    audio_dir_path = Path(AUDIO_DIR)
    if not audio_dir_path.exists():
        print(f"Error: Directory {AUDIO_DIR} does not exist")
        print("Please create it and place audio files there")
        return
    
    audio_files = list(audio_dir_path.glob("*.mp3"))
    audio_files.sort()
    
    if not audio_files:
        print("No .mp3 files found in directory")
        return
    
    print(f"Found {len(audio_files)} audio file(s):")
    for audio_file in audio_files:
        print(f"  - {audio_file.name}")
    print("")
    
    # Process each file
    for audio_file in audio_files:
        total_count += 1
        filename = audio_file.name
        
        # Extract stop number from filename (assumes format: "1. name.mp3")
        try:
            stop_number = int(filename.split('.')[0])
            if stop_number in stop_map:
                stop_id = stop_map[stop_number]
                if process_audio_file(str(audio_file), stop_number, stop_id):
                    success_count += 1
            else:
                print(f"  ✗ {filename}: Invalid stop number {stop_number}")
        except (ValueError, IndexError):
            print(f"  ✗ {filename}: Could not parse stop number from filename")
    
    print("")
    print(f"=== Upload Complete ===")
    print(f"Successfully uploaded: {success_count}/{total_count} files")
    
    if success_count < total_count:
        print(f"Failed: {total_count - success_count} files")

if __name__ == "__main__":
    main()
