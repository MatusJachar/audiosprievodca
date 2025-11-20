"""
Add text content for Slovak, Russian, Spanish, and Chinese
For now, using English as fallback until proper translations are provided
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
tour_stops_collection = db['tour_stops']

def main():
    print("\n" + "="*70)
    print("ADDING MISSING TEXT CONTENT (USING ENGLISH AS FALLBACK)")
    print("="*70)
    
    stops = list(tour_stops_collection.find().sort('stop_number', 1))
    
    for stop in stops:
        stop_id = stop['_id']
        stop_num = stop['stop_number']
        
        # Get English content as fallback
        en_content = stop['content'].get('en', {})
        
        if not en_content:
            print(f"Stop {stop_num}: No English content found, skipping...")
            continue
        
        print(f"\nStop {stop_num}: {en_content.get('title', 'Unknown')}")
        
        # Add content for missing languages using English as fallback
        languages_to_add = ['sk', 'ru', 'es', 'zh']
        
        for lang in languages_to_add:
            if lang not in stop['content']:
                print(f"  Adding {lang.upper()} content (English fallback)...")
                tour_stops_collection.update_one(
                    {'_id': stop_id},
                    {'$set': {
                        f'content.{lang}': {
                            'title': en_content['title'],
                            'description': en_content['description'] + f"\n\n[Note: {lang.upper()} translation pending]"
                        }
                    }}
                )
    
    print("\n" + "="*70)
    print("CONTENT UPDATE COMPLETE")
    print("NOTE: Slovak, Russian, Spanish, and Chinese are using English")
    print("      text as fallback until proper translations are provided.")
    print("="*70)

if __name__ == "__main__":
    main()
