const express = require('express');
const { findByUserId, findById, insert, update, remove } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/templates
// List all templates for the authenticated user, sorted by usageCount (most used first)
router.get('/', (req, res) => {
  const { type } = req.query;
  let templates = findByUserId('templates', req.user.id);

  if (type && (type === 'expense' || type === 'income')) {
    templates = templates.filter(t => t.type === type);
  }

  // Sort by usageCount descending (most popular first), then by name
  templates.sort((a, b) => {
    const countDiff = (b.usageCount || 0) - (a.usageCount || 0);
    if (countDiff !== 0) return countDiff;
    return (a.name || '').localeCompare(b.name || '', 'cs');
  });

  res.json(templates);
});

// POST /api/templates
// Create a new template
router.post('/', (req, res) => {
  const {
    type, name, title, amount, categoryId, subcategoryId,
    wellmallPercentage, providerName,
    linkedMemberId, linkedVehicleId, linkedPetId,
    notes, icon,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Vyplňte název šablony' });
  }

  if (!type || (type !== 'expense' && type !== 'income')) {
    return res.status(400).json({ message: 'Typ musí být "expense" nebo "income"' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Vyplňte výchozí název transakce' });
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: 'Vyplňte výchozí částku' });
  }

  const template = insert('templates', {
    userId: req.user.id,
    type,
    name: name.trim(),
    title: title.trim(),
    amount: parseFloat(amount) || 0,
    categoryId: categoryId || null,
    subcategoryId: subcategoryId || null,
    wellmallPercentage: parseFloat(wellmallPercentage) || 0,
    providerName: providerName || null,
    linkedMemberId: linkedMemberId || null,
    linkedVehicleId: linkedVehicleId || null,
    linkedPetId: linkedPetId || null,
    notes: notes || null,
    icon: icon || null,
    usageCount: 0,
  });

  res.status(201).json(template);
});

// PUT /api/templates/:id
// Update an existing template
router.put('/:id', (req, res) => {
  const existing = findById('templates', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Šablona nenalezena' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Přístup zamítnut' });
  }

  // Validate type if provided
  if (req.body.type && req.body.type !== 'expense' && req.body.type !== 'income') {
    return res.status(400).json({ message: 'Typ musí být "expense" nebo "income"' });
  }

  // Prevent overwriting system fields
  const { id, userId, createdAt, ...allowedUpdates } = req.body;

  const updated = update('templates', req.params.id, allowedUpdates);
  res.json(updated);
});

// DELETE /api/templates/:id
// Delete a template
router.delete('/:id', (req, res) => {
  const existing = findById('templates', req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Šablona nenalezena' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Přístup zamítnut' });
  }

  const success = remove('templates', req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Šablona nenalezena' });
  }

  res.json({ message: 'Šablona smazána' });
});

// POST /api/templates/:id/use
// Create an actual expense or income from a template, with optional overrides
router.post('/:id/use', (req, res) => {
  const template = findById('templates', req.params.id);
  if (!template) {
    return res.status(404).json({ message: 'Šablona nenalezena' });
  }

  if (template.userId !== req.user.id) {
    return res.status(403).json({ message: 'Přístup zamítnut' });
  }

  const now = new Date();
  const overrides = req.body || {};

  if (template.type === 'expense') {
    // Build expense from template defaults + overrides
    const amount = parseFloat(overrides.amountTotal !== undefined ? overrides.amountTotal : template.amount) || 0;
    const wellmallPct = parseFloat(overrides.wellmallPercentage !== undefined ? overrides.wellmallPercentage : template.wellmallPercentage) || 0;
    const amountWellmall = Math.round((amount * wellmallPct / 100) * 100) / 100;
    const amountFamily = Math.round((amount - amountWellmall) * 100) / 100;

    const expense = insert('expenses', {
      userId: req.user.id,
      categoryId: overrides.categoryId || template.categoryId || 'extraordinary',
      subcategoryId: overrides.subcategoryId || template.subcategoryId || null,
      title: overrides.title || template.title,
      amountTotal: amount,
      amountFamily: amountFamily,
      amountWellmall: amountWellmall,
      wellmallPercentage: wellmallPct,
      isRecurring: overrides.isRecurring || false,
      frequency: overrides.frequency || 'monthly',
      dueDate: overrides.dueDate || null,
      contractEndDate: overrides.contractEndDate || null,
      linkedMemberId: overrides.linkedMemberId || template.linkedMemberId || null,
      linkedVehicleId: overrides.linkedVehicleId || template.linkedVehicleId || null,
      linkedPetId: overrides.linkedPetId || template.linkedPetId || null,
      pdfUrl: overrides.pdfUrl || null,
      providerName: overrides.providerName || template.providerName || null,
      notes: overrides.notes || template.notes || null,
      month: parseInt(overrides.month) || (now.getMonth() + 1),
      year: parseInt(overrides.year) || now.getFullYear(),
      fromTemplateId: template.id,
    });

    // Increment usageCount
    update('templates', template.id, { usageCount: (template.usageCount || 0) + 1 });

    return res.status(201).json(expense);
  }

  if (template.type === 'income') {
    const income = insert('incomes', {
      userId: req.user.id,
      title: overrides.title || template.title,
      amount: parseFloat(overrides.amount !== undefined ? overrides.amount : template.amount) || 0,
      type: overrides.incomeType || 'active_salary',
      linkedMemberId: overrides.linkedMemberId || template.linkedMemberId || null,
      isRecurring: overrides.isRecurring || false,
      frequency: overrides.frequency || 'monthly',
      month: parseInt(overrides.month) || (now.getMonth() + 1),
      year: parseInt(overrides.year) || now.getFullYear(),
      fromTemplateId: template.id,
    });

    // Increment usageCount
    update('templates', template.id, { usageCount: (template.usageCount || 0) + 1 });

    return res.status(201).json(income);
  }

  return res.status(400).json({ message: 'Neplatný typ šablony' });
});

module.exports = router;
