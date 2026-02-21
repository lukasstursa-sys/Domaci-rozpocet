const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const vehicles = findByUserId('vehicles', req.user.id);
  res.json(vehicles);
});

router.post('/', (req, res) => {
  const { type, spz, brand, model } = req.body;
  if (!spz || !brand) {
    return res.status(400).json({ message: 'Vyplňte SPZ a značku' });
  }

  const vehicle = insert('vehicles', {
    userId: req.user.id,
    type: type || 'car',
    spz,
    brand,
    model,
  });

  res.status(201).json(vehicle);
});

router.put('/:id', (req, res) => {
  const vehicle = update('vehicles', req.params.id, req.body);
  if (!vehicle) return res.status(404).json({ message: 'Vozidlo nenalezeno' });
  res.json(vehicle);
});

router.delete('/:id', (req, res) => {
  const success = remove('vehicles', req.params.id);
  if (!success) return res.status(404).json({ message: 'Vozidlo nenalezeno' });
  res.json({ message: 'Vozidlo smazáno' });
});

module.exports = router;
