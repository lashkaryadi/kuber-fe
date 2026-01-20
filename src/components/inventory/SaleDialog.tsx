import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem, SoldShape } from '@/types/inventory';
import { toast } from 'sonner';

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  onSuccess: () => void;
}

export const SaleDialog: React.FC<SaleDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSuccess
}) => {
  const [saleType, setSaleType] = useState<'full' | 'partial'>('full');
  const [saleCode, setSaleCode] = useState('');
  const [soldShapes, setSoldShapes] = useState<SoldShape[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize sold shapes based on item type
  useEffect(() => {
    if (open && item) {
      if (item.shapeType === 'single') {
        setSoldShapes([{
          shapeName: item.singleShape!,
          pieces: item.availablePieces || 0,
          weight: item.availableWeight || 0,
          pricePerCarat: item.pricePerCarat || 0,
          lineTotal: (item.availableWeight || 0) * (item.pricePerCarat || 0)
        }]);
      } else if (item.shapeType === 'mix' && item.shapes) {
        setSoldShapes(item.shapes.map(shape => ({
          shapeName: shape.shapeName,
          pieces: shape.pieces,
          weight: shape.weight,
          pricePerCarat: item.pricePerCarat || 0,
          lineTotal: shape.weight * (item.pricePerCarat || 0)
        })));
      }
      setSaleType('full');
      setSaleCode('');
    }
  }, [open, item]);

  // Update line totals when quantities change
  useEffect(() => {
    setSoldShapes(prev => prev.map(shape => ({
      ...shape,
      lineTotal: shape.weight * shape.pricePerCarat
    })));
  }, [soldShapes.map(s => s.weight + s.pricePerCarat)]);

  const handleShapeQuantityChange = (index: number, field: 'pieces' | 'weight', value: number) => {
    setSoldShapes(prev => prev.map((shape, i) => {
      if (i === index) {
        const updated = { ...shape, [field]: value };
        updated.lineTotal = updated.weight * updated.pricePerCarat;
        return updated;
      }
      return shape;
    }));
  };

  const handlePricePerCaratChange = (index: number, value: number) => {
    setSoldShapes(prev => prev.map((shape, i) => {
      if (i === index) {
        const updated = { ...shape, pricePerCarat: value };
        updated.lineTotal = updated.weight * updated.pricePerCarat;
        return updated;
      }
      return shape;
    }));
  };

  const getTotalSold = () => {
    return soldShapes.reduce((total, shape) => ({
      pieces: total.pieces + shape.pieces,
      weight: total.weight + shape.weight,
      price: total.price + shape.lineTotal
    }), { pieces: 0, weight: 0, price: 0 });
  };

  const validateSale = () => {
    const totalSold = getTotalSold();

    if (item.shapeType === 'single') {
      if (totalSold.pieces > (item.availablePieces || 0)) {
        toast.error('Cannot sell more pieces than available');
        return false;
      }
      if (totalSold.weight > (item.availableWeight || 0)) {
        toast.error('Cannot sell more weight than available');
        return false;
      }
    } else if (item.shapeType === 'mix') {
      for (const soldShape of soldShapes) {
        const availableShape = item.shapes?.find(s => s.shapeName === soldShape.shapeName);
        if (!availableShape) {
          toast.error(`Shape ${soldShape.shapeName} not found in item`);
          return false;
        }
        if (soldShape.pieces > availableShape.pieces) {
          toast.error(`Cannot sell more ${soldShape.shapeName} pieces than available`);
          return false;
        }
        if (soldShape.weight > availableShape.weight) {
          toast.error(`Cannot sell more ${soldShape.shapeName} weight than available`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSale()) return;

    setLoading(true);

    try {
      const saleData = {
        items: [{
          inventoryId: item._id,
          serialNumber: item.serialNumber,
          category: item.category?.name || '',
          shapeType: item.shapeType,
          soldShapes: saleType === 'full' ? soldShapes : soldShapes.filter(s => s.pieces > 0 || s.weight > 0)
        }],
        paymentMethod: 'Cash', // Default
        paymentStatus: 'Paid', // Default
        amountPaid: totalSold.price,
        notes: `Sale of ${item.serialNumber} - ${saleCode}`
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Sale completed successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to complete sale');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const totalSold = getTotalSold();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sell Item - {item.serialNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Type */}
          <div>
            <Label>Sale Type</Label>
            <Select value={saleType} onValueChange={(value: 'full' | 'partial') => setSaleType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Sale</SelectItem>
                <SelectItem value="partial">Partial Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sale Code */}
          <div>
            <Label htmlFor="saleCode">Sale Code</Label>
            <Input
              id="saleCode"
              value={saleCode}
              onChange={(e) => setSaleCode(e.target.value)}
              placeholder="Enter sale code"
            />
          </div>

          {/* Shape-wise Sale Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sale Details by Shape</h3>

            {soldShapes.map((shape, index) => {
              const availableShape = item.shapes?.find(s => s.shapeName === shape.shapeName);
              const maxPieces = availableShape?.pieces || item.availablePieces || 0;
              const maxWeight = availableShape?.weight || item.availableWeight || 0;

              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{shape.shapeName}</h4>
                    <span className="text-sm text-gray-500">
                      Available: {maxPieces} pcs, {maxWeight.toFixed(2)} ct
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Pieces to Sell</Label>
                      <Input
                        type="number"
                        min="0"
                        max={maxPieces}
                        value={shape.pieces}
                        onChange={(e) => handleShapeQuantityChange(index, 'pieces', parseInt(e.target.value) || 0)}
                        disabled={saleType === 'full'}
                      />
                    </div>
                    <div>
                      <Label>Weight to Sell (ct)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxWeight}
                        value={shape.weight}
                        onChange={(e) => handleShapeQuantityChange(index, 'weight', parseFloat(e.target.value) || 0)}
                        disabled={saleType === 'full'}
                      />
                    </div>
                    <div>
                      <Label>Price per Carat</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={shape.pricePerCarat}
                        onChange={(e) => handlePricePerCaratChange(index, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium">
                      Line Total: ${shape.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sale Summary */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-lg font-medium">
              <div>Total Pieces: {totalSold.pieces}</div>
              <div>Total Weight: {totalSold.weight.toFixed(2)} ct</div>
              <div>Total Price: ${totalSold.price.toFixed(2)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};