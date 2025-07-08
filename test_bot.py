#!/usr/bin/env python3
"""
Скрипт для тестирования Telegram бота и уведомлений
Massage Master Bot v2.0
"""

import asyncio
import os
import json
from datetime import datetime, timedelta
from aiogram import Bot

# Настройки из переменных окружения
BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_ID = os.getenv("VITE_ADMIN_ID")
CALENDAR_ID = os.getenv("CALENDAR_ID")

# Цвета для консоли
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="info"):
    """Печать сообщений с цветами"""
    colors = {
        "success": Colors.GREEN + "✅ ",
        "error": Colors.RED + "❌ ", 
        "warning": Colors.YELLOW + "⚠️ ",
        "info": Colors.BLUE + "ℹ️ ",
        "test": Colors.PURPLE + "🧪 "
    }
    
    print(f"{colors.get(status, '')}{message}{Colors.RESET}")

def check_environment():
    """Проверка переменных окружения"""
    print_status("Проверка переменных окружения...", "test")
    
    variables = {
        "BOT_TOKEN": BOT_TOKEN,
        "ADMIN_ID": ADMIN_ID, 
        "CALENDAR_ID": CALENDAR_ID,
        "GOOGLE_APPLICATION_CREDENTIALS": os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    }
    
    all_good = True
    for name, value in variables.items():
        if value:
            print_status(f"{name}: {'*' * 10} (установлена)", "success")
        else:
            print_status(f"{name}: НЕ УСТАНОВЛЕНА", "error")
            all_good = False
    
    return all_good

async def test_bot_connection():
    """Тест подключения к боту"""
    print_status("Тестирование подключения к боту...", "test")
    
    if not BOT_TOKEN:
        print_status("BOT_TOKEN не установлен", "error")
        return False
    
    try:
        bot = Bot(token=BOT_TOKEN)
        bot_info = await bot.get_me()
        print_status(f"Бот подключен: @{bot_info.username} ({bot_info.first_name})", "success")
        await bot.session.close()
        return True
    except Exception as e:
        print_status(f"Ошибка подключения к боту: {e}", "error")
        return False

async def test_admin_notification():
    """Тест отправки уведомления администратору"""
    print_status("Тестирование уведомлений админу...", "test")
    
    if not BOT_TOKEN or not ADMIN_ID:
        print_status("BOT_TOKEN или ADMIN_ID не установлены", "error")
        return False
    
    try:
        bot = Bot(token=BOT_TOKEN)
        
        test_message = f"""
🔔 **ТЕСТОВОЕ УВЕДОМЛЕНИЕ**

Время: {datetime.now().strftime('%H:%M:%S')}
Дата: {datetime.now().strftime('%d.%m.%Y')}

✅ Уведомления работают корректно!

🤖 Massage Master Bot v2.0
        """
        
        await bot.send_message(
            chat_id=ADMIN_ID,
            text=test_message,
            parse_mode='Markdown'
        )
        
        print_status("Тестовое уведомление отправлено", "success")
        await bot.session.close()
        return True
        
    except Exception as e:
        print_status(f"Ошибка отправки уведомления: {e}", "error")
        return False

def test_google_calendar():
    """Тест подключения к Google Calendar"""
    print_status("Тестирование Google Calendar API...", "test")
    
    try:
        from calendar_utils import get_calendar_service
        
        service = get_calendar_service()
        calendars = service.calendarList().list().execute()
        
        print_status(f"Google Calendar API работает. Календарей: {len(calendars['items'])}", "success")
        
        # Поиск нашего календаря
        for calendar in calendars['items']:
            if calendar['id'] == CALENDAR_ID:
                print_status(f"Целевой календарь найден: {calendar.get('summary', 'Без названия')}", "success")
                return True
        
        print_status("Целевой календарь не найден", "warning")
        return True  # API работает, но календарь не найден
        
    except ImportError:
        print_status("Модуль calendar_utils не найден", "error")
        return False
    except Exception as e:
        print_status(f"Ошибка Google Calendar API: {e}", "error")
        return False

def test_event_creation():
    """Тест создания события в календаре"""
    print_status("Тестирование создания события...", "test")
    
    try:
        from calendar_utils import create_event
        
        # Создаем тестовое событие через час
        test_time = datetime.now() + timedelta(hours=1)
        end_time = test_time + timedelta(minutes=60)
        
        event_link = create_event(
            name="ТЕСТ - Удалить после проверки",
            start_time=test_time,
            end_time=end_time,
            massage_type="Тестовый массаж",
            description="Это тестовое событие. Можно удалить."
        )
        
        print_status(f"Тестовое событие создано: {event_link}", "success")
        return True
        
    except ImportError:
        print_status("Модуль calendar_utils не найден", "error")
        return False
    except Exception as e:
        print_status(f"Ошибка создания события: {e}", "error")
        return False

def test_webapp_data_format():
    """Тест формата данных от WebApp"""
    print_status("Тестирование формата данных WebApp...", "test")
    
    # Симулируем данные от фронтенда
    test_data = {
        "slot": "2025-01-15T14:00:00.000Z",
        "name": "Тестовый пользователь",
        "massageType": "fullbody",
        "massageName": "Массаж всего тела",
        "price": "4000 ₽"
    }
    
    try:
        # Проверяем, что данные корректно сериализуются
        json_data = json.dumps(test_data)
        parsed_data = json.loads(json_data)
        
        # Проверяем формат времени
        selected_time = datetime.fromisoformat(parsed_data['slot'])
        
        print_status("Формат данных WebApp корректен", "success")
        print_status(f"Пример: {parsed_data['name']} - {parsed_data['massageName']} на {selected_time.strftime('%d.%m.%Y %H:%M')}", "info")
        return True
        
    except Exception as e:
        print_status(f"Ошибка формата данных: {e}", "error")
        return False

async def run_all_tests():
    """Запуск всех тестов"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}🧪 ТЕСТИРОВАНИЕ MASSAGE MASTER BOT v2.0{Colors.RESET}")
    print("=" * 50)
    
    tests = [
        ("Переменные окружения", check_environment),
        ("Подключение к боту", test_bot_connection),
        ("Google Calendar API", test_google_calendar),
        ("Создание события", test_event_creation),
        ("Формат данных WebApp", test_webapp_data_format),
        ("Уведомления админу", test_admin_notification),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{Colors.CYAN}📋 {test_name}:{Colors.RESET}")
        
        if asyncio.iscoroutinefunction(test_func):
            result = await test_func()
        else:
            result = test_func()
            
        results.append((test_name, result))
    
    # Итоги
    print(f"\n{Colors.BOLD}📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:{Colors.RESET}")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ ПРОШЕЛ" if result else "❌ НЕ ПРОШЕЛ"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.RESET} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n{Colors.BOLD}Результат: {passed}/{total} тестов прошли{Colors.RESET}")
    
    if passed == total:
        print_status("Все тесты пройдены! Система готова к работе. 🎉", "success")
    else:
        print_status("Есть проблемы. Проверьте конфигурацию.", "warning")
        print_status("Смотрите TROUBLESHOOTING_NOTIFICATIONS.md для решения проблем", "info")

if __name__ == "__main__":
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print_status("\nТестирование прервано пользователем", "warning")
    except Exception as e:
        print_status(f"Критическая ошибка: {e}", "error") 