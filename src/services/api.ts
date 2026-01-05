const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    this.setToken(null);
    return { data: { message: 'Logged out successfully' } };
  }

  // Inventory endpoints
  async getInventory(params?: { category?: string; status?: string; search?: string }) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<InventoryItem[]>(`/inventory${queryString}`);
  }

  async getInventoryItem(id: string) {
    return this.request<InventoryItem>(`/inventory/${id}`);
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>) {
    return this.request<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateInventoryItem(id: string, item: Partial<InventoryItem>) {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.request<void>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseUrl}/upload`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload error' };
    }
  }

  // Categories endpoints
  async getCategories() {
    return this.request<Category[]>('/categories');
  }

  async createCategory(category: Omit<Category, 'id'>) {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: Partial<Category>) {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Sold items endpoints
  async getSoldItems() {
    return this.request<SoldItem[]>('/sold');
  }

  async markAsSold(inventoryId: string, saleData: { price: number; soldDate: string; buyer?: string }) {
    return this.request<SoldItem>('/sold', {
      method: 'POST',
      body: JSON.stringify({ inventoryId, ...saleData }),
    });
  }

  // Users endpoints
  async getUsers() {
    return this.request<User[]>('/users');
  }

  async createUser(user: Omit<User, 'id'> & { password: string }) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: Partial<User>) {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request<DashboardStats>('/dashboard/stats');
  }
}

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  serialNumber: string;
  category: string;
  weight: number;
  weightUnit: 'carat' | 'gram';
  certification?: string;
  location: string;
  status: 'pending' | 'approved' | 'sold';
  description?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SoldItem {
  id: string;
  inventoryItem: InventoryItem;
  price: number;
  currency: string;
  soldDate: string;
  buyer?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalInventory: number;
  approvedItems: number;
  soldItems: number;
  pendingApproval: number;
  totalValue: number;
  recentSales: SoldItem[];
}

export const api = new ApiService(API_BASE_URL);
export default api;
