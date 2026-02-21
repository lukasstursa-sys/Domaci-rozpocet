const express = require('express');
const { findByUserId, getDb } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/export/csv?type=expenses&month=X&year=Y
router.get('/csv', (req, res) => {
  const { type, month, year } = req.query;
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  let rows = [];
  let headers = [];
  let filename = '';

  if (type === 'incomes') {
    headers = ['Název', 'Částka', 'Typ', 'Opakující se', 'Měsíc', 'Rok'];
    const incomes = findByUserId('incomes', req.user.id).filter(
      i => i.month === targetMonth && i.year === targetYear
    );
    rows = incomes.map(i => [
      i.title, i.amount, i.type, i.isRecurring ? 'Ano' : 'Ne', i.month, i.year,
    ]);
    filename = `prijmy-${targetYear}-${String(targetMonth).padStart(2, '0')}.csv`;
  } else {
    // Default: expenses
    headers = [
      'Název', 'Kategorie', 'Celkem', 'Rodina', 'WellMall', 'WellMall %',
      'Poskytovatel', 'Opakující se', 'Frekvence', 'Konec smlouvy', 'Měsíc', 'Rok',
    ];
    const expenses = findByUserId('expenses', req.user.id).filter(
      e => e.month === targetMonth && e.year === targetYear
    );
    rows = expenses.map(e => [
      e.title, e.categoryId, e.amountTotal, e.amountFamily, e.amountWellmall,
      e.wellmallPercentage, e.providerName || '', e.isRecurring ? 'Ano' : 'Ne',
      e.frequency || '', e.contractEndDate || '', e.month, e.year,
    ]);
    filename = `vydaje-${targetYear}-${String(targetMonth).padStart(2, '0')}.csv`;
  }

  // Build CSV with BOM for Excel Czech compatibility
  const BOM = '\uFEFF';
  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCsv).join(';'),
    ...rows.map(row => row.map(escapeCsv).join(';')),
  ];

  const csv = BOM + csvLines.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// GET /api/export/backup - Full data backup as JSON
router.get('/backup', (req, res) => {
  const userId = req.user.id;

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {
      familyMembers: findByUserId('familyMembers', userId),
      vehicles: findByUserId('vehicles', userId),
      pets: findByUserId('pets', userId),
      expenses: findByUserId('expenses', userId),
      incomes: findByUserId('incomes', userId),
      calendarEvents: findByUserId('calendarEvents', userId),
      budgetLimits: findByUserId('budgetLimits', userId),
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="rozpocet-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
});

// POST /api/export/restore - Restore from backup JSON
router.post('/restore', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ message: 'Chybí data pro obnovu' });
  }

  const { insert } = require('../models/db');
  const userId = req.user.id;
  let imported = 0;

  const collections = ['familyMembers', 'vehicles', 'pets', 'expenses', 'incomes', 'calendarEvents', 'budgetLimits'];

  for (const col of collections) {
    if (Array.isArray(data[col])) {
      for (const item of data[col]) {
        const { id, createdAt, updatedAt, ...rest } = item;
        insert(col, { ...rest, userId });
        imported++;
      }
    }
  }

  res.json({ message: `Obnoveno ${imported} záznamů`, count: imported });
});

module.exports = router;
