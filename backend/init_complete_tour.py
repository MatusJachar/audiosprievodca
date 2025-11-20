#!/usr/bin/env python3
"""
Script to initialize all 13 tour stops with content in 8 languages
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Tour stops data - simplified English content for now (can be expanded)
TOUR_STOPS = [
    {
        "stop_number": 1,
        "title_en": "Welcome",
        "description_en": "Welcome to one of the largest castle complexes in Europe. Welcome to Spiš Castle, which has undergone a gradual transformation from a royal castle through a noble residence to a military fortress."
    },
    {
        "stop_number": 2,
        "title_en": "In Front of the Castle Photography",
        "description_en": "The castle hill was already inhabited in prehistoric times and the Neolithic period. Archaeological research has confirmed rich settlement by Celtic tribes and Dacians."
    },
    {
        "stop_number": 3,
        "title_en": "At the Castle Model",
        "description_en": "In this room you can see the model of Spiš Castle showing the final state of the complex at the beginning of the 18th century, when it was still inhabited and had roofs."
    },
    {
        "stop_number": 4,
        "title_en": "In the Kitchen",
        "description_en": "The basic component of the diet was meat. Traditional types such as poultry, beef, pork or game were consumed. Hungarian cuisine in the Middle Ages was known throughout Europe as very spicy and savory."
    },
    {
        "stop_number": 5,
        "title_en": "On the Lower Terrace",
        "description_en": "On the walls we can see photographs showing why this entire area was inscribed on the UNESCO World Cultural and Natural Heritage List in 1993."
    },
    {
        "stop_number": 6,
        "title_en": "On the Romanesque Forecourt",
        "description_en": "You have entered through the oldest Romanesque gate. This part of the castle was built after 1241, when the Mongols invaded Hungary and plundered the surrounding countryside."
    },
    {
        "stop_number": 7,
        "title_en": "On the Upper Terrace",
        "description_en": "Spiš Castle stands on top of a travertine rock at 634 meters above sea level. From here you can control the entire wide surroundings and see almost half of the Slovak mountains."
    },
    {
        "stop_number": 8,
        "title_en": "Lower Courtyard",
        "description_en": "The creation of the lower courtyard is connected with the Czech nobleman Ján Jiskra of Brandýs, who built a military camp for his soldiers surrounded by large walls."
    },
    {
        "stop_number": 9,
        "title_en": "Torture Chamber",
        "description_en": "The torture chamber was an integral part of the judicial system in the past. It was considered a completely normal and legal way for a judge to obtain testimony from the accused."
    },
    {
        "stop_number": 10,
        "title_en": "In Zápoľský Palace",
        "description_en": "You are standing in the kitchen of the original western Zápoľský palaces in Renaissance style. This is where the history of Spiš Castle began to be written."
    },
    {
        "stop_number": 11,
        "title_en": "Tower",
        "description_en": "The current 19-meter castle tower was built in the middle of the fortified acropolis. It served as a place of last defense and was called Nebojsa."
    },
    {
        "stop_number": 12,
        "title_en": "Romanesque Palace",
        "description_en": "This is a three-story Romanesque palace, one of only 4 preserved Romanesque palaces of a secular character in the world. The palace has typical Romanesque double windows."
    },
    {
        "stop_number": 13,
        "title_en": "From the Window",
        "description_en": "There is a beautiful view of the countryside and courtyards. By building all the courtyards, the castle gained its monumental dimensions with an area of more than 41 thousand square meters."
    }
]

# Translation templates (simplified - in production, use proper translations)
TRANSLATIONS = {
    "sk": {"title_prefix": "", "desc_prefix": ""},
    "de": {"title_prefix": "", "desc_prefix": ""},
    "pl": {"title_prefix": "", "desc_prefix": ""},
    "ru": {"title_prefix": "", "desc_prefix": ""},
    "es": {"title_prefix": "", "desc_prefix": ""},
    "hu": {"title_prefix": "", "desc_prefix": ""},
    "zh": {"title_prefix": "", "desc_prefix": ""},
}

async def create_tour_stop(stop_data):
    """Create a tour stop with content in all 8 languages"""
    
    # For now, using English content for all languages (can be properly translated later)
    content = {
        "en": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "sk": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "de": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "pl": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "ru": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "es": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "hu": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        },
        "zh": {
            "title": stop_data["title_en"],
            "description": stop_data["description_en"]
        }
    }
    
    tour_stop = {
        "id": str(uuid.uuid4()),
        "stop_number": stop_data["stop_number"],
        "image_base64": None,
        "content": content,
        "audio": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    return tour_stop

async def init_all_stops():
    """Initialize all 13 tour stops"""
    
    # Clear existing stops
    print("Clearing existing tour stops...")
    await db.tour_stops.delete_many({})
    
    print("Creating 13 tour stops...")
    for stop_data in TOUR_STOPS:
        tour_stop = await create_tour_stop(stop_data)
        await db.tour_stops.insert_one(tour_stop)
        print(f"  ✓ Stop {stop_data['stop_number']}: {stop_data['title_en']}")
    
    # Verify
    count = await db.tour_stops.count_documents({})
    print(f"\n✓ Successfully created {count} tour stops!")

async def main():
    try:
        await init_all_stops()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
