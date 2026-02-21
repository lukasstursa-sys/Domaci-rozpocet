import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Expense, Income, FamilyMember, Vehicle, Pet,
  CalendarEvent, Notification, MonthlyOverview, RatRaceData,
  CategoryBreakdown, ExpenseCategory
} from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  expenses: Expense[];
  incomes: Income[];
  familyMembers: FamilyMember[];
  vehicles: Vehicle[];
  pets: Pet[];
  calendarEvents: CalendarEvent[];
  notifications: Notification[];
  overview: MonthlyOverview;
  ratRace: RatRaceData;
  categoryBreakdown: CategoryBreakdown[];
  currentMonth: number;
  currentYear: number;
  setMonth: (month: number, year: number) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

const defaultOverview: MonthlyOverview = {
  activeIncome: 0,
  passiveIncome: 0,
  totalExpenses: 0,
  remainingBudget: 0,
  wellmallTotal: 0,
  familyTotal: 0,
};

const defaultRatRace: RatRaceData = {
  passiveIncome: 0,
  totalExpenses: 0,
  percentage: 0,
  trend: 'stable',
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setMonth = useCallback((month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [expData, incData, members, vehs, petData, events, notifs] =
        await Promise.all([
          api.getExpenses(currentMonth, currentYear),
          api.getIncomes(currentMonth, currentYear),
          api.getFamilyMembers(),
          api.getVehicles(),
          api.getPets(),
          api.getCalendarEvents(currentMonth, currentYear),
          api.getNotifications(),
        ]);
      setExpenses(expData);
      setIncomes(incData);
      setFamilyMembers(members);
      setVehicles(vehs);
      setPets(petData);
      setCalendarEvents(events);
      setNotifications(notifs);
    } catch (err) {
      console.error('Chyba při načítání dat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentMonth, currentYear]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
      const created = await api.createExpense(expense);
      setExpenses((prev) => [...prev, created]);
    },
    []
  );

  const addIncome = useCallback(
    async (income: Omit<Income, 'id' | 'userId' | 'createdAt'>) => {
      const created = await api.createIncome(income);
      setIncomes((prev) => [...prev, created]);
    },
    []
  );

  const updateExpense = useCallback(
    async (id: string, expense: Partial<Expense>) => {
      const updated = await api.updateExpense(id, expense);
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    },
    []
  );

  const updateIncome = useCallback(
    async (id: string, income: Partial<Income>) => {
      const updated = await api.updateIncome(id, income);
      setIncomes((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    await api.deleteIncome(id);
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Computed values
  const activeIncome = incomes
    .filter((i) => i.type === 'active_salary')
    .reduce((sum, i) => sum + i.amount, 0);

  const passiveIncome = incomes
    .filter((i) => i.type !== 'active_salary')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountTotal, 0);
  const wellmallTotal = expenses.reduce((sum, e) => sum + e.amountWellmall, 0);
  const familyTotal = expenses.reduce((sum, e) => sum + e.amountFamily, 0);

  const overview: MonthlyOverview = {
    activeIncome,
    passiveIncome,
    totalExpenses,
    remainingBudget: activeIncome + passiveIncome - totalExpenses,
    wellmallTotal,
    familyTotal,
  };

  const ratRacePercentage = totalExpenses > 0
    ? Math.min(Math.round((passiveIncome / totalExpenses) * 100), 100)
    : 0;

  const ratRace: RatRaceData = {
    passiveIncome,
    totalExpenses,
    percentage: ratRacePercentage,
    trend: 'stable',
  };

  // Category breakdown
  const categoryMap = new Map<ExpenseCategory, number>();
  expenses.forEach((e) => {
    const current = categoryMap.get(e.categoryId) || 0;
    categoryMap.set(e.categoryId, current + e.amountTotal);
  });

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category],
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <DataContext.Provider
      value={{
        expenses,
        incomes,
        familyMembers,
        vehicles,
        pets,
        calendarEvents,
        notifications,
        overview,
        ratRace,
        categoryBreakdown,
        currentMonth,
        currentYear,
        setMonth,
        refreshData,
        isLoading,
        addExpense,
        updateExpense,
        addIncome,
        updateIncome,
        deleteExpense,
        deleteIncome,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData musí být použit uvnitř DataProvider');
  }
  return context;
}
