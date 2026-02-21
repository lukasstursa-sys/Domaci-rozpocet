const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const members = findByUserId('familyMembers', req.user.id);
  res.json(members);
});

router.post('/', (req, res) => {
  const { name, role, birthdate } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Vyplňte jméno člena rodiny' });
  }

  const member = insert('familyMembers', {
    userId: req.user.id,
    name,
    role: role || 'parent',
    birthdate,
  });

  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const member = update('familyMembers', req.params.id, req.body);
  if (!member) return res.status(404).json({ message: 'Člen rodiny nenalezen' });
  res.json(member);
});

router.delete('/:id', (req, res) => {
  const success = remove('familyMembers', req.params.id);
  if (!success) return res.status(404).json({ message: 'Člen rodiny nenalezen' });
  res.json({ message: 'Člen rodiny smazán' });
});

module.exports = router;
