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

   dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: "mm" | "cm" | "inch";
  };

  certification?: string;
  location?: string;

  status: "pending" | "approved" | "sold";

  description?: string;
  images?: string[];

  createdAt: string;
}
export interface DashboardStats {
  totalInventory: number;
  approvedItems: number;
  soldItems: number;
  pendingApproval: number;
  totalValue: number;
  inStockValue: number | string;
  recentSales: SoldItem[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  createdAt: string;
}

export interface SoldItem {
  id: string;
  inventoryItem: {
    id: string;
    serialNumber: string;
    category: {
      id: string;
      name: string;
    };
    weight: number;
    weightUnit: string;
  };
  price: number;
  currency: string;
  buyer?: string;
  soldDate: string;
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
    try {
      const { data } = await apiClient.get("/dashboard");
      return { data: data.data };
    } catch (err: any) {
      return {
        error: err?.response?.data?.error || "Failed to fetch dashboard stats",
      };
    }
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

  async getUsers(params?: { search?: string }) {
    try {
      const { data } = await apiClient.get("/users", { params });

      const users = data.data?.map((u: any) => ({
        id: u._id, // ✅ MAP _id → id
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })) || [];

      return { success: true, data: users };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "Failed to fetch users",
      };
    }
  },

  async exportUsersExcel() {
    const response = await apiClient.get("/users/export", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.xlsx";
    a.click();
  },
  async createUser(payload: any) {
    try {
      const { data } = await apiClient.post("/users", payload);
      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "User creation failed",
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
        message: err?.response?.data?.message || "User update failed",
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
        message: err?.response?.data?.message || "User delete failed",
      };
    }
  },

  /* -------- CATEGORIES -------- */
  async getCategories(params?: { search?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get("/categories", { params });
    return data;
  },

  async exportCategoriesExcel() {
    const response = await apiClient.get("/categories/export", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categories.xlsx";
    a.click();
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
  async bulkUpdateInventory(ids: string[], updates: any) {
  try {
    const { data } = await apiClient.put("/inventory/bulk-update", {
      ids,
      updates,
    });
    return { success: true, data };
  } catch {
    return { success: false };
  }
},
//   
/* -------- INVENTORY IMPORT (PREVIEW + CONFIRM) -------- */

async previewInventoryExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await apiClient.post(
      "/inventory/import/preview",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      message:
        err?.response?.data?.message || "Excel preview failed",
    };
  }
},

async confirmInventoryImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await apiClient.post(
      "/inventory/import/confirm",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      message:
        err?.response?.data?.message || "Excel import failed",
    };
  }
},

async downloadImportReport(rows: any[]) {
  try {
    const response = await apiClient.post(
      "/inventory/import/report",
      { rows },
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-validation-report.xlsx";
    a.click();

    // Clean up the URL object
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.response?.data?.message || "Failed to download report",
    };
  }
},


  async importInventoryExcel(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await apiClient.post("/inventory/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "Import failed",
      };
    }
  },

  async exportInventoryExcel() {
    const response = await apiClient.get("/inventory/export", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.xlsx";
    a.click();
  },

  async exportSoldItemsExcel() {
    const response = await apiClient.get("/sold/export", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sold-items.xlsx";
    a.click();
  },

  async getInventory(params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { data } = await apiClient.get("/inventory", { params });
    return data;
  },

  async createInventoryItem(payload: any) {
    try {
      const { data } = await apiClient.post("/inventory", payload);
      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Failed to create inventory item",
        field: err?.response?.data?.field, // 👈 serialNumber
      };
    }
  },

  async updateInventoryItem(id: string, payload: any) {
    try {
      const { data } = await apiClient.put(`/inventory/${id}`, payload);

      return {
        success: true,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Failed to update inventory item",
        field: err?.response?.data?.field,
      };
    }
  },

  async deleteInventoryItem(id: string) {
    await apiClient.delete(`/inventory/${id}`);
    return true;
  },

  async getApprovedInventory() {
    try {
      const { data } = await apiClient.get("/inventory", {
        params: { status: "approved" },
      });
      // Handle both old and new response formats for backward compatibility
      const inventoryData = Array.isArray(data) ? data : (data?.data || []);
      return { success: true, data: inventoryData };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Failed to fetch approved inventory",
      };
    }
  },

  async getSellableInventory() {
    try {
      const { data } = await apiClient.get("/inventory/sellable");
      return { success: true, data: data.data || [] };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.message || "Failed to fetch sellable inventory",
      };
    }
  },

  /* -------- SOLD -------- */
  // async getSoldItems() {
  //   const { data } = await apiClient.get("/sold");
  //   return data;
  // },
  async getSoldItems(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) {
    try {
      const { data } = await apiClient.get("/sold", { params });
      return { success: true, data: data.data, meta: data.meta };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "Failed to fetch sold items",
        data: [],
        meta: null
      };
    }
  },

  async markAsSold(payload: {
    inventoryId: string;
    price: number;
    currency: string;
    soldDate: string;
    buyer?: string;
  }) {
    try {
      const { data } = await apiClient.post("/sold", payload);

      return {
        success: true,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to mark item as sold",
      };
    }
  },
  async undoSold(soldId: string) {
    try {
      await apiClient.delete(`/sold/${soldId}/undo`);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "Undo failed",
      };
    }
  },

  async updateSold(
    soldId: string,
    payload: { price: number; soldDate: string; buyer?: string }
  ) {
    try {
      const { data } = await apiClient.put(`/sold/${soldId}`, payload);
      return { success: true, data };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || "Update failed",
      };
    }
  },

  // async undoSold(soldId: string) {
  //   try {
  //     await apiClient.delete(`/sold/${soldId}/undo`);
  //     return { success: true };
  //   } catch (err: any) {
  //     return {
  //       success: false,
  //       message:
  //         err?.response?.data?.message ||
  //         "Failed to undo sold item",
  //     };
  //   }
  // },
  // async updateSold(
  //   soldId: string,
  //   payload: {
  //     price: number;
  //     soldDate: string;
  //     buyer?: string;
  //   }
  // ) {
  //   try {
  //     const { data } = await apiClient.put(`/sold/${soldId}`, payload);
  //     return { success: true, data };
  //   } catch (err: any) {
  //     return {
  //       success: false,
  //       message:
  //         err?.response?.data?.message ||
  //         "Failed to update sold item",
  //     };
  //   }
  // },

  // async markAsSold(inventoryId: string, payload: ¯¸any) {
  //   const { data } = await apiClient.post(`/sold/${inventoryId}`, payload);
  //   return data;
  // },
  // async markAsSold(payload: {
  //   inventoryId: string;
  //   price: number;
  //   currency: string;
  //   soldDate: string;
  //   buyer?: string;
  // }) {
  //   try {
  //     const { data } = await apiClient.post("/sold", payload);
  //     return { success: true, data };
  //   } catch (err: any) {
  //     return {
  //       success: false,
  //       message: err?.response?.data?.message || "Failed to mark item as sold",
  //     };
  //   }
  // },

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

  async getInvoiceBySold(soldId: string) {
    const { data } = await apiClient.get(`/invoices/sold/${soldId}`);
    return data;
  },
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

// // PREVIEW EXCEL
// export const previewInventoryExcel = async (file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   const res = await fetch("/api/inventory/import/preview", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//     body: formData,
//   });

//   return res.json();
// };

// // CONFIRM IMPORT
// export const confirmInventoryImport = async (file: File) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   const res = await fetch("/api/inventory/import", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//     body: formData,
//   });

//   return res.json();
// };

export default api;
