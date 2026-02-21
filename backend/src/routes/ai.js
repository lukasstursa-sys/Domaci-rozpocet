const express = require('express');
const { findByUserId, getDb } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Zpráva je povinná' });
  }

  try {
    // Get user financial context
    const expenses = findByUserId('expenses', req.user.id);
    const incomes = findByUserId('incomes', req.user.id);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amountTotal, 0);
    const totalIncome = incomes.reduce((sum, i) => i.amount + sum, 0);
    const passiveIncome = incomes
      .filter(i => i.type !== 'active_salary')
      .reduce((sum, i) => sum + i.amount, 0);

    const ratRacePercentage = totalExpenses > 0
      ? Math.round((passiveIncome / totalExpenses) * 100)
      : 0;

    // If OpenAI API key is configured, use it
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key') {
      const systemPrompt = getDb().aiPrompt.prompt;
      const context = `
Finanční kontext uživatele:
- Celkové příjmy: ${totalIncome} Kč/měsíc
- Pasivní příjmy: ${passiveIncome} Kč/měsíc
- Celkové výdaje: ${totalExpenses} Kč/měsíc
- Rat Race metr: ${ratRacePercentage}%
- Počet výdajových položek: ${expenses.length}
`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt + '\n' + context },
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || 'Omlouvám se, nepodařilo se mi vygenerovat odpověď.',
      });
    }

    // Fallback: generate contextual response without AI API
    const reply = generateLocalResponse(message, {
      totalExpenses,
      totalIncome,
      passiveIncome,
      ratRacePercentage,
      expenses,
    });

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.json({
      reply: 'Omlouvám se, momentálně mám technické potíže. Zkuste to prosím později.',
    });
  }
});

// GET /api/ai/insights
router.get('/insights', (req, res) => {
  const expenses = findByUserId('expenses', req.user.id);
  const incomes = findByUserId('incomes', req.user.id);

  const insights = [];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountTotal, 0);
  const passiveIncome = incomes
    .filter(i => i.type !== 'active_salary')
    .reduce((sum, i) => sum + i.amount, 0);

  const ratRace = totalExpenses > 0
    ? Math.round((passiveIncome / totalExpenses) * 100)
    : 0;

  if (ratRace < 10) {
    insights.push('Vaše pasivní příjmy pokrývají méně než 10 % výdajů. Zvažte nastavení pravidelného investování.');
  } else if (ratRace < 50) {
    insights.push(`Skvělý pokrok! Pasivní příjmy pokrývají ${ratRace} % výdajů. Pokračujte v budování.`);
  }

  // Check for duplicate subscriptions
  const subscriptions = expenses.filter(e => e.categoryId === 'subscriptions');
  const hasNetflix = subscriptions.some(e => e.subcategoryId === 'netflix');
  const hasHBO = subscriptions.some(e => e.subcategoryId === 'hbo');
  if (hasNetflix && hasHBO) {
    const totalStreamingSavings = subscriptions
      .filter(e => ['netflix', 'hbo'].includes(e.subcategoryId))
      .reduce((sum, e) => sum + e.amountTotal, 0);
    insights.push(
      `Využíváte Netflix i HBO. Zrušením jedné služby ušetříte až ${totalStreamingSavings * 12} Kč ročně.`
    );
  }

  // Check for upcoming contract expirations
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiring = expenses.filter(
    e => e.contractEndDate && new Date(e.contractEndDate) <= ninetyDays && new Date(e.contractEndDate) >= now
  );
  expiring.forEach(e => {
    const days = Math.ceil((new Date(e.contractEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    insights.push(`Smlouva "${e.title}" u ${e.providerName || 'poskytovatele'} vyprší za ${days} dní. Čas vyjednat lepší podmínky!`);
  });

  // Grocery spending analysis
  const groceries = expenses
    .filter(e => e.subcategoryId === 'groceries')
    .reduce((sum, e) => sum + e.amountTotal, 0);
  if (groceries > 10000) {
    insights.push(`Výdaje za potraviny jsou ${groceries} Kč. Zkuste plánování jídelníčku pro úsporu.`);
  }

  if (insights.length === 0) {
    insights.push('Vaše finance vypadají dobře! Pokračujte ve sledování výdajů.');
  }

  res.json({ insights });
});

function generateLocalResponse(message, ctx) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('rat race') || lowerMsg.includes('krysí závod') || lowerMsg.includes('pasivní')) {
    return `Aktuálně vaše pasivní příjmy pokrývají ${ctx.ratRacePercentage} % vašich výdajů. ` +
      `Pro dosažení finanční svobody potřebujete 100 %. ` +
      `Doporučuji zvýšit investice nebo hledat nové zdroje pasivního příjmu, jako jsou dividendové akcie, ETF fondy, nebo příjmy z pronájmu.`;
  }

  if (lowerMsg.includes('ušetřit') || lowerMsg.includes('úspora') || lowerMsg.includes('snížit')) {
    return `Na základě vašich dat vydáváte měsíčně ${ctx.totalExpenses} Kč. ` +
      `Největší úspory obvykle najdete v oblasti předplatných a jídla. ` +
      `Zkontrolujte, zda využíváte všechna svá předplatná naplno, a zvažte plánování nákupů potravin.`;
  }

  if (lowerMsg.includes('investic') || lowerMsg.includes('etf') || lowerMsg.includes('akci')) {
    return `S vašimi příjmy ${ctx.totalIncome} Kč a výdaji ${ctx.totalExpenses} Kč máte prostor pro investování ` +
      `${Math.max(0, ctx.totalIncome - ctx.totalExpenses)} Kč měsíčně. ` +
      `Doporučuji začít s pravidelnými investicemi do globálních ETF fondů. I malá částka, investovaná pravidelně, může za 10-15 let vytvořit významný pasivní příjem.`;
  }

  return `Díky za váš dotaz! Vaše aktuální finanční situace: příjmy ${ctx.totalIncome} Kč, výdaje ${ctx.totalExpenses} Kč. ` +
    `Pasivní příjmy tvoří ${ctx.ratRacePercentage} % vašich výdajů. ` +
    `Mohu vám pomoci s analýzou výdajů, návrhy na úspory, nebo strategií pro budování pasivních příjmů. Co vás zajímá konkrétně?`;
}

module.exports = router;
