#!/bin/bash

echo "🧹 Полная очистка проекта Massage Master..."

# Остановка всех сервисов
echo "🛑 Останавливаю все сервисы..."
./stop_project.sh

# Полная очистка Docker
echo "🐳 Полная очистка Docker..."
docker system prune -a --volumes -f
docker builder prune -a -f

# Очистка всех образов
echo "🗑️  Удаление всех Docker образов..."
docker rmi $(docker images -q) 2>/dev/null || echo "ℹ️  Нет образов для удаления"

# Очистка всех контейнеров
echo "🗑️  Удаление всех Docker контейнеров..."
docker rm $(docker ps -aq) 2>/dev/null || echo "ℹ️  Нет контейнеров для удаления"

# Очистка всех volumes
echo "🗑️  Удаление всех Docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || echo "ℹ️  Нет volumes для удаления"

# Очистка всех networks
echo "🗑️  Удаление всех Docker networks..."
docker network rm $(docker network ls -q) 2>/dev/null || echo "ℹ️  Нет networks для удаления"

# Очистка node_modules (если нужно)
read -p "🗑️  Удалить node_modules? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Удаление node_modules..."
    rm -rf frontend/node_modules 2>/dev/null
    rm -f frontend/package-lock.json 2>/dev/null
fi

# Очистка Python кэша
echo "🗑️  Очистка Python кэша..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null

# Очистка временных файлов
echo "🗑️  Очистка временных файлов..."
rm -f *.log 2>/dev/null
rm -f .env 2>/dev/null
rm -f .env.local 2>/dev/null
rm -f .env.production 2>/dev/null

# Очистка IDE файлов
echo "🗑️  Очистка IDE файлов..."
rm -rf .vscode 2>/dev/null
rm -rf .idea 2>/dev/null
rm -f *.swp 2>/dev/null
rm -f *.swo 2>/dev/null

echo ""
echo "✅ Полная очистка завершена!"
echo "🎯 Проект полностью очищен"
echo "💡 Для перезапуска выполните: ./start_project.sh" 