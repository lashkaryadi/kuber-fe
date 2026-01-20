import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShapeSelector } from './ShapeSelector';
import { CategorySelector } from './CategorySelector';
import { InventoryItem, ShapeName, AVAILABLE_SHAPES } from '@/types/inventory';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: any[];
  editItem?: InventoryItem;
}

export const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  categories,
  editItem
}) => {
  const [formData, setFormData] = useState({
    serialNumber: '',
    purchaseCode: '',
    category: '',
    description: '',
    totalPieces: '',
    totalWeight: '',
    pricePerCarat: '',
    totalPrice: '',
    shapeType: 'single' as 'single' | 'mix',
    singleShape: '' as ShapeName,
    shapes: [] as Array<{ shape: ShapeName; pieces: number; weight: number }>
  });

  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // Reset form when dialog opens/closes or editItem changes
  useEffect(() => {
    if (open) {
      if (editItem) {
        // Populate form for editing
        setFormData({
          serialNumber: editItem.serialNumber || '',
          purchaseCode: editItem.purchaseCode || '',
          category: editItem.category?._id || '',
          description: editItem.description || '',
          totalPieces: editItem.totalPieces?.toString() || '',
          totalWeight: editItem.totalWeight?.toString() || '',
          pricePerCarat: editItem.pricePerCarat?.toString() || '',
          totalPrice: editItem.totalPrice?.toString() || '',
          shapeType: editItem.shapeType || 'single',
          singleShape: editItem.singleShape || '' as ShapeName,
          shapes: editItem.shapes || []
        });
      } else {
        // Reset form for new item
        setFormData({
          serialNumber: '',
          purchaseCode: '',
          category: '',
          description: '',
          totalPieces: '',
          totalWeight: '',
          pricePerCarat: '',
          totalPrice: '',
          shapeType: 'single',
          singleShape: '' as ShapeName,
          shapes: []
        });
      }
    }
  }, [open, editItem]);

  // Auto-calculate total price
  useEffect(() => {
    const weight = parseFloat(formData.totalWeight) || 0;
    const pricePerCarat = parseFloat(formData.pricePerCarat) || 0;
    const totalPrice = weight * pricePerCarat;
    if (totalPrice > 0) {
      setFormData(prev => ({ ...prev, totalPrice: totalPrice.toFixed(2) }));
    }
  }, [formData.totalWeight, formData.pricePerCarat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.serialNumber) {
        toast.error('Please enter a serial number');
        return;
      }

      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }

      if (formData.shapeType === 'single' && !formData.singleShape) {
        toast.error('Please select a shape');
        return;
      }

      if (formData.shapeType === 'mix' && formData.shapes.length === 0) {
        toast.error('Please add at least one shape');
        return;
      }

      // Prepare data
      const submitData = {
        ...formData,
        totalPieces: parseInt(formData.totalPieces) || 0,
        totalWeight: parseFloat(formData.totalWeight) || 0,
        pricePerCarat: parseFloat(formData.pricePerCarat) || 0,
        totalPrice: parseFloat(formData.totalPrice) || 0,
        shapes: formData.shapeType === 'mix' ? formData.shapes : []
      };

      const url = editItem ? `/api/inventory/${editItem._id}` : '/api/inventory';
      const method = editItem ? 'PUT' : 'POST';

      const token = getToken();

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editItem ? 'Item updated successfully' : 'Item added successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleShapeTypeChange = (value: 'single' | 'mix') => {
    setFormData(prev => ({
      ...prev,
      shapeType: value,
      singleShape: value === 'single' ? prev.singleShape : '' as ShapeName,
      shapes: value === 'mix' ? prev.shapes : []
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="purchaseCode">Purchase Code</Label>
              <Input
                id="purchaseCode"
                value={formData.purchaseCode}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseCode: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <CategorySelector
              categories={categories}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              onCreateCategory={async (name) => {
                // This will be handled by the CategorySelector internally
              }}
              placeholder="Select a category..."
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Quantity and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalPieces">Total Pieces</Label>
              <Input
                id="totalPieces"
                type="number"
                value={formData.totalPieces}
                onChange={(e) => setFormData(prev => ({ ...prev, totalPieces: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="totalWeight">Total Weight (carats)</Label>
              <Input
                id="totalWeight"
                type="number"
                step="0.01"
                value={formData.totalWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, totalWeight: e.target.value }))}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pricePerCarat">Price per Carat</Label>
              <Input
                id="pricePerCarat"
                type="number"
                step="0.01"
                value={formData.pricePerCarat}
                onChange={(e) => setFormData(prev => ({ ...prev, pricePerCarat: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                value={formData.totalPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, totalPrice: e.target.value }))}
                readOnly
              />
            </div>
          </div>

          {/* Shape Selection */}
          <div className="space-y-4">
            <Label>Shape Type</Label>
            <RadioGroup
              value={formData.shapeType}
              onValueChange={handleShapeTypeChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Shape</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mix" id="mix" />
                <Label htmlFor="mix">Mix Shapes</Label>
              </div>
            </RadioGroup>

            {formData.shapeType === 'single' && (
              <div>
                <Label htmlFor="singleShape">Shape</Label>
                <Select
                  value={formData.singleShape}
                  onValueChange={(value: ShapeName) => setFormData(prev => ({ ...prev, singleShape: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SHAPES.map(shape => (
                      <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.shapeType === 'mix' && (
              <ShapeSelector
                shapes={formData.shapes}
                onChange={(shapes) => setFormData(prev => ({ ...prev, shapes }))}
              />
            )}
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
              {loading ? 'Saving...' : (editItem ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};