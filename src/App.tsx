import { useState, useEffect} from 'react';
import Login from './components/Login';
import CashierView from './components/CashierView';
import OrdersView from './components/OrdersView';
import AdminDashboard from './components/AdminDashboard';
import InvoiceThankYou from './components/InvoiceThankYou';
import goobaTextLogo from './assets/GOOBA-text.svg';
import { posBackend } from './lib/posBackend';
import type { AppUser, MenuItem, CartItem, Order, PaymentMethod, SaleRecord, ShiftRecord, Offer } from './lib/posTypes';
import './App.css';

const INVOICE_THANKYOU_KEY = 'googleInvoiceThankYouSeen';

const DEFAULT_USERS: AppUser[] = [
  { id: 'admin-omar', username: 'Omar', password: '01277554354', role: 'admin', active: true },
  { id: 'cashier-gooba', username: 'Gooba', password: '01008191994', role: 'cashier', active: true },
  { id: 'cashier-elsos', username: 'Elsos', password: '01226210927', role: 'cashier', active: true },
  { id: 'cashier-mohanad', username: 'Mohanad', password: '01207266413', role: 'cashier', active: true },
];

// Orders paid before payment methods were tracked are treated as cash for drawer math
const isCashPayment = (order: Order) => !order.paymentMethod || order.paymentMethod === 'cash';
const TAX_RATE = 0.14;
const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
const toLocalDateValue = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_MENU_ITEMS: MenuItem[] = [
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
  // Fresh
  { id: 53, name: 'Fresh Peach', price: 70, image: 'https://loremflickr.com/200/200/peach,fresh,drink?lock=153', category: 'Fresh' },
  { id: 54, name: 'Fresh Yogurt', price: 80, image: 'https://loremflickr.com/200/200/yogurt,drink?lock=154', category: 'Fresh' },
  // Milk Shake
  { id: 55, name: 'Nutella Milkshake', price: 100, image: 'https://loremflickr.com/200/200/nutella,milkshake?lock=155', category: 'MilkShake' },
  { id: 56, name: 'Caramel Milkshake', price: 100, image: 'https://loremflickr.com/200/200/caramel,milkshake?lock=156', category: 'MilkShake' },
  { id: 57, name: 'Lotus Milkshake', price: 100, image: 'https://loremflickr.com/200/200/lotus,milkshake?lock=157', category: 'MilkShake' },
  { id: 58, name: 'Vanilla Milkshake', price: 100, image: 'https://loremflickr.com/200/200/vanilla,milkshake?lock=158', category: 'MilkShake' },
  { id: 59, name: 'Oreo Milkshake', price: 100, image: 'https://loremflickr.com/200/200/oreo,milkshake?lock=159', category: 'MilkShake' },
  { id: 60, name: 'Watermelon Milkshake', price: 90, image: 'https://loremflickr.com/200/200/watermelon,milkshake?lock=160', category: 'MilkShake' },
  { id: 61, name: 'Strawberry Milkshake', price: 90, image: 'https://loremflickr.com/200/200/strawberry,milkshake?lock=161', category: 'MilkShake' },
  { id: 62, name: 'Mango Milkshake', price: 90, image: 'https://loremflickr.com/200/200/mango,milkshake?lock=162', category: 'MilkShake' },
  { id: 63, name: 'Blueberry Milkshake', price: 90, image: 'https://loremflickr.com/200/200/blueberry,milkshake?lock=163', category: 'MilkShake' },
  { id: 64, name: 'Peach Milkshake', price: 90, image: 'https://loremflickr.com/200/200/peach,milkshake?lock=164', category: 'MilkShake' },
  // Ice Tea
  { id: 65, name: 'Lemon Ice Tea', price: 70, image: 'https://loremflickr.com/200/200/lemon,iced,tea?lock=165', category: 'IceTea' },
  { id: 66, name: 'Peach Ice Tea', price: 85, image: 'https://loremflickr.com/200/200/peach,iced,tea?lock=166', category: 'IceTea' },
  { id: 67, name: 'Passion Fruit Ice Tea', price: 85, image: 'https://loremflickr.com/200/200/passion,fruit,iced,tea?lock=167', category: 'IceTea' },
  { id: 68, name: 'Mango Ice Tea', price: 85, image: 'https://loremflickr.com/200/200/mango,iced,tea?lock=168', category: 'IceTea' },
  { id: 69, name: 'Cherry Ice Tea', price: 85, image: 'https://loremflickr.com/200/200/cherry,iced,tea?lock=169', category: 'IceTea' },
  // Smoothies
  { id: 70, name: 'Mango Madness Smoothie', price: 90, image: 'https://loremflickr.com/200/200/mango,smoothie?lock=170', category: 'Smoothies' },
  { id: 71, name: 'Strawberry Blast Smoothie', price: 90, image: 'https://loremflickr.com/200/200/strawberry,smoothie?lock=171', category: 'Smoothies' },
  { id: 72, name: 'Strawberry Banana Smoothie', price: 90, image: 'https://loremflickr.com/200/200/strawberry,banana,smoothie?lock=172', category: 'Smoothies' },
  { id: 73, name: 'Tropical Mix Smoothie', price: 90, image: 'https://loremflickr.com/200/200/tropical,smoothie?lock=173', category: 'Smoothies' },
  { id: 74, name: 'Peach Smoothie', price: 90, image: 'https://loremflickr.com/200/200/peach,smoothie?lock=174', category: 'Smoothies' },
  { id: 75, name: 'Signature Sunset Smoothie', price: 90, image: 'https://loremflickr.com/200/200/sunset,smoothie,fruit?lock=175', category: 'Smoothies' },
  // Soft Drinks
  { id: 76, name: 'Soda Can', price: 45, image: 'https://loremflickr.com/200/200/soda,can?lock=176', category: 'SoftDrinks' },
  { id: 77, name: 'Red Bull', price: 100, image: 'https://loremflickr.com/200/200/red,bull,energy,drink?lock=177', category: 'SoftDrinks' },
  { id: 78, name: 'Water', price: 15, image: 'https://loremflickr.com/200/200/water,bottle?lock=178', category: 'SoftDrinks' },
  // Hookah
  { id: 79, name: 'Hookah Pyrex', price: 150, image: 'https://loremflickr.com/200/200/hookah,shisha,glass?lock=179', category: 'Hookah' },
  { id: 80, name: 'Hookah Fakher', price: 80, image: 'https://loremflickr.com/200/200/hookah,shisha?lock=180', category: 'Hookah' },
  { id: 81, name: 'Moasel', price: 20, image: 'https://loremflickr.com/200/200/tobacco,shisha?lock=181', category: 'Hookah' },
  { id: 82, name: 'Moasel Arabi', price: 50, image: 'https://loremflickr.com/200/200/shisha,tobacco,arabic?lock=182', category: 'Hookah' },
];

const translations = {
  en: {
    login: 'Login',
    number: 'Username',
    password: 'Password',
    initialDrawer: 'Initial Drawer Amount (EGP)',
    cart: 'Cart',
    menu: 'Menu',
    regularMenu: 'Regular Menu',
    specialMenu: 'Special Menu',
    total: 'Total',
    checkout: 'Checkout',
    remove: 'Remove',
    addToCart: 'Add to Cart',
    emptyCart: 'No items in cart',
    orders: 'Orders',
    orderId: 'Order ID',
    date: 'Date',
    status: 'Status',
    statusAll: 'All',
    pending: 'Pending',
    paid: 'Paid',
    pay: 'Pay',
    changePaymentMethod: 'Change Payment',
    noOrders: 'No orders found',
    noOrdersForFilter: 'No orders in this status',
    table: 'Table',
    toGo: 'To Go',
    subtotal: 'Subtotal',
    tax: 'Tax',
    includeTax: 'Add 14% Tax',
    selectTable: 'Select Table',
    selectOption: 'Select Option',
    addItems: 'Add Items',
    editingOrder: 'Editing Current Order',
    orderManagement: 'Order Management',
    orderInstructions: 'Click on pending orders to choose a payment method, mark as paid, and print the receipt.',
    paymentNote: 'Only cash payments affect the drawer amount. Card and InstaPay sales are tracked separately.',
    cancel: 'Cancel',
    quantity: 'Quantity',
    extras: 'Extras',
    cafeReceipt: 'Cafe Receipt',
    orderNumber: 'Order #',
    paymentCash: 'Payment: Cash',
    paymentCard: 'Payment: Card',
    paymentInstapay: 'Payment: InstaPay',
    thankYou: 'Thank you for your visit!',
    occupied: 'Occupied',
    logout: 'Logout',
    finalDrawer: 'Final Drawer Amount (EGP)',
    shiftSummary: 'Shift Summary',
    shiftStart: 'Shift Start',
    shiftEnd: 'Shift End',
    initialAmount: 'Initial Amount',
    finalAmount: 'Final Amount',
    totalSales: 'Total Sales',
    expectedDrawer: 'Expected Drawer (Cash)',
    difference: 'Difference',
    selectPaymentMethod: 'Select Payment Method',
    updatePaymentMethod: 'Update Payment Method',
    confirmPayment: 'Confirm Payment',
    cash: 'Cash',
    card: 'Card',
    instapay: 'InstaPay',
    cashSales: 'Cash Sales',
    cardSales: 'Card Sales',
    instapaySales: 'InstaPay Sales',
    categories: {
      HotDrinks: 'Hot Drinks',
      Coffee: 'Coffee',
      Espresso: 'Espresso',
      IceCoffee: 'Ice Coffee',
      FreshJuice: 'Fresh Juice',
      Mojito: 'Mojito',
      Energy: 'Energy',
      Fresh: 'Fresh',
      MilkShake: 'Milk Shake',
      IceTea: 'Ice Tea',
      Smoothies: 'Smoothies',
      SoftDrinks: 'Soft Drinks',
      Hookah: 'Hookah',
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
      53: 'Fresh Peach',
      54: 'Fresh Yogurt',
      55: 'Nutella Milkshake',
      56: 'Caramel Milkshake',
      57: 'Lotus Milkshake',
      58: 'Vanilla Milkshake',
      59: 'Oreo Milkshake',
      60: 'Watermelon Milkshake',
      61: 'Strawberry Milkshake',
      62: 'Mango Milkshake',
      63: 'Blueberry Milkshake',
      64: 'Peach Milkshake',
      65: 'Lemon Ice Tea',
      66: 'Peach Ice Tea',
      67: 'Passion Fruit Ice Tea',
      68: 'Mango Ice Tea',
      69: 'Cherry Ice Tea',
      70: 'Mango Madness Smoothie',
      71: 'Strawberry Blast Smoothie',
      72: 'Strawberry Banana Smoothie',
      73: 'Tropical Mix Smoothie',
      74: 'Peach Smoothie',
      75: 'Signature Sunset Smoothie',
      76: 'Soda Can',
      77: 'Red Bull',
      78: 'Water',
      79: 'Hookah Pyrex',
      80: 'Hookah Fakher',
      81: 'Moasel',
      82: 'Moasel Arabi',
    },
  },
  ar: {
    login: 'تسجيل الدخول',
    number: 'اسم المستخدم',
    password: 'كلمة المرور',
    initialDrawer: 'مبلغ الدرج الأولي (EGP)',
    cart: 'السلة',
    menu: 'القائمة',
    regularMenu: 'القائمة العادية',
    specialMenu: 'القائمة الخاصة',
    total: 'المجموع',
    checkout: 'الدفع',
    remove: 'إزالة',
    addToCart: 'إضافة إلى السلة',
    emptyCart: 'لا توجد عناصر في السلة',
    orders: 'الطلبات',
    orderId: 'رقم الطلب',
    date: 'التاريخ',
    status: 'الحالة',
    statusAll: 'الكل',
    pending: 'في الانتظار',
    paid: 'مدفوع',
    pay: 'دفع',
    changePaymentMethod: 'تغيير الدفع',
    noOrders: 'لا توجد طلبات',
    noOrdersForFilter: 'لا توجد طلبات بهذه الحالة',
    table: 'الطاولة',
    toGo: 'سفري',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    includeTax: 'إضافة ضريبة 14%',
    selectTable: 'اختر الطاولة',
    selectOption: 'اختر الخيار',
    addItems: 'إضافة عناصر',
    editingOrder: 'تعديل الطلب الحالي',
    orderManagement: 'إدارة الطلبات',
    orderInstructions: 'انقر على الطلبات المعلقة لاختيار طريقة الدفع وتحديثها كمدفوعة وطباعة الإيصال.',
    paymentNote: 'المدفوعات النقدية فقط تؤثر على مبلغ الدرج. مبيعات البطاقة وInstaPay يتم تتبعها بشكل منفصل.',
    cancel: 'إلغاء',
    quantity: 'الكمية',
    extras: 'إضافات',
    cafeReceipt: 'إيصال المقهى',
    orderNumber: 'رقم الطلب',
    paymentCash: 'الدفع: نقدي',
    paymentCard: 'الدفع: بطاقة',
    paymentInstapay: 'الدفع: InstaPay',
    thankYou: 'شكرًا لزيارتكم!',
    occupied: 'مشغول',
    logout: 'تسجيل الخروج',
    finalDrawer: 'مبلغ الدرج النهائي (EGP)',
    shiftSummary: 'ملخص الوردية',
    shiftStart: 'بداية الوردية',
    shiftEnd: 'نهاية الوردية',
    initialAmount: 'المبلغ الأولي',
    selectPaymentMethod: 'اختر طريقة الدفع',
    updatePaymentMethod: 'تحديث طريقة الدفع',
    confirmPayment: 'تأكيد الدفع',
    cash: 'نقدي',
    card: 'بطاقة',
    instapay: 'InstaPay',
    cashSales: 'مبيعات نقدية',
    cardSales: 'مبيعات البطاقة',
    instapaySales: 'مبيعات InstaPay',
    finalAmount: 'المبلغ النهائي',
    totalSales: 'إجمالي المبيعات',
    expectedDrawer: 'الدرج المتوقع (نقدي)',
    difference: 'الفرق',
    categories: {
      HotDrinks: 'مشروبات ساخنة',
      Coffee: 'قهوة',
      Espresso: 'إسبريسو',
      IceCoffee: 'قهوة مثلجة',
      FreshJuice: 'عصائر طازجة',
      Mojito: 'موهيتو',
      Energy: 'مشروبات طاقة',
      Fresh: 'فريش',
      MilkShake: 'ميلك شيك',
      IceTea: 'آيس تي',
      Smoothies: 'سموذي',
      SoftDrinks: 'مشروبات غازية',
      Hookah: 'شيشة',
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
      53: 'فريش خوخ',
      54: 'فريش زبادي',
      55: 'ميلك شيك نوتيلا',
      56: 'ميلك شيك كراميل',
      57: 'ميلك شيك لوتس',
      58: 'ميلك شيك فانيليا',
      59: 'ميلك شيك أوريو',
      60: 'ميلك شيك بطيخ',
      61: 'ميلك شيك فراولة',
      62: 'ميلك شيك مانجا',
      63: 'ميلك شيك بلوبيري',
      64: 'ميلك شيك خوخ',
      65: 'آيس تي ليمون',
      66: 'آيس تي خوخ',
      67: 'آيس تي فاكهة العشق',
      68: 'آيس تي مانجا',
      69: 'آيس تي كرز',
      70: 'سموذي مانجا مادنس',
      71: 'سموذي فراولة بلاست',
      72: 'سموذي فراولة وموز',
      73: 'سموذي تروبيكال مكس',
      74: 'سموذي خوخ',
      75: 'سموذي سيجنتشر صانسيت',
      76: 'مشروب غازي',
      77: 'ريد بول',
      78: 'مياه',
      79: 'شيشة بايركس',
      80: 'شيشة فاخر',
      81: 'معسل',
      82: 'معسل عربي',
    },
  },
};

interface CheckoutModalProps {
  orders: Order[];
  selectedTable: number | 'to-go' | null;
  onSelectTable: (table: number | 'to-go') => void;
  onCancel: () => void;
  onConfirm: () => void;
  translations: {
    selectOption: string;
    toGo: string;
    table: string;
    occupied: string;
    cancel: string;
    checkout: string;
  };
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  orders,
  selectedTable,
  onSelectTable,
  onCancel,
  onConfirm,
  translations,
}) => {
  // Get tables that have pending orders
  const occupiedTables = orders
    .filter(order => order.status === 'pending' && typeof order.table === 'number')
    .map(order => order.table as number);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{translations.selectOption}</h3>
        <div className="table-options">
          <button
            className={`table-option ${selectedTable === 'to-go' ? 'selected' : ''}`}
            onClick={() => onSelectTable('to-go')}
          >
            {translations.toGo}
          </button>
          {Array.from({ length: 15 }, (_, i) => i + 1).map(tableNum => {
            const isOccupied = occupiedTables.includes(tableNum);
            return (
              <button
                key={tableNum}
                className={`table-option ${selectedTable === tableNum ? 'selected' : ''} ${isOccupied ? 'disabled' : ''}`}
                onClick={() => !isOccupied && onSelectTable(tableNum)}
                disabled={isOccupied}
              >
                {translations.table} {tableNum}
                {isOccupied && <span className="occupied-indicator"> ({translations.occupied})</span>}
              </button>
            );
          })}
        </div>
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            {translations.cancel}
          </button>
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={!selectedTable}
          >
            {translations.checkout}
          </button>
        </div>
      </div>
    </div>
  );
};

interface LogoutModalProps {
  initialDrawerAmount: number;
  orders: Order[];
  shiftStartTime: number | null;
  finalDrawerAmount: string;
  onFinalDrawerAmountChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  translations: {
    shiftSummary: string;
    shiftStart: string;
    shiftEnd: string;
    initialAmount: string;
    totalSales: string;
    cashSales: string;
    cardSales: string;
    instapaySales: string;
    expectedDrawer: string;
    finalDrawer: string;
    cancel: string;
    logout: string;
  };
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  initialDrawerAmount,
  orders,
  shiftStartTime,
  finalDrawerAmount,
  onFinalDrawerAmountChange,
  onCancel,
  onConfirm,
  translations,
}) => {
  const paidOrders = orders.filter(order => order.status === 'paid');
  const cashSales = paidOrders.filter(isCashPayment).reduce((sum, order) => sum + order.total, 0);
  const cardSales = paidOrders.filter(order => order.paymentMethod === 'card').reduce((sum, order) => sum + order.total, 0);
  const instapaySales = paidOrders.filter(order => order.paymentMethod === 'instapay').reduce((sum, order) => sum + order.total, 0);
  const totalSales = cashSales + cardSales + instapaySales;
  const expectedDrawer = initialDrawerAmount + cashSales;

  return (
    <div className="modal-overlay">
      <div className="modal-content logout-modal">
        <h3>{translations.shiftSummary}</h3>
        <div className="shift-summary">
          <div className="summary-row">
            <span>{translations.shiftStart}:</span>
            <span>{shiftStartTime ? new Date(shiftStartTime).toLocaleString() : ''}</span>
          </div>
          <div className="summary-row">
            <span>{translations.shiftEnd}:</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>{translations.initialAmount}:</span>
            <span>EGP{initialDrawerAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>{translations.cashSales}:</span>
            <span>EGP{cashSales.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>{translations.cardSales}:</span>
            <span>EGP{cardSales.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>{translations.instapaySales}:</span>
            <span>EGP{instapaySales.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>{translations.totalSales}:</span>
            <span>EGP{totalSales.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>{translations.expectedDrawer}:</span>
            <span>EGP{expectedDrawer.toFixed(2)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="final-drawer-input">
            <label>{translations.finalDrawer}:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={finalDrawerAmount}
              onChange={(e) => onFinalDrawerAmountChange(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            {translations.cancel}
          </button>
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={!finalDrawerAmount}
          >
            {translations.logout}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminLoginModalProps {
  username: string;
  onUsernameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  error: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  cancelLabel: string;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  error,
  onCancel,
  onSubmit,
  cancelLabel,
}) => (
  <div className="modal-overlay admin-login-overlay" onClick={onCancel}>
    <div className="modal-content admin-login-modal" onClick={(e) => e.stopPropagation()}>
      <div className="admin-login-heading">
        <span className="admin-login-kicker">Restricted access</span>
        <h3>Admin Login</h3>
      </div>
      <form className="admin-login-form" onSubmit={onSubmit}>
        <div className="admin-field">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoFocus
          />
        </div>
        <div className="admin-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
        </div>
        {error && <p className="admin-login-error">Incorrect username or password.</p>}
        <div className="modal-buttons">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="submit" className="confirm-btn">
            Login
          </button>
        </div>
      </form>
    </div>
  </div>
);

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
  const [initialDrawerAmount, setInitialDrawerAmount] = useState<number>(0);
  const [shiftStartTime, setShiftStartTime] = useState<number | null>(null);
  const [cashierId, setCashierId] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [finalDrawerAmount, setFinalDrawerAmount] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState(false);
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [menuCatalog, setMenuCatalog] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [showInvoiceThankYou, setShowInvoiceThankYou] = useState(
    () => localStorage.getItem(INVOICE_THANKYOU_KEY) !== '1'
  );

  const t = translations[language];

  const dismissInvoiceThankYou = () => {
    localStorage.setItem(INVOICE_THANKYOU_KEY, '1');
    setShowInvoiceThankYou(false);
  };

  // Resume an active cashier session (and its orders) if one is already open on this device
  useEffect(() => {
    const loadBackendState = async () => {
      const [loadedUsers, loadedMenuItems, loadedOffers, loadedOrders, loadedSales, loadedShifts] =
        await Promise.all([
          posBackend.getUsers(DEFAULT_USERS),
          posBackend.getMenuItems(DEFAULT_MENU_ITEMS),
          posBackend.getOffers(),
          posBackend.getOrders(),
          posBackend.getSales(),
          posBackend.getShifts(),
        ]);

      setUsers(loadedUsers.length ? loadedUsers : DEFAULT_USERS);
      setMenuCatalog(loadedMenuItems.length ? loadedMenuItems : DEFAULT_MENU_ITEMS);
      setOffers(loadedOffers);
      setOrders(loadedOrders);
      setSalesHistory(loadedSales);
      setShifts(loadedShifts);

      const savedSession = localStorage.getItem('cafeActiveSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const cashPaidTotal = loadedOrders
          .filter((order) => order.status === 'paid' && isCashPayment(order))
          .reduce((sum, order) => sum + order.total, 0);
        setIsLoggedIn(true);
        setCashierId(session.cashierId);
        setInitialDrawerAmount(session.initialDrawerAmount);
        setDrawerAmount(session.initialDrawerAmount + cashPaidTotal);
        setShiftStartTime(session.shiftStartTime);
      }
    };

    loadBackendState().catch((error) => {
      console.error('Unable to load backend state', error);
    });
  }, []);

  const handleLogin = (username: string, password: string, initialDrawer: number) => {
    const cashier = users.find((user) =>
      user.username === username &&
      user.password === password &&
      user.role === 'cashier' &&
      user.active
    );
    if (!cashier) {
      return false;
    }
    const shiftStart = Date.now();
    setIsLoggedIn(true);
    setInitialDrawerAmount(initialDrawer);
    setDrawerAmount(initialDrawer);
    setShiftStartTime(shiftStart);
    setCashierId(username);
    localStorage.setItem('cafeActiveSession', JSON.stringify({
      cashierId: username,
      initialDrawerAmount: initialDrawer,
      shiftStartTime: shiftStart,
    }));
    return true;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const openAdminLogin = () => {
    setAdminUsernameInput('');
    setAdminPasswordInput('');
    setAdminError(false);
    setShowAdminLogin(true);
  };

  const submitAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = users.find((user) =>
      user.username === adminUsernameInput &&
      user.password === adminPasswordInput &&
      user.role === 'admin' &&
      user.active
    );
    if (admin) {
      setShowAdminLogin(false);
      setShowAdminDashboard(true);
    } else {
      setAdminError(true);
    }
  };

  const toggleOrdersView = () => {
    setShowOrders(!showOrders);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    const finalAmount = parseFloat(finalDrawerAmount);
    if (isNaN(finalAmount) || finalAmount < 0) return;

    const shiftEndTime = Date.now();
    const paidOrders = orders.filter(order => order.status === 'paid');
    const cashSales = paidOrders.filter(isCashPayment).reduce((sum, order) => sum + order.total, 0);
    const cardSales = paidOrders.filter(order => order.paymentMethod === 'card').reduce((sum, order) => sum + order.total, 0);
    const instapaySales = paidOrders.filter(order => order.paymentMethod === 'instapay').reduce((sum, order) => sum + order.total, 0);
    const totalSales = cashSales + cardSales + instapaySales;
    const expectedDrawer = initialDrawerAmount + cashSales;
    const difference = finalAmount - expectedDrawer;

    const shiftData = {
      cashierId,
      shiftStart: shiftStartTime,
      shiftEnd: shiftEndTime,
      initialDrawer: initialDrawerAmount,
      finalDrawer: finalAmount,
      totalSales,
      cashSales,
      cardSales,
      instapaySales,
      expectedDrawer,
      difference,
      ordersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      date: toLocalDateValue(shiftStartTime ?? shiftEndTime),
    };

    await posBackend.recordShift(shiftData);
    setShifts((prev) => [...prev, shiftData]);

    // End the session so the device is free for the next cashier to log in
    localStorage.removeItem('cafeActiveSession');
    await posBackend.clearOrders();

    // Reset state
    setIsLoggedIn(false);
    setCart([]);
    setOrders([]);
    setDrawerAmount(0);
    setInitialDrawerAmount(0);
    setShiftStartTime(null);
    setCashierId('');
    setShowLogoutModal(false);
    setFinalDrawerAmount('');
    setShowOrders(false);
    setEditingOrderId(null);
  };

  const saveOrder = async () => {
    if (cart.length === 0) return;

    if (editingOrderId) {
      // For editing existing orders, directly update without showing modal
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const now = Date.now();
      const updatedOrders = orders.map(order =>
        order.id === editingOrderId
          ? {
              ...order,
              items: [...cart],
              total,
              timestamp: now,
              businessDate: order.businessDate ?? toLocalDateValue(shiftStartTime ?? now),
            }
          : order
      );
      setOrders(updatedOrders);
      const updatedOrder = updatedOrders.find((order) => order.id === editingOrderId);
      if (updatedOrder) await posBackend.saveOrder(updatedOrder);
      setCart([]);
      setEditingOrderId(null);
    } else {
      // For new orders, show the table selection modal
      setShowCheckoutModal(true);
    }
  };

  const confirmCheckout = async () => {
    if (!selectedTable) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const now = Date.now();
    const businessDate = toLocalDateValue(shiftStartTime ?? now);

    if (editingOrderId) {
      // Update existing order
      const updatedOrders = orders.map(order =>
        order.id === editingOrderId
          ? { ...order, items: [...cart], total, timestamp: now, businessDate: order.businessDate ?? businessDate }
          : order
      );
      setOrders(updatedOrders);
      const updatedOrder = updatedOrders.find((order) => order.id === editingOrderId);
      if (updatedOrder) await posBackend.saveOrder(updatedOrder);
      setEditingOrderId(null);
    } else {
      // Create new order
      const newOrder: Order = {
        id: now.toString(),
        items: [...cart],
        total,
        timestamp: now,
        businessDate,
        status: 'pending',
        table: selectedTable,
        cashierId,
      };

      const updatedOrders = [...orders, newOrder];
      setOrders(updatedOrders);
      await posBackend.saveOrder(newOrder);
    }

    setCart([]); // Clear cart after checkout
    setShowCheckoutModal(false);
    setSelectedTable(null);
  };

  const recordSale = async (order: Order) => {
    const saleRecord: SaleRecord = {
      orderId: order.id,
      cashierId: order.cashierId || cashierId,
      table: order.table,
      items: order.items,
      total: order.total,
      subtotal: order.subtotal,
      taxApplied: order.taxApplied,
      taxRate: order.taxRate,
      taxAmount: order.taxAmount,
      paidAt: Date.now(),
      businessDate: order.businessDate ?? toLocalDateValue(shiftStartTime ?? order.timestamp),
      paymentMethod: order.paymentMethod || 'cash',
    };
    await posBackend.recordSale(saleRecord);
    setSalesHistory((prev) => [...prev, saleRecord]);
  };

  const payOrder = async (orderId: string, paymentMethod: PaymentMethod, taxApplied: boolean) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const subtotal = order.subtotal ?? order.total;
    const taxAmount = taxApplied ? roundMoney(subtotal * TAX_RATE) : 0;
    const paidOrder: Order = {
      ...order,
      status: 'paid',
      paymentMethod,
      subtotal,
      taxApplied,
      taxRate: taxApplied ? TAX_RATE : 0,
      taxAmount,
      total: roundMoney(subtotal + taxAmount),
    };

    const updatedOrders = orders.map(order =>
      order.id === orderId ? paidOrder : order
    );
    setOrders(updatedOrders);
    await posBackend.saveOrder(paidOrder);

    // Only cash actually lands in the physical drawer; card/InstaPay settle elsewhere
    if (paymentMethod === 'cash') {
      setDrawerAmount(prev => prev + paidOrder.total);
    }
    await recordSale(paidOrder);
    printReceipt(paidOrder);
  };

  const changePaymentMethod = async (orderId: string, paymentMethod: PaymentMethod) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status !== 'paid') return;

    const previousMethod = order.paymentMethod || 'cash';
    if (previousMethod === paymentMethod) return;

    const updatedOrder = { ...order, paymentMethod };
    setOrders((prev) => prev.map((item) => (item.id === orderId ? updatedOrder : item)));
    setSalesHistory((prev) =>
      prev.map((sale) => (sale.orderId === orderId ? { ...sale, paymentMethod } : sale))
    );

    await posBackend.saveOrder(updatedOrder);
    await posBackend.updateSalePaymentMethod(orderId, paymentMethod);

    if (previousMethod === 'cash' && paymentMethod !== 'cash') {
      setDrawerAmount((prev) => Math.max(initialDrawerAmount, prev - order.total));
    } else if (previousMethod !== 'cash' && paymentMethod === 'cash') {
      setDrawerAmount((prev) => prev + order.total);
    }
  };

  const cancelOrder = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    const sale = salesHistory.find((item) => item.orderId === orderId);
    if (!order && !sale) return;

    if (order?.status === 'paid' || sale) {
      await posBackend.deleteSaleByOrderId(orderId);
    }
    if (order) {
      await posBackend.deleteOrder(orderId);
    }

    setOrders((prev) => prev.filter((item) => item.id !== orderId));
    setSalesHistory((prev) => prev.filter((sale) => sale.orderId !== orderId));

    if (order && isCashPayment(order)) {
      setDrawerAmount((prev) => Math.max(initialDrawerAmount, prev - order.total));
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
              body { font-family: Arial, sans-serif; margin: 0; }
              .logo-banner { display: flex; justify-content: center; padding: 24px 20px 4px; background: #ffffff; }
              .logo-banner img { width: 70%; max-width: 260px; display: block; filter: brightness(0); }
              .receipt-body { padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
              .footer .closing { margin-top: 10px; font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="logo-banner">
              <img src="${goobaTextLogo}" alt="Gooba" />
            </div>
            <div class="receipt-body">
              <div class="header">
                <h2>${t.cafeReceipt}</h2>
                <p>${t.orderNumber}${order.id}</p>
                <p>${new Date(order.timestamp).toLocaleString()}</p>
              </div>
              ${order.items.map(item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>EGP${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="total">
                ${order.taxApplied ? `
                  <div class="item">
                    <span>${t.subtotal}</span>
                    <span>EGP${(order.subtotal ?? order.total - (order.taxAmount ?? 0)).toFixed(2)}</span>
                  </div>
                  <div class="item">
                    <span>${t.tax} 14%</span>
                    <span>EGP${(order.taxAmount ?? 0).toFixed(2)}</span>
                  </div>
                ` : ''}
                <div class="item">
                  <span>${t.total}</span>
                  <span>EGP${order.total.toFixed(2)}</span>
                </div>
              </div>
              <div class="footer">
                <p>${
                  order.paymentMethod === 'card'
                    ? t.paymentCard
                    : order.paymentMethod === 'instapay'
                    ? t.paymentInstapay
                    : t.paymentCash
                }</p>
                <p>${t.thankYou}</p>
                <p class="closing">Your Next Coffee Is Waiting, See You Soon!</p>
              </div>
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
    extras?: string[]
  ) => {
    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) =>
        cartItem.id === item.id &&
        cartItem.price === item.price &&
        areExtrasEqual(cartItem.extras, extras)
      );

      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem === existing
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity, extras }];
    });
  };

  const removeFromCart = (item: CartItem) => {
    setCart((prevCart) =>
      prevCart
        .map((cartItem) =>
          cartItem.id === item.id &&
          cartItem.price === item.price &&
          areExtrasEqual(cartItem.extras, item.extras)
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  const translatedMenuItems = menuCatalog
    .map(item => {
      const activeOffer = offers.find((offer) => offer.active && offer.menuItemId === item.id);
      const translatedName = t.menuItems[item.id as keyof typeof t.menuItems] || item.name;
      const offerPrice = activeOffer
        ? item.price * (1 - activeOffer.discountPercent / 100)
        : item.price;

      return {
        ...item,
        name: activeOffer ? `${translatedName} (${activeOffer.title})` : translatedName,
        price: Math.max(0, Number(offerPrice.toFixed(2))),
        specialPrice: item.specialPrice ?? item.price,
      };
    });

  const saveAdminUser = async (user: AppUser) => {
    await posBackend.saveUser(user);
    setUsers(await posBackend.getUsers(DEFAULT_USERS));
  };

  const deleteAdminUser = async (id: string) => {
    await posBackend.deleteUser(id);
    setUsers(await posBackend.getUsers(DEFAULT_USERS));
  };

  const saveAdminMenuItem = async (item: MenuItem) => {
    await posBackend.saveMenuItem({ ...item, specialPrice: item.specialPrice ?? item.price });
    setMenuCatalog(await posBackend.getMenuItems(DEFAULT_MENU_ITEMS));
  };

  const deleteAdminMenuItem = async (id: number) => {
    await posBackend.deleteMenuItem(id);
    setMenuCatalog(await posBackend.getMenuItems(DEFAULT_MENU_ITEMS));
  };

  const saveAdminOffer = async (offer: Offer) => {
    await posBackend.saveOffer(offer);
    setOffers(await posBackend.getOffers());
  };

  const deleteAdminOffer = async (id: string) => {
    await posBackend.deleteOffer(id);
    setOffers(await posBackend.getOffers());
  };

  return (
    <div className="app" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {showInvoiceThankYou && <InvoiceThankYou onClose={dismissInvoiceThankYou} />}
      {showCheckoutModal && (
        <CheckoutModal
          orders={orders}
          selectedTable={selectedTable}
          onSelectTable={setSelectedTable}
          onCancel={() => setShowCheckoutModal(false)}
          onConfirm={confirmCheckout}
          translations={t}
        />
      )}
      {showLogoutModal && (
        <LogoutModal
          initialDrawerAmount={initialDrawerAmount}
          orders={orders}
          shiftStartTime={shiftStartTime}
          finalDrawerAmount={finalDrawerAmount}
          onFinalDrawerAmountChange={setFinalDrawerAmount}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          translations={t}
        />
      )}
      {showAdminLogin && (
        <AdminLoginModal
          username={adminUsernameInput}
          onUsernameChange={(value) => {
            setAdminUsernameInput(value);
            setAdminError(false);
          }}
          password={adminPasswordInput}
          onPasswordChange={(value) => {
            setAdminPasswordInput(value);
            setAdminError(false);
          }}
          error={adminError}
          onCancel={() => setShowAdminLogin(false)}
          onSubmit={submitAdminLogin}
          cancelLabel={t.cancel}
        />
      )}
      {showAdminDashboard ? (
        <AdminDashboard
          onBack={() => setShowAdminDashboard(false)}
          users={users}
          menuItems={menuCatalog}
          offers={offers}
          orders={orders}
          salesHistory={salesHistory}
          shifts={shifts}
          onSaveUser={saveAdminUser}
          onDeleteUser={deleteAdminUser}
          onSaveMenuItem={saveAdminMenuItem}
          onDeleteMenuItem={deleteAdminMenuItem}
          onSaveOffer={saveAdminOffer}
          onDeleteOffer={deleteAdminOffer}
          onCancelOrder={cancelOrder}
        />
      ) : isLoggedIn ? (
        showOrders ? (
          <OrdersView
            orders={orders}
            onPayOrder={payOrder}
            onChangePaymentMethod={changePaymentMethod}
            onBack={() => setShowOrders(false)}
            onAddItems={addItemsToOrder}
            onLogout={handleLogout}
            drawerAmount={drawerAmount}
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
        <Login
          onLogin={handleLogin}
          onToggleLanguage={toggleLanguage}
          language={language}
          translations={t}
          onAdminClick={openAdminLogin}
        />
      )}
    </div>
  );
}

export default App;
