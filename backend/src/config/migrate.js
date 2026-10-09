const pool = require('./db');

// Agrega columnas aquí para que se creen automáticamente al arrancar
const schema = [
  {
    table: 'users',
    create: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    columns: [
      { name: 'name',       def: 'VARCHAR(100) NOT NULL' },
      { name: 'email',      def: 'VARCHAR(150)' },
      { name: 'password',   def: 'VARCHAR(255) NOT NULL' },
      { name: 'created_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'role',       def: "VARCHAR(20) NOT NULL DEFAULT 'consulta'" },
    ],
  },
  {
    table: 'items',
    create: `
      CREATE TABLE IF NOT EXISTS items (
        codigo VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL DEFAULT '',
        lead_time INTEGER NOT NULL DEFAULT 0,
        stock DOUBLE PRECISION NOT NULL DEFAULT 0,
        seguridad DOUBLE PRECISION NOT NULL DEFAULT 0,
        lote_min DOUBLE PRECISION NOT NULL DEFAULT 0,
        multiplo DOUBLE PRECISION NOT NULL DEFAULT 0
      )
    `,
    columns: [
      { name: 'nombre',    def: "VARCHAR(150) NOT NULL DEFAULT ''" },
      { name: 'lead_time', def: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'stock',     def: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
      { name: 'seguridad', def: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
      { name: 'lote_min',  def: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
      { name: 'multiplo',  def: 'DOUBLE PRECISION NOT NULL DEFAULT 0' },
    ],
  },
  {
    table: 'bom',
    create: `
      CREATE TABLE IF NOT EXISTS bom (
        padre VARCHAR(50) REFERENCES items(codigo) ON DELETE CASCADE,
        hijo  VARCHAR(50) REFERENCES items(codigo) ON DELETE CASCADE,
        qty DOUBLE PRECISION NOT NULL CHECK (qty > 0),
        PRIMARY KEY (padre, hijo)
      )
    `,
    columns: [],
  },
  {
    table: 'recepciones',
    create: `
      CREATE TABLE IF NOT EXISTS recepciones (
        id SERIAL PRIMARY KEY,
        item VARCHAR(50) REFERENCES items(codigo) ON DELETE CASCADE,
        periodo INTEGER NOT NULL,
        qty DOUBLE PRECISION NOT NULL
      )
    `,
    columns: [],
  },
  {
    table: 'demanda',
    create: `
      CREATE TABLE IF NOT EXISTS demanda (
        id SERIAL PRIMARY KEY,
        item VARCHAR(50) REFERENCES items(codigo) ON DELETE CASCADE,
        periodo INTEGER NOT NULL,
        qty DOUBLE PRECISION NOT NULL
      )
    `,
    columns: [],
  },
  {
    table: 'corridas',
    create: `
      CREATE TABLE IF NOT EXISTS corridas (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(100),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resultado JSONB
      )
    `,
    columns: [],
  },
];

async function runMigrations() {
  for (const entry of schema) {
    await pool.query(entry.create);

    const { rows } = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
      [entry.table]
    );
    const existing = rows.map((r) => r.column_name);

    for (const col of entry.columns) {
      if (!existing.includes(col.name)) {
        await pool.query(`ALTER TABLE ${entry.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}`);
        console.log(`Columna añadida: ${entry.table}.${col.name}`);
      }
    }

    console.log(`Tabla lista: ${entry.table}`);
  }
}

module.exports = runMigrations;
