// ============================================================
// Database Layer with JSON File Persistence
// Data is kept in memory for speed and periodically flushed to disk.
// On startup, data is loaded from the JSON file if it exists.
// ============================================================
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data/db.json');

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// In-memory storage
const db = {
  users: [],
  familyMembers: [],
  vehicles: [],
  pets: [],
  expenses: [],
  incomes: [],
  calendarEvents: [],
  notifications: [],
  globalCategories: [],
  budgetLimits: [],
  recurringTransactions: [],
  templates: [],
  debts: [],
  accounts: [],
  transfers: [],
  aiPrompt: {
    prompt: `Jsi finanční poradce pro české rodiny. Tvým cílem je pomoci rodině uniknout z "krysího závodu"
    budováním pasivních příjmů a snižováním zbytečných výdajů. Komunikuješ česky, jsi motivující ale realistický.
    Navrhuj konkrétní kroky k finanční svobodě. Analyzuj výdaje a hledej úspory.`
  },
};

// --- Persistence ---

function initPersistence() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);

      for (const key of Object.keys(db)) {
        if (key === 'aiPrompt') {
          if (loaded.aiPrompt && loaded.aiPrompt.prompt) {
            db.aiPrompt.prompt = loaded.aiPrompt.prompt;
          }
        } else if (Array.isArray(db[key]) && Array.isArray(loaded[key])) {
          db[key] = loaded[key];
        }
      }
      console.log(`[DB] Data loaded from ${DB_FILE} (${db.users.length} users, ${db.expenses.length} expenses)`);
    } else {
      console.log('[DB] No existing data file, starting fresh');
    }
  } catch (err) {
    console.error('[DB] Error loading persistent data:', err.message);
  }
}

function persistToFile() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error persisting data:', err.message);
  }
}

let persistTimer = null;

function schedulePersistence() {
  if (persistTimer) clearInterval(persistTimer);
  persistTimer = setInterval(persistToFile, 30_000);

  process.on('SIGINT', () => { persistToFile(); process.exit(0); });
  process.on('SIGTERM', () => { persistToFile(); process.exit(0); });
}

// Debounced write after mutations
function markDirty() {
  if (markDirty._timeout) clearTimeout(markDirty._timeout);
  markDirty._timeout = setTimeout(persistToFile, 2000);
}

// --- CRUD Operations ---

function getDb() {
  return db;
}

function findById(collection, id) {
  return db[collection].find(item => item.id === id);
}

function findByUserId(collection, userId) {
  return db[collection].filter(item => item.userId === userId);
}

function insert(collection, item) {
  const newItem = { ...item, id: generateId(), createdAt: new Date().toISOString() };
  db[collection].push(newItem);
  markDirty();
  return newItem;
}

function update(collection, id, updates) {
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return null;
  db[collection][index] = { ...db[collection][index], ...updates, updatedAt: new Date().toISOString() };
  markDirty();
  return db[collection][index];
}

function remove(collection, id) {
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return false;
  db[collection].splice(index, 1);
  markDirty();
  return true;
}

module.exports = {
  getDb, findById, findByUserId, insert, update, remove, generateId,
  initPersistence, persistToFile, schedulePersistence,
};
