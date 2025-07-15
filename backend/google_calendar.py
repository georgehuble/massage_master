from datetime import datetime, timedelta
from typing import List
import os
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Настройки
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
CALENDAR_ID = os.getenv("CALENDAR_ID")

def get_available_slots(date: datetime, massage_type: str = "classic", duration_minutes: int = 60) -> List[str]:
    now = datetime.utcnow()
    if date.date() < now.date() or date.date() > now.date() + timedelta(days=14):
        return []

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build("calendar", "v3", credentials=creds)

    time_min = datetime(date.year, date.month, date.day, 0, 0).isoformat() + "Z"
    time_max = datetime(date.year, date.month, date.day, 23, 59).isoformat() + "Z"

    events_result = (
        service.events()
        .list(
            calendarId=CALENDAR_ID,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    events = events_result.get("items", [])
    
    # Получаем информацию о занятых интервалах
    busy_intervals = []
    for event in events:
        start_str = event["start"].get("dateTime")
        end_str = event["end"].get("dateTime") 
        if start_str and end_str:
            try:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00")).replace(tzinfo=None)
                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00")).replace(tzinfo=None)
                busy_intervals.append((start_dt, end_dt))
            except Exception as e:
                print(f"[get_available_slots] Ошибка парсинга события: {e}")
                continue

    available = []
    # Проверяем слоты с 10:00 до 21:00 каждый час
    for hour in range(10, 21):
        slot_start = datetime(date.year, date.month, date.day, hour, 0)
        slot_end = slot_start + timedelta(minutes=duration_minutes)
        
        # Проверяем, что слот начинается не раньше чем через 4 часа от текущего времени
        if slot_start <= now + timedelta(hours=4):
            continue
            
        # Проверяем, что слот не выходит за рамки рабочего дня (до 21:00)
        if slot_end.hour > 21 or (slot_end.hour == 21 and slot_end.minute > 0):
            continue
        
        # Проверяем пересечения с занятыми интервалами
        is_available = True
        for busy_start, busy_end in busy_intervals:
            # Пересечение есть, если: начало_слота < конец_занятого И конец_слота > начало_занятого
            if slot_start < busy_end and slot_end > busy_start:
                is_available = False
                break
        
        if is_available:
            available.append(slot_start.isoformat())
    
    return available
