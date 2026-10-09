const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'email y password son requeridos' });
      }
      const user = await UserModel.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Email o clave incorrectos' });
      }
      const payload = { id: user.id, name: user.name, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
      res.json({ success: true, data: { token, user: payload } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = AuthController;
