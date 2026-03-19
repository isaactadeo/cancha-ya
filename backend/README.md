# CanchaYa API

REST API para gestión de reservas de canchas de fútbol. Construida en Go con arquitectura en capas, JWT, precios dinámicos y control de solapamiento a nivel de base de datos.

## Stack

- **Go** + Gin
- **PostgreSQL** con constraint de exclusión para anti-solapamiento
- **JWT** para autenticación
- **Docker** para la base de datos local

## Arquitectura
```
cmd/api/          → entrada
internal/
  handlers/       → HTTP (thin handlers)
  services/       → lógica de negocio
  repositories/   → queries SQL
  models/         → structs
  middlewares/    → auth JWT, roles
pkg/utils/        → db, helpers
```

Toda la lógica de negocio vive en `services/`. Los handlers solo reciben, delegan y responden.

## Features

- Registro y login con bcrypt + JWT
- Roles: `admin`, `empleado`, `cliente`
- CRUD de canchas (solo admin)
- Reservas con validación de solapamiento (doble capa: service + DB constraint)
- Precios dinámicos: +20% fin de semana, +15% horario nocturno (20:00-24:00)
- Cancelación con validaciones de estado
- Reportes de ingresos y ocupación por período (solo admin)

## Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login, devuelve JWT |

### Canchas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/canchas` | Listar canchas (público) |
| GET | `/canchas/:id` | Ver cancha (público) |
| POST | `/api/admin/canchas` | Crear cancha (admin) |
| PUT | `/api/admin/canchas/:id` | Editar cancha (admin) |
| DELETE | `/api/admin/canchas/:id` | Eliminar cancha (admin) |

### Reservas
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/reservas` | Crear reserva |
| GET | `/api/mis-reservas` | Historial del usuario |
| GET | `/api/reservas?fecha=` | Reservas por fecha |
| DELETE | `/api/reservas/:id` | Cancelar reserva |

### Reportes (admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/reportes/ingresos?desde=&hasta=` | Ingresos por período |
| GET | `/api/admin/reportes/ocupacion?desde=&hasta=` | Ocupación por cancha |

## Correr localmente

**Requisitos:** Go 1.21+, Docker
```bash
# 1. Clonar el repo
git clone https://github.com/isaactadeo/cancha-ya-api.git
cd cancha-ya-api

# 2. Levantar Postgres
docker-compose up -d

# 3. Cargar el schema
cat docs/schema.sql | docker exec -i cancha-ya-api-db-1 psql -U canchauser -d canchadb

# 4. Correr el servidor
go run cmd/api/main.go
```

El servidor queda en `http://localhost:8080`.

## Ejemplo de uso
```bash
# Registrarse
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Isaac Tadeo","email":"isaac@test.com","password":"123456"}'

# Crear reserva (con token)
curl -X POST http://localhost:8080/api/reservas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"court_id":1,"start_time":"2026-03-21T21:00:00","duration":60}'
```

## Decisiones técnicas

**Anti double-booking con dos capas:** el service valida antes de insertar, y la DB tiene un `EXCLUDE USING gist` constraint que rechaza solapamientos a nivel de transacción. Esto cubre el caso de dos requests concurrentes simultáneas.

**Precios dinámicos en el service:** la lógica de precios vive en `calcularPrecio()` dentro del service, no en el handler ni en la DB. Fácil de testear y de extender con nuevas reglas.

**Handlers finos:** los handlers no tienen lógica de negocio. Solo parsean el request, llaman al service y devuelven la respuesta. Esto hace que el sistema sea testeable por capas.