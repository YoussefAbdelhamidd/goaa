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
  size?: string;
  extras?: string[];
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
  // Hot Drinks
  { id: 1, name: 'Tea', price: 28, image: 'https://loremflickr.com/200/200/black,tea,cup?lock=101', category: 'HotDrinks' },
  { id: 2, name: 'Milk Tea', price: 43, image: 'https://loremflickr.com/200/200/milk,tea,chai?lock=102', category: 'HotDrinks' },
  { id: 3, name: 'Zarda', price: 33, image: 'https://loremflickr.com/200/200/saffron,drink?lock=103', category: 'HotDrinks' },
  { id: 4, name: 'Green Tea', price: 33, image: 'https://loremflickr.com/200/200/green,tea?lock=104', category: 'HotDrinks' },
  { id: 5, name: 'Fruit Tea', price: 45, image: 'https://loremflickr.com/200/200/fruit,tea?lock=105', category: 'HotDrinks' },
  { id: 6, name: 'Herbal Tea', price: 33, image: 'https://loremflickr.com/200/200/herbal,tea?lock=106', category: 'HotDrinks' },
  { id: 7, name: 'Hot Cider', price: 60, image: 'https://loremflickr.com/200/200/apple,cider,hot?lock=107', category: 'HotDrinks' },
  // Coffee
  { id: 8, name: 'Turkish Coffee (Single)', price: 38, image: 'https://loremflickr.com/200/200/turkish,coffee?lock=108', category: 'Coffee' },
  { id: 9, name: 'Turkish Coffee (Double)', price: 58, image: 'https://loremflickr.com/200/200/turkish,coffee,cup?lock=109', category: 'Coffee' },
  { id: 10, name: 'French Coffee', price: 58, image: 'https://loremflickr.com/200/200/french,press,coffee?lock=110', category: 'Coffee' },
  { id: 11, name: 'Hazelnut Coffee', price: 68, image: 'https://loremflickr.com/200/200/hazelnut,coffee?lock=111', category: 'Coffee' },
  { id: 12, name: 'Nutella Coffee', price: 68, image: 'https://loremflickr.com/200/200/nutella,coffee,chocolate?lock=112', category: 'Coffee' },
  { id: 13, name: 'Nescafe', price: 58, image: 'https://loremflickr.com/200/200/instant,coffee,nescafe?lock=113', category: 'Coffee' },
  // Espresso
  { id: 14, name: 'Espresso (Single)', price: 50, image: 'https://loremflickr.com/200/200/espresso,shot?lock=114', category: 'Espresso' },
  { id: 15, name: 'Espresso (Double)', price: 70, image: 'https://loremflickr.com/200/200/espresso,double?lock=115', category: 'Espresso' },
  { id: 16, name: 'Macchiato (Single)', price: 50, image: 'https://loremflickr.com/200/200/macchiato,coffee?lock=116', category: 'Espresso' },
  { id: 17, name: 'Macchiato (Double)', price: 70, image: 'https://loremflickr.com/200/200/macchiato,espresso?lock=117', category: 'Espresso' },
  { id: 18, name: 'Cortado', price: 80, image: 'https://loremflickr.com/200/200/cortado,coffee?lock=118', category: 'Espresso' },
  { id: 19, name: 'Cappuccino', price: 85, image: 'https://loremflickr.com/200/200/cappuccino,foam?lock=119', category: 'Espresso' },
  { id: 20, name: 'Latte', price: 80, image: 'https://loremflickr.com/200/200/latte,art?lock=120', category: 'Espresso' },
  { id: 21, name: 'Flat White', price: 90, image: 'https://loremflickr.com/200/200/flat,white,coffee?lock=121', category: 'Espresso' },
  { id: 22, name: 'Mocha', price: 90, image: 'https://loremflickr.com/200/200/mocha,coffee?lock=122', category: 'Espresso' },
  { id: 23, name: 'American Coffee', price: 80, image: 'https://loremflickr.com/200/200/americano,coffee?lock=123', category: 'Espresso' },
  // Ice Coffee
  { id: 24, name: 'Ice Latte', price: 90, image: 'https://loremflickr.com/200/200/iced,latte?lock=124', category: 'IceCoffee' },
  { id: 25, name: 'Ice Cappuccino', price: 90, image: 'https://loremflickr.com/200/200/iced,cappuccino?lock=125', category: 'IceCoffee' },
  { id: 26, name: 'Ice Americano', price: 90, image: 'https://loremflickr.com/200/200/iced,americano?lock=126', category: 'IceCoffee' },
  { id: 27, name: 'Ice Flat White', price: 90, image: 'https://loremflickr.com/200/200/iced,coffee,white?lock=127', category: 'IceCoffee' },
  { id: 28, name: 'Ice Mocha', price: 100, image: 'https://loremflickr.com/200/200/iced,mocha,chocolate?lock=128', category: 'IceCoffee' },
  { id: 29, name: 'Ice Spanish Latte', price: 100, image: 'https://loremflickr.com/200/200/iced,spanish,latte?lock=129', category: 'IceCoffee' },
  { id: 30, name: 'Ice Caramel Macchiato', price: 100, image: 'https://loremflickr.com/200/200/caramel,macchiato,iced?lock=130', category: 'IceCoffee' },
  { id: 31, name: 'Frappe', price: 90, image: 'https://loremflickr.com/200/200/frappe,coffee?lock=131', category: 'IceCoffee' },
  { id: 32, name: 'Frappuccino', price: 110, image: 'https://loremflickr.com/200/200/frappuccino,whipped?lock=132', category: 'IceCoffee' },
  // Fresh Juice
  { id: 33, name: 'Mango Juice', price: 80, image: 'https://loremflickr.com/200/200/mango,juice?lock=133', category: 'FreshJuice' },
  { id: 34, name: 'Strawberry Juice', price: 80, image: 'https://loremflickr.com/200/200/strawberry,juice?lock=134', category: 'FreshJuice' },
  { id: 35, name: 'Guava Juice', price: 80, image: 'https://loremflickr.com/200/200/guava,juice?lock=135', category: 'FreshJuice' },
  { id: 36, name: 'Watermelon Juice', price: 80, image: 'https://loremflickr.com/200/200/watermelon,juice?lock=136', category: 'FreshJuice' },
  { id: 37, name: 'Orange Juice', price: 80, image: 'https://loremflickr.com/200/200/orange,juice?lock=137', category: 'FreshJuice' },
  { id: 38, name: 'Lemon Juice', price: 65, image: 'https://loremflickr.com/200/200/lemon,juice?lock=138', category: 'FreshJuice' },
  { id: 39, name: 'Lemon Mint', price: 75, image: 'https://loremflickr.com/200/200/lemon,mint,drink?lock=139', category: 'FreshJuice' },
  // Mojito
  { id: 40, name: 'Peach Mojito', price: 90, image: 'https://loremflickr.com/200/200/peach,mojito?lock=140', category: 'Mojito' },
  { id: 41, name: 'Strawberry Mojito', price: 90, image: 'https://loremflickr.com/200/200/strawberry,mojito?lock=141', category: 'Mojito' },
  { id: 42, name: 'Classic Mojito', price: 90, image: 'https://loremflickr.com/200/200/classic,mojito,mint?lock=142', category: 'Mojito' },
  { id: 43, name: 'Mango Mojito', price: 90, image: 'https://loremflickr.com/200/200/mango,mojito?lock=143', category: 'Mojito' },
  { id: 44, name: 'Pineapple Mojito', price: 90, image: 'https://loremflickr.com/200/200/pineapple,mojito?lock=144', category: 'Mojito' },
  { id: 45, name: 'Blueberry Mojito', price: 90, image: 'https://loremflickr.com/200/200/blueberry,mojito?lock=145', category: 'Mojito' },
  { id: 46, name: 'Watermelon Mojito', price: 90, image: 'https://loremflickr.com/200/200/watermelon,mojito?lock=146', category: 'Mojito' },
  { id: 47, name: 'Blue Passion Mojito', price: 90, image: 'https://loremflickr.com/200/200/blue,cocktail,mojito?lock=147', category: 'Mojito' },
  // Energy
  { id: 48, name: 'Blueberry Energy', price: 100, image: 'https://loremflickr.com/200/200/blueberry,energy,drink?lock=148', category: 'Energy' },
  { id: 49, name: 'Strawberry Energy', price: 100, image: 'https://loremflickr.com/200/200/strawberry,energy,drink?lock=149', category: 'Energy' },
  { id: 50, name: 'Watermelon Energy', price: 100, image: 'https://loremflickr.com/200/200/watermelon,energy,drink?lock=150', category: 'Energy' },
  { id: 51, name: 'Peach Energy', price: 100, image: 'https://loremflickr.com/200/200/peach,energy,drink?lock=151', category: 'Energy' },
  { id: 52, name: 'Passion Energy', price: 100, image: 'https://loremflickr.com/200/200/passion,fruit,energy?lock=152', category: 'Energy' },
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
    quantity: 'Quantity',
    size: 'Size',
    extras: 'Extras',
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
      HotDrinks: 'Hot Drinks',
      Coffee: 'Coffee',
      Espresso: 'Espresso',
      IceCoffee: 'Ice Coffee',
      FreshJuice: 'Fresh Juice',
      Mojito: 'Mojito',
      Energy: 'Energy',
    },
    menuItems: {
      1: 'Tea',
      2: 'Milk Tea',
      3: 'Zarda',
      4: 'Green Tea',
      5: 'Fruit Tea',
      6: 'Herbal Tea',
      7: 'Hot Cider',
      8: 'Turkish Coffee (Single)',
      9: 'Turkish Coffee (Double)',
      10: 'French Coffee',
      11: 'Hazelnut Coffee',
      12: 'Nutella Coffee',
      13: 'Nescafe',
      14: 'Espresso (Single)',
      15: 'Espresso (Double)',
      16: 'Macchiato (Single)',
      17: 'Macchiato (Double)',
      18: 'Cortado',
      19: 'Cappuccino',
      20: 'Latte',
      21: 'Flat White',
      22: 'Mocha',
      23: 'American Coffee',
      24: 'Ice Latte',
      25: 'Ice Cappuccino',
      26: 'Ice Americano',
      27: 'Ice Flat White',
      28: 'Ice Mocha',
      29: 'Ice Spanish Latte',
      30: 'Ice Caramel Macchiato',
      31: 'Frappe',
      32: 'Frappuccino',
      33: 'Mango Juice',
      34: 'Strawberry Juice',
      35: 'Guava Juice',
      36: 'Watermelon Juice',
      37: 'Orange Juice',
      38: 'Lemon Juice',
      39: 'Lemon Mint',
      40: 'Peach Mojito',
      41: 'Strawberry Mojito',
      42: 'Classic Mojito',
      43: 'Mango Mojito',
      44: 'Pineapple Mojito',
      45: 'Blueberry Mojito',
      46: 'Watermelon Mojito',
      47: 'Blue Passion Mojito',
      48: 'Blueberry Energy',
      49: 'Strawberry Energy',
      50: 'Watermelon Energy',
      51: 'Peach Energy',
      52: 'Passion Energy',
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
    quantity: 'الكمية',
    size: 'الحجم',
    extras: 'إضافات',
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
      HotDrinks: 'مشروبات ساخنة',
      Coffee: 'قهوة',
      Espresso: 'إسبريسو',
      IceCoffee: 'قهوة مثلجة',
      FreshJuice: 'عصائر طازجة',
      Mojito: 'موهيتو',
      Energy: 'مشروبات طاقة',
    },
    menuItems: {
      1: 'شاي',
      2: 'شاي بحليب',
      3: 'زرده',
      4: 'شاي أخضر',
      5: 'شاي فواكه',
      6: 'أعشاب',
      7: 'هوت سيدر',
      8: 'قهوة تركي (فردي)',
      9: 'قهوة تركي (دوبل)',
      10: 'قهوة فرنساوي',
      11: 'قهوة بندق',
      12: 'قهوة نوتيلا',
      13: 'نسكافيه',
      14: 'إسبريسو (فردي)',
      15: 'إسبريسو (دوبل)',
      16: 'ماكياتو (فردي)',
      17: 'ماكياتو (دوبل)',
      18: 'كورتادو',
      19: 'كابتشينو',
      20: 'لاتيه',
      21: 'فلات وايت',
      22: 'موكا',
      23: 'قهوة أمريكية',
      24: 'آيس لاتيه',
      25: 'آيس كابتشينو',
      26: 'آيس أمريكانو',
      27: 'آيس فلات وايت',
      28: 'آيس موكا',
      29: 'آيس سبانيش لاتيه',
      30: 'آيس كراميل ماكياتو',
      31: 'فرابيه',
      32: 'فرابتشينو',
      33: 'عصير مانجا',
      34: 'عصير فراولة',
      35: 'عصير جوافة',
      36: 'عصير بطيخ',
      37: 'عصير برتقال',
      38: 'عصير ليمون',
      39: 'ليمون بالنعناع',
      40: 'موهيتو خوخ',
      41: 'موهيتو فراولة',
      42: 'موهيتو كلاسيك',
      43: 'موهيتو مانجا',
      44: 'موهيتو أناناس',
      45: 'موهيتو بلوبيري',
      46: 'موهيتو بطيخ',
      47: 'موهيتو بلو باشون',
      48: 'إنرجي بلوبيري',
      49: 'إنرجي فراولة',
      50: 'إنرجي بطيخ',
      51: 'إنرجي خوخ',
      52: 'إنرجي باشون',
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

  const areExtrasEqual = (a?: string[], b?: string[]) => {
    if (!a && !b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.slice().sort().join(',') === b.slice().sort().join(',');
  };

  const addToCart = (
    item: MenuItem,
    quantity: number = 1,
    size?: string,
    extras?: string[]
  ) => {
    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) =>
        cartItem.id === item.id &&
        cartItem.size === size &&
        areExtrasEqual(cartItem.extras, extras)
      );

      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem === existing
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity, size, extras }];
    });
  };

  const removeFromCart = (item: CartItem) => {
    setCart((prevCart) =>
      prevCart
        .map((cartItem) =>
          cartItem.id === item.id &&
          cartItem.size === item.size &&
          areExtrasEqual(cartItem.extras, item.extras)
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
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
        <Login onLogin={handleLogin} onToggleLanguage={toggleLanguage} language={language} translations={t} />
      )}
    </div>
  );
}

export default App;
