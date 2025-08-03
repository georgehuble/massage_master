from datetime import datetime, timedelta, timezone
from typing import List
import os
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Настройки
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "google_key.json")
CALENDAR_ID = os.getenv("CALENDAR_ID")

def get_available_slots(date: datetime, massage_type: str = "classic", duration_minutes: int = 60) -> List[str]:
    print(f"[get_available_slots] Начало выполнения функции")
    print(f"[get_available_slots] Дата: {date}, тип: {massage_type}, длительность: {duration_minutes}")
    
    # Используем московское время (явно)
    MOSCOW_TZ = timezone(timedelta(hours=3))
    now = datetime.now(MOSCOW_TZ)
    print(f"[get_available_slots] Текущее время (МСК): {now}")
    
    if date.date() < now.date() or date.date() > now.date() + timedelta(days=14):
        print(f"[get_available_slots] Дата вне диапазона, возвращаем пустой список")
        return []

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build("calendar", "v3", credentials=creds)

    # Время в UTC для Google Calendar API
    time_min = datetime(date.year, date.month, date.day, 0, 0, tzinfo=timezone.utc).isoformat()
    time_max = datetime(date.year, date.month, date.day, 23, 59, tzinfo=timezone.utc).isoformat()

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
                # Всегда парсим как UTC, потом переводим в МСК
                start_dt_utc = datetime.fromisoformat(start_str.replace("Z", "+00:00")).astimezone(timezone.utc)
                end_dt_utc = datetime.fromisoformat(end_str.replace("Z", "+00:00")).astimezone(timezone.utc)
                start_dt_moscow = start_dt_utc.astimezone(MOSCOW_TZ).replace(tzinfo=None)
                end_dt_moscow = end_dt_utc.astimezone(MOSCOW_TZ).replace(tzinfo=None)
                # Добавляем буферное время (20 минут) после каждого сеанса
                end_dt_with_buffer = end_dt_moscow + timedelta(minutes=20)
                busy_intervals.append((start_dt_moscow, end_dt_with_buffer))
                print(f"[get_available_slots] Занятый интервал (МСК): {start_dt_moscow} - {end_dt_with_buffer}")
            except Exception as e:
                print(f"[get_available_slots] Ошибка парсинга события: {e}")
                continue

    available = []
    # Проверяем слоты с 10:00 до 21:00 с интервалом в 20 минут
    for hour in range(10, 21):
        for minute in [0, 20, 40]:  # Слоты каждые 20 минут
            slot_start = datetime(date.year, date.month, date.day, hour, minute, tzinfo=MOSCOW_TZ).replace(tzinfo=None)
            slot_end = slot_start + timedelta(minutes=duration_minutes)
            # Проверяем, что слот начинается не раньше чем через 4 часа от текущего времени
            if slot_start <= now.replace(tzinfo=None) + timedelta(hours=4):
                continue
            # Проверяем, что слот не выходит за рамки рабочего дня (до 21:00)
            if slot_end.hour > 21 or (slot_end.hour == 21 and slot_end.minute > 0):
                continue
            # Проверяем пересечения с занятыми интервалами
            is_available = True
            for busy_start, busy_end in busy_intervals:
                # Пересечение есть, если: начало_слота < конец_занятого И конец_слота > начало_занятого
                if slot_start < busy_end and slot_end > busy_start:
                    print(f"[get_available_slots] Слот {slot_start} - {slot_end} пересекается с занятым {busy_start} - {busy_end}")
                    is_available = False
                    break
            if is_available:
                available.append(slot_start.isoformat())
                print(f"[get_available_slots] Доступный слот: {slot_start}")
    print(f"[get_available_slots] Всего доступных слотов: {len(available)}")
    print(f"[get_available_slots] Возвращаемые слоты: {available}")
    return available

def delete_event(event_id: str):
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    import os
    SCOPES = ["https://www.googleapis.com/auth/calendar"]
    SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "google_key.json")
    CALENDAR_ID = os.getenv("CALENDAR_ID")
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    service = build("calendar", "v3", credentials=creds)
    service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
