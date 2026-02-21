const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/incomes?month=X&year=Y
router.get('/', (req, res) => {
  const { month, year } = req.query;
  let incomes = findByUserId('incomes', req.user.id);

  if (month && year) {
    incomes = incomes.filter(
      i => i.month === parseInt(month) && i.year === parseInt(year)
    );
  }

  res.json(incomes);
});

// POST /api/incomes
router.post('/', (req, res) => {
  const { title, amount, type, linkedMemberId, isRecurring, frequency, month, year } = req.body;

  if (!title || amount === undefined) {
    return res.status(400).json({ message: 'Vyplňte název a částku' });
  }

  const income = insert('incomes', {
    userId: req.user.id,
    title,
    amount: parseFloat(amount) || 0,
    type: type || 'active_salary',
    linkedMemberId,
    isRecurring: isRecurring || false,
    frequency: frequency || 'monthly',
    month: parseInt(month) || new Date().getMonth() + 1,
    year: parseInt(year) || new Date().getFullYear(),
  });

  res.status(201).json(income);
});

// PUT /api/incomes/:id
router.put('/:id', (req, res) => {
  const income = update('incomes', req.params.id, req.body);
  if (!income) {
    return res.status(404).json({ message: 'Příjem nenalezen' });
  }
  res.json(income);
});

// DELETE /api/incomes/:id
router.delete('/:id', (req, res) => {
  const success = remove('incomes', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Příjem nenalezen' });
  }
  res.json({ message: 'Příjem smazán' });
});

module.exports = router;
