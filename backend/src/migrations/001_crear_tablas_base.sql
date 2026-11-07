-- Migración 001: Crear tablas base del sistema MRP

-- Tabla de control de migraciones (se crea automáticamente por el runner, pero se declara aquí para referencia)
-- CREATE TABLE IF NOT EXISTS schema_migrations (
--     version VARCHAR(20) PRIMARY KEY,
--     aplicado_en TIMESTAMP DEFAULT NOW()
-- );

-- Tabla de articulos
CREATE TABLE IF NOT EXISTS articulos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    stock NUMERIC(10,2) DEFAULT 0 CHECK (stock >= 0),
    stock_seguridad NUMERIC(10,2) DEFAULT 0 CHECK (stock_seguridad >= 0),
    tiempo_entrega INTEGER DEFAULT 0 CHECK (tiempo_entrega >= 0),
    lote_minimo NUMERIC(10,2) DEFAULT 0 CHECK (lote_minimo >= 0),
    multiplo NUMERIC(10,2) DEFAULT 1 CHECK (multiplo > 0)
);

-- Tabla BOM (Bill of Materials)
CREATE TABLE IF NOT EXISTS bom (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    componente_id INTEGER NOT NULL REFERENCES articulos(id),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
    CHECK (articulo_id <> componente_id),
    UNIQUE (articulo_id, componente_id)
);

-- Tabla de demandas
CREATE TABLE IF NOT EXISTS demandas (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    periodo INTEGER NOT NULL CHECK (periodo >= 0),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0)
);

-- Tabla de recepciones
CREATE TABLE IF NOT EXISTS recepciones (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    periodo INTEGER NOT NULL CHECK (periodo >= 0),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bom_articulo ON bom(articulo_id);
CREATE INDEX IF NOT EXISTS idx_bom_componente ON bom(componente_id);
CREATE INDEX IF NOT EXISTS idx_demandas_articulo ON demandas(articulo_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_articulo ON recepciones(articulo_id);