from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: str
    role: str  # 'farmer' or 'buyer'
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Crop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farmer_id: str
    farmer_name: str
    farmer_phone: str
    farmer_location: str
    crop_type: str
    quantity: float
    unit: str  # kg, quintal, ton
    price: float
    expected_harvest_date: str
    description: str
    image: Optional[str] = None
    status: str = "available"  # available, sold
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CropCreate(BaseModel):
    crop_type: str
    quantity: float
    unit: str
    price: float
    expected_harvest_date: str
    description: str
    image: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_id: str
    farmer_id: str
    buyer_id: str
    buyer_name: str
    buyer_phone: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    crop_id: str
    farmer_id: str
    message: str

class MarketPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    crop_type: str
    price: float
    unit: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        location=user_data.location
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id']})
    user.pop('password', None)
    return {"token": token, "user": user}

@api_router.get("/crops")
async def get_crops(crop_type: Optional[str] = None, location: Optional[str] = None):
    query = {"status": "available"}
    if crop_type:
        query["crop_type"] = {"$regex": crop_type, "$options": "i"}
    if location:
        query["farmer_location"] = {"$regex": location, "$options": "i"}
    
    crops = await db.crops.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for crop in crops:
        if isinstance(crop.get('created_at'), str):
            crop['created_at'] = datetime.fromisoformat(crop['created_at'])
    return crops

@api_router.post("/crops", response_model=Crop)
async def create_crop(crop_data: CropCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'farmer':
        raise HTTPException(status_code=403, detail="Only farmers can post crops")
    
    crop = Crop(
        farmer_id=current_user['id'],
        farmer_name=current_user['name'],
        farmer_phone=current_user['phone'],
        farmer_location=current_user.get('location', ''),
        **crop_data.model_dump()
    )
    
    doc = crop.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.crops.insert_one(doc)
    return crop

@api_router.get("/crops/my-crops")
async def get_my_crops(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'farmer':
        raise HTTPException(status_code=403, detail="Only farmers can access this")
    
    crops = await db.crops.find({"farmer_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for crop in crops:
        if isinstance(crop.get('created_at'), str):
            crop['created_at'] = datetime.fromisoformat(crop['created_at'])
    return crops

@api_router.delete("/crops/{crop_id}")
async def delete_crop(crop_id: str, current_user: dict = Depends(get_current_user)):
    crop = await db.crops.find_one({"id": crop_id, "farmer_id": current_user['id']})
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    await db.crops.delete_one({"id": crop_id})
    return {"message": "Crop deleted successfully"}

@api_router.put("/crops/{crop_id}/status")
async def update_crop_status(crop_id: str, status: str, current_user: dict = Depends(get_current_user)):
    crop = await db.crops.find_one({"id": crop_id, "farmer_id": current_user['id']})
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    await db.crops.update_one({"id": crop_id}, {"$set": {"status": status}})
    return {"message": "Status updated successfully"}

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'buyer':
        raise HTTPException(status_code=403, detail="Only buyers can send messages")
    
    message = Message(
        crop_id=message_data.crop_id,
        farmer_id=message_data.farmer_id,
        buyer_id=current_user['id'],
        buyer_name=current_user['name'],
        buyer_phone=current_user['phone'],
        message=message_data.message
    )
    
    doc = message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.messages.insert_one(doc)
    return message

@api_router.get("/messages/received")
async def get_received_messages(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'farmer':
        raise HTTPException(status_code=403, detail="Only farmers can access this")
    
    messages = await db.messages.find({"farmer_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

@api_router.get("/market-prices")
async def get_market_prices():
    prices = await db.market_prices.find({}, {"_id": 0}).to_list(100)
    for price in prices:
        if isinstance(price.get('updated_at'), str):
            price['updated_at'] = datetime.fromisoformat(price['updated_at'])
    return prices

# Initialize market prices
@api_router.post("/init-market-prices")
async def init_market_prices():
    existing = await db.market_prices.count_documents({})
    if existing > 0:
        return {"message": "Market prices already initialized"}
    
    default_prices = [
        {"crop_type": "Wheat", "price": 2200, "unit": "quintal"},
        {"crop_type": "Rice", "price": 2500, "unit": "quintal"},
        {"crop_type": "Cotton", "price": 6500, "unit": "quintal"},
        {"crop_type": "Sugarcane", "price": 300, "unit": "quintal"},
        {"crop_type": "Maize", "price": 1850, "unit": "quintal"},
        {"crop_type": "Potato", "price": 20, "unit": "kg"},
        {"crop_type": "Tomato", "price": 25, "unit": "kg"},
        {"crop_type": "Onion", "price": 30, "unit": "kg"},
    ]
    
    for price_data in default_prices:
        price = MarketPrice(**price_data)
        doc = price.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.market_prices.insert_one(doc)
    
    return {"message": "Market prices initialized"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()