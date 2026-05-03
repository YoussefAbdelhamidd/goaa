import React, { useRef, useState } from 'react';
import logo from '../assets/Main logo.png';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  size?: string;
  extras?: string[];
}

interface CashierViewProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem, quantity?: number, size?: string, extras?: string[]) => void;
  onRemoveFromCart: (item: CartItem) => void;
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
    quantity: string;
    size: string;
    extras: string;
    cancel: string;
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const sizeOptions = ['Small', 'Medium', 'Large'];
  const extraOptions = ['Extra Cheese', 'Extra Sauce', 'No Sugar'];

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedQuantity(1);
    setSelectedSize('Medium');
    setSelectedExtras([]);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setSelectedQuantity(1);
    setSelectedSize('Medium');
    setSelectedExtras([]);
  };

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((item) => item !== extra) : [...prev, extra]
    );
  };

  const confirmAdd = () => {
    if (!selectedItem) return;
    onAddToCart(selectedItem, selectedQuantity, selectedSize, selectedExtras);
    closeItemModal();
  };

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
          <div className="header-brand">
            <img src={logo} alt="Brand logo" className="cashier-logo" />
            <div>
              <h2>{translations.cart}</h2>
              {isEditingOrder && (
                <p className="editing-indicator">
                  {translations.editingOrder}
                </p>
              )}
            </div>
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
              <div
                key={`${item.id}-${item.size || 'default'}-${item.extras?.join('_') || ''}`}
                className="cart-item"
              >
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  {item.size && <p>Size: {item.size}</p>}
                  {item.extras && item.extras.length > 0 && (
                    <p>Extras: {item.extras.join(', ')}</p>
                  )}
                  <p>${item.price.toFixed(2)} each</p>
                  <div className="cart-item-quantity">
                    <span>Qty: {item.quantity}</span>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => onAddToCart(item, 1, item.size, item.extras)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        className="quantity-btn"
                        onClick={() => onRemoveFromCart(item)}
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
        {selectedItem && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{selectedItem.name}</h3>
              <img src={selectedItem.image} alt={selectedItem.name} className="menu-item-image" />
              <p className="price">${selectedItem.price.toFixed(2)}</p>
              <div className="item-options">
                <div className="option-group">
                  <label>{translations.quantity}</label>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      type="button"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    >
                      −
                    </button>
                    <span>{selectedQuantity}</span>
                    <button
                      className="quantity-btn"
                      type="button"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="option-group">
                  <label>{translations.size}</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    {sizeOptions.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="option-group">
                  <label>{translations.extras}</label>
                  <div className="extras-list">
                    {extraOptions.map((extra) => (
                      <label key={extra} className="extra-option">
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra)}
                          onChange={() => toggleExtra(extra)}
                        />
                        {extra}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="cancel-btn" type="button" onClick={closeItemModal}>
                  {translations.cancel}
                </button>
                <button className="confirm-btn" type="button" onClick={confirmAdd}>
                  {translations.addToCart}
                </button>
              </div>
            </div>
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
                  <div key={item.id} className="menu-item" onClick={() => openItemModal(item)}>
                    <img src={item.image} alt={item.name} className="menu-item-image" />
                    <h3>{item.name}</h3>
                    <p className="price">${item.price.toFixed(2)}</p>
                    <button className="add-btn" type="button">{translations.addToCart}</button>
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