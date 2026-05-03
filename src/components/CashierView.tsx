import React, { useRef } from 'react';

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

interface CashierViewProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (id: number) => void;
  onCheckout: () => void;
  onToggleOrders: () => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
  isEditingOrder: boolean;
  translations: {
    cart: string;
    menu: string;
    total: string;
    checkout: string;
    remove: string;
    addToCart: string;
    emptyCart: string;
    orders: string;
    categories: {
      [key: string]: string;
    };
    editingOrder: string;
  };
}

const CashierView: React.FC<CashierViewProps> = ({
  menuItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
  onToggleOrders,
  language,
  onToggleLanguage,
  isEditingOrder,
  translations,
}) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Refs for scrolling
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToTop = () => {
    const menuGrid = document.querySelector('.menu-grid');
    if (menuGrid) {
      menuGrid.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToCategory = (category: string) => {
    const element = categoryRefs.current[category];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const categories = Object.keys(groupedItems);

  return (
    <div className="cashier-view">
      <div className="cart-section">
        <div className="header">
          <div>
            <h2>{translations.cart}</h2>
            {isEditingOrder && (
              <p className="editing-indicator">
                {translations.editingOrder}
              </p>
            )}
          </div>
          <div className="header-buttons">
            <button onClick={onToggleOrders} className="orders-btn">
              {translations.orders}
            </button>
            <button onClick={onToggleLanguage} className="lang-toggle">
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
        {cart.length === 0 ? (
          <p className="empty-cart">{translations.emptyCart}</p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>${item.price.toFixed(2)} each</p>
                  <div className="cart-item-quantity">
                    <span>Qty: {item.quantity}</span>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => onAddToCart(item)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        className="quantity-btn"
                        onClick={() => onRemoveFromCart(item.id)}
                        title="Decrease quantity"
                      >
                        −
                      </button>
                    </div>
                  </div>
                  <p className="item-subtotal">
                    Subtotal: ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="cart-total">
            <h3>{translations.total}: ${total.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={onCheckout}>{translations.checkout}</button>
          </div>
        )}
      </div>
      <div className="menu-section">
        <h2>{translations.menu}</h2>
        <div className="category-buttons">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className="category-btn"
            >
              {translations.categories[category]}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {categories.map((category) => (
            <div
              key={category}
              ref={(el) => { categoryRefs.current[category] = el; }}
              className="category-section"
            >
              <h3 className="category-title">{translations.categories[category]}</h3>
              <div className="category-items">
                {groupedItems[category].map((item) => (
                  <div key={item.id} className="menu-item" onClick={() => onAddToCart(item)}>
                    <img src={item.image} alt={item.name} className="menu-item-image" />
                    <h3>{item.name}</h3>
                    <p className="price">${item.price.toFixed(2)}</p>
                    <button className="add-btn">{translations.addToCart}</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={scrollToTop} className="scroll-to-top-btn">↑</button>
        </div>
      </div>
    </div>
  );
};

export default CashierView;