from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from emergentintegrations.llm.openai import OpenAITextToSpeech
import base64
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize OpenAI TTS
tts = OpenAITextToSpeech(api_key=os.getenv("EMERGENT_LLM_KEY"))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class TourStopContent(BaseModel):
    title: str
    description: str

class TourStop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stop_number: Optional[int] = None
    stop_name: Optional[str] = None  # For special stops like "Legends"
    image_base64: Optional[str] = None
    content: Dict[str, TourStopContent]  # language code -> content
    legends: Optional[List[Dict]] = None  # For Legends stop
    audio: Dict[str, str] = {}  # language code -> audio_base64
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TourStopCreate(BaseModel):
    stop_number: Optional[int] = None
    stop_name: Optional[str] = None
    image_base64: Optional[str] = None
    content: Dict[str, TourStopContent]
    legends: Optional[List[Dict]] = None

class TourStopUpdate(BaseModel):
    stop_number: Optional[int] = None
    image_base64: Optional[str] = None
    content: Optional[Dict[str, TourStopContent]] = None

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    completed_stops: List[str] = []
    last_played_stop: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AudioGenerateRequest(BaseModel):
    stop_id: str
    language: str

class AudioUploadRequest(BaseModel):
    stop_id: str
    language: str
    audio_base64: str

class ImageUploadRequest(BaseModel):
    image_base64: str

class AppSettings(BaseModel):
    id: str = Field(default_factory=lambda: "app_settings")
    background_image_base64: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Castle Audio Tour Guide API"}

@api_router.get("/tour-stops", response_model=List[TourStop])
async def get_tour_stops():
    """Get all tour stops - numbered stops first (1-13), then Legend 1-4 at the end
    Audio is NOT included in list view for performance (569MB -> 0.6MB response)
    Audio is fetched per-stop when viewing stop details
    """
    try:
        # Get all stops
        all_stops = await db.tour_stops.find().to_list(100)
        
        # DO NOT fetch audio in list view - causes 569MB response and timeouts
        # Audio is fetched individually when viewing stop details
        for stop in all_stops:
            stop['audio'] = {}  # Empty audio for list view
        
        # Separate numbered stops and Legend stops
        numbered_stops = [s for s in all_stops if s.get('stop_number') is not None]
        legend_stops = [s for s in all_stops if s.get('stop_name', '').startswith('Legend ')]
        
        # Sort numbered stops by stop_number
        numbered_stops.sort(key=lambda x: x.get('stop_number', 999))
        
        # Sort legend stops by name (Legend 1, Legend 2, Legend 3, Legend 4)
        legend_stops.sort(key=lambda x: x.get('stop_name', ''))
        
        # Combine: numbered stops first, then Legend stops at the end
        sorted_stops = numbered_stops + legend_stops
        
        return [TourStop(**stop) for stop in sorted_stops]
    except Exception as e:
        logger.error(f"Error fetching tour stops: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tour-stops/{stop_id}", response_model=TourStop)
async def get_tour_stop(stop_id: str, compressed: bool = False):
    """Get a specific tour stop. Use compressed=true for smaller audio files (offline mode)"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        # Fetch audio from tour_audio collection
        audio_files = await db.tour_audio.find({'stop_id': stop_id}).to_list(None)
        stop['audio'] = {af['language']: af['audio_base64'] for af in audio_files}
        
        return TourStop(**stop)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tour stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tour-stops/{stop_id}/audio/{language}")
async def get_tour_stop_audio_only(stop_id: str, language: str):
    """Get only audio for a stop - optimized for streaming/caching"""
    try:
        audio_doc = await db.tour_audio.find_one({'stop_id': stop_id, 'language': language})
        if not audio_doc:
            raise HTTPException(status_code=404, detail="Audio not found")
        
        return {
            "stop_id": stop_id,
            "language": language,
            "audio_base64": audio_doc['audio_base64'],
            "size_kb": len(audio_doc['audio_base64']) // 1024
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/audio/stream/{stop_id}/{language}")
async def stream_audio(stop_id: str, language: str):
    """Stream audio as MP3 file - much faster than base64"""
    from fastapi.responses import Response
    
    try:
        # Audio is stored in tour_audio collection
        audio_doc = await db.tour_audio.find_one({'stop_id': stop_id, 'language': language})
        
        if not audio_doc or not audio_doc.get('audio_base64'):
            # Fallback: try to get from tour_stops collection
            stop = await db.tour_stops.find_one({'id': stop_id})
            if stop and stop.get('audio', {}).get(language):
                audio_base64 = stop['audio'][language]
            else:
                raise HTTPException(status_code=404, detail=f"Audio not found for stop {stop_id} language {language}")
        else:
            audio_base64 = audio_doc['audio_base64']
        
        # Decode base64 to binary
        audio_bytes = base64.b64decode(audio_base64)
        
        # Return as streamable MP3
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename={stop_id}_{language}.mp3",
                "Cache-Control": "public, max-age=31536000",
                "Accept-Ranges": "bytes"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tour-stops", response_model=TourStop)
async def create_tour_stop(tour_stop: TourStopCreate):
    """Create a new tour stop"""
    try:
        stop_dict = tour_stop.dict()
        stop_obj = TourStop(**stop_dict)
        await db.tour_stops.insert_one(stop_obj.dict())
        return stop_obj
    except Exception as e:
        logger.error(f"Error creating tour stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/tour-stops/{stop_id}", response_model=TourStop)
async def update_tour_stop(stop_id: str, update: TourStopUpdate):
    """Update a tour stop"""
    try:
        existing = await db.tour_stops.find_one({"id": stop_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        update_dict = {k: v for k, v in update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db.tour_stops.update_one(
            {"id": stop_id},
            {"$set": update_dict}
        )
        
        updated_stop = await db.tour_stops.find_one({"id": stop_id})
        return TourStop(**updated_stop)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tour stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/tour-stops/{stop_id}")
async def delete_tour_stop(stop_id: str):
    """Delete a tour stop"""
    try:
        result = await db.tour_stops.delete_one({"id": stop_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        return {"message": "Tour stop deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tour stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/audio/generate")
async def generate_audio(request: AudioGenerateRequest):
    """Generate audio for a tour stop using TTS"""
    try:
        # Get tour stop
        stop = await db.tour_stops.find_one({"id": request.stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        # Get content for the language
        if request.language not in stop.get("content", {}):
            raise HTTPException(status_code=404, detail=f"Content not found for language: {request.language}")
        
        content = stop["content"][request.language]
        text = f"{content['title']}. {content['description']}"
        
        # Generate audio using TTS
        logger.info(f"Generating audio for stop {request.stop_id} in {request.language}")
        audio_bytes = await tts.generate_speech(
            text=text,
            model="tts-1",
            voice="alloy",
            speed=1.0
        )
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Store in tour_audio collection
        existing_audio = await db.tour_audio.find_one({
            "stop_id": request.stop_id,
            "language": request.language
        })
        
        if existing_audio:
            await db.tour_audio.update_one(
                {"stop_id": request.stop_id, "language": request.language},
                {"$set": {
                    "audio_base64": audio_base64,
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            audio_doc = {
                "id": str(uuid.uuid4()),
                "stop_id": request.stop_id,
                "language": request.language,
                "audio_base64": audio_base64,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.tour_audio.insert_one(audio_doc)
        
        return {
            "message": "Audio generated successfully",
            "audio_base64": audio_base64
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/audio/upload")
async def upload_audio(request: AudioUploadRequest):
    """Upload custom audio for a tour stop"""
    try:
        # Check if tour stop exists
        stop = await db.tour_stops.find_one({"id": request.stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        # Check if audio already exists for this stop + language
        existing_audio = await db.tour_audio.find_one({
            "stop_id": request.stop_id,
            "language": request.language
        })
        
        if existing_audio:
            # Update existing audio
            await db.tour_audio.update_one(
                {"stop_id": request.stop_id, "language": request.language},
                {"$set": {
                    "audio_base64": request.audio_base64,
                    "updated_at": datetime.utcnow()
                }}
            )
            logger.info(f"Updated audio for stop {request.stop_id} language {request.language}")
        else:
            # Insert new audio document
            audio_doc = {
                "id": str(uuid.uuid4()),
                "stop_id": request.stop_id,
                "language": request.language,
                "audio_base64": request.audio_base64,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.tour_audio.insert_one(audio_doc)
            logger.info(f"Inserted new audio for stop {request.stop_id} language {request.language}")
        
        return {"message": "Audio uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/audio/generate-all/{stop_id}")
async def generate_all_audio(stop_id: str):
    """Generate audio for all 8 languages for a tour stop"""
    try:
        # Get tour stop
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        languages = ["sk", "en", "de", "pl", "ru", "es", "hu", "zh"]
        results = {}
        
        for lang in languages:
            if lang not in stop.get("content", {}):
                results[lang] = "Content not found"
                continue
            
            try:
                content = stop["content"][lang]
                text = f"{content['title']}. {content['description']}"
                
                logger.info(f"Generating audio for {lang}")
                audio_bytes = await tts.generate_speech(
                    text=text,
                    model="tts-1",
                    voice="alloy",
                    speed=1.0
                )
                
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                await db.tour_stops.update_one(
                    {"id": stop_id},
                    {"$set": {f"audio.{lang}": audio_base64}}
                )
                
                results[lang] = "Success"
            except Exception as e:
                logger.error(f"Error generating audio for {lang}: {e}")
                results[lang] = f"Error: {str(e)}"
        
        return {"message": "Audio generation completed", "results": results}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating all audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/audio/generate-legend")
async def generate_legend_audio(stop_id: str, legend_index: int, language: str):
    """Generate audio for a specific legend"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        legends = stop.get("legends", [])
        if legend_index >= len(legends):
            raise HTTPException(status_code=404, detail="Legend not found")
        
        legend = legends[legend_index]
        content = legend.get("content", {}).get(language)
        
        if not content:
            raise HTTPException(status_code=404, detail=f"Content not found for language: {language}")
        
        text = f"{content['title']}. {content['description']}"
        
        logger.info(f"Generating audio for legend {legend_index} in {language}")
        audio_bytes = await tts.generate_speech(
            text=text,
            model="tts-1",
            voice="alloy",
            speed=1.0
        )
        
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Update legend audio
        if "audio" not in legend:
            legend["audio"] = {}
        legend["audio"][language] = audio_base64
        
        # Update in database
        await db.tour_stops.update_one(
            {"id": stop_id},
            {"$set": {"legends": legends}}
        )
        
        return {
            "message": "Legend audio generated successfully",
            "audio_base64": audio_base64
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating legend audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Image Upload Endpoints
@api_router.post("/images/background")
async def upload_background_image(request: ImageUploadRequest):
    """Upload background image for the main page"""
    try:
        # Get or create app settings
        settings = await db.app_settings.find_one({"id": "app_settings"})
        
        if settings:
            await db.app_settings.update_one(
                {"id": "app_settings"},
                {"$set": {
                    "background_image_base64": request.image_base64,
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            new_settings = AppSettings(background_image_base64=request.image_base64)
            await db.app_settings.insert_one(new_settings.dict())
        
        return {"message": "Background image uploaded successfully"}
    except Exception as e:
        logger.error(f"Error uploading background image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/images/background")
async def get_background_image():
    """Get background image"""
    try:
        settings = await db.app_settings.find_one({"id": "app_settings"})
        if not settings or not settings.get("background_image_base64"):
            return {"background_image_base64": None}
        return {"background_image_base64": settings["background_image_base64"]}
    except Exception as e:
        logger.error(f"Error fetching background image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/images/tour-stop/{stop_id}")
async def upload_tour_stop_image(stop_id: str, request: ImageUploadRequest):
    """Upload image for a specific tour stop"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        await db.tour_stops.update_one(
            {"id": stop_id},
            {"$set": {
                "image_base64": request.image_base64,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Tour stop image uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading tour stop image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Progress
@api_router.get("/progress/{user_id}", response_model=UserProgress)
async def get_user_progress(user_id: str):
    """Get user's progress"""
    try:
        progress = await db.user_progress.find_one({"user_id": user_id})
        if not progress:
            # Create new progress
            new_progress = UserProgress(user_id=user_id)
            await db.user_progress.insert_one(new_progress.dict())
            return new_progress
        return UserProgress(**progress)
    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/{user_id}/complete/{stop_id}")
async def mark_stop_complete(user_id: str, stop_id: str):
    """Mark a tour stop as completed"""
    try:
        progress = await db.user_progress.find_one({"user_id": user_id})
        
        if not progress:
            progress = UserProgress(user_id=user_id, completed_stops=[stop_id])
            await db.user_progress.insert_one(progress.dict())
        else:
            completed = progress.get("completed_stops", [])
            if stop_id not in completed:
                completed.append(stop_id)
                await db.user_progress.update_one(
                    {"user_id": user_id},
                    {"$set": {"completed_stops": completed, "updated_at": datetime.utcnow()}}
                )
        
        return {"message": "Stop marked as complete"}
    except Exception as e:
        logger.error(f"Error marking stop complete: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/{user_id}/reset")
async def reset_progress(user_id: str):
    """Reset user's progress"""
    try:
        await db.user_progress.update_one(
            {"user_id": user_id},
            {"$set": {"completed_stops": [], "last_played_stop": None, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Progress reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize tour data
@api_router.post("/init-tour-data")
async def init_tour_data():
    """Initialize the 13 tour stops with content in 8 languages"""
    try:
        # Check if data already exists
        count = await db.tour_stops.count_documents({})
        if count > 0:
            return {"message": "Tour data already initialized", "count": count}
        
        # Tour stops data (simplified - will be populated from the text)
        tour_stops_data = [
            {
                "stop_number": 1,
                "content": {
                    "en": {
                        "title": "Welcome",
                        "description": "Welcome to one of the largest castle complexes in Europe. Welcome to the largest monument with its exceptional architecture, which is an example of the construction development of the castle in different stylistic periods."
                    },
                    "sk": {
                        "title": "Vitajte",
                        "description": "Vitajte v jednom z najväčších hradných komplexov v Európe. Vitajte v najväčšej pamiatke s výnimočnou architektúrou, ktorá je príkladom stavebného vývoja hradu v rôznych štýlových obdobiach."
                    },
                    "de": {
                        "title": "Willkommen",
                        "description": "Willkommen zu einem der größten Burgkomplexe in Europa. Willkommen zum größten Denkmal mit seiner außergewöhnlichen Architektur, die ein Beispiel für die Bauentwicklung der Burg in verschiedenen stilistischen Epochen ist."
                    },
                    "pl": {
                        "title": "Witamy",
                        "description": "Witamy w jednym z największych kompleksów zamkowych w Europie. Witamy w największym zabytku o wyjątkowej architekturze, który jest przykładem rozwoju budowlanego zamku w różnych okresach stylistycznych."
                    },
                    "ru": {
                        "title": "Добро пожаловать",
                        "description": "Добро пожаловать в один из крупнейших замковых комплексов в Европе. Добро пожаловать в крупнейший памятник с исключительной архитектурой, который является примером строительного развития замка в разные стилистические периоды."
                    },
                    "es": {
                        "title": "Bienvenido",
                        "description": "Bienvenido a uno de los complejos de castillos más grandes de Europa. Bienvenido al monumento más grande con su arquitectura excepcional, que es un ejemplo del desarrollo constructivo del castillo en diferentes períodos estilísticos."
                    },
                    "hu": {
                        "title": "Üdvözöljük",
                        "description": "Üdvözöljük Európa egyik legnagyobb várkomplexumában. Üdvözöljük a legnagyobb műemlékben kivételes építészetével, amely a vár építészeti fejlődésének példája különböző stíluskorszakokban."
                    },
                    "zh": {
                        "title": "欢迎",
                        "description": "欢迎来到欧洲最大的城堡建筑群之一。欢迎来到这座最大的纪念碑，其卓越的建筑是城堡在不同风格时期建筑发展的典范。"
                    }
                }
            }
        ]
        
        # Insert initial data
        for stop_data in tour_stops_data:
            stop = TourStop(**stop_data)
            await db.tour_stops.insert_one(stop.dict())
        
        return {"message": "Tour data initialized successfully", "count": len(tour_stops_data)}
    except Exception as e:
        logger.error(f"Error initializing tour data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
