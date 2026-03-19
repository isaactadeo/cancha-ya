# CanchaYa

Sistema de reservas de canchas de fútbol. Backend en Go y frontend en React.

## Estructura
```
cancha-ya/
  backend/    API REST en Go (Gin + PostgreSQL)
  frontend/   App en React + Tailwind
```

## Levantar el proyecto

### Backend
```bash
cd backend
docker-compose up -d
go run cmd/api/main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```