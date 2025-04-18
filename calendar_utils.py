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

def create_event(start_time: datetime, user_name: str):
    service = get_calendar_service()
    event = {
        "summary": f"Массаж для {user_name}",
        "start": {"dateTime": start_time.isoformat(), "timeZone": "Europe/Moscow"},
        "end": {"dateTime": (start_time + timedelta(hours=1)).isoformat(), "timeZone": "Europe/Moscow"},
    }
    created_event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
    return created_event.get("htmlLink")

def get_busy_slots_for_day(service, day: datetime.date):
    start = datetime.combine(day, datetime.min.time()).isoformat() + "Z"
    end = (datetime.combine(day, datetime.min.time()) + timedelta(days=1)).isoformat() + "Z"

    events_result = service.events().list(
        calendarId=CALENDAR_ID, timeMin=start, timeMax=end,
        singleEvents=True, orderBy="startTime"
    ).execute()

    busy = [datetime.fromisoformat(e["start"]["dateTime"]) for e in events_result.get("items", []) if "dateTime" in e["start"]]
    return busy