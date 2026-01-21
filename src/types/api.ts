export interface Category {
  _id: string;
  name: string;
  code: string;
}

export interface Shape {
  _id: string;
  name: string;
}

export interface InventoryItem {
  _id: string;
  serialNumber: string;
  category: Category;
  shape?: Shape;
  pieces: number;
  weight: number;
  status: "in_stock" | "sold" | "pending";
}