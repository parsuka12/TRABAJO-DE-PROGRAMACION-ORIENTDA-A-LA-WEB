-- Migración 002: Crear tabla de corridas (ejecuciones de MRP)

CREATE TABLE IF NOT EXISTS corridas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW(),
    horizonte INTEGER,
    usuario_id INTEGER,
    resultado JSONB
);

CREATE INDEX IF NOT EXISTS idx_corridas_fecha ON corridas(fecha DESC);