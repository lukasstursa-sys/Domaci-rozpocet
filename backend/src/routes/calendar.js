const express = require('express');
const { findByUserId, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/calendar?month=X&year=Y
router.get('/', (req, res) => {
  const { month, year } = req.query;
  const expenses = findByUserId('expenses', req.user.id);
  const events = [];

  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  // Generate calendar events from recurring expenses
  expenses.forEach(expense => {
    if (expense.isRecurring && expense.dueDate) {
      const dueDay = new Date(expense.dueDate).getDate();
      events.push({
        id: `due-${expense.id}`,
        userId: req.user.id,
        title: `Splatnost: ${expense.title}`,
        date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`,
        type: 'due_date',
        relatedExpenseId: expense.id,
        description: `${expense.amountTotal} Kč - ${expense.providerName || ''}`,
        isAlert: false,
      });
    }

    // Contract end date alerts
    if (expense.contractEndDate) {
      const endDate = new Date(expense.contractEndDate);
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();

      if (endMonth === targetMonth && endYear === targetYear) {
        events.push({
          id: `exp-${expense.id}`,
          userId: req.user.id,
          title: `Konec smlouvy: ${expense.title}`,
          date: expense.contractEndDate,
          type: 'expiration',
          relatedExpenseId: expense.id,
          description: `Končí smlouva u ${expense.providerName || expense.title}`,
          isAlert: true,
        });
      }
    }
  });

  // Add stored calendar events
  const storedEvents = findByUserId('calendarEvents', req.user.id);
  const filteredStored = storedEvents.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
  });

  res.json([...events, ...filteredStored]);
});

// POST /api/calendar
router.post('/', (req, res) => {
  const { title, date, type, description, isAlert } = req.body;

  if (!title || !date) {
    return res.status(400).json({ message: 'Vyplňte název a datum' });
  }

  const event = insert('calendarEvents', {
    userId: req.user.id,
    title,
    date,
    type: type || 'reminder',
    description: description || '',
    isAlert: isAlert || false,
  });

  res.status(201).json(event);
});

// PUT /api/calendar/:id
router.put('/:id', (req, res) => {
  const event = update('calendarEvents', req.params.id, req.body);
  if (!event) {
    return res.status(404).json({ message: 'Událost nenalezena' });
  }
  res.json(event);
});

// DELETE /api/calendar/:id
router.delete('/:id', (req, res) => {
  const success = remove('calendarEvents', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Událost nenalezena' });
  }
  res.json({ message: 'Událost smazána' });
});

module.exports = router;
