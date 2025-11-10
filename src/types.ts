export enum PaymentMethod {
  CASH = 'Bar',
  CARD = 'Karte',
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string; // Base64 encoded image string
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  date: string; // ISO string
  eventId: string;
  status: 'COMPLETED' | 'CANCELLED';
}

export interface Event {
  id: string;
  name: string;
  date: string;
}

export interface BackupData {
  categories: Category[];
  products: Product[];
  transactions: Transaction[];
  events: Event[];
  activeEventId: string | null;
  eventProducts: Record<string, string[]>;
}

