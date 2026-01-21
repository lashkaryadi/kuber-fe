import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Shape } from '@/types/inventory';
import api from '@/services/api';
import { toast } from 'sonner';

interface ShapeSelectorProps {
  shapes: Shape[];
  onChange: (shapes: Shape[]) => void;
  isSingleShape?: boolean;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  shapes,
  onChange,
  isSingleShape = false
}) => {
  const [availableShapes, setAvailableShapes] = useState<string[]>([]);
  const [isCreatingNewShape, setIsCreatingNewShape] = useState(false);
  const [newShapeName, setNewShapeName] = useState('');

  // Fetch available shapes on mount
  useEffect(() => {
    fetchShapes();
  }, []);

  const fetchShapes = async () => {
    try {
      const response = await api.getShapes();
      if (response.success) {
        setAvailableShapes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching shapes:', error);
    }
  };

  const handleCreateShape = async () => {
    if (!newShapeName.trim()) {
      toast.error('Please enter a shape name');
      return;
    }

    try {
      const response = await api.createShape(newShapeName.trim());
      if (response.success) {
        toast.success('Shape created successfully');
        await fetchShapes();

        // Add the new shape to the selection
        if (isSingleShape) {
          onChange([{ shape: newShapeName.trim(), pieces: 0, weight: 0 }]);
        } else {
          onChange([...shapes, { shape: newShapeName.trim(), pieces: 0, weight: 0 }]);
        }

        setNewShapeName('');
        setIsCreatingNewShape(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create shape');
    }
  };

  const handleAddShape = () => {
    onChange([...shapes, { shape: '', pieces: 0, weight: 0 }]);
  };

  const handleRemoveShape = (index: number) => {
    const updatedShapes = shapes.filter((_, i) => i !== index);
    onChange(updatedShapes);
  };

  const handleShapeChange = (index: number, field: keyof Shape, value: string | number) => {
    const updatedShapes = shapes.map((shape, i) => {
      if (i === index) {
        return { ...shape, [field]: value };
      }
      return shape;
    });
    onChange(updatedShapes);
  };

  if (isSingleShape) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select
            value={shapes[0]?.shape || ''}
            onValueChange={(value) => {
              if (value === 'create_new') {
                setIsCreatingNewShape(true);
              } else {
                onChange([{ shape: value, pieces: 0, weight: 0 }]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shape..." />
            </SelectTrigger>
            <SelectContent>
              {availableShapes.map((shapeName) => (
                <SelectItem key={shapeName} value={shapeName}>
                  {shapeName}
                </SelectItem>
              ))}
              <SelectItem value="create_new" className="text-primary font-medium">
                + Create New Shape
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCreatingNewShape && (
          <div className="flex gap-2 p-3 border rounded-md bg-muted/50">
            <Input
              placeholder="Enter shape name..."
              value={newShapeName}
              onChange={(e) => setNewShapeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateShape();
                }
              }}
            />
            <Button onClick={handleCreateShape} size="sm">
              Create
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreatingNewShape(false);
                setNewShapeName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Mix shapes mode
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Shapes *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddShape}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Shape
        </Button>
      </div>

      {shapes.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No shapes added yet. Click "Add Shape" to begin.
        </div>
      )}

      {shapes.map((shape, index) => (
        <div key={index} className="flex gap-2 items-start p-3 border rounded-md bg-muted/50">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor={`shape-name-${index}`} className="text-xs">Shape</Label>
              <Select
                value={shape.shape}
                onValueChange={(value) => {
                  if (value === 'create_new') {
                    setIsCreatingNewShape(true);
                  } else {
                    handleShapeChange(index, 'shape', value);
                  }
                }}
              >
                <SelectTrigger id={`shape-name-${index}`}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {availableShapes.map((shapeName) => (
                    <SelectItem key={shapeName} value={shapeName}>
                      {shapeName}
                    </SelectItem>
                  ))}
                  <SelectItem value="create_new" className="text-primary font-medium">
                    + Create New Shape
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`shape-pieces-${index}`} className="text-xs">Pieces</Label>
              <Input
                id={`shape-pieces-${index}`}
                type="number"
                min="0"
                value={shape.pieces}
                onChange={(e) => handleShapeChange(index, 'pieces', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor={`shape-weight-${index}`} className="text-xs">Weight (ct)</Label>
              <Input
                id={`shape-weight-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={shape.weight}
                onChange={(e) => handleShapeChange(index, 'weight', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveShape(index)}
            className="text-destructive hover:text-destructive/90 mt-5"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {isCreatingNewShape && (
        <div className="flex gap-2 p-3 border rounded-md bg-primary/5">
          <Input
            placeholder="Enter new shape name..."
            value={newShapeName}
            onChange={(e) => setNewShapeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateShape();
              }
            }}
          />
          <Button onClick={handleCreateShape} size="sm">
            Create
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreatingNewShape(false);
              setNewShapeName('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};