// ============================================================
// Domácí Rozpočet - Backend API Server
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

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

const { checkExpirations } = require('./services/automation');
const { generateMonthlyWellmallReports } = require('./services/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Příliš mnoho požadavků, zkuste to později.' },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cron Jobs
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

  // Auto-seed in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const { seed } = require('./seed');
      console.log('[SERVER] Seed data loaded for development');
    } catch (err) {
      console.error('[SERVER] Seed error:', err);
    }
  }
});

module.exports = app;
