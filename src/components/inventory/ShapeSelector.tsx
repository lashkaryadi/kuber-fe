import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { InventoryShape } from '@/types/inventory';
import api from '@/services/api';
import { toast } from 'sonner';

interface ShapeSelectorProps {
  shapes: InventoryShape[];
  onChange: (shapes: InventoryShape[]) => void;
  isSingleShape?: boolean;
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  shapes,
  onChange,
  isSingleShape = false,
}) => {
  const [availableShapes, setAvailableShapes] = useState<string[]>([]);
  const [isCreatingNewShape, setIsCreatingNewShape] = useState(false);
  const [newShapeName, setNewShapeName] = useState('');

  useEffect(() => {
    fetchShapes();
  }, []);

  const fetchShapes = async () => {
    try {
      const response = await api.getShapes();
      if (response.data) {
        setAvailableShapes(response.data);
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
      const response = await api.createShape({ name: newShapeName.trim() });
      if (response.success) {
        toast.success('Shape created successfully');

        await fetchShapes();

        if (isSingleShape) {
          onChange([{ shape: newShapeName.trim(), pieces: 0, weight: 0 }]);
        } else {
          onChange([...shapes, { shape: newShapeName.trim(), pieces: 0, weight: 0 }]);
        }

        setNewShapeName('');
        setIsCreatingNewShape(false);
      } else {
        if (response.status === 409) {
          toast.error('Shape already exists');
        } else {
          toast.error('Failed to create shape: ' + (response.message || 'Unknown error'));
        }
      }
    } catch (error: unknown) {
      const err = error as any;
      toast.error('Failed to create shape: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleAddShape = () => {
    onChange([...shapes, { shape: '', pieces: 0, weight: 0 }]);
  };

  const handleRemoveShape = (index: number) => {
    onChange(shapes.filter((_, i) => i !== index));
  };

  const handleShapeChange = (
    index: number,
    field: 'shape' | 'pieces' | 'weight',
    value: string | number
  ) => {
    const updatedShapes = shapes.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange(updatedShapes);
  };

  /* ================= SINGLE SHAPE ================= */

  if (isSingleShape) {
    return (
      <div className="space-y-2">
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
            {availableShapes.map((shape, index) => (
              <SelectItem key={`${shape}-${index}`} value={shape}>
                {shape}
              </SelectItem>
            ))}
            <SelectItem value="create_new" className="text-primary">
              + Create New Shape
            </SelectItem>
          </SelectContent>
        </Select>

        {isCreatingNewShape && (
          <div className="flex gap-2">
            <Input
              placeholder="New shape name"
              value={newShapeName}
              onChange={(e) => setNewShapeName(e.target.value)}
            />
            <Button size="sm" onClick={handleCreateShape}>Create</Button>
          </div>
        )}
      </div>
    );
  }

  /* ================= MIX SHAPES ================= */

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Shapes *</Label>
        <Button size="sm" variant="outline" onClick={handleAddShape}>
          <Plus className="w-4 h-4 mr-1" /> Add Shape
        </Button>
      </div>

      {shapes.map((shape, index) => (
        <div key={index} className="grid grid-cols-4 gap-2 items-end">
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
            <SelectTrigger>
              <SelectValue placeholder="Shape" />
            </SelectTrigger>
            <SelectContent>
              {availableShapes.map((s, index) => (
                <SelectItem key={`${s}-${index}`} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value="create_new">+ Create New</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Pieces"
            value={shape.pieces}
            onChange={(e) =>
              handleShapeChange(index, 'pieces', Number(e.target.value))
            }
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Weight"
            value={shape.weight}
            onChange={(e) =>
              handleShapeChange(index, 'weight', Number(e.target.value))
            }
          />

          <Button
            variant="ghost"
            onClick={() => handleRemoveShape(index)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}

      {isCreatingNewShape && (
        <div className="flex gap-2">
          <Input
            placeholder="New shape name"
            value={newShapeName}
            onChange={(e) => setNewShapeName(e.target.value)}
          />
          <Button size="sm" onClick={handleCreateShape}>Create</Button>
        </div>
      )}
    </div>
  );
};