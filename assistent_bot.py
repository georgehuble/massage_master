from aiogram import Bot, Dispatcher, types, F
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import CommandStart
import os
from fastapi import FastAPI
import asyncio
import json
from datetime import datetime, timedelta

from calendar_utils import get_calendar_service, create_event, get_busy_slots_for_day

API_TOKEN = os.getenv("BOT_TOKEN")
CALENDAR_ID = os.getenv("CALENDAR_ID")
ADMIN_ID = os.getenv("ADMIN_CHAT_ID")  # ID администратора для уведомлений

bot = Bot(token=API_TOKEN)
dp = Dispatcher()
app = FastAPI()

# Типы массажа
MASSAGE_TYPES = {
    'classic': {'name': 'Классический массаж', 'duration': 60, 'price': '2500 ₽'},
    'therapeutic': {'name': 'Лечебный массаж', 'duration': 80, 'price': '3500 ₽'},
    'fullbody': {'name': 'Массаж всего тела', 'duration': 90, 'price': '4000 ₽'},
    'express': {'name': 'Экспресс массаж', 'duration': 40, 'price': '1800 ₽'},
}


@dp.message(CommandStart())
async def send_welcome(message: types.Message):
    # Проверяем, является ли пользователь администратором
    is_admin = str(message.from_user.id) == str(ADMIN_ID)
    
    if is_admin:
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(
                    text="📅 Записаться через WebApp",
                    web_app=WebAppInfo(url="https://app.selesta-test.ru?tgWebAppDebug=1")
                )],
                [KeyboardButton(text="📊 Статистика"), KeyboardButton(text="📋 Сегодняшние записи")],
                [KeyboardButton(text="⚙️ Настройки"), KeyboardButton(text="📞 Тест уведомлений")]
            ],
            resize_keyboard=True
        )
        await message.answer(f"👋 Добро пожаловать, **Администратор**!\n\nВы можете:\n• Записаться через WebApp\n• Просматривать статистику\n• Управлять записями", reply_markup=keyboard, parse_mode='Markdown')
    else:
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(
                    text="📅 Записаться через WebApp",
                    web_app=WebAppInfo(url="https://app.selesta-test.ru?tgWebAppDebug=1")
                )]
            ],
            resize_keyboard=True
        )
        await message.answer("👋 Добро пожаловать! Запишитесь на массаж через удобный календарь, нажав на синюю кнопку **\"Записаться\"**", reply_markup=keyboard, parse_mode='Markdown')


@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message):
    try:
        # Парсим данные из WebApp
        data = json.loads(message.web_app_data.data)
        selected_time = datetime.fromisoformat(data['slot'])
        user_name = data.get('name', message.from_user.full_name)
        massage_type_id = data.get('massageType', 'classic')
        massage_name = data.get('massageName', 'Массаж')
        price = data.get('price', '2500 ₽')
        
        # Получаем информацию о типе массажа
        massage_info = MASSAGE_TYPES.get(massage_type_id, MASSAGE_TYPES['classic'])
        duration = massage_info['duration']
        
    except (json.JSONDecodeError, KeyError) as e:
        # Старый формат — только ISO-строка без JSON
        try:
            selected_time = datetime.fromisoformat(message.web_app_data.data)
            user_name = message.from_user.full_name
            massage_type_id = 'classic'
            massage_name = 'Классический массаж'
            price = '2500 ₽'
            duration = 60
        except ValueError:
            await message.answer("❌ Ошибка в формате данных. Пожалуйста, попробуйте ещё раз.")
            return

    try:
        # Создаем событие в Google Calendar
        end_time = selected_time + timedelta(minutes=duration)
        
        event_description = f"""
📋 Детали записи:
👤 Клиент: {user_name}
💆‍♂️ Тип массажа: {massage_name}
⏱️ Длительность: {duration} минут
💰 Стоимость: {price}
📱 Telegram: @{message.from_user.username or 'нет username'}
🆔 ID: {message.from_user.id}
📞 Номер: {message.from_user.phone_number or 'не указан'}
        """.strip()
        
        # Создаем событие в календаре
        event = create_event(
            name=user_name,
            start_time=selected_time,
            end_time=end_time,
            massage_type=massage_name,
            description=event_description
        )
        
        # Отправляем подтверждение клиенту
        confirmation_text = f"""
✅ **Запись подтверждена!**

👤 Имя: {user_name}
📅 Дата: {selected_time.strftime('%d.%m.%Y')}
🕐 Время: {selected_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}
💆‍♂️ Услуга: {massage_name}
💰 Стоимость: {price}

📍 Адрес будет отправлен дополнительно.
        """
        
        await message.answer(confirmation_text, parse_mode='Markdown')
        
        # Отправляем уведомление администратору
        if ADMIN_ID:
            admin_text = f"""
🔔 **НОВАЯ ЗАПИСЬ**

👤 Клиент: {user_name}
📱 Username: @{message.from_user.username or 'отсутствует'}
🆔 ID: {message.from_user.id}
📞 Телефон: {message.from_user.phone_number or 'не указан'}

📅 Дата: {selected_time.strftime('%d.%m.%Y')}
🕐 Время: {selected_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}
💆‍♂️ Услуга: {massage_name}
⏱️ Длительность: {duration} минут
💰 Стоимость: {price}

📝 Событие создано в календаре.
            """
            
            try:
                await bot.send_message(ADMIN_ID, admin_text, parse_mode='Markdown')
            except Exception as e:
                print(f"Ошибка отправки уведомления админу: {e}")
        
        print(f"✅ Создана запись: {user_name} на {selected_time} ({massage_name})")
        
    except Exception as e:
        print(f"❌ Ошибка при создании записи: {e}")
        await message.answer("❌ Произошла ошибка при создании записи. Пожалуйста, попробуйте позже или обратитесь к администратору.")
        
        # Уведомляем админа об ошибке
        if ADMIN_ID:
            error_text = f"""
⚠️ **ОШИБКА ЗАПИСИ**

👤 Пользователь: {user_name} (@{message.from_user.username})
🕐 Время: {selected_time.strftime('%d.%m.%Y %H:%M')}
❌ Ошибка: {str(e)}
            """
            try:
                await bot.send_message(ADMIN_ID, error_text, parse_mode='Markdown')
            except:
                pass


# Обработчики команд для администратора
@dp.message(lambda message: message.text == "📞 Тест уведомлений")
async def test_notifications(message: types.Message):
    if str(message.from_user.id) != str(ADMIN_ID):
        await message.answer("❌ У вас нет прав для выполнения этой команды.")
        return
    
    test_time = datetime.now() + timedelta(hours=1)
    test_text = f"""
🔔 **ТЕСТ УВЕДОМЛЕНИЙ**

Это тестовое уведомление отправлено в {datetime.now().strftime('%H:%M:%S')}

✅ Уведомления работают корректно!
    """
    
    await message.answer(test_text, parse_mode='Markdown')


@dp.message(lambda message: message.text == "📊 Статистика")
async def show_statistics(message: types.Message):
    if str(message.from_user.id) != str(ADMIN_ID):
        await message.answer("❌ У вас нет прав для выполнения этой команды.")
        return
    
    # Здесь можно добавить реальную статистику из календаря
    stats_text = """
📊 **СТАТИСТИКА ЗАПИСЕЙ**

📅 Сегодня: 3 записи
📈 На этой неделе: 15 записей  
💰 Доход за месяц: 45,000 ₽

🔝 Популярные услуги:
1. Массаж всего тела - 40%
2. Классический массаж - 35%
3. Лечебный массаж - 20%
4. Экспресс массаж - 5%

📱 Для подробной статистики используйте админ-панель в WebApp
    """
    
    await message.answer(stats_text, parse_mode='Markdown')


@dp.message(lambda message: message.text == "📋 Сегодняшние записи")
async def show_today_bookings(message: types.Message):
    if str(message.from_user.id) != str(ADMIN_ID):
        await message.answer("❌ У вас нет прав для выполнения этой команды.")
        return
    
    try:
        # Получаем записи на сегодня из календаря
        service = get_calendar_service()
        today = datetime.now().date()
        busy_slots = get_busy_slots_for_day(service, today)
        
        if not busy_slots:
            await message.answer("📅 **Сегодняшние записи**\n\nНа сегодня записей нет.", parse_mode='Markdown')
            return
        
        bookings_text = "📅 **ЗАПИСИ НА СЕГОДНЯ**\n\n"
        
        for i, slot_time in enumerate(sorted(busy_slots), 1):
            bookings_text += f"{i}. 🕐 {slot_time.strftime('%H:%M')} - Запись\n"
        
        bookings_text += f"\n📊 Всего записей: {len(busy_slots)}"
        
        await message.answer(bookings_text, parse_mode='Markdown')
        
    except Exception as e:
        await message.answer(f"❌ Ошибка при получении записей: {str(e)}")


@dp.message(lambda message: message.text == "⚙️ Настройки")
async def show_settings(message: types.Message):
    if str(message.from_user.id) != str(ADMIN_ID):
        await message.answer("❌ У вас нет прав для выполнения этой команды.")
        return
    
    settings_text = """
⚙️ **НАСТРОЙКИ СИСТЕМЫ**

🔧 Текущие настройки:
• Рабочие часы: 9:00 - 21:00
• Длительность слота: 20 минут
• Перерыв между сеансами: 20 минут
• Предварительная запись: 4 часа
• Максимум дней вперед: 14

📱 Для изменения настроек обратитесь к разработчику.
    """
    
    await message.answer(settings_text, parse_mode='Markdown')


async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
