import requests
import os

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID")

def notify_admin(name: str, slot: str):
    message = f"📅 <b>Новая запись</b>\n👤 {name}\n🕒 {slot}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.ok
    except Exception as e:
        print(f"[notify_admin] Ошибка: {e}")
        return False

def notify_admin_cancel(name: str, slot: str):
    message = f"❌ <b>Запись отменена</b>\n👤 {name}\n🕒 {slot}"
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.ok
    except Exception as e:
        print(f"[notify_admin_cancel] Ошибка: {e}")
        return False