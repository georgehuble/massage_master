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

def get_available_slots(date: datetime) -> List[str]:
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
    busy_slots = []

    for event in events:
        start = event["start"].get("dateTime")
        if start:
            busy_slots.append(start)

    available = []
    for hour in range(10, 21):
        slot = datetime(date.year, date.month, date.day, hour, 0)
        if slot > now + timedelta(hours=4):
            iso_slot = slot.isoformat()
            if not any(iso_slot.startswith(busy.split("T")[0] + "T" + busy.split("T")[1][:5]) for busy in busy_slots):
                available.append(iso_slot)
    return available
