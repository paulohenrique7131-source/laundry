export type ServiceItem = {
  id: string;
  name: string;
  priceLP: number;
  priceP: number | null;
  category?: string; // Optional category if needed later
};

export type EnxovalItem = {
  id: string;
  name: string;
  price: number;
};

export type OrderType = 'servicos' | 'enxoval' | 'ambos'; // Added 'ambos' for consolidated view filtering

export type ServiceType = 'normal' | 'expresso' | 'urgente';

export type OrderItem = {
  itemId: string;
  name: string;
  quantityLP: number; // For Enxoval, use quantityLP as the only quantity
  quantityP?: number; // Only for Services
  unitPriceLP: number;
  unitPriceP?: number | null;
  total: number;
};

export type HistoryRecord = {
  id: string;
  date: string; // ISO date string
  type: OrderType;
  serviceType: ServiceType; // 'normal' default for Enxoval
  items: OrderItem[];
  subtotal: number;
  total: number;
  createdAt: number;
};

export type AppNote = {
  id: string;
  content: string; // HTML string from rich text editor
  createdAt: number;
};

export type AppSettings = {
  serviceItems: ServiceItem[];
  enxovalItems: EnxovalItem[];
  theme: 'dark' | 'light';
};
