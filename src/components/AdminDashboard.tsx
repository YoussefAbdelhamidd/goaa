import React, { useMemo, useState } from 'react';
import type { AppUser, MenuItem, Offer, Order, PaymentMethod, SaleRecord, ShiftRecord } from '../lib/posTypes';
import { backendMode } from '../lib/posBackend';

interface AdminDashboardProps {
  onBack: () => void;
  users: AppUser[];
  menuItems: MenuItem[];
  offers: Offer[];
  orders: Order[];
  salesHistory: SaleRecord[];
  shifts: ShiftRecord[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: number) => Promise<void>;
  onSaveOffer: (offer: Offer) => Promise<void>;
  onDeleteOffer: (id: string) => Promise<void>;
  onCancelOrder: (id: string) => Promise<void>;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';
type AdminTab = 'reports' | 'orders' | 'users' | 'menu' | 'offers';
type AdminOrderRow = {
  id: string;
  timestamp: number;
  cashierId?: string;
  table?: number | 'to-go';
  status: 'pending' | 'paid';
  paymentMethod?: PaymentMethod;
  total: number;
};

const blankUser = (): AppUser => ({
  id: `user-${Date.now()}`,
  username: '',
  password: '',
  role: 'cashier',
  active: true,
});

const blankMenuItem = (items: MenuItem[]): MenuItem => ({
  id: Math.max(0, ...items.map((item) => item.id)) + 1,
  name: '',
  price: 0,
  image: '',
  category: 'HotDrinks',
  available: true,
});

const blankOffer = (items: MenuItem[]): Offer => ({
  id: `offer-${Date.now()}`,
  menuItemId: items[0]?.id ?? 1,
  title: '',
  discountPercent: 0,
  active: true,
});

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const addDays = (timestamp: number, days: number) => {
  const d = new Date(timestamp);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const toDateInputValue = (date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const dateInputToTimestamp = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
};

const dateInputToDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatCalendarDate = (value: string) =>
  dateInputToDate(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const getCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => new Date(year, month, index - leadingDays + 1));
};

const isSameCalendarDay = (date: Date, value: string) => {
  const selected = dateInputToDate(value);
  return (
    date.getFullYear() === selected.getFullYear() &&
    date.getMonth() === selected.getMonth() &&
    date.getDate() === selected.getDate()
  );
};

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Pick a Date' },
  { value: 'all', label: 'All Time' },
];

const matchesDateFilter = (timestamp: number, dateFilter: DateFilter, customDate: string) => {
  if (dateFilter === 'all') return true;

  if (dateFilter === 'custom') {
    const start = dateInputToTimestamp(customDate);
    const end = addDays(start, 1);
    return timestamp >= start && timestamp < end;
  }

  if (dateFilter === 'yesterday') {
    const end = startOfDay();
    const start = addDays(end, -1);
    return timestamp >= start && timestamp < end;
  }

  const cutoff = dateFilter === 'today'
    ? startOfDay()
    : dateFilter === 'week'
      ? startOfWeek()
      : startOfMonth();

  return timestamp >= cutoff;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  users,
  menuItems,
  offers,
  orders,
  salesHistory,
  shifts,
  onSaveUser,
  onDeleteUser,
  onSaveMenuItem,
  onDeleteMenuItem,
  onSaveOffer,
  onDeleteOffer,
  onCancelOrder,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDate, setCustomDate] = useState(() => toDateInputValue());
  const [calendarMonth, setCalendarMonth] = useState(() => dateInputToDate(toDateInputValue()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const [userForm, setUserForm] = useState<AppUser>(blankUser());
  const [menuItemBeingEdited, setMenuItemBeingEdited] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [offerForm, setOfferForm] = useState<Offer>(() => blankOffer(menuItems));
  const [message, setMessage] = useState('');

  const filteredSales = useMemo(() => {
    return salesHistory.filter((sale) => matchesDateFilter(sale.paidAt, dateFilter, customDate));
  }, [salesHistory, dateFilter, customDate]);

  const filteredOrders = useMemo<AdminOrderRow[]>(() => {
    const paidRows = salesHistory.map((sale) => ({
      id: sale.orderId,
      timestamp: sale.paidAt,
      cashierId: sale.cashierId,
      table: sale.table,
      status: 'paid' as const,
      paymentMethod: sale.paymentMethod,
      total: sale.total,
    }));
    const pendingRows = orders
      .filter((order) => order.status === 'pending')
      .map((order) => ({
        id: order.id,
        timestamp: order.timestamp,
        cashierId: order.cashierId,
        table: order.table,
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total,
      }));

    return [...paidRows, ...pendingRows]
      .filter((order) => matchesDateFilter(order.timestamp, dateFilter, customDate))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, salesHistory, dateFilter, customDate]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  const calendarMonthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const revenueByPaymentMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = { cash: 0, card: 0, instapay: 0 };
    filteredSales.forEach((sale) => {
      const method = sale.paymentMethod || 'cash';
      totals[method] += sale.total;
    });
    return totals;
  }, [filteredSales]);
  const electronicRevenue = revenueByPaymentMethod.card + revenueByPaymentMethod.instapay;

  const revenueByCashier = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    filteredSales.forEach((sale) => {
      const entry = map.get(sale.cashierId) || { revenue: 0, orders: 0 };
      entry.revenue += sale.total;
      entry.orders += 1;
      map.set(sale.cashierId, entry);
    });
    return Array.from(map.entries())
      .map(([cashierId, stats]) => ({ cashierId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const topItems = useMemo(() => {
    const map = new Map<string, { quantity: number; revenue: number }>();
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const entry = map.get(item.name) || { quantity: 0, revenue: 0 };
        entry.quantity += item.quantity;
        entry.revenue += item.price * item.quantity;
        map.set(item.name, entry);
      });
    });
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  const recentShifts = useMemo(
    () => [...shifts].sort((a, b) => b.shiftEnd - a.shiftEnd).slice(0, 15),
    [shifts]
  );

  const filteredMenuItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      String(item.price).includes(query)
    );
  }, [menuItems, menuSearch]);

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveUser({ ...userForm, username: userForm.username.trim() });
    setUserForm(blankUser());
    setMessage('User saved.');
  };

  const saveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemBeingEdited) return;
    await onSaveMenuItem({
      ...menuItemBeingEdited,
      name: menuItemBeingEdited.name.trim(),
      category: menuItemBeingEdited.category.trim(),
    });
    const wasNewItem = !menuItems.some((item) => item.id === menuItemBeingEdited.id);
    setMenuItemBeingEdited(null);
    setMessage(wasNewItem ? 'Menu item added.' : 'Menu item updated.');
  };

  const saveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveOffer({ ...offerForm, title: offerForm.title.trim() });
    setOfferForm(blankOffer(menuItems));
    setMessage('Offer saved.');
  };

  const cancelOrder = async (order: AdminOrderRow) => {
    const confirmed = window.confirm(`Cancel order #${order.id.slice(-6)}? This will remove it from reports if it was paid.`);
    if (!confirmed) return;
    await onCancelOrder(order.id);
    setMessage(`Order #${order.id.slice(-6)} canceled.`);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button onClick={onBack} className="back-btn">←</button>
        <div className="admin-title-block">
          <span>Gooba POS</span>
          <h2>Admin Dashboard</h2>
        </div>
        <div className="admin-filter-tabs">
          {(['reports', 'orders', 'users', 'menu', 'offers'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={`admin-filter-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setMessage('');
              }}
            >
              {tab === 'reports' ? 'Reports' : tab === 'orders' ? 'Orders' : tab === 'users' ? 'Cashiers' : tab === 'menu' ? 'Menu' : 'Offers'}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-status-row">
          <span className={`admin-status-pill ${backendMode === 'supabase' ? 'online' : ''}`}>
            {backendMode === 'supabase' ? 'Supabase connected' : 'Local fallback'}
          </span>
          {message && <span className="admin-message">{message}</span>}
        </div>

        {(activeTab === 'reports' || activeTab === 'orders') && (
            <div className="admin-date-filter-bar">
              <div className="admin-filter-tabs">
                {dateFilterOptions.map((filter) => (
                  <button
                    key={filter.value}
                    className={`admin-filter-btn ${dateFilter === filter.value ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter(filter.value);
                      setIsCalendarOpen(filter.value === 'custom');
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="admin-calendar-picker">
                <button
                  className={`admin-calendar-trigger ${dateFilter === 'custom' ? 'active' : ''}`}
                  type="button"
                  onClick={() => {
                    setDateFilter('custom');
                    setCalendarMonth(dateInputToDate(customDate));
                    setIsCalendarOpen((open) => !open);
                  }}
                >
                  <span>Calendar</span>
                  <strong>{formatCalendarDate(customDate)}</strong>
                </button>
                {isCalendarOpen && (
                  <div className="admin-calendar-popover">
                    <div className="admin-calendar-header">
                      <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      >
                        &lt;
                      </button>
                      <strong>{calendarMonthLabel}</strong>
                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      >
                        &gt;
                      </button>
                    </div>
                    <div className="admin-calendar-weekdays">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="admin-calendar-grid">
                      {calendarDays.map((day) => {
                        const dateValue = toDateInputValue(day);
                        const isOutsideMonth = day.getMonth() !== calendarMonth.getMonth();
                        const isSelected = isSameCalendarDay(day, customDate);
                        const isToday = isSameCalendarDay(day, toDateInputValue());

                        return (
                          <button
                            key={dateValue}
                            type="button"
                            className={[
                              isOutsideMonth ? 'outside' : '',
                              isSelected ? 'selected' : '',
                              isToday ? 'today' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => {
                              setCustomDate(dateValue);
                              setDateFilter('custom');
                              setIsCalendarOpen(false);
                            }}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
        )}

        {activeTab === 'reports' && (
          <>

            <div className="admin-stats-grid">
              <div className="admin-stat-card admin-stat-total">
                <span className="admin-stat-label">Total Revenue</span>
                <strong className="admin-stat-value">EGP{totalRevenue.toFixed(2)}</strong>
                <span className="admin-stat-note">Cash + card + InstaPay</span>
              </div>
              <div className="admin-stat-card admin-stat-cash">
                <span className="admin-stat-label">Cash in Drawer</span>
                <strong className="admin-stat-value">EGP{revenueByPaymentMethod.cash.toFixed(2)}</strong>
                <span className="admin-stat-note">Physical cash only</span>
              </div>
              <div className="admin-stat-card admin-stat-cardpay">
                <span className="admin-stat-label">Card Sales</span>
                <strong className="admin-stat-value">EGP{revenueByPaymentMethod.card.toFixed(2)}</strong>
                <span className="admin-stat-note">Not in drawer</span>
              </div>
              <div className="admin-stat-card admin-stat-instapay">
                <span className="admin-stat-label">InstaPay Sales</span>
                <strong className="admin-stat-value">EGP{revenueByPaymentMethod.instapay.toFixed(2)}</strong>
                <span className="admin-stat-note">Not in drawer</span>
              </div>
              <div className="admin-stat-card admin-stat-electronic">
                <span className="admin-stat-label">Electronic Total</span>
                <strong className="admin-stat-value">EGP{electronicRevenue.toFixed(2)}</strong>
                <span className="admin-stat-note">Card + InstaPay</span>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Orders Sold</span>
                <strong className="admin-stat-value">{totalOrders}</strong>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Avg Order Value</span>
                <strong className="admin-stat-value">EGP{avgOrderValue.toFixed(2)}</strong>
              </div>
              <div className="admin-stat-card">
                <span className="admin-stat-label">Active Cashiers</span>
                <strong className="admin-stat-value">{users.filter((user) => user.role === 'cashier' && user.active).length}</strong>
              </div>
            </div>

            <div className="admin-panels">
              <ReportTable title="Revenue by Cashier" empty={revenueByCashier.length === 0}>
                <thead><tr><th>Cashier</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody>
                  {revenueByCashier.map((row) => (
                    <tr key={row.cashierId}><td data-label="Cashier">{row.cashierId}</td><td data-label="Orders">{row.orders}</td><td data-label="Revenue">EGP{row.revenue.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </ReportTable>

              <ReportTable title="Drawer vs Electronic Payments" empty={totalOrders === 0}>
                <thead><tr><th>Method</th><th>Where it goes</th><th>Revenue</th></tr></thead>
                <tbody>
                  <tr><td data-label="Method">Cash</td><td data-label="Where it goes">Drawer</td><td data-label="Revenue">EGP{revenueByPaymentMethod.cash.toFixed(2)}</td></tr>
                  <tr><td data-label="Method">Card</td><td data-label="Where it goes">Bank/Card terminal</td><td data-label="Revenue">EGP{revenueByPaymentMethod.card.toFixed(2)}</td></tr>
                  <tr><td data-label="Method">InstaPay</td><td data-label="Where it goes">InstaPay account</td><td data-label="Revenue">EGP{revenueByPaymentMethod.instapay.toFixed(2)}</td></tr>
                </tbody>
              </ReportTable>

              <ReportTable title="Top Selling Items" empty={topItems.length === 0}>
                <thead><tr><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topItems.map((row) => (
                    <tr key={row.name}><td data-label="Item">{row.name}</td><td data-label="Qty Sold">{row.quantity}</td><td data-label="Revenue">EGP{row.revenue.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </ReportTable>
            </div>

            <ReportTable title="Shift History" empty={recentShifts.length === 0}>
              <thead>
                <tr><th>Cashier</th><th>Date</th><th>Cash Sales</th><th>Card / InstaPay</th><th>Total Sales</th><th>Expected Drawer</th><th>Final Drawer</th><th>Difference</th></tr>
              </thead>
              <tbody>
                {recentShifts.map((shift, index) => {
                  const nonCashSales = (shift.cardSales ?? 0) + (shift.instapaySales ?? 0);
                  return (
                    <tr key={`${shift.cashierId}-${shift.shiftEnd}-${index}`}>
                      <td data-label="Cashier">{shift.cashierId}</td><td data-label="Date">{shift.date}</td><td data-label="Cash Sales">EGP{(shift.cashSales ?? shift.totalSales).toFixed(2)}</td>
                      <td data-label="Card / InstaPay">EGP{nonCashSales.toFixed(2)}</td><td data-label="Total Sales">EGP{shift.totalSales.toFixed(2)}</td><td data-label="Expected Drawer">EGP{shift.expectedDrawer.toFixed(2)}</td><td data-label="Final Drawer">EGP{shift.finalDrawer.toFixed(2)}</td>
                      <td data-label="Difference" className={shift.difference === 0 ? '' : shift.difference > 0 ? 'admin-diff-positive' : 'admin-diff-negative'}>
                        {shift.difference > 0 ? '+' : ''}EGP{shift.difference.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ReportTable>
          </>
        )}

        {activeTab === 'orders' && (
          <ReportTable title="Orders by Day" empty={filteredOrders.length === 0}>
            <thead>
              <tr><th>Order</th><th>Date</th><th>Cashier</th><th>Table</th><th>Status</th><th>Payment</th><th>Total</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">#{order.id.slice(-6)}</td>
                  <td data-label="Date">{new Date(order.timestamp).toLocaleString()}</td>
                  <td data-label="Cashier">{order.cashierId || 'Unknown'}</td>
                  <td data-label="Table">{order.table === 'to-go' ? 'To Go' : order.table ? `Table ${order.table}` : '-'}</td>
                  <td data-label="Status">{order.status === 'paid' ? 'Paid' : 'Pending'}</td>
                  <td data-label="Payment">{order.paymentMethod || '-'}</td>
                  <td data-label="Total">EGP{order.total.toFixed(2)}</td>
                  <td data-label="Actions">
                    <button className="admin-filter-btn admin-danger-btn" onClick={() => cancelOrder(order)}>
                      Cancel Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        )}

        {activeTab === 'users' && (
          <CrudPanel title="Cashier Users">
            <form className="admin-form" onSubmit={saveUser}>
              <div className="admin-field">
                <label>Username</label>
                <input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="Cashier name" required />
              </div>
              <div className="admin-field">
                <label>Password</label>
                <input value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Login password" required />
              </div>
              <div className="admin-field">
                <label>Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AppUser['role'] })}>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label className="admin-check"><input type="checkbox" checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} /> Active</label>
              <button className="confirm-btn" type="submit">Save User</button>
            </form>
            <AdminTable>
              <thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Username">{user.username}</td><td data-label="Role">{user.role}</td><td data-label="Status">{user.active ? 'Active' : 'Disabled'}</td>
                    <td data-label="Actions">
                      <button className="admin-filter-btn" onClick={() => setUserForm(user)}>Edit</button>
                      <button className="admin-filter-btn" onClick={() => onDeleteUser(user.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </CrudPanel>
        )}

        {activeTab === 'menu' && (
          <>
          <CrudPanel title="Menu Items">
            <div className="admin-toolbar">
              <div className="admin-field admin-search-field">
                <label>Search menu</label>
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search item, category, or price"
                />
              </div>
              <span className="admin-result-count">{filteredMenuItems.length} of {menuItems.length} items</span>
              <button className="confirm-btn admin-add-btn" type="button" onClick={() => setMenuItemBeingEdited(blankMenuItem(menuItems))}>
                Add Item
              </button>
            </div>
            <AdminTable>
              <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredMenuItems.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Item">{item.name}</td><td data-label="Category">{item.category}</td><td data-label="Price">EGP{item.price.toFixed(2)}</td><td data-label="Status">{item.available === false ? 'Out of stock' : 'Available'}</td>
                    <td data-label="Actions">
                      <button className="admin-filter-btn" onClick={() => setMenuItemBeingEdited(item)}>Edit</button>
                      <button className="admin-filter-btn" onClick={() => onDeleteMenuItem(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredMenuItems.length === 0 && (
                  <tr>
                    <td colSpan={5}>No menu items match your search.</td>
                  </tr>
                )}
              </tbody>
            </AdminTable>
          </CrudPanel>
          </>
        )}

        {activeTab === 'offers' && (
          <CrudPanel title="Offers">
            <form className="admin-form" onSubmit={saveOffer}>
              <div className="admin-field">
                <label>Offer title</label>
                <input value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} placeholder="Morning deal" required />
              </div>
              <div className="admin-field">
                <label>Menu item</label>
                <select value={offerForm.menuItemId} onChange={(e) => setOfferForm({ ...offerForm, menuItemId: Number(e.target.value) })}>
                  {menuItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Discount</label>
                <input type="number" min="0" max="100" step="1" value={offerForm.discountPercent} onChange={(e) => setOfferForm({ ...offerForm, discountPercent: Number(e.target.value) })} placeholder="%" required />
              </div>
              <label className="admin-check"><input type="checkbox" checked={offerForm.active} onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })} /> Active</label>
              <button className="confirm-btn" type="submit">Save Offer</button>
            </form>
            <AdminTable>
              <thead><tr><th>Offer</th><th>Item</th><th>Discount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id}>
                    <td data-label="Offer">{offer.title}</td><td data-label="Item">{menuItems.find((item) => item.id === offer.menuItemId)?.name || offer.menuItemId}</td><td data-label="Discount">{offer.discountPercent}%</td><td data-label="Status">{offer.active ? 'Active' : 'Off'}</td>
                    <td data-label="Actions">
                      <button className="admin-filter-btn" onClick={() => setOfferForm(offer)}>Edit</button>
                      <button className="admin-filter-btn" onClick={() => onDeleteOffer(offer.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </CrudPanel>
        )}
      </div>
      {menuItemBeingEdited && (
        <div className="modal-overlay admin-edit-overlay" onClick={() => setMenuItemBeingEdited(null)}>
          <div className="modal-content admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-edit-heading">
              <span>{menuItems.some((item) => item.id === menuItemBeingEdited.id) ? 'Edit menu item' : 'Add menu item'}</span>
              <h3>{menuItemBeingEdited.name || 'Menu item'}</h3>
            </div>
            <form className="admin-form admin-modal-form" onSubmit={saveMenuItem}>
              <div className="admin-field">
                <label>Item name</label>
                <input
                  value={menuItemBeingEdited.name}
                  onChange={(e) => setMenuItemBeingEdited({ ...menuItemBeingEdited, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={menuItemBeingEdited.price}
                  onChange={(e) => setMenuItemBeingEdited({ ...menuItemBeingEdited, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="admin-field">
                <label>Category</label>
                <input
                  value={menuItemBeingEdited.category}
                  onChange={(e) => setMenuItemBeingEdited({ ...menuItemBeingEdited, category: e.target.value })}
                  required
                />
              </div>
              <div className="admin-field admin-field-wide">
                <label>Image URL</label>
                <input
                  value={menuItemBeingEdited.image}
                  onChange={(e) => setMenuItemBeingEdited({ ...menuItemBeingEdited, image: e.target.value })}
                />
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={menuItemBeingEdited.available ?? true}
                  onChange={(e) => setMenuItemBeingEdited({ ...menuItemBeingEdited, available: e.target.checked })}
                />
                Available for sale
              </label>
              <div className="modal-buttons">
                <button className="cancel-btn" type="button" onClick={() => setMenuItemBeingEdited(null)}>
                  Cancel
                </button>
                <button className="confirm-btn" type="submit">
                  {menuItems.some((item) => item.id === menuItemBeingEdited.id) ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportTable: React.FC<{ title: string; empty: boolean; children: React.ReactNode }> = ({ title, empty, children }) => (
  <div className="admin-panel">
    <h3>{title}</h3>
    {empty ? <p className="admin-empty">No records for this period.</p> : <table className="admin-table">{children}</table>}
  </div>
);

const CrudPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="admin-panel">
    <h3>{title}</h3>
    {children}
  </div>
);

const AdminTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <table className="admin-table">{children}</table>
);

export default AdminDashboard;
