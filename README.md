# CanchaYA ⚽

Sistema de reservas de canchas de fútbol — fullstack con Go y React.

![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)

## ¿Qué es?

CanchaYA es una aplicación web para gestionar reservas de canchas deportivas. Permite a los clientes ver disponibilidad y reservar turnos, y a los administradores gestionar canchas, ver quién reservó cada turno y consultar reportes de ingresos y ocupación.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Go + Gin |
| Base de datos | PostgreSQL |
| Auth | JWT + bcrypt |
| Frontend | React + Vite |
| Estilos | Tailwind CSS |
| Animaciones | Framer Motion |
| Gráficos | Recharts |
| Infra local | Docker |

## Arquitectura del backend
```
backend/
  cmd/api/main.go           → punto de entrada
  internal/
    handlers/               → HTTP (thin handlers, sin lógica)
    services/               → lógica de negocio
    repositories/           → queries SQL
    models/                 → structs
    middlewares/            → auth JWT, roles
  pkg/utils/                → db, helpers
```

La regla principal: **los handlers no tienen lógica de negocio**. Todo vive en los services. Esto hace que cada capa sea testeable de forma independiente.

## Funcionalidades

### Cliente
- Registro e inicio de sesión
- Grilla visual de disponibilidad por fecha y cancha
- Reservar un turno clickeando una celda libre
- Ver historial de reservas y cancelar turnos

### Admin
- Panel de gestión de canchas (crear, editar, activar/desactivar, eliminar)
- Grilla con nombre del cliente en cada turno reservado
- Modal de detalle con datos completos del cliente al clickear un turno
- Reportes de ingresos por día y ocupación por cancha con gráficos interactivos

## Decisiones técnicas

**Anti double-booking con doble capa**
El service valida la disponibilidad antes de insertar. Además, la base de datos tiene un `EXCLUDE USING gist` constraint que rechaza solapamientos a nivel de transacción. Esto cubre el caso de dos requests concurrentes simultáneas.

**Precios dinámicos**
La función `calcularPrecio()` vive en el service y aplica las reglas de negocio: precio base × duración, +20% fines de semana, +15% horario nocturno (20:00-24:00). Fácil de extender con nuevas reglas sin tocar el handler.

**Autenticación stateless**
JWT con claims de usuario y rol. El middleware extrae el rol del token y lo inyecta en el contexto de Gin. Las rutas de admin usan un segundo middleware `RoleRequired("admin")`.

**Handlers finos**
Los handlers parsean el request, llaman al service, y devuelven la respuesta. Nada más. En una entrevista podés decir exactamente dónde vive cada responsabilidad.

## Tests
```bash
cd backend
go test ./internal/services/tests/... -v
```

Casos cubiertos:
- Precio correcto en día de semana, fin de semana y horario nocturno
- Precio correcto para 60 y 90 minutos
- Cancelación con más de 24hs → permitida
- Cancelación con menos de 24hs → detectada como tardía  
- Turno ya iniciado → no se puede cancelar
- Horario válido e inválido

## Cómo correr el proyecto

**Requisitos:** Go 1.21+, Node 18+, Docker
```bash
# Clonar
git clone https://github.com/isaactadeo/cancha-ya.git
cd cancha-ya

# Base de datos
cd backend
docker-compose up -d
cat docs/schema.sql | docker exec -i cancha-ya-api-db-1 psql -U canchauser -d canchadb

# Backend
go run cmd/api/main.go

# Frontend (en otra terminal)
cd ../frontend
npm install
npm run dev
```

## Endpoints principales
```
POST   /auth/register
POST   /auth/login
GET    /canchas
POST   /api/reservas
GET    /api/mis-reservas
DELETE /api/reservas/:id
GET    /api/reservas?fecha=
POST   /api/admin/canchas
PUT    /api/admin/canchas/:id
DELETE /api/admin/canchas/:id
GET    /api/admin/reservas?fecha=
GET    /api/admin/reportes/ingresos?desde=&hasta=
GET    /api/admin/reportes/ocupacion?desde=&hasta=
```

## Estructura del monorepo
```
cancha-ya/
  backend/    API REST en Go
  frontend/   App en React
  README.md
```