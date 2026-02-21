const express = require('express');
const { findByUserId, findById, insert, update, remove, getDb } = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const VALID_ACCOUNT_TYPES = ['cash', 'bank', 'savings', 'credit_card', 'investment'];

// ============================================================
// GET /api/accounts - Seznam všech účtů přihlášeného uživatele
// ============================================================
router.get('/', (req, res) => {
  const { includeHidden } = req.query;
  let accounts = findByUserId('accounts', req.user.id);

  // Ve výchozím stavu skrýt skryté účty, pokud není explicitně požadováno
  if (includeHidden !== 'true') {
    accounts = accounts.filter(a => !a.isHidden);
  }

  // Seřadit: výchozí účet první, pak podle názvu
  accounts.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name, 'cs');
  });

  res.json(accounts);
});

// ============================================================
// POST /api/accounts - Vytvoření nového účtu
// ============================================================
router.post('/', (req, res) => {
  const {
    name, type, balance, initialBalance, currency,
    icon, color, isDefault, isHidden, includeInTotal, notes,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Název účtu je povinný' });
  }

  if (type && !VALID_ACCOUNT_TYPES.includes(type)) {
    return res.status(400).json({
      message: `Neplatný typ účtu. Povolené typy: ${VALID_ACCOUNT_TYPES.join(', ')}`,
    });
  }

  const parsedInitialBalance = parseFloat(initialBalance) || 0;
  const parsedBalance = balance !== undefined ? parseFloat(balance) : parsedInitialBalance;

  // Pokud je nastaven jako výchozí, zrušit výchozí u ostatních účtů
  if (isDefault) {
    const existingAccounts = findByUserId('accounts', req.user.id);
    existingAccounts.forEach(acc => {
      if (acc.isDefault) {
        update('accounts', acc.id, { isDefault: false });
      }
    });
  }

  const account = insert('accounts', {
    userId: req.user.id,
    name: name.trim(),
    type: type || 'bank',
    balance: parsedBalance,
    initialBalance: parsedInitialBalance,
    currency: currency || 'CZK',
    icon: icon || '💰',
    color: color || '#4CAF50',
    isDefault: isDefault || false,
    isHidden: isHidden || false,
    includeInTotal: includeInTotal !== undefined ? includeInTotal : true,
    notes: notes || '',
  });

  res.status(201).json(account);
});

// ============================================================
// PUT /api/accounts/:id - Aktualizace účtu
// ============================================================
router.put('/:id', (req, res) => {
  const existing = findById('accounts', req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Účet nenalezen' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Nemáte oprávnění upravovat tento účet' });
  }

  // Validace typu pokud je posílán
  if (req.body.type && !VALID_ACCOUNT_TYPES.includes(req.body.type)) {
    return res.status(400).json({
      message: `Neplatný typ účtu. Povolené typy: ${VALID_ACCOUNT_TYPES.join(', ')}`,
    });
  }

  // Pokud se nastavuje jako výchozí, zrušit výchozí u ostatních
  if (req.body.isDefault) {
    const existingAccounts = findByUserId('accounts', req.user.id);
    existingAccounts.forEach(acc => {
      if (acc.id !== req.params.id && acc.isDefault) {
        update('accounts', acc.id, { isDefault: false });
      }
    });
  }

  // Parsovat číselné hodnoty pokud jsou přítomny
  const updates = { ...req.body };
  if (updates.balance !== undefined) updates.balance = parseFloat(updates.balance);
  if (updates.initialBalance !== undefined) updates.initialBalance = parseFloat(updates.initialBalance);
  if (updates.name) updates.name = updates.name.trim();

  const account = update('accounts', req.params.id, updates);
  res.json(account);
});

// ============================================================
// DELETE /api/accounts/:id - Smazání účtu (pouze bez transakcí)
// ============================================================
router.delete('/:id', (req, res) => {
  const existing = findById('accounts', req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Účet nenalezen' });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Nemáte oprávnění smazat tento účet' });
  }

  // Zkontrolovat, zda existují propojené transakce (výdaje nebo příjmy)
  const linkedExpenses = findByUserId('expenses', req.user.id)
    .filter(e => e.accountId === req.params.id);
  const linkedIncomes = findByUserId('incomes', req.user.id)
    .filter(i => i.accountId === req.params.id);

  if (linkedExpenses.length > 0 || linkedIncomes.length > 0) {
    const totalLinked = linkedExpenses.length + linkedIncomes.length;
    return res.status(409).json({
      message: `Účet nelze smazat, protože má ${totalLinked} propojených transakcí. Nejprve přesuňte nebo smažte transakce.`,
      linkedTransactions: {
        expenses: linkedExpenses.length,
        incomes: linkedIncomes.length,
      },
    });
  }

  // Zkontrolovat, zda existují propojené převody
  const db = getDb();
  if (db.transfers) {
    const linkedTransfers = db.transfers.filter(
      t => t.userId === req.user.id &&
        (t.fromAccountId === req.params.id || t.toAccountId === req.params.id)
    );
    if (linkedTransfers.length > 0) {
      return res.status(409).json({
        message: `Účet nelze smazat, protože má ${linkedTransfers.length} propojených převodů. Nejprve smažte převody.`,
        linkedTransfers: linkedTransfers.length,
      });
    }
  }

  // Nelze smazat výchozí účet
  if (existing.isDefault) {
    return res.status(409).json({
      message: 'Nelze smazat výchozí účet. Nejprve nastavte jiný účet jako výchozí.',
    });
  }

  const success = remove('accounts', req.params.id);
  if (!success) {
    return res.status(500).json({ message: 'Chyba při mazání účtu' });
  }

  res.json({ message: 'Účet byl úspěšně smazán' });
});

// ============================================================
// POST /api/accounts/transfer - Převod mezi dvěma účty
// ============================================================
router.post('/transfer', (req, res) => {
  const { fromAccountId, toAccountId, amount, note } = req.body;

  // Validace vstupů
  if (!fromAccountId || !toAccountId) {
    return res.status(400).json({ message: 'Zadejte zdrojový i cílový účet' });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ message: 'Zdrojový a cílový účet nemohou být stejné' });
  }

  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Částka musí být kladné číslo' });
  }

  // Ověřit existenci účtů a vlastnictví
  const fromAccount = findById('accounts', fromAccountId);
  const toAccount = findById('accounts', toAccountId);

  if (!fromAccount) {
    return res.status(404).json({ message: 'Zdrojový účet nenalezen' });
  }

  if (!toAccount) {
    return res.status(404).json({ message: 'Cílový účet nenalezen' });
  }

  if (fromAccount.userId !== req.user.id || toAccount.userId !== req.user.id) {
    return res.status(403).json({ message: 'Nemáte oprávnění k jednomu nebo oběma účtům' });
  }

  // Zkontrolovat dostatečný zůstatek (volitelné - lze povolit záporný zůstatek)
  if (fromAccount.balance < parsedAmount) {
    return res.status(400).json({
      message: `Nedostatečný zůstatek na účtu "${fromAccount.name}". Dostupný zůstatek: ${fromAccount.balance} ${fromAccount.currency}`,
    });
  }

  // Provést převod - aktualizovat zůstatky
  const updatedFrom = update('accounts', fromAccountId, {
    balance: fromAccount.balance - parsedAmount,
  });

  const updatedTo = update('accounts', toAccountId, {
    balance: toAccount.balance + parsedAmount,
  });

  // Inicializovat kolekci transfers pokud neexistuje
  const db = getDb();
  if (!db.transfers) {
    db.transfers = [];
  }

  // Vytvořit záznam o převodu
  const transfer = insert('transfers', {
    userId: req.user.id,
    fromAccountId,
    toAccountId,
    fromAccountName: fromAccount.name,
    toAccountName: toAccount.name,
    amount: parsedAmount,
    currency: fromAccount.currency,
    note: note || '',
    date: new Date().toISOString(),
  });

  res.status(201).json({
    message: 'Převod úspěšně proveden',
    transfer,
    fromAccount: updatedFrom,
    toAccount: updatedTo,
  });
});

// ============================================================
// GET /api/accounts/:id/transactions - Transakce propojené s účtem
// ============================================================
router.get('/:id/transactions', (req, res) => {
  const account = findById('accounts', req.params.id);

  if (!account) {
    return res.status(404).json({ message: 'Účet nenalezen' });
  }

  if (account.userId !== req.user.id) {
    return res.status(403).json({ message: 'Nemáte oprávnění k tomuto účtu' });
  }

  const { month, year, limit, offset } = req.query;

  // Získat výdaje a příjmy propojené s tímto účtem
  let expenses = findByUserId('expenses', req.user.id)
    .filter(e => e.accountId === req.params.id)
    .map(e => ({ ...e, transactionType: 'expense' }));

  let incomes = findByUserId('incomes', req.user.id)
    .filter(i => i.accountId === req.params.id)
    .map(i => ({ ...i, transactionType: 'income' }));

  // Získat převody propojené s tímto účtem
  const db = getDb();
  let transfers = [];
  if (db.transfers) {
    transfers = db.transfers
      .filter(t =>
        t.userId === req.user.id &&
        (t.fromAccountId === req.params.id || t.toAccountId === req.params.id)
      )
      .map(t => ({
        ...t,
        transactionType: 'transfer',
        // Označit směr převodu z pohledu tohoto účtu
        transferDirection: t.fromAccountId === req.params.id ? 'outgoing' : 'incoming',
      }));
  }

  // Filtrovat podle měsíce a roku pokud je zadáno
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);

    expenses = expenses.filter(e => e.month === m && e.year === y);
    incomes = incomes.filter(i => i.month === m && i.year === y);
    transfers = transfers.filter(t => {
      const d = new Date(t.date || t.createdAt);
      return (d.getMonth() + 1) === m && d.getFullYear() === y;
    });
  }

  // Sloučit a seřadit podle data (nejnovější první)
  let allTransactions = [...expenses, ...incomes, ...transfers];
  allTransactions.sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateB - dateA;
  });

  // Stránkování
  const total = allTransactions.length;
  const parsedOffset = parseInt(offset) || 0;
  const parsedLimit = parseInt(limit) || 50;
  allTransactions = allTransactions.slice(parsedOffset, parsedOffset + parsedLimit);

  res.json({
    transactions: allTransactions,
    total,
    offset: parsedOffset,
    limit: parsedLimit,
    account: {
      id: account.id,
      name: account.name,
      balance: account.balance,
      currency: account.currency,
    },
  });
});

module.exports = router;
