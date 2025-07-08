# 🔧 Устранение проблем с уведомлениями Telegram бота

## 🚨 Частые причины отсутствия уведомлений

### 1. **Неправильные переменные окружения**

Проверьте наличие всех необходимых переменных:

```bash
# В файле .env или переменных окружения должно быть:
BOT_TOKEN=ваш_токен_бота
VITE_ADMIN_ID=telegram_id_администратора
CALENDAR_ID=id_google_календаря
GOOGLE_APPLICATION_CREDENTIALS=путь_к_файлу_сервисного_аккаунта
```

### 2. **Получение правильного ADMIN_ID**

**Как узнать свой Telegram ID:**

```python
# Добавьте в assistent_bot.py временно:
@dp.message()
async def debug_user_id(message: types.Message):
    await message.answer(f"Ваш ID: {message.from_user.id}")
```

Или используйте бота [@userinfobot](https://t.me/userinfobot)

### 3. **Проверка работы бота**

#### Тест подключения:
```bash
# Запустите бота и проверьте логи
python assistent_bot.py
```

#### Тест уведомлений:
1. Запустите бота `/start`
2. Если вы админ - нажмите "📞 Тест уведомлений"
3. Должно прийти тестовое сообщение

### 4. **Проблемы с правами бота**

Убедитесь что бот:
- ✅ Создан через [@BotFather](https://t.me/BotFather)
- ✅ Имеет правильный токен
- ✅ Не заблокирован пользователем
- ✅ Может отправлять сообщения

### 5. **Диагностика WebApp данных**

Проверьте формат данных от фронтенда:

```javascript
// В App.jsx проверьте что отправляется:
const dataToSend = JSON.stringify({
  slot: selectedSlot,
  name: userNameForBooking,
  massageType: selectedMassageType.id,
  massageName: selectedMassageType.name,
  price: selectedMassageType.price
});
```

### 6. **Проверка логов**

#### В консоли бота должно выводиться:
```
✅ Создана запись: Иван Иванов на 2025-01-15 14:00:00 (Массаж всего тела)
✅ Событие создано: https://calendar.google.com/calendar/event?eid=...
```

#### Если есть ошибки:
```
❌ Ошибка при создании записи: ...
❌ Ошибка создания события в календаре: ...
❌ Ошибка отправки уведомления админу: ...
```

## 🛠️ Пошаговая диагностика

### Шаг 1: Проверить переменные
```bash
echo $BOT_TOKEN
echo $VITE_ADMIN_ID  
echo $CALENDAR_ID
```

### Шаг 2: Проверить бота вручную
```python
import asyncio
from aiogram import Bot

async def test_bot():
    bot = Bot(token="ваш_токен")
    try:
        await bot.send_message(chat_id="ваш_id", text="Тест")
        print("✅ Бот работает")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await bot.session.close()

asyncio.run(test_bot())
```

### Шаг 3: Проверить Google Calendar API
```python
from calendar_utils import get_calendar_service

try:
    service = get_calendar_service()
    calendars = service.calendarList().list().execute()
    print("✅ Google Calendar API работает")
    print(f"Доступно календарей: {len(calendars['items'])}")
except Exception as e:
    print(f"❌ Ошибка Google API: {e}")
```

### Шаг 4: Проверить создание события
```python
from datetime import datetime, timedelta
from calendar_utils import create_event

try:
    test_time = datetime.now() + timedelta(hours=1)
    end_time = test_time + timedelta(minutes=60)
    
    event_link = create_event(
        name="Тестовый пользователь",
        start_time=test_time,
        end_time=end_time,
        massage_type="Тестовый массаж",
        description="Тестовое описание"
    )
    print(f"✅ Событие создано: {event_link}")
except Exception as e:
    print(f"❌ Ошибка создания события: {e}")
```

## 🔍 Частые ошибки и решения

### Ошибка: "Forbidden: bot was blocked by the user"
**Решение:** Пользователь заблокировал бота. Попросите разблокировать.

### Ошибка: "Invalid token"
**Решение:** Проверьте правильность BOT_TOKEN в переменных окружения.

### Ошибка: "Chat not found"
**Решение:** Неправильный ADMIN_ID. Получите корректный ID.

### Ошибка: "Credentials not found"
**Решение:** Проверьте путь к google_key.json и переменную GOOGLE_APPLICATION_CREDENTIALS.

### Ошибка: "Calendar not found"
**Решение:** Проверьте CALENDAR_ID и права доступа сервисного аккаунта.

## 📝 Тестовый чек-лист

- [ ] Бот отвечает на `/start`
- [ ] Админ видит дополнительные кнопки
- [ ] Кнопка "Тест уведомлений" работает
- [ ] WebApp открывается
- [ ] Можно выбрать тип массажа
- [ ] Можно выбрать дату в календаре
- [ ] Можно выбрать время
- [ ] При записи приходит подтверждение клиенту
- [ ] При записи приходит уведомление админу
- [ ] Событие создается в Google Calendar

## 📞 Дополнительная помощь

Если проблема не решается:

1. Проверьте логи сервера
2. Убедитесь что все сервисы запущены
3. Перезапустите бота
4. Проверьте интернет-соединение
5. Обратитесь к разработчику с логами ошибок

---

**Создано для Massage Master Bot v2.0** 🤖 