from datetime import datetime, timedelta
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from notifications import notify_admin, notify_admin_cancel
from calendar_utils import create_event, get_calendar_service

SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
CALENDAR_ID = os.getenv("CALENDAR_ID")

def get_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build("calendar", "v3", credentials=creds)

def book_slot(user_name: str, slot_iso: str, massage_type: str = "classic", duration_minutes: int = 60):
    service = get_service()
    start = datetime.fromisoformat(slot_iso)
    end = start + timedelta(minutes=duration_minutes)
    
    massage_names = {
        "classic": "Классический массаж",
        "neck-shoulder": "Массаж шейно-воротниковой зоны",
        "back": "Массаж спины",
        "back-neck": "Массаж спины и шейно-воротниковой зоны",
        "stone": "Массаж горячими камнями (стоун-терапия)",
        "lymphatic": "Лимфодренажный массаж",
        "anticellulite": "Антицеллюлитный массаж",
        "sports": "Спортивный массаж",
        "cupping": "Баночный динамический массаж"
    }
    massage_name = massage_names.get(massage_type, "Массаж")
    
    # Проверяем пересечения с существующими событиями
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
        event_end_str = event.get("end", {}).get("dateTime")
        if not event_start_str or not event_end_str:
            continue
        try:
            event_start = datetime.fromisoformat(event_start_str.replace("Z", "+00:00")).replace(tzinfo=None)
            event_end = datetime.fromisoformat(event_end_str.replace("Z", "+00:00")).replace(tzinfo=None)
            # Добавляем буферное время к существующим событиям
            event_end_with_buffer = event_end + timedelta(minutes=20)
            if start < event_end_with_buffer and end > event_start:
                print(f"[book_slot] Найдено пересечение: новый слот {start}-{end}, существующий {event_start}-{event_end_with_buffer}")
                return False, None
        except Exception as e:
            print("[book_slot] Ошибка парсинга:", e)
            continue
    
    # Создаем событие используя calendar_utils
    try:
        description = f"Клиент: {user_name}\nТип: {massage_name}\nДлительность: {duration_minutes} мин"
        event_link = create_event(
            name=user_name,
            start_time=start,
            end_time=end,
            massage_type=massage_name,
            description=description
        )
        
        if event_link:
            # Получаем ID события из ссылки
            event_id = event_link.split('/')[-1]
            notify_admin(user_name, slot_iso)
            print(f"[book_slot] Событие создано успешно: {event_id}")
            return True, event_id
        else:
            print("[book_slot] Ошибка создания события через calendar_utils")
            return False, None
            
    except Exception as e:
        print(f"[book_slot] Ошибка при создании события: {e}")
        return False, None

def cancel_slot(event_id: str = None, user_name: str = None, slot_iso: str = None, massage_type: str = "classic") -> bool:
    service = get_service()
    
    # Приоритет: удаление по event_id
    if event_id:
        try:
            service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
            notify_admin_cancel(user_name or "", slot_iso or "")
            print(f"[cancel_slot] Событие удалено по id: {event_id}")
            return True
        except Exception as e:
            print(f"[cancel_slot] Ошибка удаления по id: {e}")
            return False
    
    # Резервный способ: поиск по времени и имени
    if not slot_iso or not user_name:
        return False
        
    start = datetime.fromisoformat(slot_iso)
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
            event_id = event.get("id")
            
            if not event_start_str or not event_id:
                continue
                
            try:
                event_start = datetime.fromisoformat(event_start_str.replace("Z", "+00:00"))
                # Проверяем совпадение времени (с допуском в 1 минуту)
                if abs((event_start.replace(tzinfo=None) - start).total_seconds()) < 60:
                    # Проверяем, содержит ли название события имя пользователя
                    if user_name.lower() in summary:
                        service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
                        notify_admin_cancel(user_name, slot_iso)
                        print(f"[cancel_slot] Событие удалено: {event_id}")
                        return True
            except Exception as e:
                print("[cancel_slot] Ошибка парсинга времени:", e)
                continue
                
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
            event_id = event.get("id")
            if name and time_str and event_id:
                bookings.append({
                    "name": name,
                    "slot": time_str,
                    "eventId": event_id
                })
        return bookings
    except Exception as e:
        print(f"[get_all_bookings] Ошибка: {e}")
        return []

def get_user_bookings(user_name: str) -> list[dict]:
    """Получить записи конкретного пользователя"""
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
            summary = event.get("summary", "")
            # Проверяем, содержит ли название события имя пользователя
            if user_name.lower() in summary.lower():
                time_str = event.get("start", {}).get("dateTime")
                event_id = event.get("id")
                description = event.get("description", "")
                
                # Извлекаем информацию о типе массажа и длительности из описания
                massage_type = "classic"
                duration = 60
                if "Тип:" in description:
                    type_line = [line for line in description.split('\n') if "Тип:" in line]
                    if type_line:
                        massage_name = type_line[0].split("Тип:")[1].strip()
                        # Обратное преобразование названия в ID
                        massage_name_to_id = {
                            "Классический массаж": "classic",
                            "Массаж шейно-воротниковой зоны": "neck-shoulder",
                            "Массаж спины": "back",
                            "Массаж спины и шейно-воротниковой зоны": "back-neck",
                            "Массаж горячими камнями (стоун-терапия)": "stone",
                            "Лимфодренажный массаж": "lymphatic",
                            "Антицеллюлитный массаж": "anticellulite",
                            "Спортивный массаж": "sports",
                            "Баночный динамический массаж": "cupping"
                        }
                        massage_type = massage_name_to_id.get(massage_name, "classic")
                if "Длительность:" in description:
                    duration_line = [line for line in description.split('\n') if "Длительность:" in line]
                    if duration_line:
                        duration_str = duration_line[0].split("Длительность:")[1].strip().replace(" мин", "")
                        try:
                            duration = int(duration_str)
                        except:
                            duration = 60
                
                if time_str and event_id:
                    bookings.append({
                        "name": user_name,
                        "slot": time_str,
                        "eventId": event_id,
                        "massageType": massage_type,
                        "duration": duration
                    })
        return bookings
    except Exception as e:
        print(f"[get_user_bookings] Ошибка: {e}")
        return []
