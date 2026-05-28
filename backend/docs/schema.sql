CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name  VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    phone      VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role       VARCHAR(20) NOT NULL DEFAULT 'cliente'
                   CHECK (role IN ('admin', 'empleado', 'cliente')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE courts (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(50) NOT NULL,
    type           VARCHAR(5) NOT NULL CHECK (type IN ('5', '7', '11')),
    price_per_hour DECIMAL(10,2) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id),
    court_id    INT  NOT NULL REFERENCES courts(id),
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'reservada'
                    CHECK (status IN ('reservada', 'cancelada', 'jugada')),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        court_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);