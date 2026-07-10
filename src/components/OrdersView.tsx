import React, { useMemo, useState } from 'react';

type PaymentMethod = 'cash' | 'card' | 'instapay';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
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
  paymentMethod?: PaymentMethod;
}

interface OrdersViewProps {
  orders: Order[];
  onPayOrder: (orderId: string, paymentMethod: PaymentMethod, taxApplied: boolean) => void;
  onChangePaymentMethod: (orderId: string, paymentMethod: PaymentMethod) => void;
  onBack: () => void;
  onAddItems: (orderId: string) => void;
  onLogout: () => void;
  drawerAmount: number;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  translations: {
    orders: string;
    orderId: string;
    date: string;
    status: string;
    statusAll: string;
    pending: string;
    paid: string;
    pay: string;
    changePaymentMethod: string;
    noOrders: string;
    noOrdersForFilter: string;
    total: string;
    subtotal: string;
    tax: string;
    includeTax: string;
    table: string;
    toGo: string;
    addItems: string;
    orderManagement: string;
    orderInstructions: string;
    paymentNote: string;
    cancel: string;
    logout: string;
    selectPaymentMethod: string;
    updatePaymentMethod: string;
    confirmPayment: string;
    cash: string;
    card: string;
    instapay: string;
  };
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'instapay'];
const TAX_RATE = 0.14;

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onPayOrder,
  onChangePaymentMethod,
  onBack,
  onAddItems,
  onLogout,
  drawerAmount,
  language,
  onToggleLanguage,
  translations,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [orderPendingPayment, setOrderPendingPayment] = useState<Order | null>(null);
  const [paymentMode, setPaymentMode] = useState<'pay' | 'change'>('pay');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [applyTax, setApplyTax] = useState(false);

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.timestamp - a.timestamp);
    if (statusFilter === 'all') return sorted;
    return sorted.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const paidCount = orders.filter((order) => order.status === 'paid').length;

  const openPaymentModal = (order: Order) => {
    setOrderPendingPayment(order);
    setPaymentMode(order.status === 'paid' ? 'change' : 'pay');
    setSelectedMethod(order.paymentMethod || 'cash');
    setApplyTax(order.taxApplied ?? false);
  };

  const closePaymentModal = () => setOrderPendingPayment(null);

  const confirmPayment = () => {
    if (!orderPendingPayment) return;
    if (paymentMode === 'change') {
      onChangePaymentMethod(orderPendingPayment.id, selectedMethod);
    } else {
      onPayOrder(orderPendingPayment.id, selectedMethod, applyTax);
    }
    setOrderPendingPayment(null);
  };

  const paymentMethodLabel = (method: PaymentMethod) =>
    method === 'cash' ? translations.cash : method === 'card' ? translations.card : translations.instapay;
  const paymentSubtotal = orderPendingPayment?.subtotal ?? orderPendingPayment?.total ?? 0;
  const paymentTaxAmount = paymentMode === 'pay' && applyTax ? roundMoney(paymentSubtotal * TAX_RATE) : 0;
  const paymentTotal = roundMoney(paymentSubtotal + paymentTaxAmount);

  return (
    <div className="cashier-view">
      <div className="cart-section">
        <div className="header">
          <button onClick={onBack} className="back-btn">←</button>
          <h2>{translations.orders}</h2>
          <div className="header-buttons">
            <button onClick={onLogout} className="logout-btn">
              {translations.logout}
            </button>
            <button onClick={onToggleLanguage} className="lang-toggle">
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>

        <div className="status-tabs">
          <button
            className={`status-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            {translations.statusAll}
            <span className="status-tab-count">{orders.length}</span>
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            {translations.pending}
            <span className="status-tab-count">{pendingCount}</span>
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            {translations.paid}
            <span className="status-tab-count">{paidCount}</span>
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="empty-orders">
            {orders.length === 0 ? translations.noOrders : translations.noOrdersForFilter}
          </p>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card-top">
                  <div className="order-card-heading">
                    <span className="order-card-id">{translations.orderId} #{order.id.slice(-6)}</span>
                    <span className="order-card-date">
                      {new Date(order.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <span className={`order-badge order-badge-${order.status}`}>
                    {order.status === 'pending' ? translations.pending : translations.paid}
                  </span>
                </div>

                <div className="order-card-meta">
                  {order.table && (
                    <span className="order-meta-pill">
                      {order.table === 'to-go' ? translations.toGo : `${translations.table} ${order.table}`}
                    </span>
                  )}
                  {order.status === 'paid' && order.paymentMethod && (
                    <span className={`order-meta-pill payment-pill payment-pill-${order.paymentMethod}`}>
                      {paymentMethodLabel(order.paymentMethod)}
                    </span>
                  )}
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-detail">
                      <span>{item.name} x{item.quantity}</span>
                      <span>EGP{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>{translations.total}: EGP{order.total.toFixed(2)}</strong>
                </div>

                {order.status === 'pending' && (
                  <div className="order-actions">
                    <button
                      onClick={() => onAddItems(order.id)}
                      className="add-items-btn"
                    >
                      {translations.addItems}
                    </button>
                    <button
                      onClick={() => openPaymentModal(order)}
                      className="pay-btn"
                    >
                      {translations.pay}
                    </button>
                  </div>
                )}

                {order.status === 'paid' && (
                  <div className="order-actions">
                    <button
                      onClick={() => openPaymentModal(order)}
                      className="add-items-btn"
                    >
                      {translations.changePaymentMethod}
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      <div className="menu-section">
        <h2>{translations.orderManagement}</h2>
        <div className="drawer-status-card">
          <span className="drawer-status-label">{translations.cash}</span>
          <strong className="drawer-status-value">EGP{drawerAmount.toFixed(2)}</strong>
        </div>
        <div className="orders-info">
          <p>{translations.orderInstructions}</p>
          <p>{translations.paymentNote}</p>
        </div>
      </div>

      {orderPendingPayment && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{paymentMode === 'change' ? translations.updatePaymentMethod : translations.selectPaymentMethod}</h3>
            <div className="order-total payment-modal-total">
              {paymentMode === 'pay' && (
                <>
                  <span>{translations.subtotal}: EGP{paymentSubtotal.toFixed(2)}</span>
                  <label className="tax-toggle">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                    />
                    {translations.includeTax}
                  </label>
                  <span>{translations.tax}: EGP{paymentTaxAmount.toFixed(2)}</span>
                </>
              )}
              <strong>{translations.total}: EGP{(paymentMode === 'pay' ? paymentTotal : orderPendingPayment.total).toFixed(2)}</strong>
            </div>
            <div className="pill-group payment-method-group">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`pill-option ${selectedMethod === method ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method)}
                >
                  {paymentMethodLabel(method)}
                </button>
              ))}
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" type="button" onClick={closePaymentModal}>
                {translations.cancel}
              </button>
              <button className="confirm-btn" type="button" onClick={confirmPayment}>
                {paymentMode === 'change' ? translations.updatePaymentMethod : translations.confirmPayment}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersView;
