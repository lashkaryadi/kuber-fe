import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddInventoryDialog } from "@/components/inventory/AddInventoryDialog";
import { InventoryItem, CUTTING_STYLES, CuttingStyleCode } from "@/types/inventory";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Pagination } from "@/components/common/Pagination";
import api from "@/services/api";

type ShapeName = string;

interface SeriesItem {
  _id: string;
  name: string;
}

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [shapeFilter, setShapeFilter] = useState<string>("ALL");
  const [cuttingStyleFilter, setCuttingStyleFilter] = useState("ALL");
  const [seriesFilter, setSeriesFilter] = useState("ALL");
  const [lotTypeFilter, setLotTypeFilter] = useState("ALL");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [minPieces, setMinPieces] = useState("");
  const [maxPieces, setMaxPieces] = useState("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [availableShapes, setAvailableShapes] = useState<ShapeName[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories, shapes, series on mount
  useEffect(() => {
    fetchCategories();
    fetchAvailableShapes();
    fetchSeries();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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

  const fetchSeries = async () => {
    try {
      const response = await api.getSeries({ limit: 100 });
      if (response.success) {
        setSeriesList(response.data);
      }
    } catch (error) {
      console.error("Error fetching series:", error);
    }
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== "ALL" && { category: categoryFilter }),
        ...(statusFilter !== "All Status" && { status: statusFilter }),
        ...(shapeFilter !== "ALL" && { shape: shapeFilter }),
        ...(cuttingStyleFilter !== "ALL" && { cuttingStyle: cuttingStyleFilter }),
        ...(seriesFilter !== "ALL" && { series: seriesFilter }),
        ...(lotTypeFilter !== "ALL" && { lotType: lotTypeFilter }),
        ...(minWeight && { minWeight }),
        ...(maxWeight && { maxWeight }),
        ...(minPieces && { minPieces }),
        ...(maxPieces && { maxPieces }),
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
  }, [
    page, searchTerm, categoryFilter, statusFilter, shapeFilter,
    cuttingStyleFilter, seriesFilter, lotTypeFilter,
    minWeight, maxWeight, minPieces, maxPieces,
    sortBy, sortOrder
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    categoryFilter, statusFilter, shapeFilter, searchTerm,
    cuttingStyleFilter, seriesFilter, lotTypeFilter,
    minWeight, maxWeight, minPieces, maxPieces
  ]);

  // Fetch inventory
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        // Third click: reset sort
        setSortBy('createdAt');
        setSortOrder('desc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStatusFilter("All Status");
    setShapeFilter("ALL");
    setCuttingStyleFilter("ALL");
    setSeriesFilter("ALL");
    setLotTypeFilter("ALL");
    setMinWeight("");
    setMaxWeight("");
    setMinPieces("");
    setMaxPieces("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    searchTerm || categoryFilter !== "ALL" || statusFilter !== "All Status" ||
    shapeFilter !== "ALL" || cuttingStyleFilter !== "ALL" || seriesFilter !== "ALL" ||
    lotTypeFilter !== "ALL" || minWeight || maxWeight || minPieces || maxPieces;

  const handleExport = async () => {
    try {
      await api.exportInventoryExcel();
      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export inventory");
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.importInventoryCSV(file);
      if (response.success) {
        toast.success(response.data?.message || "CSV imported successfully");
        fetchInventory();
        fetchAvailableShapes();
      } else {
        toast.error(response.message || "Failed to import CSV");
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Failed to import CSV");
    }

    if (csvInputRef.current) {
      csvInputRef.current.value = '';
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
              onClick={() => csvInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search across all fields (serial, code, category, shape, series, cutting style...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-red-600 hover:text-red-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Category Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by category"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Shape Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Shape</label>
                <select
                  value={shapeFilter}
                  onChange={(e) => setShapeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by shape"
                >
                  <option value="ALL">All Shapes</option>
                  {availableShapes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Cutting Style Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cutting Style</label>
                <select
                  value={cuttingStyleFilter}
                  onChange={(e) => setCuttingStyleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by cutting style"
                >
                  <option value="ALL">All Styles</option>
                  {Object.entries(CUTTING_STYLES).map(([code, name]) => (
                    <option key={code} value={code}>{code} - {name}</option>
                  ))}
                </select>
              </div>

              {/* Series Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
                <select
                  value={seriesFilter}
                  onChange={(e) => setSeriesFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by series"
                >
                  <option value="ALL">All Series</option>
                  {seriesList.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Lot Type Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Lot Type</label>
                <select
                  value={lotTypeFilter}
                  onChange={(e) => setLotTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by lot type"
                >
                  <option value="ALL">All Types</option>
                  <option value="single">Single</option>
                  <option value="mix">Mix</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  aria-label="Filter by status"
                >
                  <option value="All Status">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Sold">Partially Sold</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            {/* Range Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Weight</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Min"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Weight</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Max"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Pieces</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="Min"
                  value={minPieces}
                  onChange={(e) => setMinPieces(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Pieces</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="Max"
                  value={maxPieces}
                  onChange={(e) => setMaxPieces(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-muted-foreground">
            Loading inventory...
          </div>
        )}

        {/* Empty state */}
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
            onRefresh={() => {
              fetchInventory();
              fetchAvailableShapes();
              fetchSeries();
            }}
            categories={categories}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
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
            fetchCategories();
            fetchAvailableShapes();
            fetchSeries();
          }}
          categories={categories}
        />
      </div>
    </MainLayout>
  );
};

export default Inventory;
