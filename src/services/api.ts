import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/* =======================
   TYPES
======================== */

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  serialNumber: string;
  category: Category;

  pieces: number;

  weight: number;
  weightUnit: "carat" | "gram";

  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: "mm" | "cm" | "inch";

  certification?: string;
  location: string;

  status: "pending" | "approved" | "sold";

  description?: string;
  images?: string[];

  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
}

/* =======================
   AXIOS INSTANCE
======================== */
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
});

/* =======================
   TOKEN INTERCEPTOR
======================== */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =======================
   API
======================== */
const api = {
  /* -------- TOKEN -------- */
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token: string | null) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },

  logout() {
    api.setToken(null);
    localStorage.removeItem('user');
  },

  /* -------- AUTH -------- */
  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
  }) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  /* -------- DASHBOARD -------- */
  async getDashboardStats() {
    const { data } = await apiClient.get('/dashboard');
    return data;
  },

  /* -------- USERS (ADMIN) -------- */
  async getUsers() {
    const { data } = await apiClient.get('/users');
    return data;
  },

  async createUser(payload: any) {
    const { data } = await apiClient.post('/users', payload);
    return data;
  },

  async updateUser(id: string, payload: any) {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data;
  },

  async deleteUser(id: string) {
    await apiClient.delete(`/users/${id}`);
    return true;
  },

  /* -------- CATEGORIES -------- */
  async getCategories() {
    const { data } = await apiClient.get('/categories');
    return data;
  },

  async createCategory(payload: { name: string; description?: string }) {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },

  async updateCategory(id: string, payload: any) {
    const { data } = await apiClient.put(`/categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id: string) {
    await apiClient.delete(`/categories/${id}`);
    return true;
  },

  /* -------- INVENTORY -------- */
  async getInventory(params?: any) {
    const { data } = await apiClient.get('/inventory', { params });
    return data;
  },

  async createInventoryItem(payload: any) {
    const { data } = await apiClient.post('/inventory', payload);
    return data;
  },

  async updateInventoryItem(id: string, payload: any) {
    const { data } = await apiClient.put(`/inventory/${id}`, payload);
    return data;
  },

  async deleteInventoryItem(id: string) {
    await apiClient.delete(`/inventory/${id}`);
    return true;
  },

  /* -------- SOLD -------- */
  async getSoldItems() {
    const { data } = await apiClient.get('/sold');
    return data;
  },

  async markAsSold(inventoryId: string, payload: any) {
    const { data } = await apiClient.post(`/sold/${inventoryId}`, payload);
    return data;
  },
};

export default api;
