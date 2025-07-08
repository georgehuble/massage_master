#!/bin/bash

echo "🚀 Запуск проекта Massage Master..."

# Опция для тестирования
if [ "$1" == "--test" ] || [ "$1" == "-t" ]; then
    echo "🧪 Запуск в тестовом режиме..."
    python test_bot.py
    exit 0
fi

# Проверка наличия необходимых файлов
if [ ! -f "cloudflared.sh" ]; then
    echo "❌ Файл cloudflared.sh не найден!"
    exit 1
fi

if [ ! -f "assistent_bot.py" ]; then
    echo "❌ Файл assistent_bot.py не найден!"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден!"
    exit 1
fi

echo "📁 Текущая директория: $(pwd)"

# 1. Запуск Cloudflare туннеля
echo "🌐 Запускаю Cloudflare туннель..."
chmod +x cloudflared.sh
./cloudflared.sh &
CLOUDFLARED_PID=$!
echo "✅ Cloudflare туннель запущен (PID: $CLOUDFLARED_PID)"

# Ждем немного, чтобы туннель инициализировался
sleep 5

# 2. Запуск Docker контейнера с backend
echo "🐳 Запускаю Docker контейнер..."
docker-compose up --build -d
if [ $? -eq 0 ]; then
    echo "✅ Docker контейнер запущен успешно"
else
    echo "❌ Ошибка при запуске Docker контейнера"
    echo "Попробую запустить backend напрямую через Python..."
    
    # Альтернативный запуск через Python, если Docker не работает
    cd backend
    echo "📦 Устанавливаю зависимости Python..."
    python -m pip install -r requirements.txt > /dev/null 2>&1
    echo "🐍 Запускаю backend через uvicorn..."
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    echo "✅ Backend запущен через Python (PID: $BACKEND_PID)"
    cd ..
fi

# Ждем, чтобы backend полностью запустился
sleep 3

# 3. Запуск Telegram бота
echo "🤖 Запускаю Telegram бота..."
python assistent_bot.py &
BOT_PID=$!
echo "✅ Telegram бот запущен (PID: $BOT_PID)"

echo ""
echo "🎉 Все сервисы запущены успешно!"
echo "📊 Статус сервисов:"
echo "   🌐 Cloudflare туннель: PID $CLOUDFLARED_PID"
if [ ! -z "$BACKEND_PID" ]; then
    echo "   🐍 Backend (Python): PID $BACKEND_PID"
else
    echo "   🐳 Backend (Docker): запущен"
fi
echo "   🤖 Telegram бот: PID $BOT_PID"
echo ""
echo "💡 Для остановки всех сервисов запустите: ./stop_project.sh"
echo "📱 Проект доступен через Telegram бота!"

# Сохраняем PID-ы для последующей остановки
echo "$CLOUDFLARED_PID" > .cloudflared.pid
if [ ! -z "$BACKEND_PID" ]; then
    echo "$BACKEND_PID" > .backend.pid
fi
echo "$BOT_PID" > .bot.pid

# Ожидание завершения (чтобы скрипт не закрывался сразу)
echo ""
echo "⏳ Нажмите Ctrl+C для остановки всех сервисов..."
wait 