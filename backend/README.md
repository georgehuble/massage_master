# Massage Booking Backend (FastAPI)

## 🚀 Как запустить локально с Docker

1. Установи Docker: https://www.docker.com/products/docker-desktop
2. В терминале:

```
cd backend
docker build -t massage-backend .
docker run -p 8000:8000 massage-backend
```

3. Открывай `http://localhost:8000/api/slots?day=2025-04-10`