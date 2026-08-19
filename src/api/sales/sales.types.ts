export enum PaymentStatus {
  Pending = 0,
  Paid = 1,
  PartiallyPaid = 2,
  Cancelled = 3,
}

export enum DeliveryStatus {
  Pending = 0,
  Delivered = 1,
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** GET /sales — lista resumida, sem itens (só a contagem). */
export interface SaleListItem {
  saleId: number;
  clientId: number | null;
  sellerId: number;
  sellerName: string;
  saleDate: string;
  totalItems: number;
  total: number;
  amountPaid: number;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
}

/** GET /sales/{id} — detalhe, com itens. */
export interface Sale {
  saleId: number;
  clientId: number | null;
  sellerId: number;
  sellerName: string;
  saleDate: string;
  total: number;
  amountPaid: number;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  items: SaleItem[];
}

export interface SalesFilter {
  clientId?: number;
  sellerId?: number;
}
