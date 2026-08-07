export interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  costPrice: number;
  sellPrice: number;
  stockQuantity: number;
  imageUrl: string | null;
}