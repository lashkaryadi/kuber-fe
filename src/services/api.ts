import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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

  purchaseCode: string;
  saleCode: string;

  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: "mm" | "cm" | "inch";

  certification?: string;
  location?: string;

  status: "pending" | "approved" | "sold";

  description?: string;
  images?: string[];

  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  createdAt: string;
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
  const token = localStorage.getItem("token");
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
    return localStorage.getItem("token");
  },

  setToken(token: string | null) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  },

  logout() {
    api.setToken(null);
    localStorage.removeItem("user");
  },

  /* -------- AUTH -------- */
  async login(email: string, password: string) {
    const { data } = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return data;
  },

  async register(payload: {
    username: string;
    email: string;
    password: string;
    role: "admin" | "staff";
  }) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },

  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  /* -------- DASHBOARD -------- */
  async getDashboardStats() {
    const { data } = await apiClient.get("/dashboard");
    return data;
  },

/* -------- USERS (ADMIN) -------- */

// async getUsers() {
//   try {
//     const { data } = await apiClient.get('/users');
//     return { success: true, data };
//   } catch (err: any) {
//     return {
//       success: false,
//       message: err?.response?.data?.message || 'Failed to fetch users',
//     };
//   }
// }

async getUsers() {
  try {
    const { data } = await apiClient.get("/users");

    const users = data.map((u: any) => ({
      id: u._id,              // ✅ MAP _id → id
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return { success: true, data: users };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || "Failed to fetch users",
    };
  }
}
,

async createUser(payload: any) {
  try {
    const { data } = await apiClient.post('/users', payload);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || 'User creation failed',
    };
  }
},

async updateUser(id: string, payload: any) {
  try {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || 'User update failed',
    };
  }
},

async deleteUser(id: string) {
  try {
    await apiClient.delete(`/users/${id}`);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || 'User delete failed',
    };
  }
},



  /* -------- CATEGORIES -------- */
  async getCategories() {
    const { data } = await apiClient.get("/categories");
    return data;
  },

  async createCategory(payload: { name: string; description?: string }) {
    const { data } = await apiClient.post("/categories", payload);
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
    const { data } = await apiClient.get("/inventory", { params });
    return data;
  },

  async createInventoryItem(payload: any) {
    const { data } = await apiClient.post("/inventory", payload);
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
    const { data } = await apiClient.get("/sold");
    return data;
  },

  async markAsSold(inventoryId: string, payload: any) {
    const { data } = await apiClient.post(`/sold/${inventoryId}`, payload);
    return data;
  },

  //   async generateInvoice(payload: {
  //   packagingId: string;
  //   keptItemIds: string[];
  // }) {
  //   const { data } = await apiClient.post("/invoices/generate", payload);
  //   return data;
  // },

  /* -------- PACKAGING -------- */
  async getPackaging() {
    const { data } = await apiClient.get("/packaging");
    return data;
  },

  async getPackagingById(id: string) {
    const { data } = await apiClient.get(`/packaging/${id}`);
    return data;
  },

  /* -------- INVOICES -------- */
  async generateInvoice(payload: {
    packagingId: string;
    keptItemIds: string[];
    pricePerUnit: number;
  }) {
    const { data } = await apiClient.post("/invoices/generate", payload);
    return data;
  },

  async getInvoiceById(id: string) {
    const { data } = await apiClient.get(`/invoices/${id}`);
    return data;
  },
};

export default api;
