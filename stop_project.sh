#!/bin/bash

echo "🛑 Остановка проекта Massage Master..."

# Функция для безопасной остановки процесса
stop_process() {
    local pid=$1
    local name=$2
    
    if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "⏹️  Останавливаю $name (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null
        sleep 2
        
        # Если процесс все еще работает, принудительно завершаем
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔨 Принудительно завершаю $name..."
            kill -KILL "$pid" 2>/dev/null
        fi
        echo "✅ $name остановлен"
    else
        echo "ℹ️  $name уже остановлен или не найден"
    fi
}

# Остановка Telegram бота
if [ -f ".bot.pid" ]; then
    BOT_PID=$(cat .bot.pid)
    stop_process "$BOT_PID" "Telegram бот"
    rm -f .bot.pid
fi

# Остановка Backend (если запущен через Python)
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    stop_process "$BACKEND_PID" "Backend (Python)"
    rm -f .backend.pid
fi

# Остановка Docker контейнеров
echo "🐳 Останавливаю Docker контейнеры..."
docker-compose down --remove-orphans --volumes 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Docker контейнеры остановлены"
else
    echo "ℹ️  Docker контейнеры не были запущены или уже остановлены"
fi

# Остановка Cloudflare туннеля
if [ -f ".cloudflared.pid" ]; then
    CLOUDFLARED_PID=$(cat .cloudflared.pid)
    stop_process "$CLOUDFLARED_PID" "Cloudflare туннель"
    rm -f .cloudflared.pid
fi

# Дополнительная очистка процессов по именам (на случай если PID файлы потерялись)
echo "🧹 Дополнительная очистка процессов..."
pkill -f "cloudflared tunnel" 2>/dev/null
pkill -f "assistent_bot.py" 2>/dev/null
pkill -f "uvicorn main:app" 2>/dev/null

# Очистка Docker ресурсов
echo "🧹 Очистка Docker ресурсов..."
docker system prune -f 2>/dev/null
docker volume prune -f 2>/dev/null
docker network prune -f 2>/dev/null

# Очистка временных файлов
echo "🗑️  Очистка временных файлов..."
rm -f .bot.pid .backend.pid .cloudflared.pid 2>/dev/null
rm -f *.log 2>/dev/null
rm -rf __pycache__ 2>/dev/null
rm -rf backend/__pycache__ 2>/dev/null

# Очистка кэша npm (если есть)
if [ -d "frontend/node_modules/.cache" ]; then
    echo "🗑️  Очистка npm кэша..."
    rm -rf frontend/node_modules/.cache 2>/dev/null
fi

# Очистка build файлов
if [ -d "frontend/dist" ]; then
    echo "🗑️  Очистка build файлов..."
    rm -rf frontend/dist 2>/dev/null
fi

echo ""
echo "✅ Все сервисы остановлены и очищены!"
echo "🎯 Проект Massage Master полностью выключен"
echo "💡 Для полной очистки Docker выполните: docker system prune -a --volumes -f" 