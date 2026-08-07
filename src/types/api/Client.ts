export interface ClientList {
  id: number;
  name: string;

  phoneNumber: string | null;
  document: string | null;
  district: string | null;
  description: string | null;

  totalDebt: number;
}

export interface Client {
  id: number;
  name: string;
  description: string | null;
  email: string | null;
  document: string | null;
  pix: string | null;
  phoneNumber: string | null;

  cep: string | null;
  street: string |null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  debts: SaleDebt[];
}



export interface SaleDebt {
  saleId: number;
  sellerId: number;
  sellerName: string;
  saleDate: string;

  total: number;
  amountPaid: number;
  remaining: number;

  items: DebtItem[];
}

export interface DebtItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}


export interface RegisterPayment {
  amount: number;
  note?: string | null;
}