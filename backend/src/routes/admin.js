const express = require('express');
const { getDb, insert, update } = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const totalFamilies = db.users.filter(u => !u.isSuperAdmin).length;
  const totalContracts = db.expenses.filter(e => e.pdfUrl).length;
  const totalWellmallSaved = db.expenses.reduce((sum, e) => sum + (e.amountWellmall || 0), 0);
  const activeUsers = db.users.length;

  res.json({
    totalFamilies,
    totalContracts,
    totalWellmallSaved,
    activeUsers,
  });
});

// GET /api/admin/families
router.get('/families', (req, res) => {
  const db = getDb();
  const families = db.users
    .filter(u => !u.isSuperAdmin)
    .map(u => ({
      id: u.id,
      familyName: u.familyName,
      email: u.email,
      createdAt: u.createdAt,
      membersCount: db.familyMembers.filter(m => m.userId === u.id).length,
      expensesCount: db.expenses.filter(e => e.userId === u.id).length,
    }));

  res.json(families);
});

// GET /api/admin/categories
router.get('/categories', (req, res) => {
  const db = getDb();
  res.json(db.globalCategories);
});

// POST /api/admin/categories
router.post('/categories', (req, res) => {
  const { name, icon } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Název kategorie je povinný' });
  }

  const category = insert('globalCategories', {
    name,
    icon: icon || '📁',
    isActive: true,
  });

  res.status(201).json(category);
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  const category = update('globalCategories', req.params.id, req.body);
  if (!category) {
    return res.status(404).json({ message: 'Kategorie nenalezena' });
  }
  res.json(category);
});

// GET /api/admin/ai-prompt
router.get('/ai-prompt', (req, res) => {
  const db = getDb();
  res.json({ prompt: db.aiPrompt.prompt });
});

// PUT /api/admin/ai-prompt
router.put('/ai-prompt', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt je povinný' });
  }

  const db = getDb();
  db.aiPrompt.prompt = prompt;

  res.json({ message: 'AI prompt aktualizován', prompt });
});

module.exports = router;
