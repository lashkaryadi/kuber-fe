import React, { useState } from 'react';
import { Edit, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/types/inventory';
import { AddInventoryDialog } from './AddInventoryDialog';
import { SaleDialog } from './SaleDialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

  const { getToken } = useAuth();

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/inventory/${item._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Sold</Badge>;
    }
    if (item.availablePieces === 0 && item.availableWeight === 0) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Sold</Badge>;
    }
    if (item.status === 'Pending') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    }
    if (item.availablePieces < item.totalPieces || item.availableWeight < item.totalWeight) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Partially Sold</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">In Stock</Badge>;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Serial Number
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Category
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Shape
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Pieces
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Weight (ct)
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Price/Ct
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Total Price
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item) => (
                <tr key={item._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">
                    {item.serialNumber}
                  </td>
                  <td className="p-4 align-middle">
                    {item.category?.name || 'N/A'}
                  </td>
                  <td className="p-4 align-middle">
                    {renderShapeDisplay(item)}
                  </td>
                  <td className="p-4 align-middle">
                    {item.availablePieces || 0} / {item.totalPieces || 0}
                  </td>
                  <td className="p-4 align-middle">
                    {(item.availableWeight || 0).toFixed(2)} / {(item.totalWeight || 0).toFixed(2)}
                  </td>
                  <td className="p-4 align-middle">
                    ${(item.pricePerCarat || 0).toFixed(2)}
                  </td>
                  <td className="p-4 align-middle">
                    ${(item.totalPrice || 0).toFixed(2)}
                  </td>
                  <td className="p-4 align-middle">
                    {getStatusBadge(item)}
                  </td>
                  <td className="p-4 align-middle">
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
                        className={item.availablePieces === 0 && item.availableWeight === 0 ? "" : "text-green-600 hover:text-green-700"}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive/90"
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
            <p className="text-muted-foreground">No inventory items found</p>
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