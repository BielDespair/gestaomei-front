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

export interface ProductRequest extends Omit<Product, 'id' | 'stock' | 'costPrice' | 'imageUrl' | 'stockQuantity'> {
  imageFile?: File | null;
}