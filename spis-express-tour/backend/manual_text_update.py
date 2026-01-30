#!/usr/bin/env python3
"""
MANUAL TEXT UPDATE TOOL
Simply edit the text below and run this script to update any tour stop.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

# ============================================================================
# INSTRUCTIONS:
# 1. Change STOP_NUMBER to the stop you want to update (1-13, or None for Legends)
# 2. Change LANGUAGE to the language code: 'en', 'sk', 'de', 'pl', 'ru', 'es', 'hu', 'zh'
# 3. Paste your TITLE and DESCRIPTION below
# 4. Run: python3 manual_text_update.py
# ============================================================================

STOP_NUMBER = 1  # Change this to 1-13, or None for Legends
LANGUAGE = 'en'  # Change to: en, sk, de, pl, ru, es, hu, zh

# Paste your text here:
TITLE = """Welcome"""

DESCRIPTION = """Welcome to one of the largest castle complexes in Europe. Welcome to the largest monument with its exceptional architecture, which is an example of the construction development of the castle in different stylistic periods. Welcome to Spiš Castle, which has undergone a gradual transformation from a royal castle through a noble residence to a military fortress. Or if you prefer, the other way around, from an armoured military fortress through a royal castle to a private noble residence. I would first like to ask you to move forward to the middle of this courtyard where there are tents and there on the right, below the wall, is a photograph of the entire castle complex from above. I also ask you to be careful under your feet, as there are protruding stones on the pavement and inside the tower and it is slippery. Thank you."""

# ============================================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================================

async def update_stop():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("="*80)
    print("MANUAL TEXT UPDATE TOOL")
    print("="*80)
    
    # Find the stop
    if STOP_NUMBER is None:
        query = {'stop_name': 'Legends'}
        stop_label = "Legends"
    else:
        query = {'stop_number': STOP_NUMBER}
        stop_label = f"Stop {STOP_NUMBER}"
    
    stop = await db.tour_stops.find_one(query)
    
    if not stop:
        print(f"❌ ERROR: {stop_label} not found in database!")
        client.close()
        return
    
    print(f"\n📍 Updating: {stop_label}")
    print(f"🌍 Language: {LANGUAGE}")
    print(f"📝 Title: {TITLE[:50]}...")
    print(f"📄 Description: {len(DESCRIPTION)} characters")
    print()
    
    # Show current content
    if LANGUAGE in stop.get('content', {}):
        current = stop['content'][LANGUAGE]
        print(f"Current {LANGUAGE.upper()} title: {current.get('title', 'N/A')}")
        print(f"Current {LANGUAGE.upper()} description length: {len(current.get('description', ''))} chars")
        print()
    
    # Confirm
    confirm = input("⚠️  This will REPLACE the existing text. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        client.close()
        return
    
    # Update
    update_data = {
        f'content.{LANGUAGE}.title': TITLE.strip(),
        f'content.{LANGUAGE}.description': DESCRIPTION.strip(),
        'updated_at': datetime.utcnow()
    }
    
    result = await db.tour_stops.update_one(
        {'id': stop['id']},
        {'$set': update_data}
    )
    
    if result.modified_count > 0:
        print("✅ SUCCESS! Text updated in database")
        print(f"   Title: {TITLE.strip()}")
        print(f"   Description: {len(DESCRIPTION.strip())} characters")
    else:
        print("⚠️  No changes made (text might be identical)")
    
    # Verify
    updated_stop = await db.tour_stops.find_one(query)
    saved_desc = updated_stop['content'][LANGUAGE]['description']
    
    print()
    print("="*80)
    print("VERIFICATION:")
    print(f"✅ Saved title: {updated_stop['content'][LANGUAGE]['title']}")
    print(f"✅ Saved description: {len(saved_desc)} characters")
    print(f"✅ First 100 chars: {saved_desc[:100]}...")
    print("="*80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_stop())
