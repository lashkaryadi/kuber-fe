import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

/* ============================
   TYPES
============================ */
export interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  createdAt?: string;
}

export interface RecycleBinItem {
  id: string;
  entityType: "inventory" | "category";
  entityId: string;
  entityData: any;
  deletedBy: {
    username?: string;
    email?: string;
  };
  deletedAt: string;
  expiresAt: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/* ============================
   AXIOS INSTANCE
============================ */
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/* ============================
   TOKEN HELPERS
============================ */
const getToken = () => localStorage.getItem("accessToken") || localStorage.getItem("token");

const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
  }
};

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not a retry attempt, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await apiClient.post("/auth/refresh");
        const newToken = (refreshResponse.data as any).accessToken;
        
        if (newToken) {
          setToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // For 401 without retry or other errors, clear auth
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/* ============================
   AUTH
============================ */
const login = async (email: string, password: string) => {
  const { data } = await apiClient.post("/api/auth/login", { email, password });

  if (data.accessToken) {
    setToken(data.accessToken);
  }

  return data;
};

const logout = () => {
  setToken(null);
  localStorage.removeItem("user");
};

const register = async (payload: {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "staff";
}) => {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data;
};

const verifyEmailOtp = async (email: string, otp: string) => {
  const { data } = await apiClient.post("/api/auth/verify-email", { email, otp });
  return data;
};

const resendEmailOtp = async (email: string) => {
  const { data } = await apiClient.post("/api/auth/resend-otp", { email });
  return data;
};

/* ============================
   INVENTORY
============================ */
const createInventoryItem = async (data: any) => {
  try {
    const response = await apiClient.post("/api/inventory", data);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error creating inventory:", error);
    const err = error as any;
    return {
      success: false,
      data: null,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const updateInventoryItem = async (id: string, data: any) => {
  try {
    const response = await apiClient.put(`/api/inventory/${id}`, data);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error updating inventory:", error);
    const err = error as any;
    return {
      success: false,
      data: null,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const getInventory = async (params?: any) => {
  try {
    const response = await apiClient.get("/api/inventory", { params });
    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : response.data?.data || [],
      meta: response.data?.meta || { pages: 1 }
    };
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return { success: false, data: [], meta: { pages: 1 } };
  }
};

const getInventoryById = async (id: string) => {
  try {
    const response = await apiClient.get(`/api/inventory/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return { success: false, data: null };
  }
};

const deleteInventoryItem = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/inventory/${id}`);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error deleting inventory:", error);
    const err = error as any;
    return {
      success: false,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

/* ============================
   CATEGORIES
============================ */
const getCategories = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const res = await apiClient.get("/api/categories", { params });

    return {
      success: true,
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      meta: res.data?.meta || null,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      meta: null,
    };
  }
};

const createCategory = async (payload: any) => {
  try {
    const response = await apiClient.post("/api/categories", payload);
    return { success: true, data: response.data };
  } catch (error: any) {
    const message =
      error?.response?.status === 409
        ? "Category already exists"
        : error?.response?.data?.message || "Failed to create category";

    return {
      success: false,
      message,
      status: error?.response?.status,
    };
  }
};

const updateCategory = async (id: string, payload: any) => {
  try {
    const response = await apiClient.put(`/api/categories/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, data: null };
  }
};

const deleteCategory = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, message: (error as Error).message };
  }
};

/* ============================
   SHAPES
============================ */
const getShapes = async () => {
  try {
    const response = await apiClient.get("/api/shapes");
    return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.data || [] };
  } catch (error) {
    console.error("Error fetching shapes:", error);
    return { success: false, data: [] };
  }
};

const createShape = async (payload: any) => {
  try {
    const response = await apiClient.post("/api/shapes", payload);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error creating shape:", error);
    const err = error as any;
    return {
      success: false,
      data: null,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const getInventoryShapes = async () => {
  try {
    const response = await getShapes();
    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data.map((shape: any) => shape.name || shape),
      };
    }
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error("Error fetching inventory shapes:", error);
    return {
      success: false,
      data: [],
    };
  }
};

/* ============================
   UPLOADS
============================ */
const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: { url: response.data?.url || response.data } };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { data: null, error: (error as Error).message };
  }
};

/* ============================
   SALES
============================ */
const sellInventory = async (data: any) => {
  try {
    const response = await apiClient.post("/api/sales", data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error selling inventory:", error);
    return { success: false, error: (error as Error).message };
  }
};

const getSoldItems = async (params?: any) => {
  try {
    const response = await apiClient.get("/api/sales", { params });
    return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.data || [] };
  } catch (error) {
    console.error("Error fetching sold items:", error);
    return { success: false, data: [] };
  }
};

const undoSale = async (saleId: string) => {
  try {
    const response = await apiClient.post(`/api/sales/${saleId}/undo`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error undoing sale:", error);
    return { success: false, error: (error as Error).message };
  }
};

/* ============================
   USERS
============================ */
const getUsers = async () => {
  try {
    const response = await apiClient.get("/api/users");
    return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.data || [] };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, data: [] };
  }
};

const createUser = async (payload: any) => {
  try {
    const response = await apiClient.post("/api/users", payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: (error as Error).message };
  }
};

const updateUser = async (id: string, payload: any) => {
  try {
    const response = await apiClient.put(`/api/users/${id}`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: (error as Error).message };
  }
};

const deleteUser = async (id: string) => {
  try {
    await apiClient.delete(`/api/users/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false };
  }
};

const exportUsersExcel = async () => {
  try {
    const response = await apiClient.get("/api/users/export/excel", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    return { success: true };
  } catch (error) {
    console.error("Error exporting users:", error);
    return { success: false };
  }
};

/* ============================
   DASHBOARD
============================ */
const getDashboardStats = async () => {
  try {
    const response = await apiClient.get("/api/dashboard");
    return {
      success: true,
      data: response.data || {
        totalInventory: 0,
        inStockItems: 0,
        soldItems: 0,
        pendingApproval: 0,
        totalValue: 0,
        inStockValue: 0,
        recentSales: [],
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      data: {
        totalInventory: 0,
        inStockItems: 0,
        soldItems: 0,
        pendingApproval: 0,
        totalValue: 0,
        inStockValue: 0,
        recentSales: [],
      },
    };
  }
};

/* ============================
   COMPANY / SETTINGS
============================ */
const getCompany = async () => {
  try {
    const response = await apiClient.get("/api/company");
    return response.data;
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
};

const saveCompany = async (payload: any) => {
  try {
    await apiClient.post("/api/company", payload);
    return true;
  } catch (error) {
    console.error("Error saving company:", error);
    return false;
  }
};

const uploadCompanyImage = async (file: File, type: "logo" | "signature") => {
  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", type);
    const response = await apiClient.post("/api/company/upload", formData);
    return response.data?.url || "";
  } catch (error) {
    console.error("Error uploading company image:", error);
    return "";
  }
};

/* ============================
   RECYCLE BIN
============================ */
const restoreRecycleBinItems = async (ids: string[]) => {
  try {
    const response = await apiClient.post("/api/recycle-bin/restore", { ids });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error restoring recycle bin items:", error);
    const err = error as any;
    return {
      success: false,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const permanentlyDeleteRecycleBinItems = async (ids: string[]) => {
  try {
    const response = await apiClient.delete("/api/recycle-bin/delete", { data: { ids } });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error permanently deleting recycle bin items:", error);
    const err = error as any;
    return {
      success: false,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const emptyRecycleBin = async () => {
  try {
    const response = await apiClient.post("/api/recycle-bin/empty");
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error emptying recycle bin:", error);
    const err = error as any;
    return {
      success: false,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const getRecycleBinItems = async (params?: any) => {
  try {
    const response = await apiClient.get("/api/recycle-bin", { params });
    return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.data || [], meta: response.data?.meta || { pages: 1 } };
  } catch (error: unknown) {
    console.error("Error fetching recycle bin:", error);
    const err = error as any;
    return {
      success: false,
      data: [],
      meta: { pages: 1 },
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

const restoreFromRecycleBin = async (id: string) => {
  try {
    const response = await apiClient.post(`/api/recycle-bin/${id}/restore`);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    console.error("Error restoring from recycle bin:", error);
    const err = error as any;
    return {
      success: false,
      message: err?.response?.data?.message || err.message,
      status: err?.response?.status
    };
  }
};

/* ============================
   ANALYTICS
============================ */
const getAnalytics = async (params?: any) => {
  try {
    const response = await apiClient.get("/api/analytics", { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { success: false, data: {} };
  }
};

/* ============================
   EXPORT INVENTORY
============================ */
const exportInventoryExcel = async () => {
  const res = await apiClient.get('/api/inventory/export/excel', {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'inventory.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { success: true };
};

/* ============================
   AUDIT LOGS
============================ */
const getAuditLogs = async (params?: any) => {
  try {
    const response = await apiClient.get("/api/audit-logs", { params });
    return { success: true, data: Array.isArray(response.data) ? response.data : response.data?.data || [] };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, data: [] };
  }
};

/* ============================
   EXPORT DEFAULT API
============================ */
const api = {
  // Auth
  getToken,
  setToken,
  login,
  logout,
  register,
  verifyEmailOtp,
  resendEmailOtp,

  // Inventory
  createInventoryItem,
  updateInventoryItem,
  getInventory,
  getInventoryById,
  deleteInventoryItem,
  exportInventoryExcel,

  // Categories & Shapes
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getShapes,
  createShape,
  getInventoryShapes,

  // Uploads
  uploadImage,

  // Sales
  sellInventory,
  getSoldItems,
  undoSale,

  // Users
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  exportUsersExcel,

  // Dashboard
  getDashboardStats,

  // Company
  getCompany,
  saveCompany,
  uploadCompanyImage,

  // Recycle Bin
  emptyRecycleBin,
  getRecycleBinItems,
  restoreFromRecycleBin,
  restoreRecycleBinItems,
  permanentlyDeleteRecycleBinItems,

  // Analytics
  getAnalytics,

  // Audit Logs
  getAuditLogs,
};

export default api;
