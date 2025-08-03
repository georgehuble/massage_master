from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from google_calendar import get_available_slots
from booking import book_slot, cancel_slot, get_all_bookings, get_user_bookings
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Или укажи точный домен, если хочешь: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/slots")
async def slots(
    day: str = Query(..., example="2025-04-10"),
    massageType: str = Query("classic", description="Тип массажа"),
    duration: int = Query(60, description="Длительность в минутах")
):
    logger.info(f"🔍 [BACKEND] Slots request: day={day}, massageType={massageType}, duration={duration}")
    try:
        date_obj = datetime.strptime(day, "%Y-%m-%d")
        logger.info(f"🔍 [BACKEND] Parsed date: {date_obj}")
    except ValueError:
        logger.error(f"🔍 [BACKEND] Invalid date format: {day}")
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    logger.info(f"🔍 [BACKEND] Calling get_available_slots...")
    slots = get_available_slots(date_obj, massageType, duration)
    logger.info(f"🔍 [BACKEND] Available slots count: {len(slots)}")
    logger.info(f"🔍 [BACKEND] Available slots: {slots}")
    return slots

class BookingRequest(BaseModel):
    name: str
    slot: str  # ISO format
    massageType: str = "classic"  # тип массажа
    duration: int = 60  # длительность в минутах
    eventId: str = None  # ID события в Google Calendar

@app.post("/api/book")
async def book(request: BookingRequest = Body(...)):
    success, event_id = book_slot(request.name, request.slot, request.massageType, request.duration)
    if not success:
        raise HTTPException(status_code=409, detail="Слот уже занят. Выберите другое время.")
    # Планируем автоматическое удаление события через Celery
    from tasks import delete_booking_task
    import pytz
    from datetime import datetime
    massage_time = datetime.fromisoformat(request.slot)
    moscow_tz = pytz.timezone("Europe/Moscow")
    if massage_time.tzinfo is None:
        massage_time = moscow_tz.localize(massage_time)
    delete_booking_task.apply_async(
        args=[event_id],
        eta=massage_time
    )
    return {"success": True, "eventId": event_id}

@app.post("/api/cancel")
async def cancel(request: BookingRequest = Body(...)):
    # eventId теперь может быть в теле запроса
    event_id = getattr(request, 'eventId', None) or (request.dict().get('eventId'))
    success = cancel_slot(event_id, request.name, request.slot, request.massageType)
    if not success:
        raise HTTPException(status_code=404, detail="Событие не найдено или уже отменено")
    return {"success": True}

@app.get("/api/records")
async def get_records():
    return get_all_bookings()

@app.get("/api/user-bookings/{user_name}")
async def get_user_records(user_name: str):
    return get_user_bookings(user_name)

app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("dist/index.html")
