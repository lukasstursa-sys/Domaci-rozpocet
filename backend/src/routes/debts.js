const express = require('express');
const { findByUserId, findById, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/debts/summary - Get debt summary (must be before /:id routes)
router.get('/summary', (req, res) => {
  const debts = findByUserId('debts', req.user.id);

  const totalDebt = debts
    .filter(d => d.type === 'debt' && d.status !== 'paid_off')
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const totalCredit = debts
    .filter(d => d.type === 'credit' && d.status !== 'paid_off')
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0);

  const netPosition = totalCredit - totalDebt;

  const now = new Date().toISOString();
  const overdueCount = debts.filter(
    d => d.status === 'active' && d.dueDate && d.dueDate < now
  ).length;

  res.json({
    totalDebt,
    totalCredit,
    netPosition,
    overdueCount,
    currency: 'CZK',
  });
});

// GET /api/debts?type=debt|credit&status=active|paid_off|overdue
router.get('/', (req, res) => {
  const { type, status } = req.query;
  let debts = findByUserId('debts', req.user.id);

  if (type) {
    debts = debts.filter(d => d.type === type);
  }

  if (status) {
    debts = debts.filter(d => d.status === status);
  }

  res.json(debts);
});

// POST /api/debts
router.post('/', (req, res) => {
  const {
    type,
    counterparty,
    description,
    originalAmount,
    remainingAmount,
    currency,
    interestRate,
    startDate,
    dueDate,
    status,
    linkedMemberId,
    notes,
  } = req.body;

  if (!type || !counterparty || originalAmount === undefined) {
    return res.status(400).json({ message: 'Vyplnte typ, protistranu a castku' });
  }

  if (!['debt', 'credit'].includes(type)) {
    return res.status(400).json({ message: 'Typ musi byt "debt" nebo "credit"' });
  }

  const parsedOriginal = parseFloat(originalAmount) || 0;
  const parsedRemaining = remainingAmount !== undefined
    ? parseFloat(remainingAmount) || 0
    : parsedOriginal;

  const debt = insert('debts', {
    userId: req.user.id,
    type,
    counterparty,
    description: description || '',
    originalAmount: parsedOriginal,
    remainingAmount: parsedRemaining,
    currency: currency || 'CZK',
    interestRate: interestRate !== undefined ? parseFloat(interestRate) : null,
    startDate: startDate || new Date().toISOString(),
    dueDate: dueDate || null,
    status: status || 'active',
    payments: [],
    linkedMemberId: linkedMemberId || null,
    notes: notes || '',
  });

  res.status(201).json(debt);
});

// PUT /api/debts/:id
router.put('/:id', (req, res) => {
  const existing = findById('debts', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Dluh nenalezen' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Pristup zamitnut' });
  }

  // Prevent overwriting payments array via generic update
  const { payments, ...allowedUpdates } = req.body;

  const debt = update('debts', req.params.id, allowedUpdates);
  res.json(debt);
});

// DELETE /api/debts/:id
router.delete('/:id', (req, res) => {
  const existing = findById('debts', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Dluh nenalezen' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Pristup zamitnut' });
  }

  const success = remove('debts', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Dluh nenalezen' });
  }

  res.json({ message: 'Dluh smazan' });
});

// POST /api/debts/:id/payment - Record a payment on a debt
router.post('/:id/payment', (req, res) => {
  const existing = findById('debts', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Dluh nenalezen' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Pristup zamitnut' });
  }

  const { amount, note, date } = req.body;

  if (amount === undefined || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Zadejte platnou castku platby' });
  }

  const paymentAmount = parseFloat(amount);

  const payment = {
    date: date || new Date().toISOString(),
    amount: paymentAmount,
    note: note || '',
  };

  const updatedPayments = [...(existing.payments || []), payment];
  const newRemaining = Math.max(0, (existing.remainingAmount || 0) - paymentAmount);
  const newStatus = newRemaining <= 0 ? 'paid_off' : existing.status;

  const debt = update('debts', req.params.id, {
    payments: updatedPayments,
    remainingAmount: newRemaining,
    status: newStatus,
  });

  res.json(debt);
});

module.exports = router;
