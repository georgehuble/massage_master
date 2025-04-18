from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from google_calendar import get_available_slots
from booking import book_slot, cancel_slot, get_all_bookings
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


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
async def slots(day: str = Query(..., example="2025-04-10")):
    try:
        date_obj = datetime.strptime(day, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    slots = get_available_slots(date_obj)
    return slots

class BookingRequest(BaseModel):
    name: str
    slot: str  # ISO format

@app.post("/api/book")
async def book(request: BookingRequest = Body(...)):
    success = book_slot(request.name, request.slot)
    if not success:
        raise HTTPException(status_code=409, detail="Слот уже занят. Выберите другое время.")
    return {"success": True}

@app.post("/api/cancel")
async def cancel(request: BookingRequest = Body(...)):
    success = cancel_slot(request.name, request.slot)
    if not success:
        raise HTTPException(status_code=404, detail="Событие не найдено или уже отменено")
    return {"success": True}

@app.get("/api/records")
async def get_records():
    return get_all_bookings()

app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/")
async def serve_index():
    return FileResponse("dist/index.html")
