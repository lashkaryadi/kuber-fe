import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShapeSelector } from './ShapeSelector';
import { CategorySelector } from './CategorySelector';
import { ImageUpload } from './ImageUpload';
import { InventoryItem, Category, Shape } from '@/types/inventory';
import { toast } from 'sonner';
import api from '@/services/api';
import { Loader2 } from 'lucide-react';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Category[];
  editItem?: InventoryItem;
}

interface FormData {
  category: string;
  shapeType: 'single' | 'mix';
  singleShape: string;
  shapes: Shape[];
  totalPieces: string;
  totalWeight: string;
  purchaseCode: string;
  saleCode: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    unit: 'mm' | 'cm';
  };
  certification: string;
  location: string;
  status: string;
  description: string;
  images: string[];
}

export const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  categories,
  editItem
}) => {
  const [formData, setFormData] = useState<FormData>({
    category: '',
    shapeType: 'single',
    singleShape: '',
    shapes: [],
    totalPieces: '',
    totalWeight: '',
    purchaseCode: '',
    saleCode: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'mm'
    },
    certification: '',
    location: '',
    status: 'in_stock',
    description: '',
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Reset or populate form when dialog opens/closes or editItem changes
  useEffect(() => {
    if (open) {
      if (editItem) {
        // Edit mode - populate form
        setFormData({
          category: editItem.category?._id || '',
          shapeType: editItem.shapeType,
          singleShape: editItem.singleShape || '',
          shapes: editItem.shapes || [],
          totalPieces: String(editItem.totalPieces || ''),
          totalWeight: String(editItem.totalWeight || ''),
          purchaseCode: editItem.purchaseCode || '',
          saleCode: editItem.saleCode || '',
          dimensions: {
            length: String(editItem.dimensions?.length || ''),
            width: String(editItem.dimensions?.width || ''),
            height: String(editItem.dimensions?.height || ''),
            unit: editItem.dimensions?.unit || 'mm'
          },
          certification: editItem.certification || '',
          location: editItem.location || '',
          status: editItem.status || 'in_stock',
          description: editItem.description || '',
          images: editItem.images || []
        });
      } else {
        // Create mode - reset form
        setFormData({
          category: '',
          shapeType: 'single',
          singleShape: '',
          shapes: [],
          totalPieces: '',
          totalWeight: '',
          purchaseCode: '',
          saleCode: '',
          dimensions: {
            length: '',
            width: '',
            height: '',
            unit: 'mm'
          },
          certification: '',
          location: '',
          status: 'in_stock',
          description: '',
          images: []
        });
      }
    }
  }, [open, editItem]);

  const handleShapeTypeChange = (value: 'single' | 'mix') => {
    setFormData(prev => ({
      ...prev,
      shapeType: value,
      singleShape: value === 'single' ? prev.singleShape : '',
      shapes: value === 'mix' ? prev.shapes : [],
      // Reset totals when switching types
      totalPieces: value === 'mix' ? '' : prev.totalPieces,
      totalWeight: value === 'mix' ? '' : prev.totalWeight
    }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await api.uploadImage(file);
      if (response.success && response.data?.url) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, response.data!.url]
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    // Category validation (optional but recommended)
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }

    // Shape validation
    if (formData.shapeType === 'single') {
      if (!formData.singleShape) {
        toast.error('Please select a shape');
        return false;
      }
      if (!formData.totalPieces || parseFloat(formData.totalPieces) <= 0) {
        toast.error('Please enter valid total pieces');
        return false;
      }
      if (!formData.totalWeight || parseFloat(formData.totalWeight) <= 0) {
        toast.error('Please enter valid total weight');
        return false;
      }
    } else {
      if (formData.shapes.length === 0) {
        toast.error('Please add at least one shape');
        return false;
      }
      for (const shape of formData.shapes) {
        if (!shape.shape) {
          toast.error('Please select a shape for all entries');
          return false;
        }
        if (shape.pieces <= 0) {
          toast.error(`Please enter valid pieces for ${shape.shape}`);
          return false;
        }
        if (shape.weight <= 0) {
          toast.error(`Please enter valid weight for ${shape.shape}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare data for API
      const submitData: any = {
        category: formData.category || null,
        shapeType: formData.shapeType,
        purchaseCode: formData.purchaseCode,
        saleCode: formData.saleCode,
        dimensions: {
          length: parseFloat(formData.dimensions.length) || 0,
          width: parseFloat(formData.dimensions.width) || 0,
          height: parseFloat(formData.dimensions.height) || 0,
          unit: formData.dimensions.unit
        },
        certification: formData.certification,
        location: formData.location,
        status: formData.status,
        description: formData.description,
        images: formData.images
      };

      if (formData.shapeType === 'single') {
        submitData.singleShape = formData.singleShape;
        submitData.totalPieces = parseFloat(formData.totalPieces) || 0;
        submitData.totalWeight = parseFloat(formData.totalWeight) || 0;
        submitData.shapes = [];
      } else {
        submitData.singleShape = null;
        submitData.shapes = formData.shapes.map(s => ({
          shape: s.shape,
          pieces: s.pieces,
          weight: s.weight
        }));
        // Backend will auto-calculate totals
      }

      let response;
      if (editItem) {
        response = await api.updateInventoryItem(editItem._id, submitData);
      } else {
        response = await api.createInventoryItem(submitData);
      }

      if (response.success) {
        toast.success(editItem ? 'Item updated successfully' : 'Item added successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'Failed to save item');
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Serial Number Info (Read-only for edit, auto-generated for create) */}
          {editItem && (
            <div className="p-3 bg-muted/50 rounded-md border">
              <Label className="text-sm font-medium">Serial Number</Label>
              <p className="text-lg font-semibold">{editItem.serialNumber}</p>
              <p className="text-xs text-muted-foreground">Serial numbers cannot be changed</p>
            </div>
          )}

          {!editItem && (
            <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-sm text-muted-foreground">
                ℹ️ Serial number will be auto-generated based on the selected category
              </p>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <CategorySelector
              categories={categories}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              onCreateCategory={async () => {
                // Refresh will be handled by parent component
              }}
              placeholder="Select a category..."
            />
          </div>

          {/* Shape Type Selection */}
          <div className="space-y-4">
            <Label>Shape Type *</Label>
            <RadioGroup
              value={formData.shapeType}
              onValueChange={handleShapeTypeChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Single Shape
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mix" id="mix" />
                <Label htmlFor="mix" className="font-normal cursor-pointer">
                  Mix Shapes
                </Label>
              </div>
            </RadioGroup>

            {/* Shape Selector */}
            <div className="pt-2">
              <ShapeSelector
                shapes={formData.shapeType === 'single'
                  ? (formData.singleShape ? [{ shape: formData.singleShape, pieces: 0, weight: 0 }] : [])
                  : formData.shapes
                }
                onChange={(shapes) => {
                  if (formData.shapeType === 'single') {
                    setFormData(prev => ({
                      ...prev,
                      singleShape: shapes.length > 0 ? shapes[0].shape : ''
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, shapes }));
                  }
                }}
                isSingleShape={formData.shapeType === 'single'}
              />
            </div>
          </div>

          {/* Quantity and Weight (Only for single shape) */}
          {formData.shapeType === 'single' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalPieces">Total Pieces *</Label>
                <Input
                  id="totalPieces"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.totalPieces}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalPieces: e.target.value }))}
                  placeholder="Enter total pieces"
                />
              </div>
              <div>
                <Label htmlFor="totalWeight">Total Weight (carats) *</Label>
                <Input
                  id="totalWeight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalWeight: e.target.value }))}
                  placeholder="Enter total weight"
                />
              </div>
            </div>
          )}

          {/* Mix Shapes Info */}
          {formData.shapeType === 'mix' && formData.shapes.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-md border">
              <p className="text-sm font-medium mb-1">Total Summary</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Pieces: </span>
                  <span className="font-semibold">
                    {formData.shapes.reduce((sum, s) => sum + s.pieces, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Weight: </span>
                  <span className="font-semibold">
                    {formData.shapes.reduce((sum, s) => sum + s.weight, 0).toFixed(2)} ct
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Codes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseCode">Purchase Code</Label>
              <Input
                id="purchaseCode"
                value={formData.purchaseCode}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseCode: e.target.value }))}
                placeholder="Enter purchase code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Numeric or text code for internal tracking
              </p>
            </div>
            <div>
              <Label htmlFor="saleCode">Sale Code</Label>
              <Input
                id="saleCode"
                value={formData.saleCode}
                onChange={(e) => setFormData(prev => ({ ...prev, saleCode: e.target.value }))}
                placeholder="Enter sale code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Numeric = price/carat | Text = confidential
              </p>
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <Label>Dimensions (optional)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Length"
                value={formData.dimensions.length}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, length: e.target.value }
                }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Width"
                value={formData.dimensions.width}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, width: e.target.value }
                }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Height"
                value={formData.dimensions.height}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, height: e.target.value }
                }))}
              />
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={formData.dimensions.unit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  dimensions: { ...prev.dimensions, unit: e.target.value as 'mm' | 'cm' }
                }))}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Certification & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="certification">Certification</Label>
              <Input
                id="certification"
                value={formData.certification}
                onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value }))}
                placeholder="e.g., GIA, IGI"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., New York, Mumbai"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="in_stock">In Stock</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Additional notes about this item..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Images</Label>
            <ImageUpload
              images={formData.images}
              onUpload={handleImageUpload}
              onRemove={handleRemoveImage}
              uploading={uploading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Saving...' : (editItem ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};