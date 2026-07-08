import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/Main logo.png';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  available?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  extras?: string[];
}

interface CashierViewProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem, quantity?: number, extras?: string[]) => void;
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
    extras: string;
    cancel: string;
    categories: {
      [key: string]: string;
    };
    editingOrder: string;
  };
}

const EXTRA_OPTIONS = [
  { name: 'Milk', price: 20 },
  { name: 'Sauce', price: 20 },
  { name: 'Ice Cream', price: 15 },
];

const extrasTotal = (extras?: string[]) =>
  (extras || []).reduce((sum, extraName) => {
    const extra = EXTRA_OPTIONS.find((option) => option.name === extraName);
    return sum + (extra ? extra.price : 0);
  }, 0);

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
  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(groupedItems);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(categories[0] || '');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Refs for scrolling
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryButtonsRowRef = useRef<HTMLDivElement | null>(null);
  const menuGridRef = useRef<HTMLDivElement | null>(null);

  // Highlight the category tab for whichever section is scrolled near the top of the menu
  useEffect(() => {
    const container = menuGridRef.current;
    if (!container) return;

    const updateActiveCategory = () => {
      const containerTop = container.getBoundingClientRect().top;
      let current = categories[0];
      for (const category of categories) {
        const section = categoryRefs.current[category];
        if (!section) continue;
        const sectionTop = section.getBoundingClientRect().top - containerTop;
        if (sectionTop <= 80) {
          current = category;
        } else {
          break;
        }
      }
      setActiveCategory((prev) => (prev === current ? prev : current));
    };

    updateActiveCategory();
    container.addEventListener('scroll', updateActiveCategory, { passive: true });
    return () => container.removeEventListener('scroll', updateActiveCategory);
  }, [menuItems]);

  // Keep the active tab scrolled into view within the horizontal tab bar
  useEffect(() => {
    const row = categoryButtonsRowRef.current;
    const btn = categoryBtnRefs.current[activeCategory];
    if (!row || !btn) return;

    const rowRect = row.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset = btnRect.left - rowRect.left - (row.clientWidth - btn.clientWidth) / 2;
    row.scrollTo({ left: row.scrollLeft + offset, behavior: 'smooth' });
  }, [activeCategory]);

  const openItemModal = (item: MenuItem) => {
    if (item.available === false) return;
    setSelectedItem(item);
    setSelectedQuantity(1);
    setSelectedExtras([]);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setSelectedQuantity(1);
    setSelectedExtras([]);
  };

  const toggleExtra = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((item) => item !== extra) : [...prev, extra]
    );
  };

  const confirmAdd = () => {
    if (!selectedItem) return;
    const unitPrice = selectedItem.price + extrasTotal(selectedExtras);
    onAddToCart({ ...selectedItem, price: unitPrice }, selectedQuantity, selectedExtras);
    closeItemModal();
  };

  const scrollToTop = () => {
    menuGridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = categoryRefs.current[category];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        <div className="cart-summary-strip">
          <div>
            <span>Items</span>
            <strong>{cartQuantity}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>EGP{total.toFixed(2)}</strong>
          </div>
        </div>
        {cart.length === 0 ? (
          <p className="empty-cart">{translations.emptyCart}</p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.extras?.join('_') || ''}`}
                className="cart-item"
              >
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  {item.extras && item.extras.length > 0 && (
                    <p>
                      Extras:{' '}
                      {item.extras
                        .map((extraName) => {
                          const extra = EXTRA_OPTIONS.find((option) => option.name === extraName);
                          return extra ? `${extra.name} (+EGP${extra.price})` : extraName;
                        })
                        .join(', ')}
                    </p>
                  )}
                  <p>EGP{item.price.toFixed(2)} each</p>
                  <div className="cart-item-quantity">
                    <span>Qty: {item.quantity}</span>
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => onAddToCart(item, 1, item.extras)}
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
                    Subtotal: EGP{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="cart-total">
            <h3>{translations.total}: EGP{total.toFixed(2)}</h3>
            <button className="checkout-btn" onClick={onCheckout}>{translations.checkout}</button>
          </div>
        )}
        {selectedItem && (
          <div className="modal-overlay" onClick={closeItemModal}>
            <div className="modal-content item-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="item-modal-close"
                type="button"
                onClick={closeItemModal}
                aria-label="Close"
              >
                ×
              </button>
              <div className="item-modal-hero">
                <img src={selectedItem.image} alt={selectedItem.name} className="item-modal-image" />
              </div>
              <div className="item-modal-body">
                <div className="item-modal-heading">
                  <h3>{selectedItem.name}</h3>
                  <span className="item-modal-price">EGP{selectedItem.price.toFixed(2)}</span>
                </div>
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
                    <label>{translations.extras}</label>
                    <div className="pill-group">
                      {EXTRA_OPTIONS.map((extra) => (
                        <button
                          key={extra.name}
                          type="button"
                          className={`pill-option ${selectedExtras.includes(extra.name) ? 'selected' : ''}`}
                          onClick={() => toggleExtra(extra.name)}
                        >
                          {extra.name} <span className="pill-option-price">+EGP{extra.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="item-modal-footer">
                  <div className="item-modal-total">
                    <span>{translations.total}</span>
                    <strong>
                      EGP{((selectedItem.price + extrasTotal(selectedExtras)) * selectedQuantity).toFixed(2)}
                    </strong>
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
            </div>
          </div>
        )}
      </div>
      <div className="menu-section">
        <div className="menu-topbar">
          <div>
            <span>Current menu</span>
            <h2>{translations.menu}</h2>
          </div>
          <strong>{menuItems.length} items</strong>
        </div>
        <div className="category-buttons" ref={categoryButtonsRowRef}>
          {categories.map((category) => (
            <button
              key={category}
              ref={(el) => { categoryBtnRefs.current[category] = el; }}
              onClick={() => scrollToCategory(category)}
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
            >
              {translations.categories[category]}
            </button>
          ))}
        </div>
        <div className="menu-grid" ref={menuGridRef}>
          {categories.map((category) => (
            <div
              key={category}
              ref={(el) => { categoryRefs.current[category] = el; }}
              className="category-section"
            >
              <h3 className="category-title">{translations.categories[category]}</h3>
              <div className="category-items">
                {groupedItems[category].map((item) => {
                  const isOutOfStock = item.available === false;
                  return (
                  <div
                    key={item.id}
                    className={`menu-item ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => openItemModal(item)}
                    aria-disabled={isOutOfStock}
                  >
                    <img src={item.image} alt={item.name} className="menu-item-image" />
                    {isOutOfStock && <span className="stock-badge">Out of stock</span>}
                    <h3>{item.name}</h3>
                    <p className="price">EGP{item.price.toFixed(2)}</p>
                    <button className="add-btn" type="button" disabled={isOutOfStock}>
                      {isOutOfStock ? 'Out of stock' : translations.addToCart}
                    </button>
                  </div>
                  );
                })}
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
