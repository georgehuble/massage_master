from datetime import datetime, timedelta
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from notifications import notify_admin, notify_admin_cancel

SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
CALENDAR_ID = os.getenv("CALENDAR_ID")

def get_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("calendar", "v3", credentials=creds)

def book_slot(user_name: str, slot_iso: str) -> bool:
    service = get_service()

    start = datetime.fromisoformat(slot_iso)
    end = start + timedelta(hours=1)

    # Расширяем диапазон поиска, чтобы убедиться, что слот занят
    time_min = datetime(start.year, start.month, start.day, 0, 0).isoformat() + "Z"
    time_max = datetime(start.year, start.month, start.day, 23, 59).isoformat() + "Z"


    events = service.events().list(
        calendarId=CALENDAR_ID,
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True
    ).execute()

    for event in events.get("items", []):
        event_start_str = event.get("start", {}).get("dateTime")
        if not event_start_str:
            continue

        try:
            event_start = datetime.fromisoformat(event_start_str.replace("Z", "+00:00"))
        except Exception as e:
            print("[book_slot] Ошибка парсинга:", e)
            continue

        if abs((event_start.replace(tzinfo=None) - start).total_seconds()) < 60:
            print(f"[book_slot] Найдено совпадение: {event_start}")
            return False

    # Создание события
    event = {
        "summary": f"Запись на массаж — {user_name}",
        "description": f"Клиент: {user_name}",
        "start": {"dateTime": start.isoformat(), "timeZone": "Europe/Moscow"},
        "end": {"dateTime": end.isoformat(), "timeZone": "Europe/Moscow"},
    }

    try:
        service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        notify_admin(user_name, slot_iso)
        return True
    except Exception as e:
        print(f"[book_slot] Ошибка при создании события: {e}")
        return False
    

def cancel_slot(user_name: str, slot_iso: str) -> bool:
    service = get_service()

    start = datetime.fromisoformat(slot_iso)
    end = start + timedelta(hours=1)

    # Ищем все события за день
    time_min = datetime(start.year, start.month, start.day, 0, 0).isoformat() + "Z"
    time_max = datetime(start.year, start.month, start.day, 23, 59).isoformat() + "Z"

    try:
        events = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True
        ).execute()

        for event in events.get("items", []):
            summary = event.get("summary", "").lower()
            event_start_str = event.get("start", {}).get("dateTime")

            if not event_start_str:
                continue

            try:
                event_start = datetime.fromisoformat(event_start_str.replace("Z", "+00:00"))
            except Exception as e:
                print("[cancel_slot] Ошибка парсинга времени:", e)
                continue

            if abs((event_start.replace(tzinfo=None) - start).total_seconds()) < 60:
                if user_name.lower() in summary:
                    service.events().delete(calendarId=CALENDAR_ID, eventId=event["id"]).execute()
                    notify_admin_cancel(user_name, slot_iso)
                    print(f"[cancel_slot] Событие удалено: {event['id']}")
                    return True

    except Exception as e:
        print(f"[cancel_slot] Ошибка: {e}")

    return False


def get_all_bookings() -> list[dict]:
    service = get_service()

    now = datetime.utcnow()
    future = now + timedelta(days=14)

    try:
        events = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=now.isoformat() + "Z",
            timeMax=future.isoformat() + "Z",
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        bookings = []
        for event in events.get("items", []):
            name = event.get("summary", "").replace("Запись на массаж — ", "").strip()
            time_str = event.get("start", {}).get("dateTime")
            if name and time_str:
                bookings.append({
                    "name": name,
                    "slot": time_str
                })
        return bookings

    except Exception as e:
        print(f"[get_all_bookings] Ошибка: {e}")
        return []
