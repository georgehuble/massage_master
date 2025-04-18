from aiogram import Bot, Dispatcher, types, F
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart
import os
from fastapi import FastAPI
import uvicorn
import asyncio
from datetime import datetime, timedelta

from calendar_utils import get_calendar_service, create_event, get_busy_slots_for_day
from aiogram.types import WebAppInfo

API_TOKEN = os.getenv("BOT_TOKEN")
CALENDAR_ID = os.getenv("CALENDAR_ID")

bot = Bot(token=API_TOKEN)
dp = Dispatcher()
app = FastAPI()

# Храним выбранные пользователем состояния
USER_STATE = {}


@dp.message(CommandStart())
async def send_welcome(message: types.Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="📅 Записаться через WebApp",
            web_app=WebAppInfo(url="https://filed-body-circuits-republic.trycloudflare.com")
        )]
    ])
    await message.answer("Добро пожаловать! Запишитесь на массаж через удобный календарь:", reply_markup=keyboard)


@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message):
    selected_time = datetime.fromisoformat(message.web_app_data.data)
    now = datetime.utcnow() + timedelta(hours=3)  # учёт московского времени

    # Проверка правил
    if selected_time < now + timedelta(hours=4):
        await message.answer("Вы не можете записаться менее чем за 4 часа.")
        return

    if selected_time > now + timedelta(days=14):
        await message.answer("Нельзя записываться более чем на 2 недели вперёд.")
        return

    service = get_calendar_service()
    busy = get_busy_slots_for_day(service, selected_time.date())
    if selected_time in busy:
        await message.answer("Это время уже занято.")
        return

    link = create_event(selected_time, message.from_user.full_name)
    await message.answer(f"✅ Вы записаны на {selected_time.strftime('%d.%m %H:%M')}!\n\n📅 {link}")


async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
