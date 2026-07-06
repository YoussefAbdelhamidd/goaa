import React, { useMemo, useState } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
  extras?: string[];
}

type PaymentMethod = 'cash' | 'card' | 'instapay';

interface SaleRecord {
  orderId: string;
  cashierId: string;
  table?: number | 'to-go';
  items: CartItem[];
  total: number;
  paidAt: number;
  paymentMethod?: PaymentMethod;
}

interface ShiftRecord {
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

interface AdminDashboardProps {
  onBack: () => void;
}

type DateFilter = 'today' | 'week' | 'all';

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const [salesHistory] = useState<SaleRecord[]>(() =>
    JSON.parse(localStorage.getItem('cafeSalesHistory') || '[]')
  );
  const [shifts] = useState<ShiftRecord[]>(() =>
    JSON.parse(localStorage.getItem('cafeShifts') || '[]')
  );

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

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>Admin Dashboard</h2>
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
      </div>

      <div className="admin-content">
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
            <strong className="admin-stat-value">{revenueByCashier.length}</strong>
          </div>
        </div>

        <div className="admin-panels">
          <div className="admin-panel">
            <h3>Revenue by Cashier</h3>
            {revenueByCashier.length === 0 ? (
              <p className="admin-empty">No sales recorded for this period.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cashier</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByCashier.map((row) => (
                    <tr key={row.cashierId}>
                      <td>{row.cashierId}</td>
                      <td>{row.orders}</td>
                      <td>EGP{row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-panel">
            <h3>Sales by Payment Method</h3>
            {totalOrders === 0 ? (
              <p className="admin-empty">No sales recorded for this period.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cash</td>
                    <td>EGP{revenueByPaymentMethod.cash.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Card</td>
                    <td>EGP{revenueByPaymentMethod.card.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>InstaPay</td>
                    <td>EGP{revenueByPaymentMethod.instapay.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-panel">
            <h3>Top Selling Items</h3>
            {topItems.length === 0 ? (
              <p className="admin-empty">No sales recorded for this period.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.quantity}</td>
                      <td>EGP{row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <h3>Shift History</h3>
          {recentShifts.length === 0 ? (
            <p className="admin-empty">No shifts recorded yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cashier</th>
                  <th>Date</th>
                  <th>Cash Sales</th>
                  <th>Card / InstaPay</th>
                  <th>Total Sales</th>
                  <th>Expected Drawer</th>
                  <th>Final Drawer</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {recentShifts.map((shift, index) => {
                  const nonCashSales = (shift.cardSales ?? 0) + (shift.instapaySales ?? 0);
                  return (
                    <tr key={`${shift.cashierId}-${shift.shiftEnd}-${index}`}>
                      <td>{shift.cashierId}</td>
                      <td>{shift.date}</td>
                      <td>EGP{(shift.cashSales ?? shift.totalSales).toFixed(2)}</td>
                      <td>EGP{nonCashSales.toFixed(2)}</td>
                      <td>EGP{shift.totalSales.toFixed(2)}</td>
                      <td>EGP{shift.expectedDrawer.toFixed(2)}</td>
                      <td>EGP{shift.finalDrawer.toFixed(2)}</td>
                      <td className={shift.difference === 0 ? '' : shift.difference > 0 ? 'admin-diff-positive' : 'admin-diff-negative'}>
                        {shift.difference > 0 ? '+' : ''}
                        EGP{shift.difference.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
