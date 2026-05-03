import { useState, useEffect } from 'react';
import Login from './components/Login';
import CashierView from './components/CashierView';
import OrdersView from './components/OrdersView';
import './App.css';

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

const menuItems: MenuItem[] = [
  { id: 1, name: 'Coffee', price: 2.5, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&h=150&fit=crop', category: 'Beverages' },
  { id: 2, name: 'Tea', price: 2.0, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&h=150&fit=crop', category: 'Beverages' },
  { id: 3, name: 'Sandwich', price: 5.0, image: 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?w=150&h=150&fit=crop', category: 'Food' },
  { id: 4, name: 'Cake', price: 3.5, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&h=150&fit=crop', category: 'Food' },
  { id: 5, name: 'Juice', price: 3.0, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=150&h=150&fit=crop', category: 'Beverages' },
];

const translations = {
  en: {
    login: 'Login',
    number: 'Number',
    password: 'Password',
    initialDrawer: 'Initial Drawer Amount ($)',
    cart: 'Cart',
    menu: 'Menu',
    total: 'Total',
    checkout: 'Checkout',
    remove: 'Remove',
    addToCart: 'Add to Cart',
    emptyCart: 'No items in cart',
    orders: 'Orders',
    orderId: 'Order ID',
    date: 'Date',
    status: 'Status',
    pending: 'Pending',
    paid: 'Paid',
    pay: 'Pay',
    noOrders: 'No orders found',
    table: 'Table',
    toGo: 'To Go',
    selectTable: 'Select Table',
    selectOption: 'Select Option',
    addItems: 'Add Items',
    editingOrder: 'Editing Current Order',
    orderManagement: 'Order Management',
    orderInstructions: 'Click on pending orders to mark as paid and print receipt.',
    paymentNote: 'All payments are processed as cash transactions.',
    cancel: 'Cancel',
    cafeReceipt: 'Cafe Receipt',
    orderNumber: 'Order #',
    paymentCash: 'Payment: Cash',
    thankYou: 'Thank you for your visit!',
    occupied: 'Occupied',
    logout: 'Logout',
    finalDrawer: 'Final Drawer Amount ($)',
    shiftSummary: 'Shift Summary',
    shiftStart: 'Shift Start',
    shiftEnd: 'Shift End',
    initialAmount: 'Initial Amount',
    finalAmount: 'Final Amount',
    totalSales: 'Total Sales',
    expectedDrawer: 'Expected Drawer',
    difference: 'Difference',
    categories: {
      Beverages: 'Beverages',
      Food: 'Food',
    },
    menuItems: {
      1: 'Coffee',
      2: 'Tea',
      3: 'Sandwich',
      4: 'Cake',
      5: 'Juice',
    },
  },
  ar: {
    login: 'تسجيل الدخول',
    number: 'الرقم',
    password: 'كلمة المرور',
    initialDrawer: 'مبلغ الدرج الأولي ($)',
    cart: 'السلة',
    menu: 'القائمة',
    total: 'المجموع',
    checkout: 'الدفع',
    remove: 'إزالة',
    addToCart: 'إضافة إلى السلة',
    emptyCart: 'لا توجد عناصر في السلة',
    orders: 'الطلبات',
    orderId: 'رقم الطلب',
    date: 'التاريخ',
    status: 'الحالة',
    pending: 'في الانتظار',
    paid: 'مدفوع',
    pay: 'دفع',
    noOrders: 'لا توجد طلبات',
    table: 'الطاولة',
    toGo: 'سفري',
    selectTable: 'اختر الطاولة',
    selectOption: 'اختر الخيار',
    addItems: 'إضافة عناصر',
    editingOrder: 'تعديل الطلب الحالي',
    orderManagement: 'إدارة الطلبات',
    orderInstructions: 'انقر على الطلبات المعلقة لتحديثها كمدفوعة وطباعة الإيصال.',
    paymentNote: 'جميع المدفوعات تتم نقدًا.',
    cancel: 'إلغاء',
    cafeReceipt: 'إيصال المقهى',
    orderNumber: 'رقم الطلب',
    paymentCash: 'الدفع: نقدي',
    thankYou: 'شكرًا لزيارتكم!',
    occupied: 'مشغول',
    logout: 'تسجيل الخروج',
    finalDrawer: 'مبلغ الدرج النهائي ($)',
    shiftSummary: 'ملخص الوردية',
    shiftStart: 'بداية الوردية',
    shiftEnd: 'نهاية الوردية',
    initialAmount: 'المبلغ الأولي',
    finalAmount: 'المبلغ النهائي',
    totalSales: 'إجمالي المبيعات',
    expectedDrawer: 'الدرج المتوقع',
    difference: 'الفرق',
    categories: {
      Beverages: 'المشروبات',
      Food: 'الطعام',
    },
    menuItems: {
      1: 'قهوة',
      2: 'شاي',
      3: 'ساندويتش',
      4: 'كعكة',
      5: 'عصير',
    },
  },
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | 'to-go' | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [drawerAmount, setDrawerAmount] = useState<number>(0);
  const [shiftStartTime, setShiftStartTime] = useState<number | null>(null);
  const [cashierId, setCashierId] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [finalDrawerAmount, setFinalDrawerAmount] = useState('');

  const t = translations[language];

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('cafeOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  const handleLogin = (number: string, password: string, initialDrawer: number) => {
    // Simple validation: just check if both are provided
    if (number && password) {
      setIsLoggedIn(true);
      setDrawerAmount(initialDrawer);
      setShiftStartTime(Date.now());
      setCashierId(number);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const toggleOrdersView = () => {
    setShowOrders(!showOrders);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    const finalAmount = parseFloat(finalDrawerAmount);
    if (isNaN(finalAmount) || finalAmount < 0) return;

    const shiftEndTime = Date.now();
    const paidOrders = orders.filter(order => order.status === 'paid');
    const totalSales = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const initialDrawer = drawerAmount - totalSales; // Calculate initial amount
    const expectedDrawer = initialDrawer + totalSales;
    const difference = finalAmount - expectedDrawer;

    const shiftData = {
      cashierId,
      shiftStart: shiftStartTime,
      shiftEnd: shiftEndTime,
      initialDrawer,
      finalDrawer: finalAmount,
      totalSales,
      expectedDrawer,
      difference,
      ordersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      date: new Date().toISOString().split('T')[0],
    };

    // Save shift data locally
    const existingShifts = JSON.parse(localStorage.getItem('cafeShifts') || '[]');
    existingShifts.push(shiftData);
    localStorage.setItem('cafeShifts', JSON.stringify(existingShifts));

    // Reset state
    setIsLoggedIn(false);
    setCart([]);
    setOrders([]);
    setDrawerAmount(0);
    setShiftStartTime(null);
    setCashierId('');
    setShowLogoutModal(false);
    setFinalDrawerAmount('');
    setShowOrders(false);
    setEditingOrderId(null);
  };

  const saveOrder = () => {
    if (cart.length === 0) return;

    if (editingOrderId) {
      // For editing existing orders, directly update without showing modal
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updatedOrders = orders.map(order =>
        order.id === editingOrderId
          ? { ...order, items: [...cart], total, timestamp: Date.now() }
          : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('cafeOrders', JSON.stringify(updatedOrders));
      setCart([]);
      setEditingOrderId(null);
    } else {
      // For new orders, show the table selection modal
      setShowCheckoutModal(true);
    }
  };

  const confirmCheckout = () => {
    if (!selectedTable) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (editingOrderId) {
      // Update existing order
      const updatedOrders = orders.map(order =>
        order.id === editingOrderId
          ? { ...order, items: [...cart], total, timestamp: Date.now() }
          : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('cafeOrders', JSON.stringify(updatedOrders));
      setEditingOrderId(null);
    } else {
      // Create new order
      const newOrder: Order = {
        id: Date.now().toString(),
        items: [...cart],
        total,
        timestamp: Date.now(),
        status: 'pending',
        table: selectedTable,
      };

      const updatedOrders = [...orders, newOrder];
      setOrders(updatedOrders);
      localStorage.setItem('cafeOrders', JSON.stringify(updatedOrders));
    }

    setCart([]); // Clear cart after checkout
    setShowCheckoutModal(false);
    setSelectedTable(null);
  };

  const payOrder = (orderId: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: 'paid' as const } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('cafeOrders', JSON.stringify(updatedOrders));

    // Add payment to drawer
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setDrawerAmount(prev => prev + order.total);
      printReceipt(order);
    }
  };

  const addItemsToOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setCart(order.items);
      setEditingOrderId(orderId);
      setShowOrders(false);
    }
  };

  const printReceipt = (order: Order) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (receiptWindow) {
      const receiptContent = `
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${t.cafeReceipt}</h2>
              <p>${t.orderNumber}${order.id}</p>
              <p>${new Date(order.timestamp).toLocaleString()}</p>
            </div>
            ${order.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total">
              <div class="item">
                <span>${t.total}</span>
                <span>$${order.total.toFixed(2)}</span>
              </div>
            </div>
            <div class="footer">
              <p>${t.paymentCash}</p>
              <p>${t.thankYou}</p>
            </div>
          </body>
        </html>
      `;
      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
      receiptWindow.print();
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const translatedMenuItems = menuItems.map(item => ({
    ...item,
    name: t.menuItems[item.id as keyof typeof t.menuItems],
  }));

  const CheckoutModal = () => {
    // Get tables that have pending orders
    const occupiedTables = orders
      .filter(order => order.status === 'pending' && typeof order.table === 'number')
      .map(order => order.table as number);

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>{t.selectOption}</h3>
          <div className="table-options">
            <button
              className={`table-option ${selectedTable === 'to-go' ? 'selected' : ''}`}
              onClick={() => setSelectedTable('to-go')}
            >
              {t.toGo}
            </button>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(tableNum => {
              const isOccupied = occupiedTables.includes(tableNum);
              return (
                <button
                  key={tableNum}
                  className={`table-option ${selectedTable === tableNum ? 'selected' : ''} ${isOccupied ? 'disabled' : ''}`}
                  onClick={() => !isOccupied && setSelectedTable(tableNum)}
                  disabled={isOccupied}
                >
                  {t.table} {tableNum}
                  {isOccupied && <span className="occupied-indicator"> ({t.occupied})</span>}
                </button>
              );
            })}
          </div>
          <div className="modal-buttons">
            <button className="cancel-btn" onClick={() => setShowCheckoutModal(false)}>
              {t.cancel}
            </button>
            <button
              className="confirm-btn"
              onClick={confirmCheckout}
              disabled={!selectedTable}
            >
              {t.checkout}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LogoutModal = () => {
    const paidOrders = orders.filter(order => order.status === 'paid');
    const totalSales = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const initialDrawer = drawerAmount - totalSales;
    const expectedDrawer = initialDrawer + totalSales;

    return (
      <div className="modal-overlay">
        <div className="modal-content logout-modal">
          <h3>{t.shiftSummary}</h3>
          <div className="shift-summary">
            <div className="summary-row">
              <span>{t.shiftStart}:</span>
              <span>{shiftStartTime ? new Date(shiftStartTime).toLocaleString() : ''}</span>
            </div>
            <div className="summary-row">
              <span>{t.shiftEnd}:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>{t.initialAmount}:</span>
              <span>${initialDrawer.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t.totalSales}:</span>
              <span>${totalSales.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t.expectedDrawer}:</span>
              <span>${expectedDrawer.toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="final-drawer-input">
              <label>{t.finalDrawer}:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalDrawerAmount}
                onChange={(e) => setFinalDrawerAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="modal-buttons">
            <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>
              {t.cancel}
            </button>
            <button
              className="confirm-btn"
              onClick={confirmLogout}
              disabled={!finalDrawerAmount}
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {showCheckoutModal && <CheckoutModal />}
      {showLogoutModal && <LogoutModal />}
      {isLoggedIn ? (
        showOrders ? (
          <OrdersView
            orders={orders}
            onPayOrder={payOrder}
            onBack={() => setShowOrders(false)}
            onAddItems={addItemsToOrder}
            onLogout={handleLogout}
            language={language}
            onToggleLanguage={toggleLanguage}
            translations={t}
          />
        ) : (
          <CashierView
            menuItems={translatedMenuItems}
            cart={cart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onCheckout={saveOrder}
            onToggleOrders={toggleOrdersView}
            language={language}
            onToggleLanguage={toggleLanguage}
            translations={t}
            isEditingOrder={!!editingOrderId}
          />
        )
      ) : (
        <Login onLogin={handleLogin} translations={t} />
      )}
    </div>
  );
}

export default App;
