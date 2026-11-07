const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
require('dotenv').config();

const migrationsDir = path.join(__dirname);

/**
 * Obtiene la lista de archivos de migración ordenados por nombre.
 * @returns {string[]} Nombres de archivo de migración ordenados.
 */
function listarMigraciones() {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/**
 * Lee el contenido de un archivo de migración SQL.
 * @param {string} nombreArchivo - Nombre del archivo .sql
 * @returns {string} Contenido SQL del archivo.
 */
function leerMigracion(nombreArchivo) {
  return fs.readFileSync(path.join(migrationsDir, nombreArchivo), 'utf8');
}

/**
 * Ejecuta todas las migraciones pendientes en una transacción.
 * Registra cada versión aplicada en la tabla schema_migrations.
 */
async function migrar() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Crear tabla de control de migraciones si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        aplicado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Obtener versiones ya aplicadas
    const { rows: aplicadas } = await client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const versionesAplicadas = new Set(aplicadas.map((r) => r.version));

    // Listar todos los archivos de migración disponibles
    const archivosMigracion = listarMigraciones();
    let ejecutadas = 0;

    for (const archivo of archivosMigracion) {
      const version = archivo.replace('.sql', '');

      // Saltar si ya fue aplicada
      if (versionesAplicadas.has(version)) {
        console.log(`⏭️  Migración ${version} ya aplicada, saltando.`);
        continue;
      }

      const sql = leerMigracion(archivo);

      // Ejecutar el SQL de la migración
      await client.query(sql);

      // Registrar la migración como aplicada
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );

      console.log(`✅ Migración ${version} aplicada correctamente.`);
      ejecutadas++;
    }

    await client.query('COMMIT');

    if (ejecutadas === 0) {
      console.log('ℹ️  No hay migraciones pendientes.');
    } else {
      console.log(`\n🎉 Se aplicaron ${ejecutadas} migración(es).`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando migraciones:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrar().catch((error) => {
  console.error('Error fatal:', error.message);
  process.exit(1);
});

module.exports = { migrar };