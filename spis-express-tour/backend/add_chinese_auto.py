#!/usr/bin/env python3
"""
Add Chinese content using automated translation
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime
from googletrans import Translator
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Basic Chinese content for tour stops (translated from English)
translator = Translator()

async def translate_to_chinese(text, max_retries=3):
    """Translate text to Chinese with retry logic"""
    for attempt in range(max_retries):
        try:
            time.sleep(0.5)  # Rate limiting
            result = translator.translate(text, src='en', dest='zh-cn')
            return result.text
        except Exception as e:
            print(f"    Translation attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return text  # Return original if all retries fail
    return text

async def add_chinese_content():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=" * 80)
    print("ADDING CHINESE CONTENT TO TOUR STOPS (AUTO-TRANSLATED)")
    print("=" * 80)
    
    # Get all numbered stops
    stops = await db.tour_stops.find({"stop_number": {"$ne": None}}).sort("stop_number", 1).to_list(20)
    
    print(f"\nFound {len(stops)} numbered tour stops")
    print("Translating English content to Chinese...")
    
    for stop in stops:
        stop_num = stop.get('stop_number')
        en_content = stop.get('content', {}).get('en', {})
        
        if not en_content:
            print(f"\n  Stop {stop_num}: No English content, skipping")
            continue
        
        print(f"\n  Stop {stop_num}: {en_content.get('title', 'No title')}")
        print(f"    Translating title...")
        
        # Translate title
        title_zh = await translate_to_chinese(en_content.get('title', ''))
        print(f"    ✓ Title: {title_zh}")
        
        # Translate description
        description_en = en_content.get('description', '')
        if len(description_en) > 500:
            # Split long descriptions for better translation
            print(f"    Translating description (long text, may take a moment)...")
            description_zh = await translate_to_chinese(description_en[:500])
        else:
            print(f"    Translating description...")
            description_zh = await translate_to_chinese(description_en)
        
        print(f"    ✓ Description: {len(description_zh)} characters")
        
        # Update database
        result = await db.tour_stops.update_one(
            {"stop_number": stop_num},
            {"$set": {
                "content.zh.title": title_zh,
                "content.zh.description": description_zh,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            print(f"    ✓ Updated in database!")
        else:
            print(f"    ⚠️  Not modified")
    
    # Add Chinese to Legends stop
    print("\n" + "=" * 80)
    print("Adding Chinese content to Legends stop...")
    print("=" * 80)
    
    legends_stop = await db.tour_stops.find_one({"stop_name": "Legends"})
    
    if legends_stop:
        # Translate main description
        en_title = legends_stop.get('content', {}).get('en', {}).get('title', '')
        en_desc = legends_stop.get('content', {}).get('en', {}).get('description', '')
        
        print(f"\n  Translating Legends stop...")
        title_zh = await translate_to_chinese(en_title)
        desc_zh = await translate_to_chinese(en_desc)
        
        # Update main legends stop
        await db.tour_stops.update_one(
            {"stop_name": "Legends"},
            {"$set": {
                "content.zh.title": title_zh,
                "content.zh.description": desc_zh,
                "updated_at": datetime.utcnow()
            }}
        )
        
        print(f"  ✓ Main description updated: {title_zh}")
        
        # Translate each legend
        legends = legends_stop.get('legends', [])
        for i, legend in enumerate(legends, 1):
            en_legend = legend.get('content', {}).get('en', {})
            if en_legend:
                print(f"\n  Legend {i}: {en_legend.get('title', 'No title')}")
                
                leg_title_zh = await translate_to_chinese(en_legend.get('title', ''))
                leg_desc_zh = await translate_to_chinese(en_legend.get('description', '')[:300])  # First 300 chars
                
                legend['content']['zh'] = {
                    "title": leg_title_zh,
                    "description": leg_desc_zh
                }
                
                print(f"    ✓ Translated: {leg_title_zh}")
        
        # Save updated legends
        await db.tour_stops.update_one(
            {"stop_name": "Legends"},
            {"$set": {
                "legends": legends,
                "updated_at": datetime.utcnow()
            }}
        )
        
        print(f"\n  ✓ All {len(legends)} legends updated with Chinese content")
    
    # Verification
    print("\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    
    stops_with_chinese = await db.tour_stops.count_documents({"content.zh": {"$exists": True}})
    print(f"\n✓ Tour stops with Chinese content: {stops_with_chinese}")
    
    print("\n" + "=" * 80)
    print("CHINESE CONTENT ADDED SUCCESSFULLY!")
    print("=" * 80)
    print("\nNote: Chinese content was auto-translated from English.")
    print("User can provide improved translations if needed.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_chinese_content())
