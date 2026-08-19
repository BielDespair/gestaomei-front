/** Espelha GestaoMEI.Models.StockEntry / StockEntryItem. */

export interface StockEntryItem {
	id: number;
	productId: number;
	productName: string;
	quantity: number;
	unitCost: number;
	totalCost: number;
}

/** Linha da listagem: cabeçalho da nota, sem os itens. */
export interface StockEntryList {
	id: number;
	/** Data da compra (DateOnly no backend: "2026-03-14"). */
	purchaseDate: string;
	/** Carimbo de auditoria, gerado pelo servidor. */
	createdAt: string;
	notes: string | null;
	userId: number;
	userName: string;
	itemCount: number;
	totalQuantity: number;
	totalCost: number;
}


export interface StockEntry {
	id: number;
	purchaseDate: string;
	createdAt: string;
	notes: string | null;
	userId: number;
	userName: string;
	items: StockEntryItem[];
}

/* ---------- Requests ---------- */

export interface StockEntryItemRequest {
	id?: number;
	productId: number;
	quantity: number;
	unitCost: number;
}

export interface StockEntryRequest {
	purchaseDate: string;
	notes?: string | null;
	items: StockEntryItemRequest[];
}
