import React from 'react';

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
  timestamp: number;
  status: 'pending' | 'paid';
  table?: number | 'to-go';
}

interface OrdersViewProps {
  orders: Order[];
  onPayOrder: (orderId: string) => void;
  onBack: () => void;
  onAddItems: (orderId: string) => void;
  onLogout: () => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  translations: {
    orders: string;
    orderId: string;
    date: string;
    status: string;
    pending: string;
    paid: string;
    pay: string;
    noOrders: string;
    total: string;
    table: string;
    toGo: string;
    addItems: string;
    orderManagement: string;
    orderInstructions: string;
    paymentNote: string;
    cancel: string;
    logout: string;
  };
}

const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onPayOrder,
  onBack,
  onAddItems,
  onLogout,
  language,
  onToggleLanguage,
  translations,
}) => {
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
        {orders.length === 0 ? (
          <p className="empty-orders">{translations.noOrders}</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-header">
                  <h3>{translations.orderId}: {order.id}</h3>
                  <span className={`status ${order.status}`}>
                    {order.status === 'pending' ? translations.pending : translations.paid}
                  </span>
                </div>
                <p className="order-date">
                  {translations.date}: {new Date(order.timestamp).toLocaleString()}
                </p>
                {order.table && (
                  <p className="order-table">
                    {order.table === 'to-go' ? translations.toGo : `${translations.table} ${order.table}`}
                  </p>
                )}
                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-detail">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <strong>{translations.total}: ${order.total.toFixed(2)}</strong>
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
                      onClick={() => onPayOrder(order.id)}
                      className="pay-btn"
                    >
                      {translations.pay}
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
        <div className="orders-info">
          <p>{translations.orderInstructions}</p>
          <p>{translations.paymentNote}</p>
        </div>
      </div>
    </div>
  );
};

export default OrdersView;