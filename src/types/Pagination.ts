export interface Paginated<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalItems: number;
}
