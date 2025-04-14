#!/bin/bash

echo "✅ Получение доступных слотов на 2025-04-14:"
curl "http://localhost:8000/api/slots?day=2025-04-14"
echo -e "\n"

echo "📅 Попытка бронирования слота на 2025-04-14T17:00:00:"
curl -X POST http://localhost:8000/api/book   -H "Content-Type: application/json"   -d @test.json
echo -e "\n"

echo "❌ Попытка удаления слота на 2025-04-14T17:00:00:"
curl -X POST http://localhost:8000/api/cancel \
  -H "Content-Type: application/json" \
  -d @cancel.json

# echo "📅 Попытка получить список броней админу"
# curl http://localhost:8000/api/records
# echo -e "\n"
