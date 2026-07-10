import { isSupabaseConfigured, supabase } from './supabaseClient';
import type { AppUser, MenuItem, Offer, Order, SaleRecord, ShiftRecord } from './posTypes';

const readLocal = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
};

const writeLocal = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const tableValueToDb = (table?: number | 'to-go') => (table === undefined ? null : String(table));
const tableValueFromDb = (value: string | null): number | 'to-go' | undefined => {
  if (!value) return undefined;
  return value === 'to-go' ? 'to-go' : Number(value);
};

const assertSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

export const backendMode = isSupabaseConfigured ? 'supabase' : 'local';

export const posBackend = {
  async getUsers(defaultUsers: AppUser[]) {
    if (!supabase) {
      if (!localStorage.getItem('cafeUsers')) writeLocal('cafeUsers', defaultUsers);
      return readLocal<AppUser[]>('cafeUsers', defaultUsers);
    }
    const { data, error } = await supabase
      .from('app_users')
      .select('id, username, password, role, active')
      .order('username');
    if (error) throw error;
    if (!data?.length) {
      const { data: seededUsers, error: seedError } = await supabase
        .from('app_users')
        .upsert(defaultUsers, { onConflict: 'id' })
        .select('id, username, password, role, active')
        .order('username');
      if (seedError) throw seedError;
      return seededUsers as AppUser[];
    }
    return data as AppUser[];
  },

  async saveUser(user: AppUser) {
    if (!supabase) {
      const users = readLocal<AppUser[]>('cafeUsers', []);
      const next = users.some((item) => item.id === user.id)
        ? users.map((item) => (item.id === user.id ? user : item))
        : [...users, user];
      writeLocal('cafeUsers', next);
      return user;
    }
    const { data, error } = await supabase
      .from('app_users')
      .upsert(user, { onConflict: 'id' })
      .select('id, username, password, role, active')
      .single();
    if (error) throw error;
    return data as AppUser;
  },

  async deleteUser(id: string) {
    if (!supabase) {
      writeLocal('cafeUsers', readLocal<AppUser[]>('cafeUsers', []).filter((user) => user.id !== id));
      return;
    }
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
  },

  async getMenuItems(defaultItems: MenuItem[]) {
    if (!supabase) {
      if (!localStorage.getItem('cafeMenuItems')) writeLocal('cafeMenuItems', defaultItems);
      return readLocal<MenuItem[]>('cafeMenuItems', defaultItems);
    }
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, price, image, category, available')
      .order('id');
    if (error) throw error;
    if (!data?.length) {
      const { data: seededItems, error: seedError } = await supabase
        .from('menu_items')
        .upsert(defaultItems.map((item) => ({ ...item, available: item.available ?? true })), { onConflict: 'id' })
        .select('id, name, price, image, category, available')
        .order('id');
      if (seedError) throw seedError;
      return seededItems as MenuItem[];
    }
    return data as MenuItem[];
  },

  async saveMenuItem(item: MenuItem) {
    if (!supabase) {
      const items = readLocal<MenuItem[]>('cafeMenuItems', []);
      const next = items.some((menuItem) => menuItem.id === item.id)
        ? items.map((menuItem) => (menuItem.id === item.id ? item : menuItem))
        : [...items, item];
      writeLocal('cafeMenuItems', next);
      return item;
    }
    const { data, error } = await supabase
      .from('menu_items')
      .upsert({ ...item, available: item.available ?? true }, { onConflict: 'id' })
      .select('id, name, price, image, category, available')
      .single();
    if (error) throw error;
    return data as MenuItem;
  },

  async deleteMenuItem(id: number) {
    if (!supabase) {
      writeLocal('cafeMenuItems', readLocal<MenuItem[]>('cafeMenuItems', []).filter((item) => item.id !== id));
      return;
    }
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  async getOffers() {
    if (!supabase) return readLocal<Offer[]>('cafeOffers', []);
    const { data, error } = await supabase
      .from('offers')
      .select('id, menu_item_id, title, discount_percent, active')
      .order('title');
    if (error) throw error;
    return (data || []).map((offer) => ({
      id: offer.id,
      menuItemId: offer.menu_item_id,
      title: offer.title,
      discountPercent: offer.discount_percent,
      active: offer.active,
    })) as Offer[];
  },

  async saveOffer(offer: Offer) {
    if (!supabase) {
      const offers = readLocal<Offer[]>('cafeOffers', []);
      const next = offers.some((item) => item.id === offer.id)
        ? offers.map((item) => (item.id === offer.id ? offer : item))
        : [...offers, offer];
      writeLocal('cafeOffers', next);
      return offer;
    }
    const db = assertSupabase();
    const { data, error } = await db
      .from('offers')
      .upsert({
        id: offer.id,
        menu_item_id: offer.menuItemId,
        title: offer.title,
        discount_percent: offer.discountPercent,
        active: offer.active,
      }, { onConflict: 'id' })
      .select('id, menu_item_id, title, discount_percent, active')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      menuItemId: data.menu_item_id,
      title: data.title,
      discountPercent: data.discount_percent,
      active: data.active,
    } as Offer;
  },

  async deleteOffer(id: string) {
    if (!supabase) {
      writeLocal('cafeOffers', readLocal<Offer[]>('cafeOffers', []).filter((offer) => offer.id !== id));
      return;
    }
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;
  },

  async getOrders() {
    if (!supabase) return readLocal<Order[]>('cafeOrders', []);
    const { data, error } = await supabase
      .from('orders')
      .select('id, items, total, timestamp_ms, status, table_label, cashier_id, payment_method')
      .order('timestamp_ms', { ascending: false });
    if (error) throw error;
    return (data || []).map((order) => ({
      id: order.id,
      items: order.items,
      total: Number(order.total),
      timestamp: Number(order.timestamp_ms),
      status: order.status,
      table: tableValueFromDb(order.table_label),
      cashierId: order.cashier_id,
      paymentMethod: order.payment_method,
    })) as Order[];
  },

  async saveOrder(order: Order) {
    if (!supabase) {
      const orders = readLocal<Order[]>('cafeOrders', []);
      const next = orders.some((item) => item.id === order.id)
        ? orders.map((item) => (item.id === order.id ? order : item))
        : [...orders, order];
      writeLocal('cafeOrders', next);
      return order;
    }
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      items: order.items,
      total: order.total,
      timestamp_ms: order.timestamp,
      status: order.status,
      table_label: tableValueToDb(order.table),
      cashier_id: order.cashierId,
      payment_method: order.paymentMethod ?? null,
    }, { onConflict: 'id' });
    if (error) throw error;
    return order;
  },

  async deleteOrder(id: string) {
    if (!supabase) {
      writeLocal('cafeOrders', readLocal<Order[]>('cafeOrders', []).filter((order) => order.id !== id));
      return;
    }
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },

  async clearOrders() {
    if (!supabase) {
      localStorage.removeItem('cafeOrders');
      return;
    }
    const { error } = await supabase.from('orders').delete().neq('id', '');
    if (error) throw error;
  },

  async recordSale(sale: SaleRecord) {
    if (!supabase) {
      const salesHistory = readLocal<SaleRecord[]>('cafeSalesHistory', []);
      writeLocal('cafeSalesHistory', [...salesHistory, sale]);
      return;
    }
    const { error } = await supabase.from('sales').insert({
      order_id: sale.orderId,
      cashier_id: sale.cashierId,
      table_label: tableValueToDb(sale.table),
      items: sale.items,
      total: sale.total,
      paid_at_ms: sale.paidAt,
      payment_method: sale.paymentMethod,
    });
    if (error) throw error;
  },

  async deleteSaleByOrderId(orderId: string) {
    if (!supabase) {
      writeLocal(
        'cafeSalesHistory',
        readLocal<SaleRecord[]>('cafeSalesHistory', []).filter((sale) => sale.orderId !== orderId)
      );
      return;
    }
    const { error } = await supabase.from('sales').delete().eq('order_id', orderId);
    if (error) throw error;
  },

  async getSales() {
    if (!supabase) return readLocal<SaleRecord[]>('cafeSalesHistory', []);
    const { data, error } = await supabase
      .from('sales')
      .select('order_id, cashier_id, table_label, items, total, paid_at_ms, payment_method')
      .order('paid_at_ms', { ascending: false });
    if (error) throw error;
    return (data || []).map((sale) => ({
      orderId: sale.order_id,
      cashierId: sale.cashier_id,
      table: tableValueFromDb(sale.table_label),
      items: sale.items,
      total: Number(sale.total),
      paidAt: Number(sale.paid_at_ms),
      paymentMethod: sale.payment_method,
    })) as SaleRecord[];
  },

  async recordShift(shift: ShiftRecord) {
    if (!supabase) {
      const shifts = readLocal<ShiftRecord[]>('cafeShifts', []);
      writeLocal('cafeShifts', [...shifts, shift]);
      return;
    }
    const { error } = await supabase.from('shifts').insert({
      cashier_id: shift.cashierId,
      shift_start_ms: shift.shiftStart,
      shift_end_ms: shift.shiftEnd,
      initial_drawer: shift.initialDrawer,
      final_drawer: shift.finalDrawer,
      total_sales: shift.totalSales,
      cash_sales: shift.cashSales ?? 0,
      card_sales: shift.cardSales ?? 0,
      instapay_sales: shift.instapaySales ?? 0,
      expected_drawer: shift.expectedDrawer,
      difference: shift.difference,
      orders_count: shift.ordersCount,
      paid_orders_count: shift.paidOrdersCount,
      date: shift.date,
    });
    if (error) throw error;
  },

  async getShifts() {
    if (!supabase) return readLocal<ShiftRecord[]>('cafeShifts', []);
    const { data, error } = await supabase
      .from('shifts')
      .select('cashier_id, shift_start_ms, shift_end_ms, initial_drawer, final_drawer, total_sales, cash_sales, card_sales, instapay_sales, expected_drawer, difference, orders_count, paid_orders_count, date')
      .order('shift_end_ms', { ascending: false });
    if (error) throw error;
    return (data || []).map((shift) => ({
      cashierId: shift.cashier_id,
      shiftStart: shift.shift_start_ms,
      shiftEnd: shift.shift_end_ms,
      initialDrawer: Number(shift.initial_drawer),
      finalDrawer: Number(shift.final_drawer),
      totalSales: Number(shift.total_sales),
      cashSales: Number(shift.cash_sales),
      cardSales: Number(shift.card_sales),
      instapaySales: Number(shift.instapay_sales),
      expectedDrawer: Number(shift.expected_drawer),
      difference: Number(shift.difference),
      ordersCount: shift.orders_count,
      paidOrdersCount: shift.paid_orders_count,
      date: shift.date,
    })) as ShiftRecord[];
  },
};
