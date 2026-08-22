export type TranslationKey = 
  | "welcome"
  | "login"
  | "signup"
  | "balance"
  | "currency"
  | "language"
  | "settings"
  | "profile"
  | "logout"
  | "dashboard"
  | "orders"
  | "deposit"
  | "services"
  | "admin_portal";

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Welcome back",
    login: "Log In",
    signup: "Sign Up",
    balance: "Account Balance",
    currency: "Currency",
    language: "Language",
    settings: "Settings",
    profile: "Profile",
    logout: "Log Out",
    dashboard: "Dashboard",
    orders: "My Orders",
    deposit: "Add Funds",
    services: "All Services",
    admin_portal: "Admin Portal",
  },
  ur: {
    welcome: "خوش آمدید",
    login: "لاگ ان",
    signup: "سائن اپ",
    balance: "اکاؤنٹ بیلنس",
    currency: "کرنسی",
    language: "زبان",
    settings: "ترتیبات",
    profile: "پروفائل",
    logout: "لاگ آؤٹ",
    dashboard: "ڈیش بورڈ",
    orders: "میرے آرڈرز",
    deposit: "رقم جمع کریں",
    services: "تمام خدمات",
    admin_portal: "ایڈمن پورٹل",
  },
  ar: {
    welcome: "مرحباً بك",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    balance: "رصيد الحساب",
    currency: "العملة",
    language: "اللغة",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    logout: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    orders: "طلباتي",
    deposit: "إيداع الأموال",
    services: "جميع الخدمات",
    admin_portal: "لوحة الإدارة",
  },
  hi: {
    welcome: "वापस स्वागत है",
    login: "लॉग इन",
    signup: "साइन अप",
    balance: "खाता शेष",
    currency: "मुद्रा",
    language: "भाषा",
    settings: "सेटिंग्स",
    profile: "प्रोफाइल",
    logout: "लॉग आउट",
    dashboard: "डैशबोर्ड",
    orders: "मेरे आदेश",
    deposit: "धन जमा करें",
    services: "सभी सेवाएँ",
    admin_portal: "एडमिन पोर्टल",
  }
};
