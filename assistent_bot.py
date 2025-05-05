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

bot = Bot(token=API_TOKEN)
dp = Dispatcher()
app = FastAPI()

# Храним выбранные пользователем состояния
USER_STATE = {}


@dp.message(CommandStart())
async def send_welcome(message: types.Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(
                text="📅 Записаться через WebApp",
                web_app=WebAppInfo(url="https://app.selesta-test.ru?tgWebAppDebug=1")
            )]
        ],
        resize_keyboard=True
    )
    await message.answer("Добро пожаловать! Запишитесь на массаж через удобный календарь:", reply_markup=keyboard)


@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message):
    try:
        # Парсим данные из WebApp
        data = json.loads(message.web_app_data.data)
        selected_time = datetime.fromisoformat(data['slot'])
        # Всегда берём настоящее имя из Telegram
        user_name = message.from_user.full_name
    except (json.JSONDecodeError, KeyError):
        # Старый формат — только ISO-строка без JSON
        try:
            selected_time = datetime.fromisoformat(message.web_app_data.data)
            user_name = message.from_user.full_name
        except ValueError:
            await message.answer("Ошибка в формате данных. Пожалуйста, попробуйте ещё раз.")
            return

    # Здесь ваша логика сохранения записи:
    # например, сохраняем в базу: save_booking(user_name, selected_time, ...)
    # и отправляем подтверждение клиенту и уведомление администратору

    await message.answer(f"Спасибо, {user_name}! Ваша запись на {selected_time.strftime('%d.%m.%Y %H:%M')} подтверждена.")


async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
