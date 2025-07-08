from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os

SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
CALENDAR_ID = os.getenv("CALENDAR_ID")

def get_calendar_service():
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    service = build("calendar", "v3", credentials=credentials)
    return service

def create_event(name: str, start_time: datetime, end_time: datetime = None, massage_type: str = "Массаж", description: str = ""):
    service = get_calendar_service()
    
    # Если end_time не указано, используем стандартную длительность в 1 час
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    event = {
        "summary": f"{massage_type} - {name}",
        "description": description,
        "start": {
            "dateTime": start_time.isoformat(), 
            "timeZone": "Europe/Moscow"
        },
        "end": {
            "dateTime": end_time.isoformat(), 
            "timeZone": "Europe/Moscow"
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 60},  # Напоминание за час
                {"method": "popup", "minutes": 15},  # Напоминание за 15 минут
            ],
        },
        "colorId": "2"  # Зеленый цвет для массажных сессий
    }
    
    try:
        created_event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        print(f"✅ Событие создано: {created_event.get('htmlLink')}")
        return created_event.get("htmlLink")
    except Exception as e:
        print(f"❌ Ошибка создания события в календаре: {e}")
        raise e

def get_busy_slots_for_day(service, day: datetime.date):
    start = datetime.combine(day, datetime.min.time()).isoformat() + "Z"
    end = (datetime.combine(day, datetime.min.time()) + timedelta(days=1)).isoformat() + "Z"

    events_result = service.events().list(
        calendarId=CALENDAR_ID, timeMin=start, timeMax=end,
        singleEvents=True, orderBy="startTime"
    ).execute()

    busy = [datetime.fromisoformat(e["start"]["dateTime"]) for e in events_result.get("items", []) if "dateTime" in e["start"]]
    return busy