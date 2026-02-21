const express = require('express');
const { findByUserId, insert, update, remove, getDb } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the next due date by advancing `current` by `interval` units of
 * the given `frequency`.  Always returns an ISO string.
 */
function computeNextDueDate(current, frequency, interval) {
  const date = new Date(current);
  const step = interval || 1;

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + step);
      break;
    case 'weekly':
      date.setDate(date.getDate() + step * 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + step);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + step);
      break;
    default:
      date.setMonth(date.getMonth() + step);
  }

  return date.toISOString();
}

// ---------------------------------------------------------------------------
// GET /api/recurring          – list recurring transactions
//   ?active=true              – only active ones
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  let items = findByUserId('recurringTransactions', req.user.id);

  if (req.query.active === 'true') {
    items = items.filter(item => item.isActive);
  }

  res.json(items);
});

// ---------------------------------------------------------------------------
// POST /api/recurring         – create a new recurring transaction
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  const {
    type,
    title,
    amount,
    categoryId,
    subcategoryId,
    frequency,
    interval,
    startDate,
    endDate,
    isActive,
    autoConfirm,
    isSubscription,
    providerName,
    wellmallPercentage,
    linkedMemberId,
    linkedVehicleId,
    linkedPetId,
    notes,
  } = req.body;

  if (!title || amount === undefined) {
    return res.status(400).json({ message: 'Vyplnte nazev a castku' });
  }

  if (!type || !['expense', 'income'].includes(type)) {
    return res.status(400).json({ message: 'Typ musi byt "expense" nebo "income"' });
  }

  if (!frequency || !['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
    return res.status(400).json({ message: 'Neplatna frekvence. Povolene: daily, weekly, monthly, yearly' });
  }

  const resolvedStartDate = startDate || new Date().toISOString();

  const recurring = insert('recurringTransactions', {
    userId: req.user.id,
    type,
    title,
    amount: parseFloat(amount) || 0,
    categoryId: categoryId || null,
    subcategoryId: subcategoryId || null,
    frequency,
    interval: parseInt(interval) || 1,
    startDate: resolvedStartDate,
    endDate: endDate || null,
    nextDueDate: resolvedStartDate,
    isActive: isActive !== undefined ? isActive : true,
    autoConfirm: autoConfirm || false,
    isSubscription: isSubscription || false,
    providerName: providerName || null,
    wellmallPercentage: parseFloat(wellmallPercentage) || 0,
    linkedMemberId: linkedMemberId || null,
    linkedVehicleId: linkedVehicleId || null,
    linkedPetId: linkedPetId || null,
    notes: notes || null,
    lastProcessedDate: null,
  });

  res.status(201).json(recurring);
});

// ---------------------------------------------------------------------------
// PUT /api/recurring/:id      – update a recurring transaction
// ---------------------------------------------------------------------------
router.put('/:id', (req, res) => {
  // Make sure the item belongs to the requesting user
  const existing = findByUserId('recurringTransactions', req.user.id)
    .find(item => item.id === req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Opakujici se transakce nenalezena' });
  }

  const updated = update('recurringTransactions', req.params.id, req.body);
  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /api/recurring/:id   – delete / deactivate a recurring transaction
// ---------------------------------------------------------------------------
router.delete('/:id', (req, res) => {
  const existing = findByUserId('recurringTransactions', req.user.id)
    .find(item => item.id === req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Opakujici se transakce nenalezena' });
  }

  // Soft-deactivate first, then remove from DB
  update('recurringTransactions', req.params.id, { isActive: false });
  const success = remove('recurringTransactions', req.params.id);

  if (!success) {
    return res.status(404).json({ message: 'Opakujici se transakce nenalezena' });
  }

  res.json({ message: 'Opakujici se transakce smazana' });
});

// ---------------------------------------------------------------------------
// POST /api/recurring/process – expand due recurring items into real
//                               expenses / incomes for the current period
// ---------------------------------------------------------------------------
router.post('/process', (req, res) => {
  const now = new Date();
  const items = findByUserId('recurringTransactions', req.user.id)
    .filter(item => {
      if (!item.isActive) return false;
      if (!item.nextDueDate) return false;
      if (new Date(item.nextDueDate) > now) return false;
      // If endDate is set and already past, skip
      if (item.endDate && new Date(item.endDate) < now) return false;
      return true;
    });

  let processedCount = 0;
  const created = [];

  for (const item of items) {
    // Determine target month / year from the due date
    const dueDate = new Date(item.nextDueDate);
    const month = dueDate.getMonth() + 1;
    const year = dueDate.getFullYear();

    if (item.type === 'expense') {
      const expense = insert('expenses', {
        userId: req.user.id,
        categoryId: item.categoryId || 'extraordinary',
        subcategoryId: item.subcategoryId || null,
        title: item.title,
        amountTotal: item.amount,
        amountFamily: item.amount - (item.amount * (item.wellmallPercentage || 0) / 100),
        amountWellmall: item.amount * (item.wellmallPercentage || 0) / 100,
        wellmallPercentage: item.wellmallPercentage || 0,
        isRecurring: true,
        frequency: item.frequency,
        dueDate: item.nextDueDate,
        linkedMemberId: item.linkedMemberId || null,
        linkedVehicleId: item.linkedVehicleId || null,
        linkedPetId: item.linkedPetId || null,
        providerName: item.providerName || null,
        notes: item.notes || null,
        month,
        year,
        recurringTransactionId: item.id,
        autoConfirmed: item.autoConfirm,
      });
      created.push(expense);
    } else if (item.type === 'income') {
      const income = insert('incomes', {
        userId: req.user.id,
        title: item.title,
        amount: item.amount,
        type: 'recurring',
        linkedMemberId: item.linkedMemberId || null,
        isRecurring: true,
        frequency: item.frequency,
        month,
        year,
        recurringTransactionId: item.id,
        autoConfirmed: item.autoConfirm,
      });
      created.push(income);
    }

    // Advance nextDueDate and record lastProcessedDate
    const newNextDueDate = computeNextDueDate(item.nextDueDate, item.frequency, item.interval);

    // If the new next due date exceeds endDate, deactivate
    const updatePayload = {
      nextDueDate: newNextDueDate,
      lastProcessedDate: now.toISOString(),
    };

    if (item.endDate && new Date(newNextDueDate) > new Date(item.endDate)) {
      updatePayload.isActive = false;
    }

    update('recurringTransactions', item.id, updatePayload);
    processedCount++;
  }

  res.json({
    message: `Zpracovano ${processedCount} opakujicich se transakci`,
    processedCount,
    created,
  });
});

module.exports = router;
