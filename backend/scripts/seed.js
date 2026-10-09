// Uso: node scripts/seed.js "Ana" ana@empresa.com clave1 planificador
require('dotenv').config();
const pool = require('../src/config/db');
const runMigrations = require('../src/config/migrate');
const UserModel = require('../src/models/user.model');

(async () => {
  const [name, email, password, role] = process.argv.slice(2);
  if (!['planificador', 'almacen', 'consulta'].includes(role) || !password) {
    console.error('Uso: node scripts/seed.js <nombre> <email> <clave> <planificador|almacen|consulta>');
    process.exit(1);
  }
  await runMigrations();
  if (await UserModel.findByEmail(email)) { console.log('Ya existe:', email); }
  else { console.log('Creado:', await UserModel.create({ name, email, password, role })); }
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
