// ============================================================
// Domácí Rozpočet - Backend API Server
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/incomes');
const familyRoutes = require('./routes/family');
const vehicleRoutes = require('./routes/vehicles');
const petRoutes = require('./routes/pets');
const calendarRoutes = require('./routes/calendar');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const reportRoutes = require('./routes/reports');
const budgetRoutes = require('./routes/budgets');
const exportRoutes = require('./routes/export');
const templateRoutes = require('./routes/templates');
const recurringRoutes = require('./routes/recurring');
const debtRoutes = require('./routes/debts');
const accountRoutes = require('./routes/accounts');

const { checkExpirations } = require('./services/automation');
const { generateMonthlyWellmallReports } = require('./services/reports');
const { initPersistence, schedulePersistence } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for local app (served on same origin)
}));
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ];
    // Allow requests with no origin (same-origin, mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any chrome-extension origin
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Příliš mnoho požadavků, zkuste to později.' },
});
app.use(limiter);

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Příliš mnoho pokusů o přihlášení, zkuste to za 15 minut.' },
});

app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/family-members', familyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/accounts', accountRoutes);

// Serve frontend static files from extension/dist
const frontendPath = path.join(__dirname, '../../extension/dist');
app.use(express.static(frontendPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve newtab.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'newtab.html'));
});

// Cron Jobs
// Process recurring transactions daily at 6:30 AM
cron.schedule('30 6 * * *', async () => {
  console.log('[CRON] Zpracování opakujících se transakcí...');
  try {
    const { getDb, findByUserId, insert, update } = require('./models/db');
    const db = getDb();
    const now = new Date();
    let processed = 0;

    const dueItems = db.recurringTransactions.filter(
      rt => rt.isActive && new Date(rt.nextDueDate) <= now && (!rt.endDate || new Date(rt.endDate) >= now)
    );

    for (const rt of dueItems) {
      const dueDate = new Date(rt.nextDueDate);
      const month = dueDate.getMonth() + 1;
      const year = dueDate.getFullYear();

      if (rt.type === 'expense') {
        const wellmallAmt = rt.amount * ((rt.wellmallPercentage || 0) / 100);
        insert('expenses', {
          userId: rt.userId, categoryId: rt.categoryId || 'extraordinary',
          subcategoryId: rt.subcategoryId, title: rt.title,
          amountTotal: rt.amount, amountFamily: rt.amount - wellmallAmt,
          amountWellmall: wellmallAmt, wellmallPercentage: rt.wellmallPercentage || 0,
          isRecurring: true, frequency: rt.frequency, month, year,
          recurringTransactionId: rt.id,
        });
      } else {
        insert('incomes', {
          userId: rt.userId, title: rt.title, amount: rt.amount,
          type: 'active_salary', isRecurring: true, frequency: rt.frequency,
          month, year, recurringTransactionId: rt.id,
        });
      }

      // Advance nextDueDate
      const next = new Date(dueDate);
      const interval = rt.interval || 1;
      if (rt.frequency === 'daily') next.setDate(next.getDate() + interval);
      else if (rt.frequency === 'weekly') next.setDate(next.getDate() + interval * 7);
      else if (rt.frequency === 'monthly') next.setMonth(next.getMonth() + interval);
      else if (rt.frequency === 'yearly') next.setFullYear(next.getFullYear() + interval);

      const updates = { nextDueDate: next.toISOString(), lastProcessedDate: now.toISOString() };
      if (rt.endDate && next > new Date(rt.endDate)) updates.isActive = false;
      update('recurringTransactions', rt.id, updates);
      processed++;
    }
    console.log(`[CRON] Zpracováno ${processed} opakujících se transakcí`);
  } catch (err) {
    console.error('[CRON] Chyba při zpracování opakujících se transakcí:', err);
  }
});

// Check contract expirations daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Kontrola expirací smluv...');
  try {
    await checkExpirations();
  } catch (err) {
    console.error('[CRON] Chyba při kontrole expirací:', err);
  }
});

// Generate WellMall reports on the 1st of each month at 6 AM
cron.schedule('0 6 1 * *', async () => {
  console.log('[CRON] Generování WellMall reportů...');
  try {
    await generateMonthlyWellmallReports();
  } catch (err) {
    console.error('[CRON] Chyba při generování reportů:', err);
  }
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Interní chyba serveru',
  });
});

app.listen(PORT, async () => {
  console.log(`[SERVER] Domácí Rozpočet API běží na portu ${PORT}`);

  // Initialize persistent storage
  initPersistence();

  // Auto-seed in development (only if DB is empty)
  if (process.env.NODE_ENV === 'development') {
    const { getDb } = require('./models/db');
    const db = getDb();
    if (db.users.length === 0) {
      try {
        const { seed } = require('./seed');
        console.log('[SERVER] Seed data loaded for development');
      } catch (err) {
        console.error('[SERVER] Seed error:', err);
      }
    } else {
      console.log('[SERVER] DB already has data, skipping seed');
    }
  }

  // Schedule periodic persistence (every 30 seconds)
  schedulePersistence();
});

module.exports = app;
