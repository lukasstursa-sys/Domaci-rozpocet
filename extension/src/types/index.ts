// ============================================================
// Domácí Rozpočet - Type Definitions
// ============================================================

export interface User {
  id: string;
  email: string;
  familyName: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  role: 'parent' | 'child';
  birthdate: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  type: 'car' | 'moto' | 'atv';
  spz: string;
  brand: string;
  model?: string;
}

export interface Pet {
  id: string;
  userId: string;
  type: 'dog' | 'cat' | 'guinea_pig' | 'hen' | 'other';
  name: string;
}

export type ExpenseCategory =
  | 'housing_energy'
  | 'loans'
  | 'subscriptions'
  | 'telecom'
  | 'auto_moto'
  | 'insurance'
  | 'pets'
  | 'family_life'
  | 'savings_investments'
  | 'extraordinary';

export type ExpenseSubcategory =
  | 'electricity' | 'gas' | 'solid_fuel' | 'water' | 'waste'
  | 'rent' | 'mortgage' | 'consumer_loan'
  | 'mobile_plan' | 'internet' | 'tv_radio' | 'satellite'
  | 'netflix' | 'hbo' | 'youtube_premium' | 'ai_tools'
  | 'leasing' | 'fuel' | 'liability_insurance' | 'accident_insurance'
  | 'life_insurance' | 'household_insurance' | 'property_insurance'
  | 'pet_fee' | 'pet_food_vet'
  | 'school_activities' | 'clothing' | 'groceries' | 'restaurants'
  | 'drugstore' | 'pocket_money' | 'birthdays_holidays'
  | 'vacation_mountain' | 'vacation_autumn' | 'emergency_fund' | 'investment_portfolio'
  | 'renovation' | 'misc';

export interface Expense {
  id: string;
  userId: string;
  categoryId: ExpenseCategory;
  subcategoryId?: ExpenseSubcategory;
  title: string;
  amountTotal: number;
  amountFamily: number;
  amountWellmall: number;
  wellmallPercentage: number;
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly' | 'one_time';
  dueDate?: string;
  contractEndDate?: string;
  linkedMemberId?: string;
  linkedVehicleId?: string;
  linkedPetId?: string;
  pdfUrl?: string;
  providerName?: string;
  notes?: string;
  createdAt: string;
  month: number;
  year: number;
}

export type IncomeType = 'active_salary' | 'passive_rent' | 'passive_dividend' | 'passive_other';

export interface Income {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: IncomeType;
  linkedMemberId?: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly';
  month: number;
  year: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: 'due_date' | 'expiration' | 'payment' | 'reminder' | 'custom';
  relatedExpenseId?: string;
  description?: string;
  isAlert: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalFamilies: number;
  totalContracts: number;
  totalWellmallSaved: number;
  activeUsers: number;
}

export interface GlobalCategory {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface RatRaceData {
  passiveIncome: number;
  totalExpenses: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyOverview {
  activeIncome: number;
  passiveIncome: number;
  totalExpenses: number;
  remainingBudget: number;
  wellmallTotal: number;
  familyTotal: number;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

// ============================================================
// Recurring Transaction Types
// ============================================================

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringType = 'expense' | 'income';

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: RecurringType;
  title: string;
  amount: number;
  categoryId: ExpenseCategory;
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  autoConfirm: boolean;
  isSubscription: boolean;
  providerName?: string;
  wellmallPercentage: number;
  notes?: string;
  createdAt: string;
}

// ============================================================
// Template Types
// ============================================================

export interface TransactionTemplate {
  id: string;
  userId: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  categoryId: ExpenseCategory;
  subcategoryId?: ExpenseSubcategory;
  wellmallPercentage: number;
  providerName?: string;
  notes?: string;
  usageCount: number;
  createdAt: string;
}

// ============================================================
// Debt Types
// ============================================================

export type DebtType = 'debt' | 'credit';
export type DebtStatus = 'active' | 'paid_off' | 'overdue';

export interface DebtPayment {
  id: string;
  amount: number;
  note?: string;
  date: string;
}

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  counterparty: string;
  description: string;
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  startDate: string;
  dueDate?: string;
  status: DebtStatus;
  notes?: string;
  payments: DebtPayment[];
  createdAt: string;
}

export interface DebtSummary {
  totalDebt: number;
  totalCredit: number;
  netPosition: number;
  overdueCount: number;
}

// ============================================================
// Account Types
// ============================================================

export type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card' | 'investment';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  currency: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isHidden: boolean;
  includeInTotal: boolean;
  notes: string;
  createdAt: string;
}

export interface AccountTransfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  createdAt: string;
}

// ============================================================
// Budget Limit Types
// ============================================================

export interface BudgetLimit {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

// Category labels in Czech
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing_energy: 'Bydlení & Energie',
  loans: 'Úvěry & Bydlení',
  subscriptions: 'Předplatné',
  telecom: 'Telekomunikace',
  auto_moto: 'Auto & Moto',
  insurance: 'Pojištění',
  pets: 'Zvířata',
  family_life: 'Rodina & Život',
  savings_investments: 'Spoření & Investice',
  extraordinary: 'Mimořádné',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing_energy: '#1a365d',
  loans: '#e85d4a',
  subscriptions: '#8b5cf6',
  telecom: '#3b82f6',
  auto_moto: '#f59e0b',
  insurance: '#06b6d4',
  pets: '#ec4899',
  family_life: '#2d8f5e',
  savings_investments: '#10b981',
  extraordinary: '#6b7280',
};

export const SUBCATEGORY_LABELS: Record<ExpenseSubcategory, string> = {
  electricity: 'Elektřina',
  gas: 'Plyn',
  solid_fuel: 'Tuhá paliva',
  water: 'Voda/Kanalizace',
  waste: 'Svoz odpadu',
  rent: 'Nájemné',
  mortgage: 'Hypotéka',
  consumer_loan: 'Spotřebitelská půjčka',
  mobile_plan: 'Mobilní tarif',
  internet: 'Internet',
  tv_radio: 'TV/Rádio poplatky',
  satellite: 'Satelit/O2 TV',
  netflix: 'Netflix',
  hbo: 'HBO Max',
  youtube_premium: 'YouTube Premium',
  ai_tools: 'AI nástroje',
  leasing: 'Leasing/Půjčka',
  fuel: 'Palivo',
  liability_insurance: 'Povinné ručení',
  accident_insurance: 'Havarijní pojištění',
  life_insurance: 'Životní/Úrazové pojištění',
  household_insurance: 'Pojištění domácnosti',
  property_insurance: 'Pojištění nemovitosti',
  pet_fee: 'Poplatek za psa',
  pet_food_vet: 'Krmivo & Veterinář',
  school_activities: 'Škola/Kroužky',
  clothing: 'Oblečení',
  groceries: 'Nákupy potravin',
  restaurants: 'Restaurace',
  drugstore: 'Drogerie',
  pocket_money: 'Kapesné',
  birthdays_holidays: 'Narozeniny/Svátky',
  vacation_mountain: 'Dovolená hory',
  vacation_autumn: 'Podzimní dovolená',
  emergency_fund: 'Železná rezerva',
  investment_portfolio: 'Investiční portfolio',
  renovation: 'Rekonstrukce',
  misc: 'Drobné výdaje',
};
