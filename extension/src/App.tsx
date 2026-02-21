import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import Sidebar from './components/common/Sidebar';
import LoginPage from './components/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import IncomesPage from './pages/IncomesPage';
import CalendarPage from './pages/CalendarPage';
import AIChatPage from './pages/AIChatPage';
import FamilyPage from './pages/FamilyPage';
import VehiclesPage from './pages/VehiclesPage';
import PetsPage from './pages/PetsPage';
import AdminPage from './pages/AdminPage';
import LoadingSpinner from './components/common/LoadingSpinner';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-dark-bg">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'expenses': return <ExpensesPage />;
      case 'incomes': return <IncomesPage />;
      case 'calendar': return <CalendarPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'family': return <FamilyPage />;
      case 'vehicles': return <VehiclesPage />;
      case 'pets': return <PetsPage />;
      case 'admin': return <AdminPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <DataProvider>
      <div className="flex min-h-screen bg-surface-light dark:bg-dark-bg">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 ml-64 p-6 lg:p-8 max-w-7xl">
          {renderPage()}
        </main>
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
