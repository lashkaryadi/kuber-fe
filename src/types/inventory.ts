export interface Category {
  _id: string;
  name: string;
}

export interface InventoryShape {
  shape: string;
  pieces: number;
  weight: number;
}

export interface InventoryItem {
  _id: string;
  serialNumber: string;

  category?: Category | null;

  shapeType: 'single' | 'mix';
  singleShape?: string | null;
  shapes?: InventoryShape[];

  totalPieces: number;
  totalWeight: number;

  /** 🔥 BACKEND DERIVED FIELDS */
  availablePieces: number;
  availableWeight: number;

  purchaseCode?: string;
  saleCode?: string;

  totalPrice?: number;

  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'mm' | 'cm' | 'inch';
  };

  certification?: string;
  location?: string;

  status: 'in_stock' | 'pending' | 'partially_sold' | 'sold';

  description?: string;
  images?: string[];

  createdAt?: string;
  updatedAt?: string;
}