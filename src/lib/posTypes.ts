export type UserRole = 'admin' | 'cashier';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  active: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  specialPrice?: number;
  image: string;
  category: string;
  available?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  extras?: string[];
}

export type PaymentMethod = 'cash' | 'card' | 'instapay';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  taxApplied?: boolean;
  taxRate?: number;
  taxAmount?: number;
  timestamp: number;
  status: 'pending' | 'paid';
  table?: number | 'to-go';
  cashierId?: string;
  paymentMethod?: PaymentMethod;
}

export interface SaleRecord {
  orderId: string;
  cashierId: string;
  table?: number | 'to-go';
  items: CartItem[];
  total: number;
  subtotal?: number;
  taxApplied?: boolean;
  taxRate?: number;
  taxAmount?: number;
  paidAt: number;
  paymentMethod: PaymentMethod;
}

export interface ShiftRecord {
  cashierId: string;
  shiftStart: number | null;
  shiftEnd: number;
  initialDrawer: number;
  finalDrawer: number;
  totalSales: number;
  cashSales?: number;
  cardSales?: number;
  instapaySales?: number;
  expectedDrawer: number;
  difference: number;
  ordersCount: number;
  paidOrdersCount: number;
  date: string;
}

export interface Offer {
  id: string;
  menuItemId: number;
  title: string;
  discountPercent: number;
  active: boolean;
}
