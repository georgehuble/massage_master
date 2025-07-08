# Massage Master

**Система записи на массаж через Telegram WebApp**

Полнофункциональное приложение для записи на массаж с интеграцией Telegram WebApp, Google Calendar и административной панелью. Разработано Озеровым Георгием Сергеевичем.

## 🚀 Особенности

- 📱 **Telegram WebApp интерфейс** - удобная запись прямо в Telegram
- 📅 **Интеграция с Google Calendar** - автоматическое управление расписанием
- 👤 **Админ панель** - просмотр всех записей для администратора
- 🔔 **Уведомления** - автоматические сообщения о записях и отменах
- ⏰ **Умная блокировка** - защита от случайных повторных записей
- 🕒 **Динамическое расписание** - слоты с 10:00 до 21:00 с учетом занятости
- 📱 **Адаптивный дизайн** - оптимизировано для мобильных устройств

## 🏗️ Архитектура

```
massage_master/
├── frontend/           # React + Vite приложение (Telegram WebApp)
├── backend/           # FastAPI сервер с Google Calendar API
├── assistent_bot.py   # Telegram бот для уведомлений
├── docker-compose.yml # Docker конфигурация
└── README.md          # Документация
```

### Frontend (React + Vite)
- **Технологии**: React 18, Vite, TailwindCSS, React Query
- **Компоненты**: DatePicker, BookingForm, AdminPanel
- **Интеграция**: Telegram WebApp API, haptic feedback
- **Функции**: Выбор даты/времени, бронирование, отмена записей

### Backend (FastAPI)
- **Технологии**: FastAPI, Google Calendar API, Python 3.13
- **API Endpoints**:
  - `GET /api/slots` - получение свободных слотов
  - `POST /api/book` - бронирование слота
  - `POST /api/cancel` - отмена записи
  - `GET /api/records` - все записи (админ)

### Telegram Bot
- **Уведомления**: новые записи, отмены
- **WebApp**: кнопка запуска приложения
- **Обработка**: данных из WebApp

## 🛠️ Установка и запуск

### Предварительные требования

1. **Google Calendar API**:
   - Создайте проект в Google Cloud Console
   - Включите Calendar API
   - Создайте Service Account и скачайте JSON ключ
   - Дайте доступ к календарю Service Account email

2. **Telegram Bot**:
   - Создайте бота через @BotFather
   - Получите токен бота
   - Настройте WebApp URL

### Переменные окружения

Создайте файл `.env`:

```env
# Telegram Bot
BOT_TOKEN=your_bot_token_here
ADMIN_ID=your_telegram_user_id

# Google Calendar
GOOGLE_APPLICATION_CREDENTIALS=/app/google_key.json
CALENDAR_ID=your_calendar_id@gmail.com

# API
VITE_API_BASE=/api
VITE_ADMIN_ID=your_telegram_user_id
```

### Запуск через Docker

```bash
# Клонирование репозитория
git clone <repository_url>
cd massage_master

# Размещение Google Service Account ключа
cp your_google_key.json ./google_key.json

# Создание .env файла с вашими настройками
cp .env.example .env

# Запуск приложения
docker-compose up -d
```

### Ручная установка

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run build
# Статические файлы будут в dist/
```

#### Telegram Bot
```bash
python assistent_bot.py
```

## 📋 Использование

### Для клиентов

1. **Открытие**: Нажмите кнопку "📅 Записаться через WebApp" в боте
2. **Выбор даты**: Используйте iOS-style date picker
3. **Выбор времени**: Выберите свободный слот из доступных
4. **Бронирование**: Нажмите "Записаться" для подтверждения
5. **Управление**: Отмените или перезапишитесь через интерфейс

### Для администратора

- **Просмотр записей**: Автоматический доступ к админ панели
- **Уведомления**: Получение сообщений о новых записях и отменах
- **Календарь**: Управление через Google Calendar

## 🔧 Конфигурация

### Рабочие часы
По умолчанию: 10:00 - 21:00
Настройка в `backend/google_calendar.py`:
```python
for hour in range(10, 21):  # Измените диапазон часов
```

### Продолжительность сеанса
По умолчанию: 1 час
Настройка в `backend/booking.py`:
```python
end = start + timedelta(hours=1)  # Измените длительность
```

### Блокировка повторных записей
По умолчанию: 15 секунд
Настройка в `frontend/src/App.jsx`:
```javascript
const [countdown, setCountdown] = useState(15);  // Измените время
```

## 📱 Компоненты

### DatePickerIOS
- iOS-стиль выбора даты
- Поддержка тач-жестов
- Локализация на русский язык

### BookingConfirmation
- Отображение подтвержденных записей
- Возможность отмены
- Кнопка повторной записи

### AdminRecords
- Список всех записей
- Информация о клиентах
- Время записей

## 🔒 Безопасность

- **Аутентификация**: Через Telegram WebApp initData
- **Авторизация**: Проверка ADMIN_ID для админ функций
- **Валидация**: Проверка данных на frontend и backend
- **Защита**: Блокировка спама записями

## 🐛 Решение проблем

### Ошибки подключения к Google Calendar
```bash
# Проверьте переменные окружения
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $CALENDAR_ID

# Проверьте права доступа к ключу
ls -la google_key.json
```

### Проблемы с Telegram WebApp
```bash
# Проверьте URL в настройках бота
# Убедитесь что сертификат HTTPS действителен
# Проверьте CORS настройки в backend/main.py
```

### Ошибки сборки frontend
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 API Документация

### GET /api/slots
Получение свободных слотов на дату

**Параметры:**
- `day` (string): Дата в формате YYYY-MM-DD

**Ответ:**
```json
["2025-01-20T10:00:00", "2025-01-20T11:00:00", ...]
```

### POST /api/book
Бронирование слота

**Тело запроса:**
```json
{
  "name": "Имя клиента",
  "slot": "2025-01-20T10:00:00"
}
```

**Ответ:**
```json
{"success": true}
```

### POST /api/cancel
Отмена записи

**Тело запроса:**
```json
{
  "name": "Имя клиента", 
  "slot": "2025-01-20T10:00:00"
}
```

### GET /api/records
Получение всех записей (только админ)

**Ответ:**
```json
[
  {
    "name": "Имя клиента",
    "slot": "2025-01-20T10:00:00"
  }
]
```

## 🔄 Разработка

### Frontend разработка
```bash
cd frontend
npm run dev  # Запуск dev сервера на http://localhost:5173
```

### Backend разработка
```bash
cd backend
uvicorn main:app --reload  # Автоперезагрузка при изменениях
```

### Линтинг и форматирование
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
black .
flake8 .
```

## 📈 Мониторинг

### Логи
- **Backend**: FastAPI автоматические логи
- **Bot**: Логирование через aiogram
- **Frontend**: Browser Console для отладки

### Метрики
- Количество записей через админ панель
- Google Calendar аналитика
- Telegram Bot статистика

## 📝 Лицензия

Все права защищены. © 2025 Озеров Георгий Сергеевич

## 👨‍💻 Автор

**Озеров Георгий Сергеевич**
- Разработчик и владелец проекта
- Все права на исходный код принадлежат автору

## 🤝 Поддержка

При возникновении вопросов или проблем:
1. Проверьте документацию
2. Изучите логи приложения
3. Обратитесь к разработчику

---

*Система разработана для эффективного управления записями с использованием современных технологий и интеграции с популярными сервисами.*
