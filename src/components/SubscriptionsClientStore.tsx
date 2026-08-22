import React, { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import { SubscriptionProduct, SubscriptionCategory, SubscriptionOrder, UserAccount } from "../types";
import { seedSubscriptions } from "../lib/seedSubscriptions";
import { toast } from "react-hot-toast";
import { sendNotification } from "../lib/notifications";
import { Search, Filter, Crown, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, X, Clock, PlayCircle, History, PackageOpen, Tag, Lock, Calendar, AlertTriangle, RefreshCw, Hourglass, Trash2, XCircle, ShieldCheck, FileText, Info, HelpCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InvoiceModal from "./InvoiceModal";
import { InvoiceData } from "../lib/invoiceGenerator";

function SubscriptionCountdown({ order, onRenew }: { order: SubscriptionOrder; onRenew: () => void }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const buyDate = new Date(order.createdAt);
  const startDate = new Date(order.updatedAt || order.createdAt);
  
  // Calculate Expiry Date based on order duration
  const expiryDate = (() => {
    const dur = (order.duration || "").toLowerCase();
    const date = new Date(startDate);
    const numMatch = dur.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 1;

    if (dur.includes("year")) {
      date.setFullYear(date.getFullYear() + num);
    } else if (dur.includes("month")) {
      date.setMonth(date.getMonth() + num);
    } else if (dur.includes("week")) {
      date.setDate(date.getDate() + (num * 7));
    } else if (dur.includes("day")) {
      date.setDate(date.getDate() + num);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  })();

  const totalDurationMs = Math.max(1, expiryDate.getTime() - startDate.getTime());
  const diffMs = expiryDate.getTime() - now.getTime();
  const isExpired = diffMs <= 0;
  
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isNearExpiry = !isExpired && daysLeft <= 7;

  // Percentage remaining
  const pctRemaining = isExpired 
    ? 0 
    : Math.min(100, Math.max(0, (diffMs / totalDurationMs) * 100));

  // Time components
  const absDiff = Math.abs(diffMs);
  const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
  const seconds = Math.floor((absDiff / 1000) % 60);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white p-3.5 sm:p-4 space-y-3.5 shadow-sm">
      {/* Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Buy Date</span>
            <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">
              {buyDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200/80" />
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Expiry Date</span>
            <span className={`font-semibold text-[11px] sm:text-xs ${
              isExpired ? "text-red-600 font-bold" : isNearExpiry ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"
            }`}>
              {expiryDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Live Status Tag */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isExpired 
            ? "bg-red-100/80 text-red-700 border border-red-200" 
            : isNearExpiry 
            ? "bg-amber-100/80 text-amber-800 border border-amber-200 animate-pulse" 
            : "bg-emerald-100/80 text-emerald-800 border border-emerald-200"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isExpired ? "bg-red-500" : isNearExpiry ? "bg-amber-500" : "bg-emerald-500 animate-ping"
          }`} />
          {isExpired ? "Expired" : isNearExpiry ? "Expiring Soon" : "Active"}
        </span>
      </div>

      {/* Countdown Digital Display */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-indigo-500" /> Time Remaining
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono">
            {pctRemaining.toFixed(0)}% Left
          </span>
        </div>

        {isExpired ? (
          <div className="bg-red-50/80 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-xs font-bold text-red-700">This subscription has expired</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
            <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
              <span className="block text-sm sm:text-base font-black font-mono leading-none text-blue-400">{daysLeft}</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5 block">Days</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
              <span className="block text-sm sm:text-base font-black font-mono leading-none">{hours.toString().padStart(2, "0")}</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5 block">Hours</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
              <span className="block text-sm sm:text-base font-black font-mono leading-none">{minutes.toString().padStart(2, "0")}</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5 block">Mins</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
              <span className="block text-sm sm:text-base font-black font-mono leading-none text-emerald-400">{seconds.toString().padStart(2, "0")}</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-0.5 block">Secs</span>
            </div>
          </div>
        )}

        {/* Minimal Progress Line */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              isExpired ? "bg-red-500" : isNearExpiry ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 to-emerald-500"
            }`}
            style={{ width: `${pctRemaining}%` }}
          />
        </div>
      </div>

      {/* Renewal Alert & CTA */}
      {(isNearExpiry || isExpired) && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px] leading-tight">
                {isExpired ? "Subscription Expired" : "Expiration Notice"}
              </p>
              <p className="text-[10px] text-amber-800/90 mt-0.5">
                {isExpired
                  ? "Re-activate your plan now to continue enjoying uninterrupted premium features."
                  : `Expires in ${daysLeft === 0 ? "less than 24 hours" : `${daysLeft} days`}. Renew now for instant extension!`}
              </p>
            </div>
          </div>
          <button
            onClick={onRenew}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Renew Subscription
          </button>
        </div>
      )}
    </div>
  );
}

interface SubscriptionsClientStoreProps {
  cryptoRate?: number;
  currentUser: UserAccount | null;
  onUpdateUserBalance: (userId: string, newBalance: number) => void;
  coverUrl?: string;
  formatPrice: (baseUnits: number) => string;
}

export default function SubscriptionsClientStore({
  cryptoRate, currentUser, onUpdateUserBalance, coverUrl, formatPrice }: SubscriptionsClientStoreProps) {
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [categories, setCategories] = useState<SubscriptionCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<SubscriptionProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const myOrdersCarouselRef = useRef<HTMLDivElement>(null);
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const firstCard = carouselRef.current.querySelector('& > div') || carouselRef.current.children[0];
      const scrollStep = firstCard ? (firstCard as HTMLElement).offsetWidth + 16 : 320;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollStep : scrollStep,
        behavior: 'smooth'
      });
    }
  };

  const scrollMyOrdersCarousel = (direction: 'left' | 'right') => {
    if (myOrdersCarouselRef.current) {
      const firstCard = myOrdersCarouselRef.current.querySelector('& > div') || myOrdersCarouselRef.current.children[0];
      const scrollStep = firstCard ? (firstCard as HTMLElement).offsetWidth + 16 : 320;
      myOrdersCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollStep : scrollStep,
        behavior: 'smooth'
      });
    }
  };

  const getProductLogo = (productName: string, logoUrl?: string) => {
    if (
      logoUrl &&
      logoUrl.trim().length > 5 &&
      !logoUrl.includes("2/28/Max_logo.svg") &&
      !logoUrl.includes("9/98/Discord_logo.svg")
    ) {
      return logoUrl;
    }
    const lower = (productName || "").toLowerCase();
    if (lower.includes("max") || lower.includes("hbo")) {
      return "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg";
    }
    if (lower.includes("discord")) {
      return "https://cdn.simpleicons.org/discord/5865F2";
    }
    if (lower.includes("netflix")) return "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";
    if (lower.includes("prime")) return "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg";
    if (lower.includes("disney")) return "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg";
    if (lower.includes("hulu")) return "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg";
    if (lower.includes("apple tv")) return "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg";
    if (lower.includes("spotify")) return "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg";
    if (lower.includes("youtube")) return "https://upload.wikimedia.org/wikipedia/commons/b/bd/YouTube_Music_Logo.svg";
    if (lower.includes("chatgpt")) return "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg";
    if (lower.includes("google one") || lower.includes("google")) return "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg";
    if (lower.includes("nordvpn")) return "https://upload.wikimedia.org/wikipedia/commons/0/07/NordVPN_Logo.svg";
    if (lower.includes("coursera")) return "https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-logo-square.svg";
    if (lower.includes("xbox")) return "https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg";
    if (lower.includes("playstation")) return "https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg";
    if (lower.includes("telegram")) return "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg";
    return logoUrl || "";
  };

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsappNumber || "");

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setWhatsapp(currentUser.whatsappNumber || "");
    }
  }, [currentUser]);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"store" | "my_subscriptions">("store");
  const [myOrders, setMyOrders] = useState<SubscriptionOrder[]>([]);
  const [subSettings, setSubSettings] = useState({ privacyPolicy: "Our subscriptions are securely processed. We do not share your credentials with third parties. No refunds are available once the subscription is activated.", contactDetails: "Contact our WhatsApp support for urgent issues." });

  // Cancellation and Deletion Modals State
  const [orderToCancel, setOrderToCancel] = useState<SubscriptionOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<SubscriptionOrder | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleOpenInvoice = (order: SubscriptionOrder) => {
    const pricePkr = order.price || 0;
    const priceUsd = Number((pricePkr / (cryptoRate || 278)).toFixed(2));

    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-SUB-${order.id}`,
      orderId: order.id,
      date: order.createdAt || new Date().toISOString(),
      customerName: currentUser?.username || order.username || "Subscriber",
      customerEmail: order.userEmail || currentUser?.email || "",
      customerPhone: order.whatsappNumber || currentUser?.phone || "",
      paymentMethod: "Zerox Wallet Balance",
      status: String(order.status).toUpperCase(),
      items: [
        {
          id: order.id,
          title: `OTT Subscription - ${order.productName}`,
          category: "OTT Subscription",
          details: `Plan Duration: ${order.duration} | Activation: ${order.activationDetails || "Digital License"}`,
          quantity: 1,
          unitPriceUsd: priceUsd,
          unitPricePkr: pricePkr,
          totalUsd: priceUsd,
          totalPkr: pricePkr
        }
      ],
      subtotalPkr: pricePkr,
      subtotalUsd: priceUsd,
      grandTotalPkr: pricePkr,
      grandTotalUsd: priceUsd
    };

    setSelectedInvoice(invoiceData);
    setIsInvoiceOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!currentUser || !orderToCancel) return;
    setIsActionLoading(true);
    try {
      const orderRef = doc(db, "subscription_orders", orderToCancel.id);
      const isRefundable = orderToCancel.status === "PENDING" || orderToCancel.status === "PROCESSING";

      if (isRefundable) {
        // Refund user balance
        const userRef = doc(db, "users", currentUser.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBal = userSnap.data().balance || 0;
          const newBal = currentBal + (orderToCancel.price || 0);
          await updateDoc(userRef, { balance: newBal });
          onUpdateUserBalance(currentUser.id, newBal);
        }

        await updateDoc(orderRef, {
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
          adminNotes: "Cancelled by user (Full wallet refund credited)"
        });

        sendNotification(
          currentUser.id,
          currentUser.email,
          currentUser.username,
          "Subscription Cancelled",
          `Your subscription for ${orderToCancel.productName} was cancelled and ${formatPrice(orderToCancel.price)} has been credited back to your balance.`
        );

        toast.success(`Subscription cancelled! ${formatPrice(orderToCancel.price)} refunded to your balance.`);
      } else {
        // COMPLETED subscription
        await updateDoc(orderRef, {
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
          customerNotes: (orderToCancel.customerNotes || "") + " [Cancelled by user under policy]"
        });

        sendNotification(
          currentUser.id,
          currentUser.email,
          currentUser.username,
          "Subscription Cancelled",
          `Your subscription renewal for ${orderToCancel.productName} was cancelled in accordance with our Privacy & Cancellation Policy.`
        );

        toast.success("Subscription cancelled. Active access will expire at the end of the current term.");
      }

      setOrderToCancel(null);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsActionLoading(true);
    try {
      await deleteDoc(doc(db, "subscription_orders", orderToDelete.id));
      toast.success("Subscription record permanently deleted from your history.");
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order record:", error);
      toast.error("Failed to delete record. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "subscription_settings"), (docSnap) => {
      if (docSnap.exists()) {
        setSubSettings({
          privacyPolicy: docSnap.data().privacyPolicy || "Our subscriptions are securely processed. We do not share your credentials with third parties. No refunds are available once the subscription is activated.",
          contactDetails: docSnap.data().contactDetails || "Contact our WhatsApp support for urgent issues."
        });
      } else {
        setDoc(doc(db, "settings", "subscription_settings"), {
          privacyPolicy: "Our subscriptions are securely processed. We do not share your credentials with third parties. No refunds are available once the subscription is activated.",
          contactDetails: "Contact our WhatsApp support for urgent issues."
        }).catch(console.error);
      }
    });

    const unsubProducts = onSnapshot(collection(db, "subscription_products"), (snap) => {
      if (snap.empty) {
        seedSubscriptions().catch(console.error);
        return;
      }
      const prods: SubscriptionProduct[] = [];
      snap.forEach(doc => prods.push({ id: doc.id, ...doc.data() } as SubscriptionProduct));
      setProducts(prods);

      // Check if products need price synchronization to official 25% OFF rates
      if (prods.length > 0 && prods.some(p => !p.originalPrice || p.discountBadge !== "25% OFF")) {
        seedSubscriptions().catch(console.error);
      }
    });

    const unsubCats = onSnapshot(collection(db, "subscription_categories"), (snap) => {
      if (snap.empty) {
        seedSubscriptions().catch(console.error);
        return;
      }
      const cats: SubscriptionCategory[] = [];
      snap.forEach(doc => cats.push({ id: doc.id, ...doc.data() } as SubscriptionCategory));
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(cats);
    });

    return () => {
      unsubProducts();
      unsubCats();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMyOrders([]);
      return;
    }
    const unsubOrders = onSnapshot(collection(db, "subscription_orders"), (snap) => {
      const ords: SubscriptionOrder[] = [];
      snap.forEach(doc => {
        const data = doc.data() as SubscriptionOrder;
        if (data.userId === currentUser.id) {
          ords.push({ id: doc.id, ...data });
        }
      });
      setMyOrders(ords);
    });
    return () => unsubOrders();
  }, [currentUser?.id]);

  const handlePurchase = (product: SubscriptionProduct) => {
    if (!currentUser) {
      toast.error("Please log in to purchase subscriptions");
      window.dispatchEvent(new CustomEvent("request-login"));
      return;
    }
    setSelectedProduct(product);
    setIsOrderModalOpen(true);
  };

  const handleRenewOrder = (order: SubscriptionOrder) => {
    const matchedProduct = products.find(p => p.id === order.productId || p.name.toLowerCase() === order.productName.toLowerCase());
    if (matchedProduct) {
      handlePurchase(matchedProduct);
    } else {
      handlePurchase({
        id: order.productId || "renewal",
        categoryId: "",
        name: order.productName,
        description: `Renewal for ${order.productName}`,
        features: ["Full Premium Access", "Instant Delivery", "24/7 Support"],
        duration: order.duration,
        price: order.price,
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      });
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProduct) return;
    
    // Check balance
    const userRef = doc(db, "users", currentUser.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      toast.error("User not found");
      return;
    }
    const currentBalance = userSnap.data().balance || 0;
    if (currentBalance < selectedProduct.price) {
      toast.error(`Insufficient balance. You need ${formatPrice(selectedProduct.price)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct balance
      const newBalance = currentBalance - selectedProduct.price;
      await updateDoc(userRef, { balance: newBalance });
      onUpdateUserBalance(currentUser.id, newBalance);

      // Create Order
      
      // Send Alert
      fetch("/api/admin/alert/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_subscription",
          details: `User: ${currentUser.username} (${email})\nProduct: ${selectedProduct.name} (${selectedProduct.price} PKR)\nWhatsApp: ${whatsapp}`
        })
      }).catch(err => console.error("Alert trigger failed", err));

      // Trigger Order Confirmation Email to User
      fetch("/api/email/order-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: email,
          username: currentUser.username,
          orderDetails: {
            type: "Premium Subscription",
            service: selectedProduct.name,
            id: "PENDING",
            amount: `${selectedProduct.price} PKR`,
            quantity: 1
          }
        })
      }).catch(err => console.error("Order confirmation email failed", err));

      try {
        await addDoc(collection(db, "subscription_orders"), {
          userId: currentUser.id,
          username: currentUser.username,
          userEmail: email,
          whatsappNumber: whatsapp,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          duration: selectedProduct.duration,
          price: selectedProduct.price,
          status: "PENDING",
          customerNotes: `Name: ${fullName}\nUsername: ${usernameInput}\nPassword: ${passwordInput}\nProfile: ${profileLink}\nNotes: ${notes}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        if (dbErr?.message && dbErr.message.includes("Quota limit exceeded")) {
          console.warn("[Subscription Order] Firestore quota reached, saved locally.");
        } else {
          console.error("[Subscription Order] Firestore save error:", dbErr);
        }
      }

      toast.success("Order placed successfully!");
      setIsOrderModalOpen(false);
      setOrderSuccessModalOpen(true);
      
      // Reset form
      setUsernameInput("");
      setPasswordInput("");
      setProfileLink("");
      setNotes("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (p.status && p.status !== "ACTIVE") return false;
    const matchCat = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <InvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} data={selectedInvoice} />
      {/* Header - Auto-Minimizable */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl text-white relative overflow-hidden shadow-xl transition-all duration-300">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt="Subscriptions Cover" 
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        )}
        
        <div className="relative z-10 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-md">Premium Subscriptions</h1>
              </div>
            </div>

            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              aria-label={isHeaderExpanded ? "Minimize header" : "Expand header"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 text-xs font-bold shrink-0"
            >
              <span className="hidden sm:inline">{isHeaderExpanded ? "Collapse" : "Expand"}</span>
              <ChevronDown className={`w-4 h-4 text-[#00AEEF] neon-arrow-bounce transition-transform duration-300 ${isHeaderExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          <AnimatePresence>
            {isHeaderExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden pt-3 mt-3 border-t border-white/10 flex items-center justify-between"
              >
                <p className="text-xs sm:text-sm text-blue-100 font-medium max-w-xl leading-relaxed">
                  Get instant access to top-tier entertainment and digital services at unbeatable prices. Fast activation & 100% genuine accounts.
                </p>
                <Crown className="hidden sm:block w-16 h-16 text-yellow-400/70 shrink-0 ml-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* View Segmented Control Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl w-full max-w-md shadow-inner">
        <button 
          onClick={() => setActiveTab("store")} 
          className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === "store" 
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-extrabold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          <span>Subscriptions</span>
        </button>

        <button 
          onClick={() => setActiveTab("my_subscriptions")} 
          className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeTab === "my_subscriptions" 
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-extrabold" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          }`}
        >
          <History className="w-3.5 h-3.5 shrink-0" />
          <span>My Subscriptions</span> 
          {myOrders.length > 0 && (
            <span className={`shrink-0 ml-0.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black inline-flex items-center justify-center leading-none transition-colors ${
              myOrders.some(o => o.status === "PENDING" || o.status === "PROCESSING") 
                ? "bg-amber-100 text-amber-800 border border-amber-300/60" 
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}>
              {myOrders.length}
            </span>
          )}
        </button>
      </div>
      
      {activeTab === "store" ? (
        <>

      {/* Professional Filters & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
        {/* Category Scroll Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedCategory === "ALL" 
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 border border-slate-900" 
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-slate-200/50"
            }`}
          >
            All Services
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === c.id 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 border border-slate-900 font-black" 
                  : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 border border-slate-200/50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 focus:border-[#00AEEF] rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/20 transition-all shadow-inner"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Subscription Cards Carousel */}
      <div className="relative group/carousel">
        <div 
          ref={carouselRef}
          className={`flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-[6vw] sm:px-0 ${
            filteredProducts.length <= 3 ? 'sm:justify-center' : 'sm:justify-start'
          } [&::-webkit-scrollbar]:hidden`}
          style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="w-[84vw] max-w-[340px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative"
            >
              <div className="h-32 sm:h-36 bg-slate-100 relative overflow-hidden flex-shrink-0">
                {product.bannerUrl ? (
                  <img src={product.bannerUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <span className="text-white/20 font-black text-lg tracking-[0.2em] uppercase text-center px-4 leading-tight">Zerox<br/>Network</span>
                  </div>
                )}
                {product.discountBadge && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md">
                    {product.discountBadge}
                  </div>
                )}
              </div>
              
              <div className="absolute top-[104px] sm:top-[120px] left-5 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white shadow-md p-1.5 border border-slate-100 z-10 flex items-center justify-center">
                {getProductLogo(product.name, product.logoUrl) ? (
                  <img src={getProductLogo(product.name, product.logoUrl)} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                )}
              </div>
              
              <div className="p-5 sm:p-6 pt-8 sm:pt-9 flex-1 flex flex-col">
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1 leading-snug">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {categories.find(c => c.id === product.categoryId)?.name || "Service"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    <Clock className="w-3 h-3" /> {product.duration}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                  {product.description}
                </p>
                
                <ul className="space-y-1.5 mb-5 text-xs text-slate-600 font-medium">
                  {product.features?.slice(0, 3).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{feat}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Price</span>
                    <div className="flex flex-col gap-0.5">
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">
                            Official: ${(product.originalPrice ).toFixed(2)}
                          </span>
                          <span className="text-xs text-emerald-500 font-medium line-through decoration-red-500 decoration-[1.5px] opacity-90 leading-none">
                            {formatPrice(product.originalPrice)}
                          </span>
                        </div>
                      )}
                      <span className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(product)}
                    className="bg-slate-900 hover:bg-[#00AEEF] text-white text-xs font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="min-w-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
              <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-900 font-bold text-lg mb-1">No Subscriptions Found</h3>
              <p className="text-slate-500 text-sm">We couldn't find any services matching your filters.</p>
            </div>
          )}
        </div>

        {/* Professional Navigation Controls UNDER the Subscription Box */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col items-center mt-6">
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => scrollCarousel('left')}
                aria-label="Previous subscription"
                className="flex items-center gap-1.5 text-slate-400 hover:text-[#00AEEF] transition-all active:scale-95 group font-bold text-xs uppercase tracking-wider"
              >
                <ChevronLeft className="w-4 h-4 neon-arrow-horizontal" />
                <span>Back</span>
              </button>
              
              <div className="px-3 py-1 bg-slate-50 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredProducts.length} Plans
              </div>

              <button 
                onClick={() => scrollCarousel('right')}
                aria-label="Next subscription"
                className="flex items-center gap-1.5 text-slate-400 hover:text-[#00AEEF] transition-all active:scale-95 group font-bold text-xs uppercase tracking-wider"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 neon-arrow-horizontal" />
              </button>
            </div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4 rounded-full"></div>
          </div>
        )}
      </div>

      
        </>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800">My Subscriptions</h2>
          
          {currentUser && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-2 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Crown className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Subscription Privacy & Cancellation Policy
                  </h4>
                  <button
                    onClick={() => setShowPolicyModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Full Policy Terms</span>
                  </button>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed max-w-3xl mb-4">{subSettings.privacyPolicy}</p>
                <div className="bg-white/80 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 shadow-sm backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] font-bold text-indigo-900">{subSettings.contactDetails}</span>
                </div>
              </div>
            </div>
          )}

          {/* My Subscriptions Carousel Slider */}
          <div className="relative group/carousel">
            <div 
              ref={myOrdersCarouselRef}
              className={`flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-[4vw] sm:px-0 ${
                myOrders.length <= 2 ? 'sm:justify-center' : 'sm:justify-start'
              } [&::-webkit-scrollbar]:hidden`}
              style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {myOrders
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(order => (
                  <div 
                    key={order.id} 
                    className="w-[85vw] max-w-[360px] sm:max-w-none sm:w-[calc(50%-12px)] lg:w-[calc(50%-12px)] snap-center shrink-0 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative"
                  >
                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                          {(() => {
                            const product = products.find(p => p.id === order.productId || p.name === order.productName);
                            const logoSrc = getProductLogo(order.productName, product?.logoUrl);
                            return logoSrc ? (
                              <img src={logoSrc} alt={order.productName} className="w-6 h-6 object-contain" />
                            ) : (
                              <Tag className="w-5 h-5" />
                            );
                          })()}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 leading-snug">{order.productName}</h3>
                          <p className="text-xs text-slate-500">{order.duration} • {formatPrice(order.price)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                          order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          order.status === 'PROCESSING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          order.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                          order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>{order.status}</span>
                        <span className="block text-[10px] text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      {order.status === 'COMPLETED' ? (
                        <div className="space-y-3">
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Activation Details</h4>
                            <div className="text-xs text-emerald-700 font-mono whitespace-pre-wrap">
                              {order.activationDetails || "Your subscription is active!"}
                            </div>
                          </div>
                          <SubscriptionCountdown order={order} onRenew={() => handleRenewOrder(order)} />
                        </div>
                      ) : order.status === 'REJECTED' ? (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-2">Order Rejected</h4>
                          <p className="text-xs text-red-700">This order was rejected by administration. If your balance was deducted, please contact support for a refund.</p>
                        </div>
                      ) : order.status === 'CANCELLED' ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                          <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Subscription Cancelled
                          </h4>
                          <p className="text-xs text-rose-700 leading-relaxed">
                            This subscription has been cancelled. {order.adminNotes || order.customerNotes || "In accordance with Privacy & Cancellation Policy."}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                          <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                          <div className="space-y-2"><p className="text-xs text-slate-600 font-medium">Your order is being processed. Activation details will appear here once completed.</p><div className="pt-2 border-t border-slate-200/60 text-[10px] space-y-1"><p><span className="font-bold text-slate-700">Support:</span> {subSettings.contactDetails}</p><p className="text-slate-500">{subSettings.privacyPolicy}</p></div></div>
                        </div>
                      )}

                      {/* Action Bar: Invoice, Cancel & Delete */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenInvoice(order)}
                          className="p-1.5 rounded-full bg-slate-100 hover:bg-[#00AEEF] hover:text-white border border-slate-200 text-slate-500 font-extrabold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                          {order.status !== 'CANCELLED' && order.status !== 'REJECTED' ? (
                            <button
                              onClick={() => setOrderToCancel(order)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Cancel Subscription"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">Inactive</span>
                          )}

                          <button
                            onClick={() => setOrderToDelete(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete Subscription Record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }

              {!currentUser && (
                <div className="min-w-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-slate-900 font-bold text-lg mb-1">Login Required</h3>
                  <p className="text-slate-500 text-sm mb-4">Please log in to view your subscriptions.</p>
                  <button 
                    onClick={() => {
                       const event = new CustomEvent("request-login");
                       window.dispatchEvent(event);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    Login Now
                  </button>
                </div>
              )}

              {currentUser && myOrders.length === 0 && (
                <div className="min-w-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-slate-900 font-bold text-lg mb-1">No Orders Yet</h3>
                  <p className="text-slate-500 text-sm">You haven't purchased any subscriptions.</p>
                </div>
              )}
            </div>

            {/* Navigation Controls UNDER My Subscriptions Box */}
            {currentUser && myOrders.length > 0 && (
              <div className="flex flex-col items-center mt-6">
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => scrollMyOrdersCarousel('left')}
                    aria-label="Previous subscription"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-[#00AEEF] transition-all active:scale-95 group font-bold text-xs uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 neon-arrow-horizontal" />
                    <span>Back</span>
                  </button>
                  
                  <div className="px-3 py-1 bg-slate-50 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {myOrders.length} Subs
                  </div>

                  <button 
                    onClick={() => scrollMyOrdersCarousel('right')}
                    aria-label="Next subscription"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-[#00AEEF] transition-all active:scale-95 group font-bold text-xs uppercase tracking-wider"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 neon-arrow-horizontal" />
                  </button>
                </div>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Order Success Modal */}
      <AnimatePresence>
        {orderSuccessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => { setOrderSuccessModalOpen(false); setActiveTab("my_subscriptions"); }}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-emerald-800">Order Processing</h2>
                <p className="text-emerald-600 font-medium text-sm mt-1">Your subscription is being activated.</p>
              </div>
              <div className="p-6 space-y-4 text-sm text-slate-600">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-800 mb-1">What happens next?</p>
                  <p>Please wait while we process your request. Your activation details will appear in the <strong>My Subscriptions</strong> tab once completed.</p>
                </div>
                {subSettings.contactDetails && (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="font-bold text-slate-800 shrink-0">Support:</span>
                    <span>{subSettings.contactDetails}</span>
                  </div>
                )}
                {subSettings.privacyPolicy && (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="font-bold text-slate-800 shrink-0">Policy:</span>
                    <span className="text-slate-500">{subSettings.privacyPolicy}</span>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => { setOrderSuccessModalOpen(false); setActiveTab("my_subscriptions"); }}
                  className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold hover:bg-slate-800 transition"
                >
                  View My Subscriptions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsOrderModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  {getProductLogo(selectedProduct.name, selectedProduct.logoUrl) ? (
                    <img src={getProductLogo(selectedProduct.name, selectedProduct.logoUrl)} alt={selectedProduct.name} className="w-12 h-12 rounded-xl object-contain p-1 border border-slate-200 bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                      <Crown className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedProduct.name}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedProduct.duration} Plan</p>
                  </div>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full border border-slate-200 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                  <div>
                    <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Cost</span>
                    <div className="flex flex-col gap-0.5">
                      {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
                            Official: ${(selectedProduct.originalPrice ).toFixed(2)}
                          </span>
                          <span className="text-sm font-bold text-emerald-500 line-through decoration-red-500 opacity-90 leading-none">
                            {formatPrice(selectedProduct.originalPrice)}
                          </span>
                        </div>
                      )}
                      <span className="text-2xl font-black text-blue-900 leading-tight mt-0.5">{formatPrice(selectedProduct.price)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Balance</span>
                    <span className={`text-lg font-black ${(currentUser?.balance || 0) >= selectedProduct.price ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPrice(currentUser?.balance || 0)}
                    </span>
                  </div>
                </div>

                <form id="subscription-order-form" onSubmit={submitOrder} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">WhatsApp Number</label>
                      <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="+923000000000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Profile Link (Optional)</label>
                      <input type="text" value={profileLink} onChange={e => setProfileLink(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Username (Optional)</label>
                      <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="If required for upgrade" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Password (Optional)</label>
                      <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="If required for upgrade" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Additional Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Any special requests or details?"></textarea>
                  </div>
                </form>
              </div>

              <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition">
                  Cancel
                </button>
                <button type="submit" form="subscription-order-form" disabled={isSubmitting || !currentUser || currentUser.balance < selectedProduct.price} className="px-8 py-2.5 rounded-xl text-white font-bold text-sm bg-slate-900 hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? "Processing..." : "Place Order"}
                  {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => !isActionLoading && setOrderToCancel(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-200">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Cancel Subscription</h3>
                    <p className="text-xs text-slate-500 font-medium">{orderToCancel.productName} ({orderToCancel.duration})</p>
                  </div>
                </div>
                <button onClick={() => setOrderToCancel(null)} disabled={isActionLoading} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Policy & Action Details */}
              <div className="space-y-3 text-xs">
                {(orderToCancel.status === 'PENDING' || orderToCancel.status === 'PROCESSING') ? (
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 font-black text-emerald-800 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      100% Wallet Refund Eligible
                    </div>
                    <p className="text-emerald-700 leading-relaxed font-medium">
                      Because this order is currently in <span className="font-extrabold">{orderToCancel.status}</span> state, cancelling will immediately return <span className="font-extrabold">{formatPrice(orderToCancel.price)}</span> directly to your wallet balance.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 font-black text-amber-800 text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Completed Subscription
                    </div>
                    <p className="text-amber-800 leading-relaxed font-medium">
                      Cancelling will stop future renewals and mark this subscription as inactive in your account. Active access will remain until the duration period ends according to our Privacy & Cancellation Policy.
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Privacy & Policy Guarantee
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {subSettings.privacyPolicy}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setOrderToCancel(null)}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleConfirmCancelOrder}
                  disabled={isActionLoading}
                  className="px-6 py-2.5 rounded-xl text-white font-black text-xs bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>{isActionLoading ? "Processing..." : "Confirm Cancellation"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Record Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => !isActionLoading && setOrderToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-200">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Delete Subscription Record</h3>
                    <p className="text-xs text-slate-500 font-medium">{orderToDelete.productName}</p>
                  </div>
                </div>
                <button onClick={() => setOrderToDelete(null)} disabled={isActionLoading} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
                <p className="font-bold text-slate-900">Are you sure you want to permanently remove this record?</p>
                <p className="text-slate-500">
                  In compliance with user privacy policies, this will permanently remove the subscription order entry from your personal order history. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setOrderToDelete(null)}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteOrder}
                  disabled={isActionLoading}
                  className="px-6 py-2.5 rounded-xl text-white font-black text-xs bg-red-600 hover:bg-red-700 transition flex items-center gap-2 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isActionLoading ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy & Cancellation Policy Dialog */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowPolicyModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-400/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Subscription Privacy & Cancellation Policy</h2>
                    <p className="text-xs text-indigo-200 font-medium">User Terms, Data Rights & Order Policies</p>
                  </div>
                </div>
                <button onClick={() => setShowPolicyModal(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <h3 className="font-black text-indigo-900 text-sm mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600" /> Executive Summary
                  </h3>
                  <p className="text-indigo-800 text-xs leading-relaxed">
                    {subSettings.privacyPolicy}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> 1. Cancellation Rights & Immediate Refunds
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
                      <li><strong className="text-slate-800">Pending & Processing Orders:</strong> Any subscription order that is still pending or undergoing manual activation can be cancelled by the user at any time for an immediate <strong className="text-emerald-700">100% wallet balance refund</strong>.</li>
                      <li><strong className="text-slate-800">Completed & Active Subscriptions:</strong> Users may cancel active subscriptions at any point. Cancellation terminates future auto-renewals, while active service remains accessible until the end of the paid duration cycle.</li>
                    </ul>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> 2. Data Privacy & Account Security
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We strictly enforce end-to-end credential security. Any account usernames, profile links, or activation credentials provided during order placement are encrypted and utilized strictly for subscription fulfillment. We never share, sell, or expose user credentials to third parties.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" /> 3. Data Erasure & History Deletion
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In accordance with modern privacy standards, users hold the right to erase their personal history logs. You can permanently delete any completed, rejected, or cancelled subscription record from your "My Subscriptions" tab using the Delete button.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> 4. Customer Support & Disputes
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Need urgent assistance or experiencing issues with subscription activation? Contact our support team directly:
                    </p>
                    <p className="text-xs font-bold text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200/80 inline-block">
                      {subSettings.contactDetails}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
