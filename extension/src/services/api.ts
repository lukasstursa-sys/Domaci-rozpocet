// ============================================================
// API Service - Communication with Backend
// ============================================================

const API_BASE = 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Chyba serveru' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, familyName: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, familyName }),
    });
  }

  // Expenses
  async getExpenses(month: number, year: number) {
    return this.request<any[]>(`/expenses?month=${month}&year=${year}`);
  }

  async createExpense(expense: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, expense: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string) {
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Incomes
  async getIncomes(month: number, year: number) {
    return this.request<any[]>(`/incomes?month=${month}&year=${year}`);
  }

  async createIncome(income: any) {
    return this.request<any>('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  }

  async updateIncome(id: string, income: any) {
    return this.request<any>(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(income),
    });
  }

  async deleteIncome(id: string) {
    return this.request<void>(`/incomes/${id}`, {
      method: 'DELETE',
    });
  }

  // Family Members
  async getFamilyMembers() {
    return this.request<any[]>('/family-members');
  }

  async createFamilyMember(member: any) {
    return this.request<any>('/family-members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }

  async updateFamilyMember(id: string, member: any) {
    return this.request<any>(`/family-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
  }

  async deleteFamilyMember(id: string) {
    return this.request<void>(`/family-members/${id}`, {
      method: 'DELETE',
    });
  }

  // Vehicles
  async getVehicles() {
    return this.request<any[]>('/vehicles');
  }

  async createVehicle(vehicle: any) {
    return this.request<any>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(id: string, vehicle: any) {
    return this.request<any>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: string) {
    return this.request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // Pets
  async getPets() {
    return this.request<any[]>('/pets');
  }

  async createPet(pet: any) {
    return this.request<any>('/pets', {
      method: 'POST',
      body: JSON.stringify(pet),
    });
  }

  async updatePet(id: string, pet: any) {
    return this.request<any>(`/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pet),
    });
  }

  async deletePet(id: string) {
    return this.request<void>(`/pets/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar Events
  async getCalendarEvents(month: number, year: number) {
    return this.request<any[]>(`/calendar?month=${month}&year=${year}`);
  }

  // Dashboard
  async getDashboard(month: number, year: number) {
    return this.request<any>(`/dashboard?month=${month}&year=${year}`);
  }

  // AI Chat
  async sendAIMessage(message: string) {
    return this.request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAIInsights() {
    return this.request<{ insights: string[] }>('/ai/insights');
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Admin
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getAdminFamilies() {
    return this.request<any[]>('/admin/families');
  }

  async getGlobalCategories() {
    return this.request<any[]>('/admin/categories');
  }

  async updateGlobalCategory(id: string, data: any) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createGlobalCategory(data: any) {
    return this.request<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAIPrompt(prompt: string) {
    return this.request<void>('/admin/ai-prompt', {
      method: 'PUT',
      body: JSON.stringify({ prompt }),
    });
  }

  async getAIPrompt() {
    return this.request<{ prompt: string }>('/admin/ai-prompt');
  }

  // File Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload selhal');
    }

    return response.json() as Promise<{ url: string }>;
  }

  // Budget Limits
  async getBudgetLimits(month: number, year: number) {
    return this.request<any[]>(`/budgets?month=${month}&year=${year}`);
  }

  async createBudgetLimit(data: { categoryId: string; amount: number; month: number; year: number }) {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudgetLimit(id: string, data: { amount: number }) {
    return this.request<any>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudgetLimit(id: string) {
    return this.request<void>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Export & Backup
  async exportCSV(type: 'expenses' | 'incomes', month: number, year: number): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${API_BASE}/export/csv?type=${type}&month=${month}&year=${year}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Export selhal');
    }

    return response.blob();
  }

  async exportBackup(): Promise<Blob> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/export/backup`, { headers });

    if (!response.ok) {
      throw new Error('Záloha selhala');
    }

    return response.blob();
  }

  async restoreBackup(data: any) {
    return this.request<{ message: string; count: number }>('/export/restore', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  // Calendar Events (CRUD)
  async createCalendarEvent(event: any) {
    return this.request<any>('/calendar', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateCalendarEvent(id: string, event: any) {
    return this.request<any>(`/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteCalendarEvent(id: string) {
    return this.request<void>(`/calendar/${id}`, {
      method: 'DELETE',
    });
  }

  // Recurring Transactions
  async getRecurring(activeOnly?: boolean) {
    const query = activeOnly ? '?active=true' : '';
    return this.request<any[]>(`/recurring${query}`);
  }

  async createRecurring(data: any) {
    return this.request<any>('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecurring(id: string, data: any) {
    return this.request<any>(`/recurring/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurring(id: string) {
    return this.request<void>(`/recurring/${id}`, {
      method: 'DELETE',
    });
  }

  async processRecurring() {
    return this.request<{ processed: number; created: any[] }>('/recurring/process', {
      method: 'POST',
    });
  }

  // Transaction Templates
  async getTemplates() {
    return this.request<any[]>('/templates');
  }

  async createTemplate(data: any) {
    return this.request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.request<any>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string) {
    return this.request<void>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async useTemplate(id: string, overrides?: any) {
    return this.request<any>(`/templates/${id}/use`, {
      method: 'POST',
      body: JSON.stringify(overrides || {}),
    });
  }

  // Debts
  async getDebts(type?: string, status?: string) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/debts${query}`);
  }

  async getDebtSummary() {
    return this.request<{ totalDebt: number; totalCredit: number; netPosition: number; overdueCount: number }>('/debts/summary');
  }

  async createDebt(data: any) {
    return this.request<any>('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDebt(id: string, data: any) {
    return this.request<any>(`/debts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDebt(id: string) {
    return this.request<void>(`/debts/${id}`, {
      method: 'DELETE',
    });
  }

  async recordDebtPayment(id: string, payment: { amount: number; note?: string; date?: string }) {
    return this.request<any>(`/debts/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Accounts
  async getAccounts(includeHidden?: boolean) {
    const query = includeHidden ? '?includeHidden=true' : '';
    return this.request<any[]>(`/accounts${query}`);
  }

  async createAccount(data: any) {
    return this.request<any>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccount(id: string, data: any) {
    return this.request<any>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(id: string) {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async transferBetweenAccounts(fromAccountId: string, toAccountId: string, amount: number, note?: string) {
    return this.request<any>('/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify({ fromAccountId, toAccountId, amount, note }),
    });
  }

  // WellMall Report
  async generateWellmallReport(month: number, year: number) {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${API_BASE}/reports/wellmall?month=${month}&year=${year}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Generování reportu selhalo');
    }

    return response.blob();
  }
}

export const api = new ApiService();
export default api;
