// ============================================================
// Seed Data - Rodina Novákovi (Test Data)
// ============================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb, insert } = require('./models/db');

async function seed() {
  const db = getDb();

  console.log('[SEED] Vymazání existujících dat...');
  db.users.length = 0;
  db.familyMembers.length = 0;
  db.vehicles.length = 0;
  db.pets.length = 0;
  db.expenses.length = 0;
  db.incomes.length = 0;
  db.notifications.length = 0;
  db.globalCategories.length = 0;

  // ---- Users ----
  console.log('[SEED] Vytváření uživatelů...');

  const userPasswordHash = await bcrypt.hash('Heslo123', 12);
  const adminPasswordHash = await bcrypt.hash('AdminStart2026', 12);

  const testUser = insert('users', {
    email: 'rodina@test.cz',
    passwordHash: userPasswordHash,
    familyName: 'Novákovi',
    isSuperAdmin: false,
  });

  insert('users', {
    email: 'admin@wellmall.cz',
    passwordHash: adminPasswordHash,
    familyName: 'WellMall Admin',
    isSuperAdmin: true,
  });

  const userId = testUser.id;

  // ---- Family Members ----
  console.log('[SEED] Vytváření členů rodiny...');

  const tata = insert('familyMembers', {
    userId,
    name: 'Petr Novák',
    role: 'parent',
    birthdate: '1985-03-15',
  });

  const mama = insert('familyMembers', {
    userId,
    name: 'Jana Nováková',
    role: 'parent',
    birthdate: '1987-07-22',
  });

  const dite1 = insert('familyMembers', {
    userId,
    name: 'Tomáš Novák',
    role: 'child',
    birthdate: '2012-09-10',
  });

  const dite2 = insert('familyMembers', {
    userId,
    name: 'Eliška Nováková',
    role: 'child',
    birthdate: '2015-12-03',
  });

  // ---- Vehicles ----
  console.log('[SEED] Vytváření vozidel...');

  const auto1 = insert('vehicles', {
    userId,
    type: 'car',
    spz: '1AB 2345',
    brand: 'Škoda',
    model: 'Octavia',
  });

  const auto2 = insert('vehicles', {
    userId,
    type: 'car',
    spz: '3CD 6789',
    brand: 'Škoda',
    model: 'Fabia',
  });

  const motorka = insert('vehicles', {
    userId,
    type: 'moto',
    spz: '5EF 0123',
    brand: 'Honda',
    model: 'CB500F',
  });

  const ctyrkolka = insert('vehicles', {
    userId,
    type: 'atv',
    spz: '7GH 4567',
    brand: 'Can-Am',
    model: 'Outlander',
  });

  // ---- Pets ----
  console.log('[SEED] Vytváření mazlíčků...');

  const pes = insert('pets', { userId, type: 'dog', name: 'Baryk' });
  const kocka = insert('pets', { userId, type: 'cat', name: 'Micka' });
  const morcata = insert('pets', { userId, type: 'guinea_pig', name: 'Kulička' });
  const slepice = insert('pets', { userId, type: 'hen', name: 'Slepice (5ks)' });

  // ---- Incomes ----
  console.log('[SEED] Vytváření příjmů...');
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  insert('incomes', {
    userId,
    title: 'Plat - Petr (WellMall)',
    amount: 55000,
    type: 'active_salary',
    linkedMemberId: tata.id,
    isRecurring: true,
    frequency: 'monthly',
    month, year,
  });

  insert('incomes', {
    userId,
    title: 'Plat - Jana (částečný úvazek)',
    amount: 30000,
    type: 'active_salary',
    linkedMemberId: mama.id,
    isRecurring: true,
    frequency: 'monthly',
    month, year,
  });

  insert('incomes', {
    userId,
    title: 'Dividendy ETF',
    amount: 3500,
    type: 'passive_dividend',
    isRecurring: true,
    frequency: 'monthly',
    month, year,
  });

  insert('incomes', {
    userId,
    title: 'Pronájem garáže',
    amount: 1500,
    type: 'passive_rent',
    isRecurring: true,
    frequency: 'monthly',
    month, year,
  });

  // ---- Expenses ----
  console.log('[SEED] Vytváření výdajů...');

  // Bydlení & Energie
  insert('expenses', {
    userId, categoryId: 'housing_energy', subcategoryId: 'electricity',
    title: 'ČEZ Elektřina', amountTotal: 3500, amountFamily: 1500, amountWellmall: 2000,
    wellmallPercentage: 57, isRecurring: true, frequency: 'monthly',
    dueDate: `${year}-${String(month).padStart(2,'0')}-15`,
    providerName: 'ČEZ', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'housing_energy', subcategoryId: 'gas',
    title: 'Plyn', amountTotal: 2200, amountFamily: 2200, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'innogy', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'housing_energy', subcategoryId: 'solid_fuel',
    title: 'Dřevo na topení', amountTotal: 1500, amountFamily: 1500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'housing_energy', subcategoryId: 'water',
    title: 'Voda/Kanalizace (čistička)', amountTotal: 800, amountFamily: 800, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'housing_energy', subcategoryId: 'waste',
    title: 'Svoz odpadu', amountTotal: 250, amountFamily: 250, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'yearly',
    month, year,
  });

  // Úvěry
  insert('expenses', {
    userId, categoryId: 'loans', subcategoryId: 'mortgage',
    title: 'Hypotéka', amountTotal: 22000, amountFamily: 22000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    dueDate: `${year}-${String(month).padStart(2,'0')}-20`,
    contractEndDate: '2028-06-15',
    providerName: 'Česká spořitelna', month, year,
  });

  // Předplatné
  insert('expenses', {
    userId, categoryId: 'subscriptions', subcategoryId: 'netflix',
    title: 'Netflix', amountTotal: 199, amountFamily: 199, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'Netflix', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'subscriptions', subcategoryId: 'hbo',
    title: 'HBO Max', amountTotal: 199, amountFamily: 199, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'HBO', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'subscriptions', subcategoryId: 'youtube_premium',
    title: 'YouTube Premium Family', amountTotal: 269, amountFamily: 269, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'Google', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'subscriptions', subcategoryId: 'ai_tools',
    title: 'ChatGPT Plus', amountTotal: 550, amountFamily: 0, amountWellmall: 550,
    wellmallPercentage: 100, isRecurring: true, frequency: 'monthly',
    providerName: 'OpenAI', month, year,
  });

  // Telekomunikace
  insert('expenses', {
    userId, categoryId: 'telecom', subcategoryId: 'mobile_plan',
    title: 'T-Mobile - Petr', amountTotal: 799, amountFamily: 0, amountWellmall: 799,
    wellmallPercentage: 100, isRecurring: true, frequency: 'monthly',
    linkedMemberId: tata.id, providerName: 'T-Mobile', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'telecom', subcategoryId: 'mobile_plan',
    title: 'T-Mobile - Jana', amountTotal: 599, amountFamily: 599, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedMemberId: mama.id, providerName: 'T-Mobile', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'telecom', subcategoryId: 'internet',
    title: 'Internet O2', amountTotal: 599, amountFamily: 300, amountWellmall: 299,
    wellmallPercentage: 50, isRecurring: true, frequency: 'monthly',
    providerName: 'O2', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'telecom', subcategoryId: 'tv_radio',
    title: 'ČT poplatek', amountTotal: 135, amountFamily: 135, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  // Auto & Moto
  insert('expenses', {
    userId, categoryId: 'auto_moto', subcategoryId: 'fuel',
    title: 'Palivo - Octavia', amountTotal: 4500, amountFamily: 2000, amountWellmall: 2500,
    wellmallPercentage: 56, isRecurring: true, frequency: 'monthly',
    linkedVehicleId: auto1.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'auto_moto', subcategoryId: 'fuel',
    title: 'Palivo - Fabia', amountTotal: 2500, amountFamily: 2500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedVehicleId: auto2.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'auto_moto', subcategoryId: 'liability_insurance',
    title: 'Povinné ručení Octavia', amountTotal: 800, amountFamily: 400, amountWellmall: 400,
    wellmallPercentage: 50, isRecurring: true, frequency: 'monthly',
    linkedVehicleId: auto1.id, providerName: 'Kooperativa',
    contractEndDate: '2026-11-30', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'auto_moto', subcategoryId: 'liability_insurance',
    title: 'Povinné ručení Fabia', amountTotal: 550, amountFamily: 550, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedVehicleId: auto2.id, providerName: 'Allianz', month, year,
  });

  // Pojištění
  insert('expenses', {
    userId, categoryId: 'insurance', subcategoryId: 'life_insurance',
    title: 'Životní pojištění - rodina', amountTotal: 2500, amountFamily: 2500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'Generali', month, year,
  });

  insert('expenses', {
    userId, categoryId: 'insurance', subcategoryId: 'property_insurance',
    title: 'Pojištění nemovitosti', amountTotal: 450, amountFamily: 450, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    providerName: 'Česká pojišťovna', month, year,
  });

  // Zvířata
  insert('expenses', {
    userId, categoryId: 'pets', subcategoryId: 'pet_food_vet',
    title: 'Granule pes (Baryk)', amountTotal: 1200, amountFamily: 1200, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedPetId: pes.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'pets', subcategoryId: 'pet_food_vet',
    title: 'Krmení kočka (Micka)', amountTotal: 600, amountFamily: 600, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedPetId: kocka.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'pets', subcategoryId: 'pet_food_vet',
    title: 'Krmení slepice', amountTotal: 400, amountFamily: 400, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedPetId: slepice.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'pets', subcategoryId: 'pet_fee',
    title: 'Poplatek za psa', amountTotal: 100, amountFamily: 100, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedPetId: pes.id, month, year,
  });

  // Rodina & Život
  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'school_activities',
    title: 'Kroužky - Tomáš (fotbal)', amountTotal: 800, amountFamily: 800, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedMemberId: dite1.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'school_activities',
    title: 'Kroužky - Eliška (tanec)', amountTotal: 600, amountFamily: 600, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    linkedMemberId: dite2.id, month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'groceries',
    title: 'Nákupy potravin', amountTotal: 12000, amountFamily: 12000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'restaurants',
    title: 'Restaurace', amountTotal: 3000, amountFamily: 3000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'drugstore',
    title: 'Drogerie', amountTotal: 1500, amountFamily: 1500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'clothing',
    title: 'Oblečení rodina', amountTotal: 2000, amountFamily: 2000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'family_life', subcategoryId: 'pocket_money',
    title: 'Kapesné děti', amountTotal: 500, amountFamily: 500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  // Spoření & Investice
  insert('expenses', {
    userId, categoryId: 'savings_investments', subcategoryId: 'investment_portfolio',
    title: 'Měsíční investice - ETF', amountTotal: 5000, amountFamily: 5000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'savings_investments', subcategoryId: 'emergency_fund',
    title: 'Železná rezerva', amountTotal: 2000, amountFamily: 2000, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  insert('expenses', {
    userId, categoryId: 'savings_investments', subcategoryId: 'vacation_mountain',
    title: 'Spoření - dovolená hory', amountTotal: 1500, amountFamily: 1500, amountWellmall: 0,
    wellmallPercentage: 0, isRecurring: true, frequency: 'monthly',
    month, year,
  });

  // Global categories
  console.log('[SEED] Vytváření globálních kategorií...');
  const categories = [
    { name: 'Bydlení & Energie', icon: '🏠' },
    { name: 'Úvěry & Bydlení', icon: '🏦' },
    { name: 'Předplatné', icon: '📺' },
    { name: 'Telekomunikace', icon: '📱' },
    { name: 'Auto & Moto', icon: '🚗' },
    { name: 'Pojištění', icon: '🛡️' },
    { name: 'Zvířata', icon: '🐾' },
    { name: 'Rodina & Život', icon: '👨‍👩‍👧‍👦' },
    { name: 'Spoření & Investice', icon: '📈' },
    { name: 'Mimořádné', icon: '⚡' },
  ];

  categories.forEach(cat => insert('globalCategories', { ...cat, isActive: true }));

  // Notifications
  console.log('[SEED] Vytváření notifikací...');

  insert('notifications', {
    userId,
    title: 'Blížící se konec fixace hypotéky',
    message: 'Dne 15.6.2028 vám končí fixace hypotéky u České spořitelny. Zbývá méně než 2,5 roku - začněte sledovat úrokové sazby.',
    type: 'warning',
    isRead: false,
  });

  insert('notifications', {
    userId,
    title: 'Tip na úsporu: Streaming služby',
    message: 'Využíváte Netflix i HBO Max. Zrušením jedné služby ušetříte ročně 2388 Kč. Využíváte obě naplno?',
    type: 'info',
    isRead: false,
  });

  insert('notifications', {
    userId,
    title: 'Investiční tip',
    message: 'Vaše pasivní příjmy (5000 Kč) pokrývají 6,5 % výdajů. Zvýšením investic o 2000 Kč měsíčně dosáhnete 10 % do konce roku.',
    type: 'info',
    isRead: false,
  });

  console.log('[SEED] ✅ Seed data úspěšně vytvořena!');
  console.log(`[SEED] 📧 Testovací účet: rodina@test.cz / Heslo123`);
  console.log(`[SEED] 🔑 Admin účet: admin@wellmall.cz / AdminStart2026`);
}

// Run seed on module load if executed directly
seed().catch(console.error);

module.exports = { seed };
