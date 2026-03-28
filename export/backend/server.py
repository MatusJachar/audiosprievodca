from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
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
import base64
import asyncio
import io
import qrcode
from PIL import Image as PILImage, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory for audio files
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'audio'
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

PARTNER_LOGOS_DIR = ROOT_DIR / 'uploads' / 'partners'
PARTNER_LOGOS_DIR.mkdir(parents=True, exist_ok=True)

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

# ============================================
# MODELS
# ============================================

class TourStopContent(BaseModel):
    title: str
    description: str

class TourStop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stop_number: Optional[int] = None
    stop_name: Optional[str] = None
    image_base64: Optional[str] = None
    content: Dict[str, TourStopContent] = {}
    legends: Optional[List[Dict]] = None
    audio: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TourStopCreate(BaseModel):
    stop_number: Optional[int] = None
    stop_name: Optional[str] = None
    image_base64: Optional[str] = None
    content: Dict[str, TourStopContent] = {}
    legends: Optional[List[Dict]] = None

class TourStopUpdate(BaseModel):
    stop_number: Optional[int] = None
    stop_name: Optional[str] = None
    image_base64: Optional[str] = None
    content: Optional[Dict[str, TourStopContent]] = None

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    completed_stops: List[str] = []
    last_played_stop: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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

# Partner Models
class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # restaurant, hotel, shop, attraction, service
    description: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    logo_url: str = ""
    logo_base64: str = ""
    is_active: bool = True
    sort_order: int = 0
    opening_hours: str = ""
    price_range: str = ""  # €, €€, €€€
    rating: float = 0.0
    discount_text: str = ""  # Special offer for app users
    latitude: float = 0.0
    longitude: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PartnerCreate(BaseModel):
    name: str
    category: str
    description: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    logo_base64: str = ""
    is_active: bool = True
    sort_order: int = 0
    opening_hours: str = ""
    price_range: str = ""
    rating: float = 0.0
    discount_text: str = ""
    latitude: float = 0.0
    longitude: float = 0.0

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_base64: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    opening_hours: Optional[str] = None
    price_range: Optional[str] = None
    rating: Optional[float] = None
    discount_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# GastroFlow / Deep Linking Models
class Referral(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_app: str  # "audioguide" or "gastroflow"
    target_app: str
    partner_id: Optional[str] = None
    user_id: Optional[str] = None
    referral_type: str  # "direct", "referral", "embed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeepLinkConfig(BaseModel):
    id: str = Field(default_factory=lambda: "deeplink_config")
    gastroflow_base_url: str = "gastroflow://"
    audioguide_base_url: str = "audioguide://"
    web_fallback_url: str = "https://spisskyhrad.sk"
    is_enabled: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Content Models
class TaxiService(BaseModel):
    name: str
    phone: str

class TravelInfoContent(BaseModel):
    location_name: str = "Spisske Podhradie"
    location_detail: str = "053 04, Slovakia"
    by_car: str = "From Kosice: ~60 km (45 min) via E50\nFrom Poprad: ~45 km (35 min) via Route 18\nFrom Presov: ~50 km (40 min) via E50\nFree parking available at castle base"
    by_bus: str = "Regular bus service from:\nSpiska Nova Ves (20 min)\nLevoca (15 min)\nKosice (1.5 hours)"
    bus_schedule_url: str = "https://cp.hnonline.sk/"
    by_train: str = "Nearest train station:\nSpisske Podhradie (2 km walk to castle)\nSpiska Nova Ves (then bus)"
    train_schedule_url: str = "https://www.zssk.sk/en/"
    taxi_services: List[TaxiService] = []
    opening_hours_summer: str = "9:00 - 19:00"
    opening_hours_spring: str = "9:00 - 17:00"
    opening_hours_winter: str = "10:00 - 16:00"

class ShopContent(BaseModel):
    ticket_adult: str = "8.00 EUR"
    ticket_student: str = "5.00 EUR"
    ticket_child: str = "3.00 EUR"
    ticket_family: str = "18.00 EUR"
    tickets_url: str = "https://www.spisskyhrad.sk/en/tickets/"
    shop_url: str = "https://www.spisskyhrad.sk/en/shop/"
    contact_email: str = "info@spisskyhrad.sk"
    contact_phone: str = "+421 53 454 1336"
    contact_website: str = "https://www.spisskyhrad.sk"

class DiscoverContent(BaseModel):
    app_price_old: str = "9.99 EUR"
    app_price_new: str = "4.99 EUR"
    app_discount_text: str = "50% OFF - Limited time!"
    app_store_ios: str = "https://apps.apple.com/app/spis-region-guide"
    app_store_android: str = "https://play.google.com/store/apps/details?id=com.spisregion.guide"
    guide_price: str = "From 80 EUR / half day"
    guide_phone: str = "+421 901 234 567"

# ============================================
# TOUR STOP ROUTES
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Spissky hrad Audio Tour Guide API", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

@api_router.get("/tour-stops", response_model=List[TourStop])
async def get_tour_stops():
    """Get all tour stops - numbered stops first, then legends. Audio excluded for performance."""
    try:
        all_stops = await db.tour_stops.find().to_list(100)
        for stop in all_stops:
            stop['audio'] = {}
        
        numbered_stops = [s for s in all_stops if s.get('stop_number') is not None]
        legend_stops = [s for s in all_stops if s.get('stop_name', '').startswith('Legend ')]
        
        numbered_stops.sort(key=lambda x: x.get('stop_number', 999))
        legend_stops.sort(key=lambda x: x.get('stop_name', ''))
        
        sorted_stops = numbered_stops + legend_stops
        return [TourStop(**stop) for stop in sorted_stops]
    except Exception as e:
        logger.error(f"Error fetching tour stops: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tour-stops/{stop_id}", response_model=TourStop)
async def get_tour_stop(stop_id: str):
    """Get a specific tour stop with audio"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
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
    """Get only audio for a stop"""
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
    """Stream audio as MP3 file"""
    from fastapi.responses import Response
    
    try:
        audio_doc = await db.tour_audio.find_one({'stop_id': stop_id, 'language': language})
        
        if not audio_doc or not audio_doc.get('audio_base64'):
            stop = await db.tour_stops.find_one({'id': stop_id})
            if stop and stop.get('audio', {}).get(language):
                audio_base64 = stop['audio'][language]
            else:
                raise HTTPException(status_code=404, detail=f"Audio not found for stop {stop_id} language {language}")
        else:
            audio_base64 = audio_doc['audio_base64']
        
        audio_bytes = base64.b64decode(audio_base64)
        
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

# Serve uploaded audio files
@api_router.get("/uploads/audio/{filename}")
async def serve_audio_file(filename: str):
    """Serve uploaded audio files from disk"""
    from fastapi.responses import FileResponse
    
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Accept-Ranges": "bytes"
        }
    )

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
        
        # Handle nested content updates properly
        if "content" in update_dict:
            content_update = update_dict.pop("content")
            existing_content = existing.get("content", {})
            for lang, lang_content in content_update.items():
                if isinstance(lang_content, dict):
                    existing_content[lang] = lang_content
                else:
                    existing_content[lang] = lang_content.dict() if hasattr(lang_content, 'dict') else lang_content
            update_dict["content"] = existing_content
        
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
        # Also delete associated audio
        await db.tour_audio.delete_many({"stop_id": stop_id})
        return {"message": "Tour stop deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tour stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# AUDIO ROUTES
# ============================================

@api_router.post("/audio/upload")
async def upload_audio(request: AudioUploadRequest):
    """Upload custom audio for a tour stop"""
    try:
        stop = await db.tour_stops.find_one({"id": request.stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        existing_audio = await db.tour_audio.find_one({
            "stop_id": request.stop_id,
            "language": request.language
        })
        
        if existing_audio:
            await db.tour_audio.update_one(
                {"stop_id": request.stop_id, "language": request.language},
                {"$set": {
                    "audio_base64": request.audio_base64,
                    "updated_at": datetime.utcnow()
                }}
            )
        else:
            audio_doc = {
                "id": str(uuid.uuid4()),
                "stop_id": request.stop_id,
                "language": request.language,
                "audio_base64": request.audio_base64,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.tour_audio.insert_one(audio_doc)
        
        return {"message": "Audio uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/audio/upload-file")
async def upload_audio_file(stop_id: str, language: str, file: UploadFile = File(...)):
    """Upload audio file for a tour stop (multipart form)"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        # Save file to disk
        stop_num = stop.get('stop_number', 0)
        filename = f"stop{stop_num}_{language}.mp3"
        file_path = UPLOADS_DIR / filename
        
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Also store as base64 in DB for streaming
        audio_base64 = base64.b64encode(content).decode('utf-8')
        
        existing_audio = await db.tour_audio.find_one({
            "stop_id": stop_id,
            "language": language
        })
        
        if existing_audio:
            await db.tour_audio.update_one(
                {"stop_id": stop_id, "language": language},
                {"$set": {"audio_base64": audio_base64, "updated_at": datetime.utcnow()}}
            )
        else:
            await db.tour_audio.insert_one({
                "id": str(uuid.uuid4()),
                "stop_id": stop_id,
                "language": language,
                "audio_base64": audio_base64,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        return {"message": "Audio file uploaded", "filename": filename, "size_bytes": len(content)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# IMAGE ROUTES
# ============================================

@api_router.post("/images/background")
async def upload_background_image(request: ImageUploadRequest):
    try:
        settings = await db.app_settings.find_one({"id": "app_settings"})
        if settings:
            await db.app_settings.update_one(
                {"id": "app_settings"},
                {"$set": {"background_image_base64": request.image_base64, "updated_at": datetime.utcnow()}}
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
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        await db.tour_stops.update_one(
            {"id": stop_id},
            {"$set": {"image_base64": request.image_base64, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Tour stop image uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading tour stop image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# USER PROGRESS ROUTES
# ============================================

@api_router.get("/progress/{user_id}", response_model=UserProgress)
async def get_user_progress(user_id: str):
    try:
        progress = await db.user_progress.find_one({"user_id": user_id})
        if not progress:
            new_progress = UserProgress(user_id=user_id)
            await db.user_progress.insert_one(new_progress.dict())
            return new_progress
        return UserProgress(**progress)
    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/{user_id}/complete/{stop_id}")
async def mark_stop_complete(user_id: str, stop_id: str):
    try:
        progress = await db.user_progress.find_one({"user_id": user_id})
        if not progress:
            progress_obj = UserProgress(user_id=user_id, completed_stops=[stop_id])
            await db.user_progress.insert_one(progress_obj.dict())
        else:
            completed = progress.get("completed_stops", [])
            if stop_id not in completed:
                completed.append(stop_id)
                await db.user_progress.update_one(
                    {"user_id": user_id},
                    {"$set": {"completed_stops": completed, "last_played_stop": stop_id, "updated_at": datetime.utcnow()}}
                )
        return {"message": "Stop marked as complete"}
    except Exception as e:
        logger.error(f"Error marking stop complete: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/progress/{user_id}/reset")
async def reset_user_progress(user_id: str):
    try:
        await db.user_progress.update_one(
            {"user_id": user_id},
            {"$set": {"completed_stops": [], "last_played_stop": None, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Progress reset successfully"}
    except Exception as e:
        logger.error(f"Error resetting user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PARTNER ROUTES (CRUD)
# ============================================

@api_router.get("/partners")
async def get_partners(category: Optional[str] = None, active_only: bool = True):
    """Get all partners, optionally filtered by category"""
    try:
        query = {}
        if category:
            query["category"] = category
        if active_only:
            query["is_active"] = True
        
        partners = await db.partners.find(query).sort("sort_order", 1).to_list(100)
        # Remove _id field
        for p in partners:
            p.pop('_id', None)
        return partners
    except Exception as e:
        logger.error(f"Error fetching partners: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/partners/{partner_id}")
async def get_partner(partner_id: str):
    try:
        partner = await db.partners.find_one({"id": partner_id})
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
        partner.pop('_id', None)
        return partner
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching partner: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/partners")
async def create_partner(partner: PartnerCreate):
    """Create a new partner (admin only)"""
    try:
        partner_obj = Partner(**partner.dict())
        await db.partners.insert_one(partner_obj.dict())
        return partner_obj.dict()
    except Exception as e:
        logger.error(f"Error creating partner: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/partners/{partner_id}")
async def update_partner(partner_id: str, update: PartnerUpdate):
    """Update a partner (admin only)"""
    try:
        existing = await db.partners.find_one({"id": partner_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        update_dict = {k: v for k, v in update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db.partners.update_one(
            {"id": partner_id},
            {"$set": update_dict}
        )
        
        updated = await db.partners.find_one({"id": partner_id})
        updated.pop('_id', None)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating partner: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/partners/{partner_id}")
async def delete_partner(partner_id: str):
    """Delete a partner (admin only)"""
    try:
        result = await db.partners.delete_one({"id": partner_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Partner not found")
        return {"message": "Partner deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting partner: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/partners/{partner_id}/logo")
async def upload_partner_logo(partner_id: str, request: ImageUploadRequest):
    """Upload partner logo"""
    try:
        existing = await db.partners.find_one({"id": partner_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Partner not found")
        
        await db.partners.update_one(
            {"id": partner_id},
            {"$set": {"logo_base64": request.image_base64, "updated_at": datetime.utcnow()}}
        )
        return {"message": "Logo uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading partner logo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Seed sample partners
@api_router.post("/admin/partners/seed")
async def seed_partners():
    """Seed sample partner data"""
    try:
        count = await db.partners.count_documents({})
        if count > 0:
            return {"message": f"Partners already seeded ({count} partners)"}
        
        sample_partners = [
            {
                "name": "Restauracia pod hradom",
                "category": "restaurant",
                "description": "Tradicna slovenska kuchyna s vyhliadom na hrad",
                "address": "Spisske Podhradie 123, 053 04",
                "phone": "+421 53 454 1234",
                "email": "info@podhradom.sk",
                "website": "https://podhradom.sk",
                "opening_hours": "11:00 - 22:00",
                "price_range": "EUR EUR",
                "rating": 4.5,
                "discount_text": "10% zlava pre uzivatelov aplikacie!",
                "sort_order": 1,
            },
            {
                "name": "Hotel Spissky salat",
                "category": "hotel",
                "description": "Utulny hotel v historickom centre",
                "address": "Spisske Podhradie 45, 053 04",
                "phone": "+421 53 454 5678",
                "email": "recepcia@spisskyhotel.sk",
                "website": "https://spisskyhotel.sk",
                "opening_hours": "Non-stop",
                "price_range": "EUR EUR EUR",
                "rating": 4.2,
                "discount_text": "15% zlava na ubytovanie",
                "sort_order": 2,
            },
            {
                "name": "Suveniry Spis",
                "category": "shop",
                "description": "Originalne suveniry a remeselne vyrobky z reginu Spis",
                "address": "Pod hradom 8, 053 04",
                "phone": "+421 901 234 567",
                "opening_hours": "9:00 - 18:00",
                "price_range": "EUR",
                "rating": 4.8,
                "discount_text": "Darcek zadarmo k nakupu nad 20 EUR",
                "sort_order": 3,
            },
            {
                "name": "Levocka izba",
                "category": "restaurant",
                "description": "Regionalna gastronimia v historickom centre Levoce",
                "address": "Levoca, Namestie Majstra Pavla 12",
                "phone": "+421 53 451 2345",
                "website": "https://levockaizba.sk",
                "opening_hours": "10:00 - 23:00",
                "price_range": "EUR EUR",
                "rating": 4.7,
                "discount_text": "Gratis dezert pri hlavnom jedle",
                "sort_order": 4,
            },
        ]
        
        for p_data in sample_partners:
            partner = Partner(**p_data)
            await db.partners.insert_one(partner.dict())
        
        return {"message": f"Seeded {len(sample_partners)} partners"}
    except Exception as e:
        logger.error(f"Error seeding partners: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# GASTROFLOW DEEP LINKING ROUTES
# ============================================

@api_router.get("/deeplink/config")
async def get_deeplink_config():
    """Get deep linking configuration"""
    try:
        config = await db.deeplink_config.find_one({"id": "deeplink_config"})
        if not config:
            default_config = DeepLinkConfig()
            await db.deeplink_config.insert_one(default_config.dict())
            return default_config.dict()
        config.pop('_id', None)
        return config
    except Exception as e:
        logger.error(f"Error fetching deeplink config: {e}")
        return DeepLinkConfig().dict()

@api_router.put("/admin/deeplink/config")
async def update_deeplink_config(config: DeepLinkConfig):
    """Update deep linking configuration"""
    try:
        await db.deeplink_config.update_one(
            {"id": "deeplink_config"},
            {"$set": config.dict()},
            upsert=True
        )
        return {"message": "Deep link config updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/deeplink/referral")
async def track_referral(referral: Referral):
    """Track a deep link referral"""
    try:
        await db.referrals.insert_one(referral.dict())
        return {"message": "Referral tracked", "id": referral.id}
    except Exception as e:
        logger.error(f"Error tracking referral: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/deeplink/referrals/stats")
async def get_referral_stats():
    """Get referral statistics"""
    try:
        total = await db.referrals.count_documents({})
        from_gastroflow = await db.referrals.count_documents({"source_app": "gastroflow"})
        from_audioguide = await db.referrals.count_documents({"source_app": "audioguide"})
        
        return {
            "total_referrals": total,
            "from_gastroflow": from_gastroflow,
            "from_audioguide": from_audioguide,
        }
    except Exception as e:
        logger.error(f"Error fetching referral stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/deeplink/nearby-restaurants")
async def get_nearby_restaurants():
    """Get nearby restaurants for GastroFlow integration"""
    try:
        restaurants = await db.partners.find({
            "category": "restaurant",
            "is_active": True
        }).sort("rating", -1).to_list(20)
        
        for r in restaurants:
            r.pop('_id', None)
            r.pop('logo_base64', None)  # Don't send large base64 in list
        
        return restaurants
    except Exception as e:
        logger.error(f"Error fetching nearby restaurants: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# CONTENT MANAGEMENT ROUTES
# ============================================

@api_router.get("/content/travel-info")
async def get_travel_info():
    try:
        content = await db.app_content.find_one({"type": "travel_info"})
        if content:
            del content["_id"]
            return content.get("data", TravelInfoContent().dict())
        return TravelInfoContent().dict()
    except Exception as e:
        logger.error(f"Error getting travel info: {e}")
        return TravelInfoContent().dict()

@api_router.put("/content/travel-info")
async def update_travel_info(content: TravelInfoContent):
    try:
        await db.app_content.update_one(
            {"type": "travel_info"},
            {"$set": {"type": "travel_info", "data": content.dict(), "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"message": "Travel info updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/content/shop")
async def get_shop_content():
    try:
        content = await db.app_content.find_one({"type": "shop"})
        if content:
            del content["_id"]
            return content.get("data", ShopContent().dict())
        return ShopContent().dict()
    except Exception as e:
        return ShopContent().dict()

@api_router.put("/content/shop")
async def update_shop_content(content: ShopContent):
    try:
        await db.app_content.update_one(
            {"type": "shop"},
            {"$set": {"type": "shop", "data": content.dict(), "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"message": "Shop content updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/content/discover")
async def get_discover_content():
    try:
        content = await db.app_content.find_one({"type": "discover"})
        if content:
            del content["_id"]
            return content.get("data", DiscoverContent().dict())
        return DiscoverContent().dict()
    except Exception as e:
        return DiscoverContent().dict()

@api_router.put("/content/discover")
async def update_discover_content(content: DiscoverContent):
    try:
        await db.app_content.update_one(
            {"type": "discover"},
            {"$set": {"type": "discover", "data": content.dict(), "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"message": "Discover content updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ADMIN STATS / DASHBOARD
# ============================================

@api_router.get("/admin/stats")
async def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        total_stops = await db.tour_stops.count_documents({})
        total_audio = await db.tour_audio.count_documents({})
        total_partners = await db.partners.count_documents({})
        active_partners = await db.partners.count_documents({"is_active": True})
        total_referrals = await db.referrals.count_documents({})
        total_users = await db.user_progress.count_documents({})
        
        # Count languages with audio
        languages_with_audio = set()
        async for doc in db.tour_audio.find({}, {"language": 1}):
            languages_with_audio.add(doc.get("language"))
        
        return {
            "total_stops": total_stops,
            "total_audio_files": total_audio,
            "languages_with_audio": len(languages_with_audio),
            "total_partners": total_partners,
            "active_partners": active_partners,
            "total_referrals": total_referrals,
            "total_users": total_users,
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# QR CODE GENERATION
# ============================================

def generate_qr_code_image(data: str, label: str = "", size: int = 400) -> bytes:
    """Generate a QR code as PNG bytes with optional label"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="#1a1a2e", back_color="white").convert("RGB")
    qr_img = qr_img.resize((size, size), PILImage.LANCZOS)
    
    if label:
        # Add label text below QR code
        total_height = size + 80
        canvas = PILImage.new("RGB", (size + 40, total_height), "white")
        canvas.paste(qr_img, (20, 10))
        
        draw = ImageDraw.Draw(canvas)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except (OSError, IOError):
            font = ImageFont.load_default()
            font_small = font
        
        # Draw label centered
        bbox = draw.textbbox((0, 0), label, font=font)
        text_w = bbox[2] - bbox[0]
        x = (size + 40 - text_w) // 2
        draw.text((x, size + 15), label, fill="#1a1a2e", font=font)
        
        # Draw subtitle
        subtitle = "Spissky hrad Audio Guide"
        bbox2 = draw.textbbox((0, 0), subtitle, font=font_small)
        text_w2 = bbox2[2] - bbox2[0]
        x2 = (size + 40 - text_w2) // 2
        draw.text((x2, size + 45), subtitle, fill="#7B68EE", font=font_small)
        
        img_bytes = io.BytesIO()
        canvas.save(img_bytes, format="PNG")
    else:
        img_bytes = io.BytesIO()
        qr_img.save(img_bytes, format="PNG")
    
    img_bytes.seek(0)
    return img_bytes.getvalue()

@api_router.get("/qr/stop/{stop_id}")
async def get_qr_code_for_stop(
    stop_id: str,
    base_url: str = Query(default="https://spisskyhrad.sk/tour"),
    size: int = Query(default=400, ge=100, le=1000),
    format: str = Query(default="png", regex="^(png|base64)$")
):
    """Generate QR code for a specific tour stop"""
    try:
        stop = await db.tour_stops.find_one({"id": stop_id})
        if not stop:
            raise HTTPException(status_code=404, detail="Tour stop not found")
        
        # Build QR data URL
        stop_num = stop.get("stop_number")
        stop_name = stop.get("stop_name", "")
        
        if stop_num:
            qr_url = f"{base_url}/stop/{stop_num}"
            label = f"Stop {stop_num}"
        else:
            qr_url = f"{base_url}/legend/{stop_name}"
            label = stop_name or "Legend"
        
        # Get title for label
        content = stop.get("content", {})
        title = content.get("en", {}).get("title", "") or content.get("sk", {}).get("title", "")
        if title:
            label = f"{label}: {title}"
        
        png_bytes = generate_qr_code_image(qr_url, label=label, size=size)
        
        if format == "base64":
            b64 = base64.b64encode(png_bytes).decode("utf-8")
            return {
                "stop_id": stop_id,
                "qr_url": qr_url,
                "label": label,
                "qr_base64": b64,
                "size": size
            }
        
        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="qr_stop_{stop_num or stop_name}.png"',
                "Cache-Control": "public, max-age=3600"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/qr/all")
async def get_all_qr_codes(
    base_url: str = Query(default="https://spisskyhrad.sk/tour"),
    size: int = Query(default=300, ge=100, le=800)
):
    """Get QR codes for all tour stops as base64"""
    try:
        all_stops = await db.tour_stops.find().to_list(100)
        
        results = []
        for stop in all_stops:
            stop_id = stop.get("id")
            stop_num = stop.get("stop_number")
            stop_name = stop.get("stop_name", "")
            
            if stop_num:
                qr_url = f"{base_url}/stop/{stop_num}"
                label = f"Stop {stop_num}"
            else:
                qr_url = f"{base_url}/legend/{stop_name}"
                label = stop_name or "Legend"
            
            content = stop.get("content", {})
            title = content.get("en", {}).get("title", "") or content.get("sk", {}).get("title", "")
            if title:
                label = f"{label}: {title}"
            
            png_bytes = generate_qr_code_image(qr_url, label=label, size=size)
            b64 = base64.b64encode(png_bytes).decode("utf-8")
            
            results.append({
                "stop_id": stop_id,
                "stop_number": stop_num,
                "stop_name": stop_name,
                "title": title,
                "qr_url": qr_url,
                "label": label,
                "qr_base64": b64
            })
        
        # Sort: numbered first, then legends
        numbered = sorted([r for r in results if r["stop_number"]], key=lambda x: x["stop_number"])
        legends = [r for r in results if not r["stop_number"]]
        
        return {"qr_codes": numbered + legends, "total": len(results)}
    except Exception as e:
        logger.error(f"Error generating all QR codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/qr/print-sheet")
async def get_qr_print_sheet(
    base_url: str = Query(default="https://spisskyhrad.sk/tour"),
):
    """Generate a printable A4 sheet with all QR codes as PNG"""
    try:
        all_stops = await db.tour_stops.find().to_list(100)
        
        # Sort stops
        numbered = sorted([s for s in all_stops if s.get("stop_number")], key=lambda x: x["stop_number"])
        legends = [s for s in all_stops if not s.get("stop_number") and s.get("stop_name", "").startswith("Legend")]
        stops = numbered + legends
        
        # A4 at 150 DPI: 1240 x 1754 pixels
        page_w, page_h = 1240, 1754
        qr_size = 250
        cols = 4
        margin_x = 30
        margin_y = 80
        spacing_x = (page_w - 2 * margin_x) // cols
        spacing_y = qr_size + 60
        
        # Calculate pages needed
        items_per_page = cols * ((page_h - margin_y * 2) // spacing_y)
        pages_needed = max(1, (len(stops) + items_per_page - 1) // items_per_page)
        
        # Generate single page (first page)
        page = PILImage.new("RGB", (page_w, page_h), "white")
        draw = ImageDraw.Draw(page)
        
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
            label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
        except (OSError, IOError):
            title_font = ImageFont.load_default()
            label_font = title_font
            small_font = title_font
        
        # Title
        draw.text((margin_x, 20), "Spissky Hrad - QR Codes", fill="#1a1a2e", font=title_font)
        draw.text((margin_x, 55), f"Audio Tour Guide | {len(stops)} stops", fill="#7B68EE", font=small_font)
        
        for idx, stop in enumerate(stops[:items_per_page]):
            col = idx % cols
            row = idx // cols
            
            x = margin_x + col * spacing_x
            y = margin_y + row * spacing_y
            
            stop_num = stop.get("stop_number")
            stop_name = stop.get("stop_name", "")
            content = stop.get("content", {})
            title = content.get("en", {}).get("title", "") or content.get("sk", {}).get("title", "")
            
            if stop_num:
                qr_url = f"{base_url}/stop/{stop_num}"
                label_text = f"Stop {stop_num}"
            else:
                qr_url = f"{base_url}/legend/{stop_name}"
                label_text = stop_name or "Legend"
            
            # Generate QR code
            qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=6, border=1)
            qr.add_data(qr_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="#1a1a2e", back_color="white").convert("RGB")
            qr_img = qr_img.resize((qr_size, qr_size), PILImage.LANCZOS)
            
            page.paste(qr_img, (x + 10, y))
            
            # Label
            draw.text((x + 10, y + qr_size + 5), label_text, fill="#1a1a2e", font=label_font)
            if title:
                short_title = title[:25] + "..." if len(title) > 25 else title
                draw.text((x + 10, y + qr_size + 22), short_title, fill="#666666", font=small_font)
        
        img_bytes = io.BytesIO()
        page.save(img_bytes, format="PNG", quality=95)
        img_bytes.seek(0)
        
        return Response(
            content=img_bytes.getvalue(),
            media_type="image/png",
            headers={
                "Content-Disposition": 'attachment; filename="spissky_hrad_qr_codes.png"',
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        logger.error(f"Error generating QR print sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# APP SETUP
# ============================================

# Include the router in the main app
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / 'uploads')), name="uploads")

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
