import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { 
  Globe, ShoppingCart, Link as LinkIcon, HelpCircle, Clock, Info, 
  RefreshCw, ExternalLink, ChevronDown, Search, Sparkles, AlertCircle, Wallet, FileText,
  RotateCcw, CheckCircle2, XCircle, AlertTriangle, Download, Layers, ListFilter,
  Zap, ArrowRight, ShieldCheck, Check, Copy, TrendingUp, BarChart3, Eye, Sparkle,
  Play, X
} from "lucide-react";
import { SmmCategory, SmmService, SmmOrder, SmmLog, SmmProvider, UserAccount } from "../types";
import CurrencyDisplay from "./CurrencyDisplay";
import SmmReceiptModal from "./SmmReceiptModal";
import SmmHowToOrderTutorial from "./SmmHowToOrderTutorial";
import { InvoiceData } from "../lib/invoiceGenerator";
import { sanitizeUrl, isSafeUrl } from "../lib/security";

interface SmmClientStoreProps {
  cryptoRate?: number;
  currentUser: UserAccount | null;
  smmCategories: SmmCategory[];
  smmServices: SmmService[];
  smmOrders: SmmOrder[];
  setSmmOrders: React.Dispatch<React.SetStateAction<SmmOrder[]>>;
  smmLogs: SmmLog[];
  setSmmLogs: React.Dispatch<React.SetStateAction<SmmLog[]>>;
  onUpdateUserBalance: (userId: string, newBalance: number) => void;
  setActiveTab: (tab: any) => void;
  onInsufficientBalance?: (neededPkr: number, neededUsd: number, userBalancePkr: number, serviceName: string) => void;
  smmProviders?: SmmProvider[];
  smmCoverUrl?: string;
  formatPrice: (baseUnits: number) => string;
}

interface SmmPlatformShortcut {
  id: string;
  name: string;
  keywords: string[];
  placeholder: string;
  svg: React.ReactNode;
}

const SMM_PLATFORMS: SmmPlatformShortcut[] = [
  {
    id: "all",
    name: "All Platforms",
    keywords: [],
    placeholder: "https://example.com/target-link or @username",
    svg: <Sparkles className="w-4 h-4 text-[#00AEEF] shrink-0" />
  },
  {
    id: "instagram",
    name: "Instagram",
    keywords: ["instagram", "ig", "insta", "reels", "story", "stories"],
    placeholder: "https://instagram.com/username or https://instagram.com/p/...",
    svg: (
      <svg className="w-4 h-4 fill-current text-pink-500 shrink-0" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  },
  {
    id: "tiktok",
    name: "TikTok",
    keywords: ["tiktok", "tt", "tok", "douyin"],
    placeholder: "https://www.tiktok.com/@username/video/...",
    svg: (
      <svg className="w-4 h-4 fill-current text-cyan-400 shrink-0" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    )
  },
  {
    id: "youtube",
    name: "YouTube",
    keywords: ["youtube", "yt", "shorts", "subscribers", "watch", "channel"],
    placeholder: "https://www.youtube.com/watch?v=... or channel link",
    svg: (
      <svg className="w-4 h-4 fill-current text-red-500 shrink-0" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  {
    id: "telegram",
    name: "Telegram",
    keywords: ["telegram", "tg", "channel", "members", "post", "t.me"],
    placeholder: "https://t.me/channel_username or post link",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#0088cc] shrink-0" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
      </svg>
    )
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    keywords: ["whatsapp", "wa", "channel", "community"],
    placeholder: "https://whatsapp.com/channel/... or invite link",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#25D366] shrink-0" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    )
  },
  {
    id: "facebook",
    name: "Facebook",
    keywords: ["facebook", "fb", "page", "group", "profile"],
    placeholder: "https://facebook.com/page or post link",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#1877F2] shrink-0" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  {
    id: "twitter",
    name: "X / Twitter",
    keywords: ["twitter", "x.com", " x ", "x -", "x/", "tweet"],
    placeholder: "https://x.com/username or tweet link",
    svg: (
      <svg className="w-4 h-4 fill-current text-slate-800 shrink-0" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  {
    id: "spotify",
    name: "Spotify",
    keywords: ["spotify", "music", "streams", "playlist", "track", "artist"],
    placeholder: "https://open.spotify.com/track/... or playlist link",
    svg: (
      <svg className="w-4 h-4 fill-current text-emerald-500 shrink-0" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C13.62 9.9 19.08 10.56 22.8 12.84c.36.18.54.78.161 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/>
      </svg>
    )
  },
  {
    id: "discord",
    name: "Discord",
    keywords: ["discord", "server", "members"],
    placeholder: "https://discord.gg/invite-code",
    svg: (
      <svg className="w-4 h-4 fill-current text-[#5865F2] shrink-0" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
  {
    id: "snapchat",
    name: "Snapchat",
    keywords: ["snapchat", "snap", "score", "spotlight"],
    placeholder: "https://www.snapchat.com/add/username",
    svg: (
      <svg className="w-4 h-4 fill-current text-amber-400 shrink-0" viewBox="0 0 24 24">
        <path d="M12.002 0c-4.184 0-6.842 2.92-6.842 5.894 0 1.838.835 3.125 1.39 3.985.228.353.313.486.27.653-.063.245-.36.425-.792.518-.387.084-1.01.127-1.634.33-.872.285-1.573 1.086-1.573 1.95 0 .762.484 1.342 1.22 1.458.558.088.887.353 1.077.625.3.432.227 1.028-.158 1.488-.508.608-1.503 1.32-2.88 1.442-.457.04-.847.375-.958.82-.128.513.123.958.653 1.155 1.706.634 3.935.894 6.096.894 1.332 0 2.486-.098 3.535-.295 1.05.197 2.203.295 3.535.295 2.16 0 4.39-.26 6.096-.894.53-.197.78-.642.653-1.155-.11-.445-.502-.78-.958-.82-1.378-.122-2.373-.834-2.88-1.442-.385-.46-.458-1.056-.158-1.488.19-.272.52-.537 1.077-.625.736-.116 1.22-.696 1.22-1.458 0-.864-.701-1.665-1.573-1.95-.624-.203-1.247-.246-1.634-.33-.432-.093-.73-.273-.792-.518-.043-.167.042-.3.27-.653.555-.86 1.39-2.147 1.39-3.985C18.844 2.92 16.186 0 12.002 0z"/>
      </svg>
    )
  }
];

export default function SmmClientStore({
  cryptoRate = 278,
  currentUser,
  smmCategories,
  smmServices,
  smmOrders,
  setSmmOrders,
  smmLogs,
  setSmmLogs,
  onUpdateUserBalance,
  setActiveTab,
  onInsufficientBalance,
  smmProviders = [],
  smmCoverUrl,
  formatPrice
}: SmmClientStoreProps) {
  // Navigation Mode: "order" | "mass" | "pricelist" | "tracking"
  const [activeMode, setActiveMode] = useState<"order" | "mass" | "pricelist" | "tracking">("order");

  // Client single order states
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [targetLink, setTargetLink] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [refillLoadingId, setRefillLoadingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState<boolean>(true);
  const [successReceiptOrder, setSuccessReceiptOrder] = useState<{ order: SmmOrder, service: SmmService } | null>(null);
  const [historyReceiptOrder, setHistoryReceiptOrder] = useState<{ order: SmmOrder, service: SmmService } | null>(null);

  // Mass Order States
  const [massOrderText, setMassOrderText] = useState<string>("");
  const [isMassOrdering, setIsMassOrdering] = useState<boolean>(false);

  // Price List States
  const [priceListSearch, setPriceListSearch] = useState<string>("");
  const [priceListPlatform, setPriceListPlatform] = useState<string>("all");

  // Dropdown states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState<boolean>(false);
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [serviceSearch, setServiceSearch] = useState<string>("");

  // Dedicated "How to Order" Interactive Walkthrough Tutorial States
  const [showSmmTutorial, setShowSmmTutorial] = useState<boolean>(false);
  const [showSmmTutorialHint, setShowSmmTutorialHint] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("zerox_smm_tutorial_hint_dismissed") !== "true";
    }
    return true;
  });
  const [isSmmGuideMinimized, setIsSmmGuideMinimized] = useState<boolean>(true);

  const handleStartSmmTutorial = () => {
    setShowSmmTutorial(true);
    setShowSmmTutorialHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("zerox_smm_tutorial_hint_dismissed", "true");
    }
  };

  const handleDismissSmmTutorialHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSmmTutorialHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("zerox_smm_tutorial_hint_dismissed", "true");
    }
  };

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-sync active orders on mount or when switching to tracking tab
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  useEffect(() => {
    if (currentUser && (!hasAutoSynced || activeMode === "tracking")) {
      setHasAutoSynced(true);
      handleSyncRealtimeStatus(true);
    }
  }, [currentUser, activeMode]);

  // Periodic polling for real-time tracking (every 15 seconds when on tracking tab or having active orders)
  useEffect(() => {
    if (!currentUser) return;
    const hasActiveOrders = smmOrders.some(o => {
      const st = (o.status || "").toLowerCase();
      return st === "pending" || st === "processing" || st === "in progress" || st === "in_progress";
    });

    if (!hasActiveOrders && activeMode !== "tracking") return;

    const interval = setInterval(() => {
      handleSyncRealtimeStatus(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser, smmOrders, activeMode]);

  // Sync real-time statuses from server & provider
  const handleSyncRealtimeStatus = async (isAuto = false) => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      if (!isAuto) toast.loading("Syncing real-time order status...", { id: "smm-sync" });
      const res = await fetch("/api/smm/sync-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (!isAuto) toast.error(data.error || "Failed to sync order statuses.", { id: "smm-sync" });
      } else {
        if (data.updatedOrders && Array.isArray(data.updatedOrders) && data.updatedOrders.length > 0) {
          setSmmOrders(prev => {
            const updatedMap = new Map<string, SmmOrder>(data.updatedOrders.map((u: SmmOrder) => [u.id, u]));
            return prev.map(o => updatedMap.has(o.id) ? { ...o, ...updatedMap.get(o.id) } : o);
          });
        }
        if (typeof data.nextBalance === "number" && onUpdateUserBalance) {
          onUpdateUserBalance(currentUser.id, data.nextBalance);
        }
        if (!isAuto) {
          toast.success(`Real-time order statuses synced! (${data.updatedCount || 0} updated)`, { id: "smm-sync" });
        }
      }
    } catch (err) {
      if (!isAuto) toast.error("Network error during status sync.", { id: "smm-sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit refill request
  const handleRequestRefill = async (ord: SmmOrder) => {
    setRefillLoadingId(ord.id);
    try {
      toast.loading(`Dispatched refill request for #${ord.providerOrderId || ord.id}...`, { id: "smm-refill" });
      const res = await fetch("/api/smm/refill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: ord.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Refill request could not be processed at this time.", { id: "smm-refill" });
      } else {
        toast.success(data.message || `Refill accepted! Refill ID: #${data.refillId}`, { id: "smm-refill" });
        setSmmOrders(prev => prev.map(o => o.id === ord.id ? { ...o, refillStatus: "REQUESTED", refillId: String(data.refillId) } : o));
      }
    } catch (err) {
      toast.error("Network error submitting refill.", { id: "smm-refill" });
    } finally {
      setRefillLoadingId(null);
    }
  };

  // Open invoice / receipt
  const handleOpenInvoice = (order: SmmOrder) => {
    let matchedSvc = smmServices.find(s => s.id === order.serviceId || s.providerServiceId === order.serviceId);
    if (!matchedSvc) {
      matchedSvc = {
        id: order.serviceId || "svc-default",
        providerId: order.providerId || "direct",
        providerServiceId: order.serviceId || "1",
        name: order.serviceName || "SMM Promotion Service",
        category: order.categoryName || "Social Media",
        rate: order.charge,
        sellingPrice: order.charge,
        min: 1,
        max: 1000000,
        isActive: true,
        type: "Default",
        refill: true,
        cancel: false,
        isHidden: false
      };
    }
    setHistoryReceiptOrder({ order, service: matchedSvc });
  };

  // Filter valid categories
  const activeCategories = useMemo(() => {
    return smmCategories.filter(c => {
      if (!c.isActive) return false;
      const name = (c.name || "").trim();
      if (!name) return false;
      const lower = name.toLowerCase();
      if (lower.includes("demo") || lower.includes("test") || lower.includes("sample") || lower.includes("temp") || lower.includes("blank")) {
        return false;
      }
      return smmServices.some(s => {
        if (s.category !== c.name || !s.isActive || s.isHidden) return false;
        const sName = (s.name || "").trim().toLowerCase();
        return !(sName.includes("demo") || sName.includes("test") || sName.includes("sample") || sName.includes("temp") || sName.includes("blank"));
      });
    });
  }, [smmCategories, smmServices]);

  // Filter categories by selected platform
  const platformCategories = useMemo(() => {
    if (selectedPlatform === "all") return activeCategories;
    const platformObj = SMM_PLATFORMS.find(p => p.id === selectedPlatform);
    if (!platformObj || platformObj.keywords.length === 0) return activeCategories;

    return activeCategories.filter(c => {
      const catLower = (c.name || "").toLowerCase();
      const catMatch = platformObj.keywords.some(kw => catLower.includes(kw));
      if (catMatch) return true;
      return smmServices.some(s => s.category === c.name && s.isActive && !s.isHidden && platformObj.keywords.some(kw => (s.name || "").toLowerCase().includes(kw)));
    });
  }, [activeCategories, smmServices, selectedPlatform]);

  // Handle platform click
  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    setCategorySearch("");
    setServiceSearch("");

    if (platformId === "all") {
      if (activeCategories.length > 0) {
        setSelectedCategory(activeCategories[0].name);
      }
      return;
    }

    const platformObj = SMM_PLATFORMS.find(p => p.id === platformId);
    if (!platformObj) return;

    const matches = activeCategories.filter(c => {
      const catLower = (c.name || "").toLowerCase();
      if (platformObj.keywords.some(kw => catLower.includes(kw))) return true;
      return smmServices.some(s => s.category === c.name && s.isActive && !s.isHidden && platformObj.keywords.some(kw => (s.name || "").toLowerCase().includes(kw)));
    });

    if (matches.length > 0) {
      setSelectedCategory(matches[0].name);
    }
  };

  // Filtered categories for search
  const filteredActiveCategories = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    if (!q) return platformCategories;
    return platformCategories.filter((c, index) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const seqStr = String(index + 1).padStart(2, '0');
      const simpleSeq = String(index + 1);
      return nameMatch || seqStr.includes(q) || simpleSeq === q;
    });
  }, [platformCategories, categorySearch]);

  // Default selected category setup
  useEffect(() => {
    if (activeCategories.length > 0) {
      if (!selectedCategory || !activeCategories.some(cat => cat.name === selectedCategory)) {
        setSelectedCategory(activeCategories[0].name);
      }
    } else {
      setSelectedCategory("");
    }
  }, [activeCategories, selectedCategory]);

  // Filter services in category
  const filteredServices = useMemo(() => {
    return smmServices.filter(s => {
      if (s.category !== selectedCategory || !s.isActive || s.isHidden) return false;
      const name = (s.name || "").trim().toLowerCase();
      return !(name.includes("demo") || name.includes("test") || name.includes("sample") || name.includes("temp") || name.includes("blank"));
    });
  }, [smmServices, selectedCategory]);

  // Filtered services for search
  const filteredActiveServices = useMemo(() => {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return filteredServices;
    return filteredServices.filter((s, index) => {
      const nameMatch = s.name.toLowerCase().includes(q);
      const seqStr = String(index + 1).padStart(2, '0');
      const simpleSeq = String(index + 1);
      return nameMatch || seqStr.includes(q) || simpleSeq === q;
    });
  }, [filteredServices, serviceSearch]);

  // Click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update selected service on category change
  useEffect(() => {
    if (filteredServices.length > 0) {
      setSelectedServiceId(filteredServices[0].id);
    } else {
      setSelectedServiceId("");
    }
  }, [filteredServices]);

  // Current active service
  const currentService = useMemo(() => {
    return smmServices.find(s => s.id === selectedServiceId) || null;
  }, [smmServices, selectedServiceId]);

  // Current active platform object
  const currentPlatformObj = useMemo(() => {
    return SMM_PLATFORMS.find(p => p.id === selectedPlatform) || SMM_PLATFORMS[0];
  }, [selectedPlatform]);

  // Cost calculation
  const calculatedCost = useMemo(() => {
    if (!currentService || quantity === "") return 0;
    return Number(((currentService.sellingPrice / 1000) * quantity).toFixed(2));
  }, [currentService, quantity]);

  const calculatedCostBase = useMemo(() => {
    return Number((calculatedCost / cryptoRate).toFixed(4));
  }, [calculatedCost, cryptoRate]);

  // Balance preview
  const userBalancePkr = (currentUser?.balance || 0) * cryptoRate;
  const balanceAfterOrderPkr = Math.max(0, userBalancePkr - calculatedCost);
  const isInsufficient = Boolean(currentUser && (currentUser.balance <= 0 || currentUser.balance < calculatedCostBase));

  // Sequence display
  const categorySeq = useMemo(() => {
    const idx = activeCategories.findIndex(c => c.name === selectedCategory);
    return idx !== -1 ? String(idx + 1).padStart(2, '0') : "";
  }, [activeCategories, selectedCategory]);

  const serviceSeq = useMemo(() => {
    const idx = filteredServices.findIndex(s => s.id === selectedServiceId);
    return idx !== -1 ? String(idx + 1).padStart(2, '0') : "";
  }, [filteredServices, selectedServiceId]);

  // Quantity presets
  const handleSetPresetQuantity = (amount: number) => {
    if (!currentService) return;
    const clamped = Math.min(Math.max(amount, currentService.min), currentService.max);
    setQuantity(clamped);
  };

  const handleSetMinQuantity = () => {
    if (currentService) setQuantity(currentService.min);
  };

  const handleSetMaxQuantity = () => {
    if (currentService) setQuantity(currentService.max);
  };

  // Submit Single SMM Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please log in or register under the 'Wallet' tab to place SMM orders.");
      setActiveTab("wallet");
      return;
    }

    if (!currentService) {
      toast.error("Please select a valid SMM Service.");
      return;
    }

    if (!targetLink.trim()) {
      toast.error("Please enter a destination link for the campaign.");
      return;
    }

    if (!isSafeUrl(targetLink)) {
      toast.error("Security alert: Target link contains unsafe protocol. Please enter a valid URL.");
      return;
    }

    const cleanTargetLink = sanitizeUrl(targetLink);

    if (quantity === "") {
      toast.error("Please enter a valid quantity.");
      return;
    }

    if (quantity < currentService.min || quantity > currentService.max) {
      toast.error(`Quantity must be between ${currentService.min.toLocaleString()} and ${currentService.max.toLocaleString()}.`);
      return;
    }

    if (isInsufficient) {
      if (onInsufficientBalance) {
        onInsufficientBalance(calculatedCost, calculatedCostBase, userBalancePkr, currentService.name);
      }
      toast.error((t) => (
        <div className="flex flex-col gap-2 p-1">
          <span className="font-semibold text-xs text-rose-200 leading-snug">
            Insufficient wallet balance. Please recharge your wallet to proceed.
          </span>
          <button 
            onClick={() => { 
              setActiveTab("wallet"); 
              toast.dismiss(t.id); 
            }}
            className="bg-[#00AEEF] hover:bg-[#0098d4] text-white font-black py-1.5 px-3 rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Recharge Wallet</span>
          </button>
        </div>
      ), { duration: 6000 });
      return;
    }

    setIsOrdering(true);
    try {
      toast.loading("Dispatched SMM order to automated network...", { id: "smm-order-toast" });

      const res = await fetch("/api/smm/secure-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          serviceId: currentService.id,
          link: cleanTargetLink,
          quantity: Number(quantity)
        })
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        const errDetail = resData.error || resData.message || "Order could not be processed at this time";
        toast.error(`Order Failed: ${errDetail}`, { id: "smm-order-toast" });
        setIsOrdering(false);
        return;
      }
              
      const newOrder = resData.order;
      const nextBalance = resData.nextBalance;

      setSmmOrders(prev => [newOrder, ...prev]);
      onUpdateUserBalance(currentUser.id, nextBalance);

      setTargetLink("");
      setSuccessReceiptOrder({ order: newOrder, service: currentService });

      toast.success(`Order #${newOrder.providerOrderId || newOrder.id} placed successfully!`, { id: "smm-order-toast" });
    } catch (err: any) {
      console.error("Order placement error:", err);
      toast.error(`Failed to submit SMM order: ${err.message || "Network error"}`);
    } finally {
      setIsOrdering(false);
    }
  };

  // Mass Order parsing & submission
  const parsedMassOrders = useMemo(() => {
    if (!massOrderText.trim()) return [];
    const lines = massOrderText.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.map((line, idx) => {
      const parts = line.split("|").map(p => p.trim());
      // format: service_id | link | quantity
      const serviceId = parts[0] || "";
      const link = parts[1] || "";
      const qty = parseInt(parts[2] || "0", 10);

      const matchedService = smmServices.find(s => s.id === serviceId || s.providerServiceId === serviceId);
      const isValid = Boolean(matchedService && link && qty > 0 && isSafeUrl(link));
      const costPkr = matchedService && qty > 0 ? Number(((matchedService.sellingPrice / 1000) * qty).toFixed(2)) : 0;

      return {
        lineIndex: idx + 1,
        raw: line,
        serviceId,
        link,
        quantity: qty,
        service: matchedService,
        costPkr,
        isValid,
        error: !matchedService ? "Service not found" : !link ? "Missing link" : qty <= 0 ? "Invalid quantity" : !isSafeUrl(link) ? "Unsafe link" : null
      };
    });
  }, [massOrderText, smmServices]);

  const totalMassCostPkr = useMemo(() => {
    return parsedMassOrders.reduce((sum, item) => sum + (item.isValid ? item.costPkr : 0), 0);
  }, [parsedMassOrders]);

  const totalMassCostUsd = useMemo(() => {
    return Number((totalMassCostPkr / cryptoRate).toFixed(4));
  }, [totalMassCostPkr, cryptoRate]);

  const handleProcessMassOrders = async () => {
    if (!currentUser) {
      toast.error("Please login to submit mass orders.");
      setActiveTab("wallet");
      return;
    }

    const validOrders = parsedMassOrders.filter(o => o.isValid);
    if (validOrders.length === 0) {
      toast.error("No valid orders parsed from mass input. Check format: service_id|link|quantity");
      return;
    }

    if (currentUser.balance < totalMassCostUsd) {
      toast.error(`Insufficient balance. Total needed: PKR ${totalMassCostPkr.toLocaleString()} (${formatPrice(totalMassCostUsd)})`);
      return;
    }

    setIsMassOrdering(true);
    toast.loading(`Processing ${validOrders.length} bulk orders...`, { id: "smm-mass-toast" });

    try {
      const res = await fetch("/api/smm/mass-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          orders: validOrders.map(o => ({
            serviceId: o.serviceId,
            link: sanitizeUrl(o.link),
            quantity: o.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Mass order processing failed.", { id: "smm-mass-toast" });
      } else {
        const createdOrders: SmmOrder[] = (data.results || [])
          .filter((r: any) => r.success && r.order)
          .map((r: any) => r.order);

        if (createdOrders.length > 0) {
          setSmmOrders(prev => [...createdOrders, ...prev]);
        }
        if (typeof data.nextBalance === "number") {
          onUpdateUserBalance(currentUser.id, data.nextBalance);
        }

        toast.success(`Processed ${data.totalProcessed || createdOrders.length} orders successfully!`, { id: "smm-mass-toast" });
        setMassOrderText("");
        setActiveMode("tracking");
      }
    } catch (err: any) {
      toast.error(`Mass order submission failed: ${err.message}`, { id: "smm-mass-toast" });
    } finally {
      setIsMassOrdering(false);
    }
  };

  // Price List Catalog Table Filtering
  const catalogServices = useMemo(() => {
    let list = smmServices.filter(s => s.isActive && !s.isHidden);
    
    if (priceListPlatform !== "all") {
      const pObj = SMM_PLATFORMS.find(p => p.id === priceListPlatform);
      if (pObj && pObj.keywords.length > 0) {
        list = list.filter(s => {
          const sName = (s.name || "").toLowerCase();
          const sCat = (s.category || "").toLowerCase();
          return pObj.keywords.some(kw => sName.includes(kw) || sCat.includes(kw));
        });
      }
    }

    if (priceListSearch.trim()) {
      const q = priceListSearch.toLowerCase().trim();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.category.toLowerCase().includes(q) || 
        String(s.providerServiceId || s.id).includes(q)
      );
    }

    return list;
  }, [smmServices, priceListPlatform, priceListSearch]);

  // Select service directly from price list
  const handleSelectFromPriceList = (svc: SmmService) => {
    setSelectedCategory(svc.category);
    setSelectedServiceId(svc.id);
    setActiveMode("order");
    toast.success(`Selected "${svc.name}"! Fill in your link to place order.`, { id: "smm-catalog-select" });
  };

  // Filter User Orders History
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return smmOrders.filter(o => {
      const isUser = o.userId === currentUser.id;
      const searchLower = orderSearch.toLowerCase().trim();
      const matchesSearch = !searchLower || (
        (o.serviceName || "").toLowerCase().includes(searchLower) ||
        (o.id || "").toLowerCase().includes(searchLower) ||
        (o.providerOrderId && o.providerOrderId.toLowerCase().includes(searchLower)) ||
        (o.link || "").toLowerCase().includes(searchLower)
      );

      const st = (o.status || "").toUpperCase();
      let matchesStatus = true;
      if (orderStatusFilter === "PENDING") matchesStatus = st === "PENDING";
      else if (orderStatusFilter === "IN_PROGRESS") matchesStatus = st === "IN PROGRESS" || st === "IN_PROGRESS";
      else if (orderStatusFilter === "PROCESSING") matchesStatus = st === "PROCESSING";
      else if (orderStatusFilter === "COMPLETED") matchesStatus = st === "COMPLETED";
      else if (orderStatusFilter === "PARTIAL") matchesStatus = st === "PARTIAL";
      else if (orderStatusFilter === "CANCELED") matchesStatus = st === "CANCELED" || st === "CANCELLED";

      return isUser && matchesSearch && matchesStatus;
    });
  }, [smmOrders, currentUser, orderSearch, orderStatusFilter]);

  return (
    <div id="smm-client-store-root" className="bg-slate-50/50 border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-7 shadow-xs relative overflow-hidden text-slate-800 space-y-5">
      
      {/* Receipt Modals */}
      <SmmReceiptModal 
        isOpen={!!successReceiptOrder} 
        onClose={() => setSuccessReceiptOrder(null)} 
        order={successReceiptOrder?.order || null} 
        service={successReceiptOrder?.service || null} 
        user={currentUser} 
        formatPrice={formatPrice} 
        cryptoRate={cryptoRate}
      />
      <SmmReceiptModal 
        isOpen={!!historyReceiptOrder} 
        onClose={() => setHistoryReceiptOrder(null)} 
        order={historyReceiptOrder?.order || null}
        service={historyReceiptOrder?.service || null}
        user={currentUser} 
        formatPrice={formatPrice}
        cryptoRate={cryptoRate}
        isHistory={true}
      />

      {/* Header Banner - Minimal, Clean & Professional Aesthetic */}
      <div className="relative z-10 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs overflow-hidden">
        {smmCoverUrl && (
          <img 
            src={smmCoverUrl} 
            alt="SMM Cover" 
            className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" 
            referrerPolicy="no-referrer" 
          />
        )}
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Minimal Status Pills & How to Order Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-[#00AEEF] text-[11px] font-bold">
                <Zap className="w-3 h-3 text-[#00AEEF] fill-current" />
                Instant Delivery
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold">
                <Sparkle className="w-3 h-3 text-[#00AEEF]" />
                {smmServices.filter(s => s.isActive && !s.isHidden).length} Verified Services
              </span>

              {/* Dedicated "How to Order" Interactive Walkthrough Demo Trigger */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={handleStartSmmTutorial}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-blue-600/15 via-[#00AEEF]/20 to-blue-500/15 hover:from-blue-600/30 hover:to-[#00AEEF]/30 text-blue-700 border border-[#00AEEF]/40 hover:border-[#00AEEF] shadow-xs transition-all cursor-pointer active:scale-95 group shrink-0"
                  title="Watch Step-by-Step SMM Demo"
                >
                  <div className="w-4 h-4 rounded-full bg-[#00AEEF] text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span className="whitespace-nowrap font-bold tracking-tight text-[#00AEEF]">How to Order</span>
                </button>

                {/* Subtle First-Time User Hint */}
                {showSmmTutorialHint && (
                  <div className="absolute top-full left-0 mt-2 z-30 bg-gradient-to-r from-blue-600 via-[#00AEEF] to-cyan-500 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-blue-300/50 flex items-center gap-2 whitespace-nowrap animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                    <button
                      type="button"
                      onClick={handleStartSmmTutorial}
                      className="cursor-pointer hover:underline text-white font-bold"
                    >
                      Watch SMM Demo ▶
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissSmmTutorialHint}
                      className="p-1 hover:bg-black/20 rounded-md text-blue-100 hover:text-white cursor-pointer ml-1 transition-colors"
                      title="Dismiss hint"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsible Process Guide Toggle */}
              <button
                type="button"
                onClick={() => setIsSmmGuideMinimized(!isSmmGuideMinimized)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 transition cursor-pointer"
                title={isSmmGuideMinimized ? "Show 4-step order flow guide" : "Hide guide"}
              >
                <span>{isSmmGuideMinimized ? "4-Step Guide" : "Hide Guide"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSmmGuideMinimized ? "" : "rotate-180 text-[#00AEEF]"}`} />
              </button>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Social Media Marketing Services
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl mt-0.5">
                Automated high-speed campaigns for Telegram, Instagram, TikTok, YouTube, WhatsApp & more.
              </p>
            </div>
          </div>
        </div>

        {/* Minimal Feature Highlights Bar */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] sm:text-xs">Instant Dispatch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] sm:text-xs">30-Day Auto Refill</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-[#00AEEF] shrink-0" />
            <span className="text-[11px] sm:text-xs">Auto Refund Protection</span>
          </div>
        </div>

        {/* Expandable Process Guide & Steps (Collapsible) */}
        {!isSmmGuideMinimized && (
          <div className="relative z-10 mt-3.5 pt-3.5 border-t border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                How SMM Orders Work (4 Simple Steps)
              </span>
              <button
                type="button"
                onClick={handleStartSmmTutorial}
                className="text-[11px] font-extrabold text-[#00AEEF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Launch Interactive Demo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] text-xs font-black shrink-0 border border-blue-100">
                  01
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">Choose Gateway</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Select TikTok, Instagram, YouTube, TG & more</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] text-xs font-black shrink-0 border border-blue-100">
                  02
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">Select Package</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Review speed SLA, 30d refill & live pricing</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] text-xs font-black shrink-0 border border-blue-100">
                  03
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">Link & Quantity</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Paste public URL, set quantity & instant cost</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 text-[#00AEEF] text-xs font-black shrink-0 border border-blue-100">
                  04
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">Instant Dispatch</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Live progress tracking, refill & tax invoices</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs flex items-center justify-between overflow-x-auto gap-1">
        <div className="flex items-center gap-1 min-w-max">
          <button
            type="button"
            onClick={() => setActiveMode("order")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "order"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("mass")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "mass"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mass / Bulk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("pricelist")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "pricelist"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Price List</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("tracking")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeMode === "tracking"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders & Tracking</span>
            {userOrders.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                activeMode === "tracking" ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
              }`}>
                {userOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Sync Status Action */}
        <button
          type="button"
          onClick={() => handleSyncRealtimeStatus(false)}
          disabled={isSyncing}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 ml-2"
          title="Sync real-time order tracking"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00AEEF] ${isSyncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync Live Status"}</span>
        </button>
      </div>

      {/* MODE 1: SINGLE ORDER */}
      {activeMode === "order" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Left: Interactive Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-5">
              
              {/* Platform Filter Buttons */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Select Platform Gateway
                    </span>
                  </div>
                  {selectedPlatform !== "all" && (
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform("all")}
                      className="text-[11px] font-bold text-[#00AEEF] hover:underline cursor-pointer"
                    >
                      View All Platforms
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {SMM_PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handleSelectPlatform(platform.id)}
                        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {platform.svg}
                        </div>
                        <span className="whitespace-nowrap">{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Form */}
              <form onSubmit={handlePlaceOrder} className="space-y-4 pt-2 border-t border-slate-100">
                
                {/* 1. Category Selection */}
                <div className="space-y-1.5" ref={categoryDropdownRef}>
                  <label className="text-xs font-extrabold text-slate-700 block">
                    1. Choose Service Category
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                        setIsServiceDropdownOpen(false);
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition-all flex items-center justify-between text-left cursor-pointer ${
                        isCategoryDropdownOpen ? "border-[#00AEEF] bg-white ring-2 ring-blue-100 shadow-sm" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="truncate font-bold text-slate-800 flex items-center gap-2">
                        {categorySeq && (
                          <span className="shrink-0 bg-slate-200/80 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            #{categorySeq}
                          </span>
                        )}
                        <span className="truncate">
                          {selectedCategory ? selectedCategory : "Select Category"}
                        </span>
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180 text-[#00AEEF]" : ""}`} />
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in flex flex-col">
                        <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none p-1"
                            autoFocus
                          />
                        </div>
                        
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {filteredActiveCategories.length === 0 ? (
                            <div className="p-3 text-center text-slate-500 text-xs font-semibold">No matching categories</div>
                          ) : (
                            filteredActiveCategories.map((cat, idx) => {
                              const isSelected = selectedCategory === cat.name;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(cat.name);
                                    setIsCategoryDropdownOpen(false);
                                    setCategorySearch("");
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 text-[#00AEEF] font-extrabold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span className="shrink-0 bg-slate-100 text-slate-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                      #{String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className="truncate">{cat.name}</span>
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-[#00AEEF] shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Service Selection */}
                <div className="space-y-1.5" ref={serviceDropdownRef}>
                  <label className="text-xs font-extrabold text-slate-700 block">
                    2. Select Package
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={filteredServices.length === 0}
                      onClick={() => {
                        setIsServiceDropdownOpen(!isServiceDropdownOpen);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition-all flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isServiceDropdownOpen ? "border-[#00AEEF] bg-white ring-2 ring-blue-100 shadow-sm" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="truncate mr-2 text-slate-800 font-semibold text-left flex items-center gap-2 max-w-[85%]">
                        {currentService && serviceSeq && (
                          <span className="shrink-0 bg-slate-200/80 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            #{serviceSeq}
                          </span>
                        )}
                        <span className="truncate">
                          {currentService ? (
                            `${currentService.name} — ${formatPrice(currentService.sellingPrice / cryptoRate)} / 1K`
                          ) : (
                            "No services available for this category"
                          )}
                        </span>
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isServiceDropdownOpen ? "rotate-180 text-[#00AEEF]" : ""}`} />
                    </button>

                    {isServiceDropdownOpen && filteredServices.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in flex flex-col">
                        <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            placeholder="Search packages by name or ID..."
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none p-1"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {filteredActiveServices.length === 0 ? (
                            <div className="p-3 text-center text-slate-500 text-xs font-semibold">No matching packages</div>
                          ) : (
                            filteredActiveServices.map((ser, idx) => {
                              const isSelected = selectedServiceId === ser.id;
                              return (
                                <button
                                  key={ser.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedServiceId(ser.id);
                                    setIsServiceDropdownOpen(false);
                                    setServiceSearch("");
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 text-[#00AEEF] font-extrabold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-start gap-2 min-w-0 pr-2">
                                    <span className="shrink-0 bg-slate-100 text-slate-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5">
                                      #{String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold truncate text-slate-800">{ser.name}</p>
                                      <p className="text-[10px] text-slate-400">Min: {ser.min.toLocaleString()} | Max: {ser.max.toLocaleString()} {ser.refill ? "• 30d Refill" : ""}</p>
                                    </div>
                                  </div>
                                  <span className={`shrink-0 font-extrabold font-mono text-xs ${isSelected ? "text-[#00AEEF]" : "text-slate-900"}`}>
                                    {formatPrice(ser.sellingPrice / cryptoRate)} / 1K
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Target Link Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      3. Target Destination Link
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">Public URL / Profile Only</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                      <LinkIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder={currentPlatformObj.placeholder}
                      value={targetLink}
                      onChange={(e) => setTargetLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#00AEEF] shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* 4. Quantity & Quick Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      4. Order Quantity
                    </label>
                    {currentService && (
                      <span className="text-[10px] text-slate-500 font-bold">
                        Limits: {currentService.min.toLocaleString()} - {currentService.max.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        required
                        min={currentService?.min || 10}
                        max={currentService?.max || 1000000}
                        value={quantity}
                        placeholder={currentService ? `e.g. ${currentService.min}` : "Quantity"}
                        onChange={(e) => setQuantity(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#00AEEF] shadow-2xs transition-all"
                      />
                    </div>

                    {/* Total Price Card - Minimal, Light & Clean */}
                    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-center items-end sm:col-span-1 shadow-2xs">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Cost</span>
                      <div className="font-black text-sm text-[#00AEEF]">
                        <CurrencyDisplay 
                          baseUnits={calculatedCost / cryptoRate} 
                          formatPrice={formatPrice} 
                          inline={true} 
                          amountClassName="text-sm font-black text-[#00AEEF]"
                          usdClassName="text-emerald-600 text-[10px] ml-1 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity Quick Presets */}
                  {currentService && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={handleSetMinQuantity}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                      >
                        Min ({currentService.min.toLocaleString()})
                      </button>
                      {[100, 500, 1000, 2500, 5000, 10000].map(amt => {
                        if (amt < currentService.min || amt > currentService.max) return null;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSetPresetQuantity(amt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                          >
                            +{amt.toLocaleString()}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleSetMaxQuantity}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                      >
                        Max ({currentService.max.toLocaleString()})
                      </button>
                    </div>
                  )}
                </div>

                {/* Insufficient Balance Notice */}
                {isInsufficient && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 text-rose-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold truncate">
                        Insufficient balance. Needed: PKR {calculatedCost.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("wallet")}
                      className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Recharge</span>
                    </button>
                  </div>
                )}

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isOrdering || !currentService}
                  className={`w-full font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${
                    isOrdering || !currentService
                      ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]"
                  }`}
                >
                  {isOrdering ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <span>Submit Order</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Service Specs & Quality Guarantee */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between h-full space-y-4">
              <div>
                <div 
                  className="flex items-center justify-between pb-3 border-b border-slate-100 cursor-pointer select-none"
                  onClick={() => setIsPackageDetailsOpen(!isPackageDetailsOpen)}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-[#00AEEF] rounded-lg border border-blue-100">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">Service Specifications</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Quality & SLA details</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isPackageDetailsOpen ? "rotate-180 text-[#00AEEF]" : ""}`} />
                </div>

                <AnimatePresence initial={false}>
                  {isPackageDetailsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-3 space-y-3"
                    >
                      {currentService ? (
                        <>
                          <div>
                            <span className="text-[10px] text-[#00AEEF] font-black uppercase tracking-wider block">
                              Service ID: #{currentService.providerServiceId || currentService.id}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs mt-0.5 leading-snug">
                              {currentService.name}
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block">Speed</span>
                              <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3 text-[#00AEEF]" />
                                {currentService.averageTime || "Instant Start"}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block">Refill</span>
                              <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                                <span className={`w-2 h-2 rounded-full ${currentService.refill ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                {currentService.refill ? '30 Days Auto' : 'No Refill'}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block">Cancel</span>
                              <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                                <span className={`w-2 h-2 rounded-full ${currentService.cancel ? 'bg-[#00AEEF]' : 'bg-slate-300'}`}></span>
                                {currentService.cancel ? 'Supported' : 'No Cancel'}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block">Min - Max</span>
                              <span className="font-bold text-slate-800 mt-0.5 block text-xs truncate">
                                {currentService.min.toLocaleString()} - {currentService.max.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold uppercase block">Rate per 1,000</span>
                              <div className="text-xs font-black text-slate-900">
                                <CurrencyDisplay baseUnits={currentService.sellingPrice / cryptoRate} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-600 ml-1 font-bold" />
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-[#00AEEF] bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Verified
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Instructions & Notes</span>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 leading-relaxed text-xs max-h-32 overflow-y-auto">
                              {currentService.description || "Automated direct campaign line with instant start and continuous tracking."}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <HelpCircle className="h-6 w-6 mx-auto stroke-1 mb-1.5 text-slate-300" />
                          <p className="font-bold text-xs uppercase text-slate-400">Select a Service Package</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quality Guarantee Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>24/7 Automated Gateway Fulfillment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MASS / BULK ORDER */}
      {activeMode === "mass" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-[#00AEEF] rounded-lg border border-blue-100">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Mass / Bulk Order Engine</h3>
                <p className="text-xs text-slate-500 font-medium">Place multiple campaign orders at once</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <span className="font-extrabold text-slate-900 block">Format specification (one order per line):</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[#00AEEF] font-mono text-[11px] block">
              service_id | destination_link | quantity
            </code>
            <p className="text-[11px] text-slate-500">Example: <code className="font-mono">102 | https://instagram.com/user | 1000</code></p>
          </div>

          <textarea
            rows={7}
            placeholder="102 | https://instagram.com/user | 1000&#10;105 | https://t.me/channel | 5000&#10;109 | https://tiktok.com/@video | 2500"
            value={massOrderText}
            onChange={(e) => setMassOrderText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#00AEEF] shadow-inner"
          />

          {/* Mass Order Live Parser Table */}
          {parsedMassOrders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-700">Parsed Orders ({parsedMassOrders.filter(o => o.isValid).length} Valid / {parsedMassOrders.length} Total)</span>
                <span className="text-[#00AEEF]">Estimated Total: {formatPrice(totalMassCostUsd)} (PKR {totalMassCostPkr.toLocaleString()})</span>
              </div>
              
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {parsedMassOrders.map((item) => (
                  <div key={item.lineIndex} className={`p-2.5 flex items-center justify-between gap-3 ${item.isValid ? "bg-white" : "bg-rose-50/50"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-slate-400 text-[10px]">#{item.lineIndex}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate text-xs">{item.service?.name || `Service ID: ${item.serviceId}`}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.link} • Qty: {item.quantity.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {item.isValid ? (
                        <span className="font-extrabold text-[#00AEEF] font-mono text-xs">
                          PKR {item.costPkr.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {item.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleProcessMassOrders}
            disabled={isMassOrdering || parsedMassOrders.filter(o => o.isValid).length === 0}
            className="w-full bg-[#00AEEF] hover:bg-[#0098d4] text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isMassOrdering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Mass Orders...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Submit {parsedMassOrders.filter(o => o.isValid).length} Mass Orders • {formatPrice(totalMassCostUsd)}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* MODE 3: SERVICES PRICE LIST CATALOG */}
      {activeMode === "pricelist" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-[#00AEEF] rounded-lg border border-blue-100">
                <ListFilter className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Services Catalog & Price List</h3>
                <p className="text-xs text-slate-500 font-medium">Browse verified SMM services with instant rates</p>
              </div>
            </div>

            {/* Search & Platform Filter */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search service name, ID..."
                  value={priceListSearch}
                  onChange={(e) => setPriceListSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF]"
                />
              </div>
            </div>
          </div>

          {/* Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {SMM_PLATFORMS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriceListPlatform(p.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                  priceListPlatform === p.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Service Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Rate / 1K</th>
                  <th className="p-3 text-center">Min / Max</th>
                  <th className="p-3 text-center">Refill</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No services match your search criteria.
                    </td>
                  </tr>
                ) : (
                  catalogServices.map((svc) => (
                    <tr key={svc.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        #{svc.providerServiceId || svc.id}
                      </td>
                      <td className="p-3 font-bold text-slate-900 max-w-[280px]">
                        <p className="truncate" title={svc.name}>{svc.name}</p>
                      </td>
                      <td className="p-3 text-slate-500 font-medium max-w-[150px] truncate">
                        {svc.category}
                      </td>
                      <td className="p-3 text-right font-black text-[#00AEEF] font-mono">
                        {formatPrice(svc.sellingPrice / cryptoRate)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {svc.min.toLocaleString()} - {svc.max.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {svc.refill ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            30d Refill
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-semibold">No Refill</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectFromPriceList(svc)}
                          className="bg-[#00AEEF] hover:bg-[#0098d4] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition cursor-pointer active:scale-95 uppercase tracking-wider"
                        >
                          Order
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 4: ORDERS & TRACKING HISTORY */}
      {activeMode === "tracking" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-[#00AEEF] rounded-lg border border-blue-100">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Your Orders & Tracking</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time status tracking with automated updates</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, service, link..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF]"
                />
              </div>
            </div>
          </div>

          {/* SMM Policy Info Notice */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-start gap-2.5 text-slate-600 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#00AEEF] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-slate-900">Automated Order Fulfillment Policy:</span>{" "}
              SMM orders are processed automatically by Zerox Network and cannot be cancelled manually once submitted. If an order cannot be fulfilled, the system will automatically cancel it and issue a refund (minus a 2% processing fee) directly to your wallet balance.
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            {[
              { id: "ALL", label: "All Orders" },
              { id: "PENDING", label: "Pending" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "PROCESSING", label: "Processing" },
              { id: "COMPLETED", label: "Completed" },
              { id: "PARTIAL", label: "Partial" },
              { id: "CANCELED", label: "Canceled" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setOrderStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold whitespace-nowrap transition cursor-pointer border ${
                  orderStatusFilter === tab.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {userOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingCart className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
              <p className="text-xs font-extrabold text-slate-600 uppercase">No SMM Orders Found</p>
              <p className="text-xs text-slate-400 mt-0.5">Submit an order or change status filters above.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Service</th>
                      <th className="p-3">Link</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Charge</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userOrders.map((ord) => {
                      const st = (ord.status || "").toUpperCase();
                      const isCompleted = st === "COMPLETED";
                      const isInProgress = st === "IN PROGRESS" || st === "IN_PROGRESS" || st === "PROCESSING";
                      const isPending = st === "PENDING";
                      const isPartial = st === "PARTIAL";
                      const isCanceled = st === "CANCELED" || st === "CANCELLED";

                      const matchedSvc = smmServices.find(s => s.id === ord.serviceId || s.providerServiceId === ord.serviceId);
                      const supportsRefill = matchedSvc ? matchedSvc.refill : true;
                      const isRefillEligible = supportsRefill && (isCompleted || isPartial || isInProgress);

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            #{ord.providerOrderId || ord.id}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-bold text-slate-900 max-w-[200px] truncate" title={ord.serviceName}>
                            {ord.serviceName}
                          </td>
                          <td className="p-3 max-w-[160px] truncate font-semibold text-[#00AEEF] hover:underline">
                            <a href={sanitizeUrl(ord.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                              <span className="truncate">{ord.link}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </td>
                          <td className="p-3 text-right font-extrabold font-mono text-slate-900">
                            {ord.quantity.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-black text-[#00AEEF] font-mono">
                            {formatPrice(ord.charge / cryptoRate)}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            )}
                            {isInProgress && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
                                In Progress
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending
                              </span>
                            )}
                            {isPartial && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                  <AlertTriangle className="w-3 h-3 text-purple-600" />
                                  Partial
                                </span>
                                {ord.isRefunded && (
                                  <span className="block text-[9px] font-bold text-emerald-600">
                                    Refund: PKR {ord.refundAmount ? ord.refundAmount.toFixed(2) : ((ord.charge * 0.5) * 0.98).toFixed(2)} (-2% fee)
                                  </span>
                                )}
                              </div>
                            )}
                            {isCanceled && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Canceled
                                </span>
                                {ord.isRefunded && (
                                  <span className="block text-[9px] font-bold text-emerald-600">
                                    Refunded: PKR {ord.refundAmount ? ord.refundAmount.toFixed(2) : (ord.charge * 0.98).toFixed(2)} (-2% fee)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                            {isRefillEligible && (
                              <button
                                onClick={() => handleRequestRefill(ord)}
                                disabled={refillLoadingId === ord.id || ord.refillStatus === "REQUESTED"}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition cursor-pointer border ${
                                  ord.refillStatus === "REQUESTED"
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-2xs active:scale-95"
                                }`}
                              >
                                <RotateCcw className={`w-3 h-3 ${refillLoadingId === ord.id ? "animate-spin" : ""}`} />
                                <span>{ord.refillStatus === "REQUESTED" ? "Refill Sent" : "Refill"}</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenInvoice(ord)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#00AEEF] hover:text-white border border-slate-200 text-slate-600 inline-flex items-center justify-center transition cursor-pointer"
                              title="Download Invoice PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {userOrders.map((ord) => {
                  const st = (ord.status || "").toUpperCase();
                  const isCompleted = st === "COMPLETED";
                  const isInProgress = st === "IN PROGRESS" || st === "IN_PROGRESS" || st === "PROCESSING";
                  const isPending = st === "PENDING";
                  const isPartial = st === "PARTIAL";
                  const isCanceled = st === "CANCELED" || st === "CANCELLED";

                  const matchedSvc = smmServices.find(s => s.id === ord.serviceId || s.providerServiceId === ord.serviceId);
                  const supportsRefill = matchedSvc ? matchedSvc.refill : true;
                  const isRefillEligible = supportsRefill && (isCompleted || isPartial || isInProgress);

                  return (
                    <div key={ord.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-900">#{ord.providerOrderId || ord.id}</span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            In Progress
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                        {isPartial && (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              Partial
                            </span>
                            {ord.isRefunded && (
                              <span className="block text-[8px] font-bold text-emerald-600 mt-0.5">
                                Ref: PKR {ord.refundAmount ? ord.refundAmount.toFixed(2) : ((ord.charge * 0.5) * 0.98).toFixed(2)} (-2% fee)
                              </span>
                            )}
                          </div>
                        )}
                        {isCanceled && (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              Canceled
                            </span>
                            {ord.isRefunded && (
                              <span className="block text-[8px] font-bold text-emerald-600 mt-0.5">
                                Ref: PKR {ord.refundAmount ? ord.refundAmount.toFixed(2) : (ord.charge * 0.98).toFixed(2)} (-2% fee)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900">{ord.serviceName}</h4>
                        <a href={sanitizeUrl(ord.link)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#00AEEF] hover:underline flex items-center gap-1 truncate">
                          <span className="truncate">{ord.link}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Quantity</span>
                          <span className="font-extrabold text-slate-900 font-mono">{ord.quantity.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Charge</span>
                          <span className="font-extrabold text-[#00AEEF] font-mono">{formatPrice(ord.charge / cryptoRate)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Date</span>
                          <span className="text-slate-600 font-semibold text-[10px]">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        {isRefillEligible && (
                          <button
                            onClick={() => handleRequestRefill(ord)}
                            disabled={refillLoadingId === ord.id || ord.refillStatus === "REQUESTED"}
                            className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{ord.refillStatus === "REQUESTED" ? "Refill Sent" : "Refill"}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenInvoice(ord)}
                          className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition border border-slate-200 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dedicated Interactive "How to Order" SMM Tutorial Walkthrough */}
      <SmmHowToOrderTutorial
        isOpen={showSmmTutorial}
        onClose={() => setShowSmmTutorial(false)}
        onNavigateToWallet={() => {
          setShowSmmTutorial(false);
          setActiveTab("wallet");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        formatPrice={formatPrice}
      />
    </div>
  );
}
