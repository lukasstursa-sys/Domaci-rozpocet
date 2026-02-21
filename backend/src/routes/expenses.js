const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/expenses?month=X&year=Y
router.get('/', (req, res) => {
  const { month, year } = req.query;
  let expenses = findByUserId('expenses', req.user.id);

  if (month && year) {
    expenses = expenses.filter(
      e => e.month === parseInt(month) && e.year === parseInt(year)
    );
  }

  res.json(expenses);
});

// POST /api/expenses
router.post('/', (req, res) => {
  const {
    categoryId, subcategoryId, title, amountTotal,
    amountFamily, amountWellmall, wellmallPercentage,
    isRecurring, frequency, dueDate, contractEndDate,
    linkedMemberId, linkedVehicleId, linkedPetId,
    pdfUrl, providerName, notes, month, year,
  } = req.body;

  if (!title || amountTotal === undefined) {
    return res.status(400).json({ message: 'Vyplňte název a částku' });
  }

  const expense = insert('expenses', {
    userId: req.user.id,
    categoryId: categoryId || 'extraordinary',
    subcategoryId,
    title,
    amountTotal: parseFloat(amountTotal) || 0,
    amountFamily: parseFloat(amountFamily) || parseFloat(amountTotal) || 0,
    amountWellmall: parseFloat(amountWellmall) || 0,
    wellmallPercentage: parseFloat(wellmallPercentage) || 0,
    isRecurring: isRecurring || false,
    frequency: frequency || 'monthly',
    dueDate,
    contractEndDate,
    linkedMemberId,
    linkedVehicleId,
    linkedPetId,
    pdfUrl,
    providerName,
    notes,
    month: parseInt(month) || new Date().getMonth() + 1,
    year: parseInt(year) || new Date().getFullYear(),
  });

  res.status(201).json(expense);
});

// PUT /api/expenses/:id
router.put('/:id', (req, res) => {
  const expense = update('expenses', req.params.id, req.body);
  if (!expense) {
    return res.status(404).json({ message: 'Výdaj nenalezen' });
  }
  res.json(expense);
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  const success = remove('expenses', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Výdaj nenalezen' });
  }
  res.json({ message: 'Výdaj smazán' });
});

module.exports = router;
