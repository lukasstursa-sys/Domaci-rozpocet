const express = require('express');
const { findByUserId, insert, update, remove, getDb } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/budgets?month=X&year=Y
router.get('/', (req, res) => {
  const { month, year } = req.query;
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const limits = findByUserId('budgetLimits', req.user.id).filter(
    b => b.month === targetMonth && b.year === targetYear
  );

  // Compute actual spending per category
  const expenses = findByUserId('expenses', req.user.id).filter(
    e => e.month === targetMonth && e.year === targetYear
  );

  const spending = {};
  expenses.forEach(e => {
    spending[e.categoryId] = (spending[e.categoryId] || 0) + e.amountTotal;
  });

  const result = limits.map(limit => ({
    ...limit,
    spent: spending[limit.categoryId] || 0,
    remaining: limit.amount - (spending[limit.categoryId] || 0),
    percentUsed: limit.amount > 0
      ? Math.round(((spending[limit.categoryId] || 0) / limit.amount) * 100)
      : 0,
  }));

  res.json(result);
});

// POST /api/budgets
router.post('/', (req, res) => {
  const { categoryId, amount, month, year } = req.body;

  if (!categoryId || amount === undefined) {
    return res.status(400).json({ message: 'Vyplňte kategorii a limit' });
  }

  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  // Check if limit for this category/month already exists
  const existing = findByUserId('budgetLimits', req.user.id).find(
    b => b.categoryId === categoryId && b.month === targetMonth && b.year === targetYear
  );

  if (existing) {
    const updated = update('budgetLimits', existing.id, { amount: parseFloat(amount) });
    return res.json(updated);
  }

  const limit = insert('budgetLimits', {
    userId: req.user.id,
    categoryId,
    amount: parseFloat(amount),
    month: targetMonth,
    year: targetYear,
  });

  res.status(201).json(limit);
});

// PUT /api/budgets/:id
router.put('/:id', (req, res) => {
  const limit = update('budgetLimits', req.params.id, { amount: parseFloat(req.body.amount) });
  if (!limit) {
    return res.status(404).json({ message: 'Rozpočtový limit nenalezen' });
  }
  res.json(limit);
});

// DELETE /api/budgets/:id
router.delete('/:id', (req, res) => {
  const success = remove('budgetLimits', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Rozpočtový limit nenalezen' });
  }
  res.json({ message: 'Limit smazán' });
});

module.exports = router;
