const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: 'El correo y la contraseña son obligatorios'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        mensaje: 'Falta configurar JWT_SECRET'
      });
    }

    const resultado = await pool.query(
      `SELECT id, name, email, password, role
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const contraseñaValida = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        sub: usuario.id,
        role: usuario.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensaje: 'Inicio de sesión correcto',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.name,
        email: usuario.email,
        rol: usuario.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
}

module.exports = { login };