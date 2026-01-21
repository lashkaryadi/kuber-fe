import React, { useState } from 'react';
import { Edit, Trash2, ShoppingCart, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InventoryItem, Category } from '@/types/inventory';
import { AddInventoryDialog } from './AddInventoryDialog';
import { SellInventoryDialog } from './SellInventoryDialog';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryTableProps {
  inventory: InventoryItem[];
  loading: boolean;
  onRefresh: () => void;
  categories?: Category[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  loading,
  onRefresh,
  categories = []
}) => {
  const { user } = useAuth();
  const [editItem, setEditItem] = useState<InventoryItem | undefined>();
  const [saleItem, setSaleItem] = useState<InventoryItem | undefined>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleDelete = async (item: InventoryItem) => {
    if (!isAdmin) {
      toast.error('Only admins can delete inventory items');
      return;
    }

    if (!confirm(`Are you sure you want to delete item ${item.serialNumber}?`)) {
      return;
    }

    setDeletingId(item._id);

    try {
      const response = await api.deleteInventoryItem(item._id);

      if (response.success) {
        toast.success('Item moved to recycle bin');
        onRefresh();
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    const isSold = item.availablePieces === 0 && item.availableWeight === 0;
    const isPartial = item.availablePieces < item.totalPieces || item.availableWeight < item.totalWeight;

    if (isSold || item.status === 'sold') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          Sold
        </Badge>
      );
    }

    if (item.status === 'pending') {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Pending
        </Badge>
      );
    }

    if (isPartial || item.status === 'partially_sold') {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
          Partially Sold
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        In Stock
      </Badge>
    );
  };

  const renderShapes = (item: InventoryItem) => {
    if (item.shapeType === 'single') {
      return (
        <Badge variant="outline" className="text-xs">
          {item.singleShape}
        </Badge>
      );
    }

    if (item.shapeType === 'mix' && item.shapes && item.shapes.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {item.shapes.slice(0, 2).map((shape, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {shape.shape}
            </Badge>
          ))}
          {item.shapes.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{item.shapes.length - 2}
            </Badge>
          )}
        </div>
      );
    }

    return <span className="text-muted-foreground text-sm">N/A</span>;
  };

  const formatDimensions = (item: InventoryItem) => {
    if (!item.dimensions) return 'N/A';
    const { length, width, height, unit } = item.dimensions;
    if (!length && !width && !height) return 'N/A';
    return `${length} × ${width} × ${height} ${unit}`;
  };

  const canSell = (item: InventoryItem) => {
    return item.availablePieces > 0 || item.availableWeight > 0;
  };

  const getPriceDisplay = (item: InventoryItem) => {
    // Check if saleCode is numeric
    const saleCode = item.saleCode;
    if (!saleCode) return '-';

    const isNumeric = !isNaN(parseFloat(saleCode)) && isFinite(parseFloat(saleCode));

    if (isNumeric) {
      // Show as price per carat
      return `$${parseFloat(saleCode).toFixed(2)}/ct`;
    } else {
      // Confidential - hide value
      return 'Confidential';
    }
  };

  const getTotalPriceDisplay = (item: InventoryItem) => {
    const saleCode = item.saleCode;
    if (!saleCode) return '-';

    const isNumeric = !isNaN(parseFloat(saleCode)) && isFinite(parseFloat(saleCode));

    if (isNumeric && item.totalPrice) {
      return `$${item.totalPrice.toFixed(2)}`;
    } else {
      return 'Confidential';
    }
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Serial Number
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Category
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Shapes
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Available / Total Pieces
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Available / Total Weight (ct)
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Price/Ct
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Total Value
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.map((item) => (
                <tr
                  key={item._id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 align-middle font-medium">
                    {item.serialNumber}
                  </td>
                  <td className="p-4 align-middle">
                    {item.category?.name || 'N/A'}
                  </td>
                  <td className="p-4 align-middle">
                    {renderShapes(item)}
                  </td>
                  <td className="p-4 align-middle">
                    <span className={item.availablePieces < item.totalPieces ? 'text-orange-600' : ''}>
                      {item.availablePieces}
                    </span>
                    {' / '}
                    {item.totalPieces}
                  </td>
                  <td className="p-4 align-middle">
                    <span className={item.availableWeight < item.totalWeight ? 'text-orange-600' : ''}>
                      {item.availableWeight.toFixed(2)}
                    </span>
                    {' / '}
                    {item.totalWeight.toFixed(2)}
                  </td>
                  <td className="p-4 align-middle">
                    {getPriceDisplay(item)}
                  </td>
                  <td className="p-4 align-middle font-medium">
                    {getTotalPriceDisplay(item)}
                  </td>
                  <td className="p-4 align-middle">
                    {getStatusBadge(item)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-1">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditItem(item);
                          setIsEditDialogOpen(true);
                        }}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Sell Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSaleItem(item);
                          setIsSellDialogOpen(true);
                        }}
                        disabled={!canSell(item)}
                        className={canSell(item) ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : ''}
                        title="Sell"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>

                      {/* Delete Button (Admin Only) */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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
      {editItem && (
        <AddInventoryDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditItem(undefined);
          }}
          onSuccess={onRefresh}
          categories={categories}
          editItem={editItem}
        />
      )}

      {/* Sell Dialog */}
      {saleItem && (
        <SellInventoryDialog
          open={isSellDialogOpen}
          onOpenChange={(open) => {
            setIsSellDialogOpen(open);
            if (!open) setSaleItem(undefined);
          }}
          item={saleItem}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};