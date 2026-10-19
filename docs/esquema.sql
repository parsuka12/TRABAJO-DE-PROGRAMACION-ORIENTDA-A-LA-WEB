-- Base de datos para el proyecto MRP Industrial

-- Tabla de articulos
-- Aqui guardamos los productos y materiales que se usan.
CREATE TABLE articulos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    stock NUMERIC(10,2) DEFAULT 0 CHECK (stock >= 0),
    stock_seguridad NUMERIC(10,2) DEFAULT 0 CHECK (stock_seguridad >= 0),
    tiempo_entrega INTEGER DEFAULT 0 CHECK (tiempo_entrega >= 0),
    lote_minimo NUMERIC(10,2) DEFAULT 0 CHECK (lote_minimo >= 0),
    multiplo NUMERIC(10,2) DEFAULT 1 CHECK (multiplo > 0)
);

-- Tabla BOM
-- Sirve para saber que materiales necesita un producto.
CREATE TABLE bom (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    componente_id INTEGER NOT NULL REFERENCES articulos(id),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
    CHECK (articulo_id <> componente_id),
    UNIQUE (articulo_id, componente_id)
);

-- Tabla de demandas
-- Aqui guardamos cuantos productos se necesitan y en que periodo.
CREATE TABLE demandas (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    periodo INTEGER NOT NULL CHECK (periodo >= 0),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0)
);

-- Tabla de recepciones
-- Aqui guardamos los materiales que se espera recibir.
CREATE TABLE recepciones (
    id SERIAL PRIMARY KEY,
    articulo_id INTEGER NOT NULL REFERENCES articulos(id),
    periodo INTEGER NOT NULL CHECK (periodo >= 0),
    cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0)
);