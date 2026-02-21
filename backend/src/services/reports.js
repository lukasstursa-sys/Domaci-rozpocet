// ============================================================
// Report Generation Service
// ============================================================
const { getDb } = require('../models/db');
const { sendMonthlyRatRaceEmail } = require('./email');

async function generateMonthlyWellmallReports() {
  const db = getDb();
  const now = new Date();
  const lastMonth = now.getMonth(); // 0-indexed, so this is "last month"
  const year = lastMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = lastMonth === 0 ? 12 : lastMonth;

  for (const user of db.users) {
    if (user.isSuperAdmin) continue;

    const expenses = db.expenses.filter(
      e => e.userId === user.id && e.month === month && e.year === year
    );
    const incomes = db.incomes.filter(
      i => i.userId === user.id && i.month === month && i.year === year
    );

    const passiveIncome = incomes
      .filter(i => i.type !== 'active_salary')
      .reduce((sum, i) => sum + i.amount, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amountTotal, 0);
    const wellmallSaved = expenses.reduce((sum, e) => sum + e.amountWellmall, 0);

    const ratRacePercentage = totalExpenses > 0
      ? Math.min(Math.round((passiveIncome / totalExpenses) * 100), 100)
      : 0;

    // Find biggest category
    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amountTotal;
    });

    let biggestCategory = 'Žádné výdaje';
    let biggestAmount = 0;
    for (const [cat, amount] of Object.entries(categoryTotals)) {
      if (amount > biggestAmount) {
        biggestAmount = amount;
        biggestCategory = cat;
      }
    }

    try {
      await sendMonthlyRatRaceEmail(user.email, {
        familyName: user.familyName,
        month,
        year,
        ratRacePercentage,
        passiveIncome,
        totalExpenses,
        biggestCategory,
        wellmallSaved,
      });
      console.log(`[REPORT] Monthly summary sent to ${user.email}`);
    } catch (err) {
      console.error(`[REPORT] Failed to send to ${user.email}:`, err);
    }
  }
}

module.exports = { generateMonthlyWellmallReports };
