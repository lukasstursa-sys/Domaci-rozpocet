const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const pets = findByUserId('pets', req.user.id);
  res.json(pets);
});

router.post('/', (req, res) => {
  const { type, name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Vyplňte jméno mazlíčka' });
  }

  const pet = insert('pets', {
    userId: req.user.id,
    type: type || 'dog',
    name,
  });

  res.status(201).json(pet);
});

router.put('/:id', (req, res) => {
  const pet = update('pets', req.params.id, req.body);
  if (!pet) return res.status(404).json({ message: 'Mazlíček nenalezen' });
  res.json(pet);
});

router.delete('/:id', (req, res) => {
  const success = remove('pets', req.params.id);
  if (!success) return res.status(404).json({ message: 'Mazlíček nenalezen' });
  res.json({ message: 'Mazlíček smazán' });
});

module.exports = router;
