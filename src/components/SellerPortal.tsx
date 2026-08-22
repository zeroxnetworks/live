import React, { useState } from "react";
import { 
  MessageCircle, Globe, Server, CheckCircle2, Store, ArrowRight, 
  Smartphone, Calculator, Code2, User, Mail, ChevronDown, Rocket, Zap, Users, CircleDollarSign, 
  Copy, Share2, Percent, Layers, Search, Check, Flame, HelpCircle, ArrowUpRight, ShieldCheck, Tag
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

interface SellerPortalProps {
  coverUrl?: string;
}

interface DefaultServiceItem {
  id: string;
  category: "SMS Virtual Numbers" | "SMM Social Media" | "Digital Panel Accounts";
  name: string;
  basePricePkr: number;
  unit: string;
  popular?: boolean;
}

const DEFAULT_RESELLER_SERVICES: DefaultServiceItem[] = [
  // SMS Virtual Numbers
  { id: "sms-wa", category: "SMS Virtual Numbers", name: "WhatsApp Virtual OTP Number", basePricePkr: 180, unit: "number", popular: true },
  { id: "sms-tg", category: "SMS Virtual Numbers", name: "Telegram Virtual OTP Number", basePricePkr: 160, unit: "number", popular: true },
  { id: "sms-goog", category: "SMS Virtual Numbers", name: "Google / Gmail Verification Number", basePricePkr: 120, unit: "number", popular: true },
  { id: "sms-tt", category: "SMS Virtual Numbers", name: "TikTok OTP Virtual Number", basePricePkr: 130, unit: "number", popular: true },
  { id: "sms-ig", category: "SMS Virtual Numbers", name: "Instagram OTP Verification", basePricePkr: 140, unit: "number" },
  { id: "sms-ai", category: "SMS Virtual Numbers", name: "ChatGPT / OpenAI Virtual Number", basePricePkr: 220, unit: "number", popular: true },
  { id: "sms-fb", category: "SMS Virtual Numbers", name: "Facebook OTP Verification Number", basePricePkr: 110, unit: "number" },
  { id: "sms-tndr", category: "SMS Virtual Numbers", name: "Tinder SMS Activation Number", basePricePkr: 250, unit: "number" },
  { id: "sms-bnc", category: "SMS Virtual Numbers", name: "Binance SMS OTP Number", basePricePkr: 300, unit: "number" },
  { id: "sms-ntfx", category: "SMS Virtual Numbers", name: "Netflix SMS Activation Number", basePricePkr: 200, unit: "number" },

  // SMM Social Media
  { id: "smm-ig-fol", category: "SMM Social Media", name: "Instagram Non-Drop Followers", basePricePkr: 280, unit: "1000 followers", popular: true },
  { id: "smm-ig-like", category: "SMM Social Media", name: "Instagram Real Likes", basePricePkr: 60, unit: "1000 likes" },
  { id: "smm-tt-views", category: "SMM Social Media", name: "TikTok Instant Views", basePricePkr: 15, unit: "1000 views", popular: true },
  { id: "smm-tt-fol", category: "SMM Social Media", name: "TikTok Real Followers", basePricePkr: 450, unit: "1000 followers" },
  { id: "smm-yt-sub", category: "SMM Social Media", name: "YouTube Monetizable Subscribers", basePricePkr: 1800, unit: "1000 subs", popular: true },
  { id: "smm-yt-views", category: "SMM Social Media", name: "YouTube High Retention Views", basePricePkr: 350, unit: "1000 views" },
  { id: "smm-tg-mem", category: "SMM Social Media", name: "Telegram Channel Members", basePricePkr: 220, unit: "1000 members" },
  { id: "smm-fb-like", category: "SMM Social Media", name: "Facebook Page Likes & Followers", basePricePkr: 500, unit: "1000 likes" },

  // Digital Panel Accounts
  { id: "acc-gpt", category: "Digital Panel Accounts", name: "ChatGPT Plus Private Account (1 Mo)", basePricePkr: 3500, unit: "account", popular: true },
  { id: "acc-cnv", category: "Digital Panel Accounts", name: "Canva Pro Lifetime Brand Access", basePricePkr: 450, unit: "account", popular: true },
  { id: "acc-nfx", category: "Digital Panel Accounts", name: "Netflix UHD Screen (1 Month)", basePricePkr: 650, unit: "screen", popular: true },
  { id: "acc-vpn", category: "Digital Panel Accounts", name: "ExpressVPN Unlimited Premium (1 Mo)", basePricePkr: 400, unit: "account" },
  { id: "acc-sptf", category: "Digital Panel Accounts", name: "Spotify Premium Individual Account", basePricePkr: 300, unit: "account" }
];

interface SocialPlatformOption {
  id: string;
  name: string;
  iconColor: string;
  bgLight: string;
  placeholder: string;
  svg: React.ReactNode;
}

const SOCIAL_PLATFORMS: SocialPlatformOption[] = [
  {
    id: "Telegram",
    name: "Telegram",
    iconColor: "text-[#0088cc]",
    bgLight: "bg-[#0088cc]/10",
    placeholder: "e.g. @YourTelegramHandle",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#0088cc] shrink-0" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
      </svg>
    )
  },
  {
    id: "WhatsApp",
    name: "WhatsApp",
    iconColor: "text-[#25D366]",
    bgLight: "bg-[#25D366]/10",
    placeholder: "e.g. 03XX XXXXXXX or wa.me/...",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    )
  },
  {
    id: "Instagram",
    name: "Instagram",
    iconColor: "text-rose-500",
    bgLight: "bg-rose-500/10",
    placeholder: "e.g. @YourInstaHandle",
    svg: (
      <svg className="w-4 h-4 fill-current text-rose-500 shrink-0" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  },
  {
    id: "Facebook",
    name: "Facebook",
    iconColor: "text-[#1877F2]",
    bgLight: "bg-[#1877F2]/10",
    placeholder: "e.g. fb.com/yourpage",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#1877F2] shrink-0" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  {
    id: "Discord",
    name: "Discord",
    iconColor: "text-[#5865F2]",
    bgLight: "bg-[#5865F2]/10",
    placeholder: "e.g. username or Server Link",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#5865F2] shrink-0" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
  {
    id: "TikTok",
    name: "TikTok",
    iconColor: "text-slate-900",
    bgLight: "bg-slate-900/10",
    placeholder: "e.g. @YourTikTokHandle",
    svg: (
      <svg className="w-4 h-4 fill-current text-slate-900 shrink-0" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    )
  },
  {
    id: "Twitter",
    name: "X / Twitter",
    iconColor: "text-slate-900",
    bgLight: "bg-slate-900/10",
    placeholder: "e.g. @YourTwitterHandle",
    svg: (
      <svg className="w-4 h-4 fill-current text-slate-900 shrink-0" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  }
];

export default function SellerPortal({ coverUrl }: SellerPortalProps) {
  // Main Hub Mode: "manual-reseller" or "api-store"
  const [activePortalTab, setActivePortalTab] = useState<"manual-reseller" | "api-store">("manual-reseller");

  // --- MANUAL RESELLER STATES ---
  const [resellerName, setResellerName] = useState<string>("");
  const [resellerPhone, setResellerPhone] = useState<string>("");
  const [resellerSocialType, setResellerSocialType] = useState<string>("Telegram");
  const [resellerSocialContact, setResellerSocialContact] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("Easypaisa, JazzCash, Binance & Bank Transfer Accepted ⚡");
  const [customNote, setCustomNote] = useState<string>("Instant Auto-Delivery & 24/7 Replacement Guarantee!");
  
  // Profit & Markup Settings
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(35);
  const [currencySymbol, setCurrencySymbol] = useState<"PKR" | "USD" | "INR">("PKR");
  const [pkrToUsdRate] = useState<number>(278);

  // Post Generator Filter & Format
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>("ALL");
  const [postTemplateStyle, setPostTemplateStyle] = useState<"all-in-one" | "sms-hot" | "smm-growth" | "single-service">("all-in-one");
  const [selectedSingleServiceId, setSelectedSingleServiceId] = useState<string>("sms-wa");
  const [catalogSearch, setCatalogSearch] = useState<string>("");

  // Copy Feedback states for specific interactions
  const [isCopiedPost, setIsCopiedPost] = useState<boolean>(false);
  const [copiedServiceId, setCopiedServiceId] = useState<string | null>(null);

  // API Partner Form States
  const [salesPerDay, setSalesPerDay] = useState<number>(50);
  const [averageMargin, setAverageMargin] = useState<number>(0.50);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const [isDomainOpen, setIsDomainOpen] = useState(false);
  const [isHostingOpen, setIsHostingOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isSocialTypeOpen, setIsSocialTypeOpen] = useState(false);
  const domainRef = React.useRef<HTMLDivElement>(null);
  const hostingRef = React.useRef<HTMLDivElement>(null);
  const spotlightRef = React.useRef<HTMLDivElement>(null);
  const socialTypeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (domainRef.current && !domainRef.current.contains(event.target as Node)) setIsDomainOpen(false);
      if (hostingRef.current && !hostingRef.current.contains(event.target as Node)) setIsHostingOpen(false);
      if (spotlightRef.current && !spotlightRef.current.contains(event.target as Node)) setIsSpotlightOpen(false);
      if (socialTypeRef.current && !socialTypeRef.current.contains(event.target as Node)) setIsSocialTypeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    domainStatus: "Need Domain",
    hostingStatus: "Need Hosting",
    message: ""
  });

  const calculateMonthlyProfit = () => {
    return (salesPerDay * averageMargin * 30).toFixed(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWhatsAppSubmit = () => {
    const text = `*New Seller Application*%0A%0A*Name:* ${formData.name}%0A*Email:* ${formData.email}%0A*Phone:* ${formData.phone}%0A*Domain Status:* ${formData.domainStatus}%0A*Hosting Status:* ${formData.hostingStatus}%0A*Message:* ${formData.message}%0A%0AI want to launch my own store with ZeroX API!`;
    window.open(`https://wa.me/923197206072?text=${text}`, "_blank");
  };

  // Helper calculation for selling price
  const getSellingPrice = (basePkr: number) => {
    const sellingPkr = Math.ceil(basePkr * (1 + profitMarginPercent / 100));
    if (currencySymbol === "USD") {
      return `$${(sellingPkr / pkrToUsdRate).toFixed(2)}`;
    } else if (currencySymbol === "INR") {
      return `₹${Math.ceil(sellingPkr * 0.30)}`;
    }
    return `Rs. ${sellingPkr}`;
  };

  const getBasePriceFormatted = (basePkr: number) => {
    if (currencySymbol === "USD") return `$${(basePkr / pkrToUsdRate).toFixed(2)}`;
    if (currencySymbol === "INR") return `₹${Math.ceil(basePkr * 0.30)}`;
    return `Rs. ${basePkr}`;
  };

  const getProfitAmountFormatted = (basePkr: number) => {
    const sellingPkr = Math.ceil(basePkr * (1 + profitMarginPercent / 100));
    const profitPkr = sellingPkr - basePkr;
    if (currencySymbol === "USD") return `$${(profitPkr / pkrToUsdRate).toFixed(2)}`;
    if (currencySymbol === "INR") return `₹${Math.ceil(profitPkr * 0.30)}`;
    return `Rs. ${profitPkr}`;
  };

  // Dynamic Post Text Generator
  const generatePostText = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const brandHeader = resellerName ? `🔥 *${resellerName.toUpperCase()} - OFFICIAL SERVICE RATES* 🔥` : `🔥 *OFFICIAL VIRTUAL & SMM RATES* 🔥`;
    
    let body = `${brandHeader}\n📅 Updated: ${dateStr}\n`;
    if (customNote) body += `⚡ ${customNote}\n`;
    body += `------------------------------------\n`;

    if (postTemplateStyle === "all-in-one") {
      const categories: ("SMS Virtual Numbers" | "SMM Social Media" | "Digital Panel Accounts")[] = [
        "SMS Virtual Numbers",
        "SMM Social Media",
        "Digital Panel Accounts"
      ];

      categories.forEach((cat) => {
        const items = DEFAULT_RESELLER_SERVICES.filter(s => s.category === cat);
        if (items.length > 0) {
          const catEmoji = cat === "SMS Virtual Numbers" ? "📱" : cat === "SMM Social Media" ? "🚀" : "💎";
          body += `\n${catEmoji} *${cat.toUpperCase()}*\n`;
          items.forEach(item => {
            body += `• ${item.name}: *${getSellingPrice(item.basePricePkr)}* / ${item.unit}\n`;
          });
        }
      });
    } else if (postTemplateStyle === "sms-hot") {
      body += `\n📱 *HOT VIRTUAL SMS OTP NUMBERS*\n`;
      const smsItems = DEFAULT_RESELLER_SERVICES.filter(s => s.category === "SMS Virtual Numbers");
      smsItems.forEach(item => {
        body += `✅ ${item.name} ➔ *${getSellingPrice(item.basePricePkr)}*\n`;
      });
    } else if (postTemplateStyle === "smm-growth") {
      body += `\n🚀 *SOCIAL MEDIA BOOSTING RATES*\n`;
      const smmItems = DEFAULT_RESELLER_SERVICES.filter(s => s.category === "SMM Social Media");
      smmItems.forEach(item => {
        body += `⭐ ${item.name} ➔ *${getSellingPrice(item.basePricePkr)}*\n`;
      });
    } else if (postTemplateStyle === "single-service") {
      const target = DEFAULT_RESELLER_SERVICES.find(s => s.id === selectedSingleServiceId) || DEFAULT_RESELLER_SERVICES[0];
      body += `\n🎯 *SPECIAL DISCOUNT OFFER*\n`;
      body += `📌 Service: *${target.name}*\n`;
      body += `💰 Price: *${getSellingPrice(target.basePricePkr)}* (Per ${target.unit})\n`;
      body += `⚡ Instant Code Delivery & Full Warranty!\n`;
    }

    body += `\n------------------------------------\n`;
    body += `💳 *PAYMENT METHODS:*\n${paymentNote || "Easypaisa / JazzCash / Bank"}\n\n`;
    body += `📲 *HOW TO ORDER:*\n`;
    if (resellerPhone) body += `💬 WhatsApp: wa.me/${resellerPhone.replace(/[^0-9]/g, "")}\n`;
    if (resellerSocialContact) body += `✈️ ${resellerSocialType}: ${resellerSocialContact}\n`;
    body += `\n⚡ Send payment screenshot & service name to get instant delivery!`;

    return body;
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(generatePostText());
    setIsCopiedPost(true);
    toast.success("Ready-to-post template copied to clipboard!");
    setTimeout(() => setIsCopiedPost(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const post = generatePostText();
    window.open(`https://wa.me/?text=${encodeURIComponent(post)}`, "_blank");
  };

  const filteredCatalogServices = DEFAULT_RESELLER_SERVICES.filter(item => {
    const matchCat = selectedPostCategory === "ALL" || item.category === selectedPostCategory;
    const matchSearch = item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || item.category.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-800">
      
      {/* Visual Header & Premium Segment Switch */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
        {coverUrl && (
          <img src={coverUrl} alt="Seller Portal Banner" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay" />
        )}
        <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none transform select-none">
          <Store className="w-[500px] h-[500px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-indigo-300">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                ZeroX Partner & Reseller Center
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 text-slate-100">
                Resell & Partner Program
              </h2>
            </div>

            {/* Responsive Dual Hub Mode Switcher */}
            <div className="bg-black/35 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-1 self-start lg:self-center">
              <button
                type="button"
                onClick={() => setActivePortalTab("manual-reseller")}
                className="relative px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none"
              >
                {activePortalTab === "manual-reseller" && (
                  <motion.div
                    layoutId="activePortalTab"
                    className="absolute inset-0 bg-[#00AEEF] rounded-md border border-indigo-400/20 shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Smartphone className={`w-4 h-4 relative z-10 ${activePortalTab === "manual-reseller" ? "text-emerald-300" : "text-slate-400"}`} />
                <span className="relative z-10">Manual Social Reseller</span>
                <span className="relative z-10 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase scale-90">Free</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePortalTab("api-store")}
                className="relative px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none"
              >
                {activePortalTab === "api-store" && (
                  <motion.div
                    layoutId="activePortalTab"
                    className="absolute inset-0 bg-[#00AEEF] rounded-md border border-indigo-400/20 shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Code2 className={`w-4 h-4 relative z-10 ${activePortalTab === "api-store" ? "text-blue-300" : "text-slate-400"}`} />
                <span className="relative z-10">Automated API & Website</span>
              </button>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              {activePortalTab === "manual-reseller" ? (
                "Launch a zero-investment reselling business. Easily customize your service profit margins, configure your brand details, and instantly copy or share automatically-formatted promotional posts to your groups, status circles, and channels."
              ) : (
                "Deploy your own automated white-label virtual number website. Connect to our high-speed service API directly, define your retail pricing markup, and retain 100% of customer payments directly with complete control."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab View Router */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePortalTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-8"
        >
          {activePortalTab === "manual-reseller" && (
            <div className="space-y-10">
              
              {/* Reselling Operational Workflow Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { step: "01", title: "Configure Branding", desc: "Choose your markups and add your custom business contacts.", color: "border-blue-500/20 hover:border-blue-500/40 bg-blue-50/5 text-blue-600" },
                  { step: "02", title: "Compile Rate Sheet", desc: "Instantly render formatted markdown lists ready for copy.", color: "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-50/5 text-emerald-600" },
                  { step: "03", title: "Distribute & Share", desc: "Post to your WhatsApp status, channels, and social groups.", color: "border-purple-500/20 hover:border-purple-500/40 bg-purple-50/5 text-purple-600" },
                  { step: "04", title: "Secure Daily Cash", desc: "Collect payments locally, fulfill on ZeroX, and keep 100% of profits.", color: "border-amber-500/20 hover:border-amber-500/40 bg-amber-50/5 text-amber-600" }
                ].map((item, i) => (
                  <motion.div 
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    key={i} 
                    className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm transition-all duration-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-slate-300 font-mono">{item.step}</span>
                      <Check className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main Interactive Workstation Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Brand Customization and Margin Controllers (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4.5 h-4.5 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">1. Setup Brand & Margins</h3>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100/60 uppercase">
                        Active Profile
                      </span>
                    </div>

                    <div className="space-y-5">
                      {/* Brand Name Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Reseller Business Name
                        </label>
                        <input
                          type="text"
                          value={resellerName}
                          onChange={(e) => setResellerName(e.target.value)}
                          placeholder="e.g. Your Virtual OTP Services"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Phone & Telegram Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            WhatsApp Phone
                          </label>
                          <input
                            type="text"
                            value={resellerPhone}
                            onChange={(e) => setResellerPhone(e.target.value)}
                            placeholder="e.g. 03XX XXXXXXX"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Social Media Contact
                          </label>
                          {(() => {
                            const selectedPlatformObj = SOCIAL_PLATFORMS.find(p => p.id === resellerSocialType) || SOCIAL_PLATFORMS[0];
                            return (
                              <div className="flex gap-2">
                                {/* Custom Platform Select Dropdown */}
                                <div className="relative w-2/5 shrink-0" ref={socialTypeRef}>
                                  <button
                                    type="button"
                                    onClick={() => setIsSocialTypeOpen(!isSocialTypeOpen)}
                                    className="w-full bg-slate-50 border border-slate-200 hover:border-[#00AEEF]/50 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all flex items-center justify-between gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      {selectedPlatformObj.svg}
                                      <span className="truncate text-slate-800 font-bold text-xs">{selectedPlatformObj.name}</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isSocialTypeOpen ? "rotate-180" : ""}`} />
                                  </button>

                                  <AnimatePresence>
                                    {isSocialTypeOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute z-50 top-full mt-1.5 w-52 left-0 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden"
                                      >
                                        <div className="p-1.5 space-y-0.5">
                                          <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Handle Type</div>
                                          {SOCIAL_PLATFORMS.map((platform) => {
                                            const isSelected = resellerSocialType === platform.id;
                                            return (
                                              <button
                                                key={platform.id}
                                                type="button"
                                                onClick={() => {
                                                  setResellerSocialType(platform.id);
                                                  setIsSocialTypeOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                  isSelected
                                                    ? `${platform.bgLight} ${platform.iconColor}`
                                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  {platform.svg}
                                                  <span className="font-bold">{platform.name}</span>
                                                </div>
                                                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#00AEEF]" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Contact Input */}
                                <input
                                  type="text"
                                  value={resellerSocialContact}
                                  onChange={(e) => setResellerSocialContact(e.target.value)}
                                  placeholder={selectedPlatformObj.placeholder}
                                  className="w-3/5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all shadow-sm"
                                />
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Profit Margin Customization Slider */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                            <Percent className="w-4 h-4 text-emerald-600" />
                            Retail Markup Margin: <span className="text-emerald-600 font-extrabold text-sm">+{profitMarginPercent}%</span>
                          </label>
                          
                          {/* Currency selector inside slider */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 text-[10px] font-bold shadow-sm">
                            {(["PKR", "USD", "INR"] as const).map(curr => (
                              <button
                                key={curr}
                                type="button"
                                onClick={() => setCurrencySymbol(curr)}
                                className={`px-2 py-0.5 rounded ${currencySymbol === curr ? "bg-[#00AEEF] text-white font-extrabold" : "text-slate-600 hover:bg-slate-100"}`}
                              >
                                {curr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          type="range"
                          min="5"
                          max="200"
                          step="5"
                          value={profitMarginPercent}
                          onChange={(e) => setProfitMarginPercent(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />

                        <div className="flex justify-between text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                          <span>Low (+5%)</span>
                          <span>Default (+35%)</span>
                          <span>High (+100%)</span>
                        </div>

                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Margin Calculation Demo:</span>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] line-through block">Cost: {getBasePriceFormatted(180)}</span>
                            <span className="text-emerald-700 font-bold">Resell Price: {getSellingPrice(180)}</span>
                            <span className="text-[10px] font-semibold text-emerald-600 block">(Net Profit: +{getProfitAmountFormatted(180)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Note Footer */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Payment Instructions (Footer)
                        </label>
                        <input
                          type="text"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="Easypaisa, JazzCash, Binance, Bank Transfer Accepted"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Guarantee text input */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Promo/Guarantee Banner Tagline
                        </label>
                        <input
                          type="text"
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          placeholder="⚡ Instant Auto-Delivery & 24/7 Replacement Guarantee!"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Social Media Post Render Panel (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                          <h3 className="text-sm font-bold text-slate-900">2. Promotional Post Generator</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-light">
                          Dynamic ready-to-copy marketing templates formatted with your custom margins.
                        </p>
                      </div>

                      {/* Actions Box */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyPost}
                          className="bg-[#00AEEF] hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
                        >
                          {isCopiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopiedPost ? "Copied!" : "Copy Post"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp Post</span>
                        </button>
                      </div>
                    </div>

                    {/* Template Selection Pills */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Select Rate Sheet Template Style
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "all-in-one", label: "All Services" },
                          { id: "sms-hot", label: "SMS OTP Deals" },
                          { id: "smm-growth", label: "SMM Boosting" },
                          { id: "single-service", label: "Spotlight Discount" }
                        ].map(tmpl => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setPostTemplateStyle(tmpl.id as any)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-bold text-center transition border ${
                              postTemplateStyle === tmpl.id
                                ? "bg-indigo-50/65 border-indigo-500 text-indigo-700 shadow-sm font-extrabold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/80 hover:text-slate-800"
                            }`}
                          >
                            {tmpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spotlight single service dropdown if selected */}
                    {postTemplateStyle === "single-service" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 pt-1"
                      >
                        <label className="block text-xs font-bold text-slate-700">Select Spotlight Service:</label>
                        <div className="relative" ref={spotlightRef}>
                          <button
                            type="button"
                            onClick={() => setIsSpotlightOpen(!isSpotlightOpen)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-indigo-500/30 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 flex justify-between items-center"
                          >
                            <span className="truncate">
                              {DEFAULT_RESELLER_SERVICES.find(s => s.id === selectedSingleServiceId)?.name || "Select Service"} - {getSellingPrice(DEFAULT_RESELLER_SERVICES.find(s => s.id === selectedSingleServiceId)?.basePricePkr || 0)}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSpotlightOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isSpotlightOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-50 top-full mt-1.5 w-full left-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                              >
                                <div className="max-h-[220px] overflow-y-auto py-1">
                                  {DEFAULT_RESELLER_SERVICES.map((svc, idx) => (
                                    <button
                                      key={svc.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSingleServiceId(svc.id);
                                        setIsSpotlightOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                        selectedSingleServiceId === svc.id
                                          ? "bg-[#00AEEF]/10 text-[#00AEEF]"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <span className="truncate">{svc.name} - {getSellingPrice(svc.basePricePkr)}</span>
                                      {selectedSingleServiceId === svc.id && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#00AEEF] shrink-0 ml-2" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}

                    {/* Live Preview Console Box */}
                    <div className="space-y-2">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Rendered Reseller Post Preview
                      </span>
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-500">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> WhatsApp_Format.txt</span>
                          <span>UTF-8 Preview</span>
                        </div>
                        <textarea
                          readOnly
                          rows={11}
                          value={generatePostText()}
                          className="w-full bg-transparent text-emerald-400 font-mono text-[11px] sm:text-xs rounded-b-xl p-4 focus:outline-none leading-relaxed resize-none cursor-text select-all"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" /> Ready for WhatsApp, Telegram, or Facebook
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPost}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Quick Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Graphical Menu / Shared Flyer Generator */}
              <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg text-white space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="space-y-1">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      🎨 Visual Graphic Generator
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold mt-2">Instant Social Media Flyer Rates</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                      Customize rates above. Screenshot or share this branded rate graphic to Instagram stories, WhatsApp statuses, and Facebook groups.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyPost();
                        toast.success("Rate card content prepared & copied!");
                      }}
                      className="bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-lg text-xs transition border border-white/15 flex items-center gap-2 active:scale-95"
                    >
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <span>Copy Rates Text</span>
                    </button>
                  </div>
                </div>

                {/* Elegant Interactive Menu Poster Frame */}
                <div className="max-w-3xl mx-auto bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Flyer Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow border border-white/15">
                        {resellerName ? resellerName.charAt(0).toUpperCase() : "Z"}
                      </div>
                      <div>
                        <h4 className="text-base font-black tracking-tight text-white uppercase">
                          {resellerName || "YOUR BUSINESS NAME"}
                        </h4>
                        <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Certified Safe Reseller
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-widest font-bold">ORDER CONTACTS</span>
                      <div className="flex flex-col sm:items-end">
                        <span className="text-xs sm:text-sm font-bold text-indigo-300 font-mono">
                          WhatsApp: {resellerPhone || "03XX XXXXXXX"}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-indigo-300 font-mono">
                          {resellerSocialType}: {resellerSocialContact || "@YourHandle"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Rate Catalog Grid (3-columns on PC, 2 on SM, 1 on XS) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {DEFAULT_RESELLER_SERVICES.slice(0, 9).map(svc => (
                      <div key={svc.id} className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition">
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-200 block truncate">{svc.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">1x {svc.unit.split(" ")[0]}</span>
                        </div>
                        <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/15 shrink-0">
                          {getSellingPrice(svc.basePricePkr)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Flyer Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <span>Payments: <strong className="text-slate-300 font-bold">{paymentNote || "Easypaisa / JazzCash"}</strong></span>
                    </div>

                    <div className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> Fast Delivery Fulfillments
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Service Rate Grid Catalog & Margin Calculator */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4.5 h-4.5 text-indigo-600" />
                      Service Catalog & Profits Calculator
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                      Review direct wholesale costs, calculate targeted retail rates, and verify your net profit spread instantly.
                    </p>
                  </div>

                  {/* Search and Category Filter pill box */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Search Catalog..."
                        className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>

                    {/* Desktop Category switches */}
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
                      {["ALL", "SMS Virtual Numbers", "SMM Social Media", "Digital Panel Accounts"].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedPostCategory(cat)}
                          className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition uppercase tracking-wider ${
                            selectedPostCategory === cat ? "bg-white text-indigo-700 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {cat === "ALL" ? "All" : cat.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop Datagrid / Responsive Cards for Mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3.5">Service Detail</th>
                        <th className="p-3.5">Category Group</th>
                        <th className="p-3.5">Wholesale Cost</th>
                        <th className="p-3.5">Retail Rate (+{profitMarginPercent}%)</th>
                        <th className="p-3.5">Net Profit</th>
                        <th className="p-3.5 text-right">Quick Rate Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCatalogServices.map((item) => {
                        const sellingStr = getSellingPrice(item.basePricePkr);
                        const profitStr = getProfitAmountFormatted(item.basePricePkr);
                        const costStr = getBasePriceFormatted(item.basePricePkr);
                        const isSvcCopied = copiedServiceId === item.id;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="p-3.5 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                {item.popular && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                                    HOT
                                  </span>
                                )}
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-500">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase">
                                {item.category.split(" ")[0]}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">{costStr}</td>
                            <td className="p-3.5 font-mono font-bold text-emerald-700">{sellingStr}</td>
                            <td className="p-3.5 font-mono font-bold text-indigo-600">+{profitStr}</td>
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const singleText = `📌 *${item.name}*\n💰 Price: *${sellingStr}* (Per ${item.unit})\n⚡ WhatsApp Order: wa.me/${resellerPhone.replace(/[^0-9]/g, "")}`;
                                  navigator.clipboard.writeText(singleText);
                                  setCopiedServiceId(item.id);
                                  toast.success(`Copied rates format for ${item.name}!`);
                                  setTimeout(() => setCopiedServiceId(null), 2000);
                                }}
                                className="bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-[10px] transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isSvcCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{isSvcCopied ? "Copied" : "Copy Service"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Optimised Catalog (Avoid squeezed tables on portable devices) */}
                <div className="block md:hidden space-y-3">
                  {filteredCatalogServices.map((item) => {
                    const sellingStr = getSellingPrice(item.basePricePkr);
                    const profitStr = getProfitAmountFormatted(item.basePricePkr);
                    const costStr = getBasePriceFormatted(item.basePricePkr);
                    const isSvcCopied = copiedServiceId === item.id;

                    return (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.name}</h4>
                            <span className="inline-block bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              {item.category.split(" ")[0]}
                            </span>
                          </div>
                          {item.popular && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              HOT
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Wholesale</span>
                            <span className="text-slate-600 font-semibold">{costStr}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Your Retail</span>
                            <span className="text-emerald-700 font-extrabold">{sellingStr}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Net Profit</span>
                            <span className="text-indigo-600 font-bold">+{profitStr}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const singleText = `📌 *${item.name}*\n💰 Price: *${sellingStr}* (Per ${item.unit})\n⚡ WhatsApp Order: wa.me/${resellerPhone.replace(/[^0-9]/g, "")}`;
                              navigator.clipboard.writeText(singleText);
                              setCopiedServiceId(item.id);
                              toast.success(`Copied rates for ${item.name}!`);
                              setTimeout(() => setCopiedServiceId(null), 2000);
                            }}
                            className="w-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold py-2 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {isSvcCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{isSvcCopied ? "Rates Format Copied" : "Copy Shared Format"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {activePortalTab === "api-store" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Flow & Interactive ROI Dashboard */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Integration Milestones Workflow */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-100/30"></div>
                  
                  <h3 className="text-base font-extrabold text-slate-800 mb-6 relative z-10 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Rocket className="w-5 h-5 text-indigo-600 animate-bounce" /> Storefront Roadmap
                  </h3>

                  <ul className="space-y-6 relative z-10">
                    {[
                      { step: 1, title: "Submit Form Application", desc: "Share your domain preferences to activate our engineering setup desk." },
                      { step: 2, title: "Acquire Free Source Code", desc: "Obtain a high-performance React/Vite web application template built for virtual numbers." },
                      { step: 3, title: "Synchronize API Service", desc: "Generate your secure secret API keys and link real-time worldwide inventory." },
                      { step: 4, title: "Secure Passive Returns", desc: "Accept direct local currency transactions, set margins, and run automated." }
                    ].map((step, idx) => (
                      <li key={idx} className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-100/60 shadow-sm text-sm">
                          {step.step}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed font-light">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Revenue & ROI Estimator */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl shadow-lg border border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none transform select-none">
                    <Calculator className="w-48 h-48" />
                  </div>
                  
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2 relative z-10 border-b border-slate-800 pb-3 uppercase tracking-wider text-slate-300">
                    <CircleDollarSign className="w-4.5 h-4.5 text-emerald-400" /> ROI Revenue Estimator
                  </h3>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-400">Projected Daily Sales:</span>
                        <span className="text-emerald-400 font-bold">{salesPerDay} tx/day</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="500" 
                        value={salesPerDay} 
                        onChange={(e) => setSalesPerDay(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-400">Average Profit Per Sale:</span>
                        <span className="text-emerald-400 font-bold">${averageMargin.toFixed(2)} USD</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.10" 
                        max="5.00" 
                        step="0.10"
                        value={averageMargin} 
                        onChange={(e) => setAverageMargin(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Calculated Outcome */}
                    <div className="pt-5 border-t border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Monthly Revenue</span>
                      <div className="text-4xl font-extrabold text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
                        ${calculateMonthlyProfit()}
                        <span className="text-xs font-semibold text-slate-500 font-sans">USD</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1 leading-relaxed font-light">
                        *Projection estimates based on continuous 30-day operation. True yields vary by customer reach.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Applications Intake Desk & FAQs Accordion (2 cols) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Onboarding Intake Application Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-[#00AEEF]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <h3 className="text-lg font-bold text-slate-900 relative z-10">Website Partner Application</h3>
                    <p className="text-slate-500 mt-1 relative z-10 text-xs sm:text-sm font-light leading-relaxed">
                      Complete our introductory business interest profile. Submitting routes you to our developer helpdesk over WhatsApp instantly.
                    </p>
                  </div>
                  
                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name *</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-3 text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all text-slate-800"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-3 text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all text-slate-800"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Direct Business Contact (WhatsApp / Telegram) *</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-3 text-slate-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleFormChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all text-slate-800"
                          placeholder="+92 300 0000000"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Web Domain Status</label>
                        <div className="relative" ref={domainRef}>
                          <button
                            type="button"
                            onClick={() => setIsDomainOpen(!isDomainOpen)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-[#00AEEF]/50 rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none  focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 transition-all duration-200 flex justify-between items-center"
                          >
                            <div className="absolute left-3.5 top-3 text-slate-400">
                              <Globe className="w-4 h-4" />
                            </div>
                            <span className="truncate">
                              {formData.domainStatus === "Need Domain" ? "I need to register a custom domain" : "I already own a custom domain"}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDomainOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isDomainOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-50 top-full mt-1.5 w-full left-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                              >
                                <div className="py-1">
                                  {[
                                    { value: "Need Domain", label: "I need to register a custom domain" },
                                    { value: "Have Domain", label: "I already own a custom domain" }
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({...prev, domainStatus: opt.value}));
                                        setIsDomainOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                        formData.domainStatus === opt.value
                                          ? "bg-[#00AEEF]/10 text-[#00AEEF]"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {formData.domainStatus === opt.value && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#00AEEF] shrink-0 ml-2" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Cloud Hosting Status</label>
                        <div className="relative" ref={hostingRef}>
                          <button
                            type="button"
                            onClick={() => setIsHostingOpen(!isHostingOpen)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-[#00AEEF]/50 rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none  focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 transition-all duration-200 flex justify-between items-center"
                          >
                            <div className="absolute left-3.5 top-3 text-slate-400">
                              <Server className="w-4 h-4" />
                            </div>
                            <span className="truncate">
                              {formData.hostingStatus === "Need Hosting" ? "I need cloud hosting setup" : "I already have hosting active"}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isHostingOpen ? "rotate-180" : ""}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isHostingOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-50 top-full mt-1.5 w-full left-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                              >
                                <div className="py-1">
                                  {[
                                    { value: "Need Hosting", label: "I need cloud hosting setup" },
                                    { value: "Have Hosting", label: "I already have hosting active" }
                                  ].map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({...prev, hostingStatus: opt.value}));
                                        setIsHostingOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                        formData.hostingStatus === opt.value
                                          ? "bg-[#00AEEF]/10 text-[#00AEEF]"
                                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {formData.hostingStatus === opt.value && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#00AEEF] shrink-0 ml-2" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Additional Requirements (Optional)</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold focus:outline-none  focus:border-[#00AEEF] focus:ring-4 focus:ring-[#00AEEF]/10 focus:bg-white transition-all text-slate-800 resize-none"
                        placeholder="Detail any target regions, payment configurations, or timeline expectations here..."
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleWhatsAppSubmit}
                        disabled={!formData.name || !formData.phone}
                        className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/30 hover:shadow-[#25D366]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.99] cursor-pointer"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">Submit Partner Request via WhatsApp</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                      
                      <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" /> Fast Integration Desk Onboarding
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated Accordions Frequently Asked Questions */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
                    <HelpCircle className="w-4.5 h-4.5 text-indigo-600" /> General Partnership Inquiries
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        q: "Are there licensing charges for the web storefront software?", 
                        a: "No. The standard, fully integrated React-Vite agency codebase template is provided entirely free. Your only external operational expenses are your custom domain name (e.g., yourname.com) and basic cloud hosting." 
                      },
                      { 
                        q: "What is the automated revenue generation framework?", 
                        a: "Our API provides access to virtual numbers at wholesale tiers. You establish your customized price spreads and retail margins inside your website database. When customers buy from you, the markup represents 100% of your automated net income." 
                      },
                      { 
                        q: "Is engineering or web development experience required?", 
                        a: "No coding background is needed. The partner storefront works completely out-of-the-box. We provide a straightforward, self-contained installation playbook to connect to your domain and API key seamlessly." 
                      },
                      { 
                        q: "How are client purchase funds processed?", 
                        a: "You integrate your preferred checkout configurations (local mobile gateways, Binance Pay, Card processing, etc.) directly on your independent domain. Client revenue lands directly in your merchant account; you only fund your ZeroX API wholesale balance." 
                      }
                    ].map((faq, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                          className="w-full text-left px-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 transition-colors flex justify-between items-center cursor-pointer"
                        >
                          <span className="font-bold text-slate-700 text-xs sm:text-sm">{faq.q}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${faqOpen === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {faqOpen === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 py-3.5 bg-white text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-100 font-light">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
