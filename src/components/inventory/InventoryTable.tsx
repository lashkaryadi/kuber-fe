import React, { useState } from 'react';
import { Edit, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/types/inventory';
import { AddInventoryDialog } from './AddInventoryDialog';
import { SaleDialog } from './SaleDialog';
import { toast } from 'sonner';

interface InventoryTableProps {
  inventory: InventoryItem[];
  loading: boolean;
  onRefresh: () => void;
  categories?: any[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  loading,
  onRefresh,
  categories = []
}) => {
  const [editItem, setEditItem] = useState<InventoryItem | undefined>();
  const [saleItem, setSaleItem] = useState<InventoryItem | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/inventory/${item._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item deleted successfully');
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.status === 'Sold') {
      return <Badge variant="destructive">Sold</Badge>;
    }
    if (item.availablePieces === 0 && item.availableWeight === 0) {
      return <Badge variant="destructive">Sold</Badge>;
    }
    if (item.availablePieces < item.totalPieces || item.availableWeight < item.totalWeight) {
      return <Badge variant="secondary">Partially Sold</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
  };

  const renderShapeDisplay = (item: InventoryItem) => {
    if (item.shapeType === 'single') {
      return (
        <Badge variant="outline" className="text-xs">
          {item.singleShape}
        </Badge>
      );
    }

    if (item.shapeType === 'mix' && item.shapes) {
      return (
        <div className="flex flex-wrap gap-1">
          {item.shapes.slice(0, 3).map((shape, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {shape.shapeName} ({shape.pieces})
            </Badge>
          ))}
          {item.shapes.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.shapes.length - 3} more
            </Badge>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shape
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pieces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (ct)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Ct
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.serialNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderShapeDisplay(item)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.availablePieces || 0} / {item.totalPieces || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(item.availableWeight || 0).toFixed(2)} / {(item.totalWeight || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(item.pricePerCarat || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(item.totalPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditItem(item);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSaleItem(item)}
                        disabled={item.availablePieces === 0 && item.availableWeight === 0}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inventory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No inventory items found</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <AddInventoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onRefresh}
        categories={categories}
        editItem={editItem}
      />

      {/* Sale Dialog */}
      {saleItem && (
        <SaleDialog
          open={!!saleItem}
          onOpenChange={(open) => !open && setSaleItem(undefined)}
          item={saleItem}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};