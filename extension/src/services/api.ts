// ============================================================
// API Service - Communication with Backend
// ============================================================

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

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
