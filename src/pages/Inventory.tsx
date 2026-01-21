import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddInventoryDialog } from "@/components/inventory/AddInventoryDialog";
import { InventoryItem } from "@/types/inventory"; // Removed ShapeName (not exported); define locally if needed
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Pagination } from "@/components/common/Pagination";
import api from "@/services/api";

// Define ShapeName locally if not exported from types
type ShapeName = string;

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [shapeFilter, setShapeFilter] = useState<string>("ALL");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    [],
  ); // Fix: Specify type instead of any
  const [availableShapes, setAvailableShapes] = useState<ShapeName[]>([]); // NEW
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch available shapes (NEW)
  useEffect(() => {
    fetchAvailableShapes();
  }, []);

  // Fetch inventory

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();

      if (response.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  // NEW: Fetch available shapes
  const fetchAvailableShapes = async () => {
    try {
      const response = await api.getInventoryShapes();
      if (response.success && Array.isArray(response.data)) {
        setAvailableShapes(response.data);
      } else {
        setAvailableShapes([]);
      }
    } catch (error) {
      console.error("Error fetching shapes:", error);
      setAvailableShapes([]);
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "ALL" && {
          category: categoryFilter,
        }),
        ...(statusFilter !== "All Status" && { status: statusFilter }),
        ...(shapeFilter !== "ALL" && { shape: shapeFilter }),
      };

      const response = await api.getInventory(params);
      setInventory(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, statusFilter, shapeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, statusFilter, shapeFilter, searchTerm]);

  // Fetch inventory
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleExport = async () => {
    try {
      await api.exportInventoryExcel();
      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export inventory");
    }
  };

  return (
    <MainLayout title="Inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Inventory
          </h1>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-input hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="secondary"
              className="bg-secondary hover:bg-secondary/80"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            aria-label="Filter by category" // Fix: Add accessible name
          >
            <option key="ALL" value="ALL">All Categories</option>
            {categories.map((cat) => {
              const id = (cat._id || cat._id)?.toString();

              if (!id) return null; // 🛡 safety

              return (
                <option key={id} value={id}>
                  {cat.name}
                </option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            aria-label="Filter by status" // Fix: Add accessible name
          >
            <option value="All Status">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Pending">Pending</option>
            <option value="Partially Sold">Partially Sold</option>
            <option value="Sold">Sold</option>
          </select>

          {/* NEW: Shape Filter */}
          <select
            value={shapeFilter}
            onChange={(e) => setShapeFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            aria-label="Filter by shape" // Fix: Add accessible name
          >
            <option key="ALL_SHAPES" value="ALL">All Shapes</option>
            {Array.isArray(availableShapes) && availableShapes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-muted-foreground">
            Loading inventory…
          </div>
        )}

        {/* Error - This would need to be handled differently in the actual implementation */}
        {!loading && inventory.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            No inventory items match your filters
          </div>
        )}

        {/* Table */}
        {inventory.length > 0 && (
          <InventoryTable
            inventory={inventory}
            loading={loading}
            onRefresh={fetchInventory}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => setPage(p)}
          />
        )}

        {/* Add Inventory Dialog */}
        <AddInventoryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => {
            fetchInventory();
            fetchCategories(); // Refresh categories list
            fetchAvailableShapes(); // Refresh shapes list
          }}
          categories={categories}
        />
      </div>
    </MainLayout>
  );
};

export default Inventory;
