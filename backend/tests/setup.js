// Configuración de tests de integración E2E
// Este archivo se ejecuta antes de los tests para configurar la base de datos de prueba

require('dotenv').config();

// Configuración para base de datos de prueba
// Se puede configurar via variables de entorno:
// TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_SSL

const testDbConfig = {
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || process.env.DB_NAME || 'backweb_db',
  user: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.TEST_DB_SSL === 'true' || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
};

// Verificar si la base de datos está disponible
async function verificarConexion() {
  const { Pool } = require('pg');
  const pool = new Pool(testDbConfig);

  try {
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    return false;
  }
}

// Crear esquema de prueba si no existe
async function inicializarEsquema() {
  const { Pool } = require('pg');
  const pool = new Pool(testDbConfig);

  const esquema = `
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

    -- Tabla BOM
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

    -- Tabla de corridas (ejecuciones de MRP)
    CREATE TABLE IF NOT EXISTS corridas (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT NOW(),
        horizonte INTEGER,
        usuario_id INTEGER,
        resultado JSONB
    );

    -- Índices
    CREATE INDEX IF NOT EXISTS idx_bom_componente ON bom(componente_id);
    CREATE INDEX IF NOT EXISTS idx_demandas_articulo ON demandas(articulo_id);
    CREATE INDEX IF NOT EXISTS idx_recepciones_articulo ON recepciones(articulo_id);
  `;

  try {
    await pool.query(esquema);
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    console.error('Error inicializando esquema:', error.message);
    return false;
  }
}

module.exports = {
  testDbConfig,
  verificarConexion,
  inicializarEsquema,
};