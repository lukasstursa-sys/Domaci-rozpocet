const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, insert, generateId } = require('../models/db');
const { generateToken } = require('../middleware/auth');
const { validateAuth } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateAuth, async (req, res) => {
  try {
    const { email, password, familyName } = req.body;

    if (!email || !password || !familyName) {
      return res.status(400).json({ message: 'Vyplňte všechna pole' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ message: 'Uživatel s tímto emailem již existuje' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = insert('users', {
      email,
      passwordHash,
      familyName,
      isSuperAdmin: false,
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        familyName: user.familyName,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Chyba při registraci' });
  }
});

// POST /api/auth/login
router.post('/login', validateAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vyplňte email a heslo' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Neplatné přihlašovací údaje' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        familyName: user.familyName,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Chyba při přihlášení' });
  }
});

module.exports = router;
