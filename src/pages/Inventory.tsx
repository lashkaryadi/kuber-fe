import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddInventoryDialog } from '@/components/inventory/AddInventoryDialog';
import { InventoryItem, Category } from '@/types/inventory';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import api from '@/services/api';

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [shapeFilter, setShapeFilter] = useState<string>('All Shapes');

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableShapes, setAvailableShapes] = useState<string[]>([]);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch available shapes on mount
  useEffect(() => {
    fetchAvailableShapes();
  }, []);

  // Fetch inventory when filters or page changes
  useEffect(() => {
    fetchInventory();
  }, [searchTerm, categoryFilter, statusFilter, shapeFilter, page]);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        console.error('Error fetching categories:', response.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAvailableShapes = async () => {
    try {
      const response = await api.getShapes();
      if (response.success) {
        setAvailableShapes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching shapes:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'All Categories') params.category = categoryFilter;
      if (statusFilter !== 'All Status') params.status = statusFilter;
      if (shapeFilter !== 'All Shapes') params.shape = shapeFilter;

      const response = await api.getInventory(params);

      if (response.success) {
        setInventory(response.data || []);
        setTotalPages(response.meta?.pages || 1);
        setTotal(response.meta?.total || 0);
      } else {
        toast.error(response.message || 'Failed to fetch inventory');
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchInventory(),
      fetchCategories(),
      fetchAvailableShapes()
    ]);
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (categoryFilter !== 'All Categories') params.category = categoryFilter;
      if (statusFilter !== 'All Status') params.status = statusFilter;
      if (shapeFilter !== 'All Shapes') params.shape = shapeFilter;

      await api.exportInventoryExcel(params);
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export inventory');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All Categories');
    setStatusFilter('All Status');
    setShapeFilter('All Shapes');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    categoryFilter !== 'All Categories' ||
    statusFilter !== 'All Status' ||
    shapeFilter !== 'All Shapes';

  return (
    <MainLayout title="Inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your gemstone inventory
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-input hover:bg-accent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="border-input hover:bg-accent"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
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

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold">{categories.length}</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Shapes</p>
            <p className="text-2xl font-bold">{availableShapes.length}</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Current Page</p>
            <p className="text-2xl font-bold">{page} / {totalPages}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                Reset Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="All Categories">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="All Status">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Pending">Pending</option>
              <option value="Partially Sold">Partially Sold</option>
              <option value="Sold">Sold</option>
            </select>

            {/* Shape Filter */}
            <select
              value={shapeFilter}
              onChange={(e) => {
                setShapeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="All Shapes">All Shapes</option>
              {availableShapes.map(shape => (
                <option key={shape} value={shape}>{shape}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <InventoryTable
          inventory={inventory}
          loading={loading}
          onRefresh={fetchInventory}
          categories={categories}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <span className="text-xs text-muted-foreground">
                ({total} total items)
              </span>
            </div>

            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              Last
            </Button>
          </div>
        )}

        {/* Add Inventory Dialog */}
        <AddInventoryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => {
            fetchInventory();
            fetchCategories();
            fetchAvailableShapes();
          }}
          categories={categories}
        />
      </div>
    </MainLayout>
  );
};

export default Inventory;
