import React, { useMemo, useState } from 'react';
import type { AppUser, MenuItem, Offer, PaymentMethod, SaleRecord, ShiftRecord } from '../lib/posTypes';
import { backendMode } from '../lib/posBackend';

interface AdminDashboardProps {
  onBack: () => void;
  users: AppUser[];
  menuItems: MenuItem[];
  offers: Offer[];
  salesHistory: SaleRecord[];
  shifts: ShiftRecord[];
  onSaveUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: number) => Promise<void>;
  onSaveOffer: (offer: Offer) => Promise<void>;
  onDeleteOffer: (id: string) => Promise<void>;
}

type DateFilter = 'today' | 'week' | 'all';
type AdminTab = 'reports' | 'users' | 'menu' | 'offers';

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

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  users,
  menuItems,
  offers,
  salesHistory,
  shifts,
  onSaveUser,
  onDeleteUser,
  onSaveMenuItem,
  onDeleteMenuItem,
  onSaveOffer,
  onDeleteOffer,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const [userForm, setUserForm] = useState<AppUser>(blankUser());
  const [menuItemBeingEdited, setMenuItemBeingEdited] = useState<MenuItem | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [offerForm, setOfferForm] = useState<Offer>(() => blankOffer(menuItems));
  const [message, setMessage] = useState('');

  const filteredSales = useMemo(() => {
    if (dateFilter === 'all') return salesHistory;
    const cutoff = dateFilter === 'today' ? startOfToday() : startOfWeek();
    return salesHistory.filter((sale) => sale.paidAt >= cutoff);
  }, [salesHistory, dateFilter]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const revenueByPaymentMethod = useMemo(() => {
    const totals: Record<PaymentMethod, number> = { cash: 0, card: 0, instapay: 0 };
    filteredSales.forEach((sale) => {
      const method = sale.paymentMethod || 'cash';
      totals[method] += sale.total;
    });
    return totals;
  }, [filteredSales]);

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

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button onClick={onBack} className="back-btn">←</button>
        <div className="admin-title-block">
          <span>Gooba POS</span>
          <h2>Admin Dashboard</h2>
        </div>
        <div className="admin-filter-tabs">
          {(['reports', 'users', 'menu', 'offers'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              className={`admin-filter-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setMessage('');
              }}
            >
              {tab === 'reports' ? 'Reports' : tab === 'users' ? 'Cashiers' : tab === 'menu' ? 'Menu' : 'Offers'}
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

        {activeTab === 'reports' && (
          <>
            <div className="admin-filter-tabs">
              {(['today', 'week', 'all'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={`admin-filter-btn ${dateFilter === filter ? 'active' : ''}`}
                  onClick={() => setDateFilter(filter)}
                >
                  {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'All Time'}
                </button>
              ))}
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <span className="admin-stat-label">Total Revenue</span>
                <strong className="admin-stat-value">EGP{totalRevenue.toFixed(2)}</strong>
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
                    <tr key={row.cashierId}><td>{row.cashierId}</td><td>{row.orders}</td><td>EGP{row.revenue.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </ReportTable>

              <ReportTable title="Sales by Payment Method" empty={totalOrders === 0}>
                <thead><tr><th>Method</th><th>Revenue</th></tr></thead>
                <tbody>
                  <tr><td>Cash</td><td>EGP{revenueByPaymentMethod.cash.toFixed(2)}</td></tr>
                  <tr><td>Card</td><td>EGP{revenueByPaymentMethod.card.toFixed(2)}</td></tr>
                  <tr><td>InstaPay</td><td>EGP{revenueByPaymentMethod.instapay.toFixed(2)}</td></tr>
                </tbody>
              </ReportTable>

              <ReportTable title="Top Selling Items" empty={topItems.length === 0}>
                <thead><tr><th>Item</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topItems.map((row) => (
                    <tr key={row.name}><td>{row.name}</td><td>{row.quantity}</td><td>EGP{row.revenue.toFixed(2)}</td></tr>
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
                      <td>{shift.cashierId}</td><td>{shift.date}</td><td>EGP{(shift.cashSales ?? shift.totalSales).toFixed(2)}</td>
                      <td>EGP{nonCashSales.toFixed(2)}</td><td>EGP{shift.totalSales.toFixed(2)}</td><td>EGP{shift.expectedDrawer.toFixed(2)}</td><td>EGP{shift.finalDrawer.toFixed(2)}</td>
                      <td className={shift.difference === 0 ? '' : shift.difference > 0 ? 'admin-diff-positive' : 'admin-diff-negative'}>
                        {shift.difference > 0 ? '+' : ''}EGP{shift.difference.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </ReportTable>
          </>
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
                    <td>{user.username}</td><td>{user.role}</td><td>{user.active ? 'Active' : 'Disabled'}</td>
                    <td>
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
                    <td>{item.name}</td><td>{item.category}</td><td>EGP{item.price.toFixed(2)}</td><td>{item.available === false ? 'Out of stock' : 'Available'}</td>
                    <td>
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
                    <td>{offer.title}</td><td>{menuItems.find((item) => item.id === offer.menuItemId)?.name || offer.menuItemId}</td><td>{offer.discountPercent}%</td><td>{offer.active ? 'Active' : 'Off'}</td>
                    <td>
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
