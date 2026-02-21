const jwt = require('jsonwebtoken');
const { getDb } = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, isSuperAdmin: user.isSuperAdmin || false },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Přihlášení je vyžadováno' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Neplatný nebo expirovaný token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Přístup zamítnut - vyžaduje administrátorská práva' });
  }
  next();
}

module.exports = { generateToken, authMiddleware, adminMiddleware, JWT_SECRET };
