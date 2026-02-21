// ============================================================
// In-Memory Database (Replace with Firebase/PostgreSQL in production)
// Provides full CRUD operations and seed data
// ============================================================
const { v4: uuidv4 } = require('uuid') || { v4: () => `${Date.now()}-${Math.random().toString(36).slice(2)}` };

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
  aiPrompt: {
    prompt: `Jsi finanční poradce pro české rodiny. Tvým cílem je pomoci rodině uniknout z "krysího závodu"
    budováním pasivních příjmů a snižováním zbytečných výdajů. Komunikuješ česky, jsi motivující ale realistický.
    Navrhuj konkrétní kroky k finanční svobodě. Analyzuj výdaje a hledej úspory.`
  },
};

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
  return newItem;
}

function update(collection, id, updates) {
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return null;
  db[collection][index] = { ...db[collection][index], ...updates };
  return db[collection][index];
}

function remove(collection, id) {
  const index = db[collection].findIndex(item => item.id === id);
  if (index === -1) return false;
  db[collection].splice(index, 1);
  return true;
}

module.exports = { getDb, findById, findByUserId, insert, update, remove, generateId };
