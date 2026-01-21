export type ShapeType = 'single' | 'mix';

export type ShapeName = string;

export interface Shape {
  _id: string;
  name: string;
}

export interface InventoryItem {
  _id: string;
  serialNumber: string;
  category: {
    _id: string;
    name: string;
  };
  shapeType: ShapeType;
  singleShape?: ShapeName;
  shapes?: Shape[];
  totalPieces: number;
  totalWeight: number;
  availablePieces: number;
  availableWeight: number;
  purchaseCode?: string;
  saleCode?: string;
  totalPrice?: number; // ✅ ADD THIS
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'mm' | 'cm';
  };
  certification?: string;
  location?: string;
  status: 'In Stock' | 'Pending' | 'Partially Sold' | 'Sold';
  description?: string;
  images?: string[];
  displayShapes?: ShapeName[];
  createdAt: string;
  updatedAt: string;
}

export interface SoldShape {
  shapeName: ShapeName;
  pieces: number;
  weight: number;
  pricePerCarat: number;
  lineTotal: number;
}

export interface SaleItem {
  inventoryId: string;
  serialNumber: string;
  category: string;
  shapeType: ShapeType;
  singleShape?: SoldShape;
  soldShapes?: SoldShape[];
  totalPieces: number;
  totalWeight: number;
  totalAmount: number;
}