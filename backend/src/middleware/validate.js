// ============================================================
// Input Validation Middleware
// Simple validation without external dependencies
// ============================================================

function validateExpense(req, res, next) {
  const { title, amountTotal, categoryId } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Název výdaje je povinný');
  }
  if (title && title.length > 200) {
    errors.push('Název výdaje je příliš dlouhý (max 200 znaků)');
  }
  if (amountTotal === undefined || amountTotal === null) {
    errors.push('Částka je povinná');
  }
  if (amountTotal !== undefined && (isNaN(Number(amountTotal)) || Number(amountTotal) < 0)) {
    errors.push('Částka musí být kladné číslo');
  }
  if (amountTotal !== undefined && Number(amountTotal) > 100_000_000) {
    errors.push('Částka je příliš vysoká');
  }

  const validCategories = [
    'housing_energy', 'loans', 'subscriptions', 'telecom',
    'auto_moto', 'insurance', 'pets', 'family_life',
    'savings_investments', 'extraordinary',
  ];
  if (categoryId && !validCategories.includes(categoryId)) {
    errors.push('Neplatná kategorie');
  }

  const { wellmallPercentage } = req.body;
  if (wellmallPercentage !== undefined) {
    const pct = Number(wellmallPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push('WellMall procento musí být 0-100');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join('. '), errors });
  }

  next();
}

function validateIncome(req, res, next) {
  const { title, amount, type } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Název příjmu je povinný');
  }
  if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
    errors.push('Částka musí být kladné číslo');
  }

  const validTypes = ['active_salary', 'passive_rent', 'passive_dividend', 'passive_other'];
  if (type && !validTypes.includes(type)) {
    errors.push('Neplatný typ příjmu');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join('. '), errors });
  }

  next();
}

function validateAuth(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email je povinný');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Neplatný formát emailu');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Heslo je povinné');
  } else if (password.length < 6) {
    errors.push('Heslo musí mít alespoň 6 znaků');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join('. '), errors });
  }

  next();
}

module.exports = { validateExpense, validateIncome, validateAuth };
