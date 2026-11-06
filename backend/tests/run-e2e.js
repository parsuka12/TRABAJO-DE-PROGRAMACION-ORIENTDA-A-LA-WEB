#!/usr/bin/env node
// Script para ejecutar tests E2E con verificación de base de datos

const { verificarConexion, inicializarEsquema } = require('./setup');

async function main() {
  console.log('Verificando conexión a base de datos...');

  const conectado = await verificarConexion();

  if (!conectado) {
    console.log('Base de datos no disponible.');
    console.log('   Configura las variables de entorno para la BD de prueba:');
    console.log('   TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD');
    console.log('   O usa las variables DB_* estándar.');
    console.log('');
    console.log('   Tests E2E omitidos. Ejecutando solo tests unitarios...');
    process.exit(0);
  }

  console.log('Base de datos conectada.');

  console.log('Inicializando esquema...');
  const ok = await inicializarEsquema();

  if (!ok) {
    console.error('Error inicializando esquema');
    process.exit(1);
  }

  console.log('Esquema listo.');
  console.log('Ejecutando tests E2E...\n');

  // Ejecutar tests con node --test
  const { spawn } = require('child_process');
  const child = spawn('node', ['--test', 'tests/e2e.test.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}

main().catch(console.error);