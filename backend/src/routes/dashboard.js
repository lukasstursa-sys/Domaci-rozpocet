const express = require('express');
const { findByUserId } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard?month=X&year=Y
router.get('/', (req, res) => {
  const { month, year } = req.query;
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const allExpenses = findByUserId('expenses', req.user.id);
  const allIncomes = findByUserId('incomes', req.user.id);

  const expenses = allExpenses.filter(
    e => e.month === targetMonth && e.year === targetYear
  );
  const incomes = allIncomes.filter(
    i => i.month === targetMonth && i.year === targetYear
  );

  const activeIncome = incomes
    .filter(i => i.type === 'active_salary')
    .reduce((sum, i) => sum + i.amount, 0);

  const passiveIncome = incomes
    .filter(i => i.type !== 'active_salary')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountTotal, 0);
  const wellmallTotal = expenses.reduce((sum, e) => sum + e.amountWellmall, 0);
  const familyTotal = expenses.reduce((sum, e) => sum + e.amountFamily, 0);

  const ratRacePercentage = totalExpenses > 0
    ? Math.min(Math.round((passiveIncome / totalExpenses) * 100), 100)
    : 0;

  // Category breakdown
  const categoryMap = {};
  expenses.forEach(e => {
    if (!categoryMap[e.categoryId]) {
      categoryMap[e.categoryId] = 0;
    }
    categoryMap[e.categoryId] += e.amountTotal;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
  }));

  // Upcoming expirations
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcomingExpirations = allExpenses
    .filter(e => e.contractEndDate && new Date(e.contractEndDate) <= ninetyDaysFromNow && new Date(e.contractEndDate) >= now)
    .map(e => ({
      id: e.id,
      title: e.title,
      contractEndDate: e.contractEndDate,
      providerName: e.providerName,
      daysRemaining: Math.ceil((new Date(e.contractEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

  res.json({
    overview: {
      activeIncome,
      passiveIncome,
      totalExpenses,
      remainingBudget: activeIncome + passiveIncome - totalExpenses,
      wellmallTotal,
      familyTotal,
    },
    ratRace: {
      passiveIncome,
      totalExpenses,
      percentage: ratRacePercentage,
      trend: 'stable',
    },
    categoryBreakdown,
    upcomingExpirations,
    recentExpenses: expenses.slice(-5).reverse(),
  });
});

module.exports = router;
