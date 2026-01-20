import React, { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_SHAPES, Shape, ShapeName } from '@/types/inventory';

interface ShapeSelectorProps {
  shapes: Shape[];
  onChange: (shapes: Shape[]) => void;
  mode?: 'create' | 'edit';
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  shapes,
  onChange,
  mode = 'create'
}) => {
  const [selectedShape, setSelectedShape] = useState<ShapeName | ''>('');

  const handleAddShape = () => {
    if (!selectedShape) return;

    const exists = shapes.find(s => s.shapeName === selectedShape);
    if (exists) {
      alert('This shape has already been added');
      return;
    }

    onChange([...shapes, {
      shapeName: selectedShape,
      pieces: 0,
      weight: 0
    }]);
    setSelectedShape('');
  };

  const handleRemoveShape = (shapeName: ShapeName) => {
    onChange(shapes.filter(s => s.shapeName !== shapeName));
  };

  const handleUpdateShape = (shapeName: ShapeName, field: 'pieces' | 'weight', value: number) => {
    onChange(shapes.map(s => 
      s.shapeName === shapeName 
        ? { ...s, [field]: Math.max(0, value) }
        : s
    ));
  };

  const totalPieces = shapes.reduce((sum, s) => sum + s.pieces, 0);
  const totalWeight = shapes.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="space-y-4">
      {/* Add Shape Section */}
      <div className="flex gap-2">
        <select
          value={selectedShape}
          onChange={(e) => setSelectedShape(e.target.value as ShapeName)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a shape to add...</option>
          {AVAILABLE_SHAPES.filter(shape => 
            !shapes.find(s => s.shapeName === shape)
          ).map(shape => (
            <option key={shape} value={shape}>{shape}</option>
          ))}
        </select>
        <Button
          type="button"
          onClick={handleAddShape}
          disabled={!selectedShape}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Shape
        </Button>
      </div>

      {/* Shapes List */}
      {shapes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-gray-500">
            Click "Add Shape" to add shapes to this inventory item
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shapes.map((shape) => (
            <Card key={shape.shapeName} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {shape.shapeName}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveShape(shape.shapeName)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${shape.shapeName}-pieces`} className="text-sm">
                      Pieces
                    </Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateShape(shape.shapeName, 'pieces', shape.pieces - 1)}
                        disabled={shape.pieces === 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        id={`${shape.shapeName}-pieces`}
                        type="number"
                        min="0"
                        value={shape.pieces}
                        onChange={(e) => handleUpdateShape(shape.shapeName, 'pieces', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateShape(shape.shapeName, 'pieces', shape.pieces + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`${shape.shapeName}-weight`} className="text-sm">
                      Weight (carats)
                    </Label>
                    <Input
                      id={`${shape.shapeName}-weight`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={shape.weight}
                      onChange={(e) => handleUpdateShape(shape.shapeName, 'weight', parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Totals Summary */}
      {shapes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-900">Total</span>
              <div className="flex gap-6">
                <span className="text-blue-900">
                  <strong>{totalPieces}</strong> pieces
                </span>
                <span className="text-blue-900">
                  <strong>{totalWeight.toFixed(2)}</strong> carats
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};