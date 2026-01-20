import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddInventoryDialog } from '@/components/inventory/AddInventoryDialog';
import { InventoryItem, ShapeName } from '@/types/inventory';
import { toast } from 'sonner';

export const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [shapeFilter, setShapeFilter] = useState<string>('All Shapes'); // NEW
  const [categories, setCategories] = useState<any[]>([]);
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
  useEffect(() => {
    fetchInventory();
  }, [searchTerm, categoryFilter, statusFilter, shapeFilter, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // NEW: Fetch available shapes
  const fetchAvailableShapes = async () => {
    try {
      const response = await fetch('/api/inventory/shapes');
      const data = await response.json();
      if (data.success) {
        setAvailableShapes(data.data);
      }
    } catch (error) {
      console.error('Error fetching shapes:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'All Categories' && { category: categoryFilter }),
        ...(statusFilter !== 'All Status' && { status: statusFilter }),
        ...(shapeFilter !== 'All Shapes' && { shape: shapeFilter }) // NEW
      });

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.data);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/inventory/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      toast.success('Inventory exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export inventory');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button className="bg-yellow-600 hover:bg-yellow-700">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-900 hover:bg-blue-800"
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All Categories">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All Shapes">All Shapes</option>
          {availableShapes.map(shape => (
            <option key={shape} value={shape}>{shape}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <InventoryTable
        inventory={inventory}
        loading={loading}
        onRefresh={fetchInventory}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add Inventory Dialog */}
      <AddInventoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          fetchInventory();
          fetchAvailableShapes(); // Refresh shapes list
        }}
        categories={categories}
      />
    </div>
  );
};

export default Inventory;
