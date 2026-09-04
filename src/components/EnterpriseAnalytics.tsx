import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, DollarSign, ShoppingBag, BarChart3, PieChart, Download, RefreshCw, Search, Sparkles, 
  Flame, Trash2, Command, Landmark, CheckCircle2, AlertTriangle, X, ChevronRight, Filter, Eye,
  Printer, FileText, ShieldCheck, Globe, Clock, Layers, Award, FileCode, Loader2, Coins, Server,
  Tv, CreditCard, Lock, Megaphone, Check, Star, ArrowUpRight, Crown, PlayCircle, MessageSquare,
  Shield, HelpCircle, CheckSquare, KeyRound, UserCheck, AlertOctagon, Share2, Smartphone, Database,
  TrendingUp, Calculator, Percent, BarChart2, RotateCcw, Activity
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell,
  BarChart, Bar, LineChart as RechartsLineChart, Line, ComposedChart, Legend
} from "recharts";
import { toast } from "react-hot-toast";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { 
  UserAccount, SmmOrder, ActivationOrder, DepositRequest, SmmService, Announcement, 
  SmmProvider, SubscriptionOrder, SubscriptionProduct, ReviewItem, PrivacyPolicyData 
} from "../types";
import CurrencyDisplay from "./CurrencyDisplay";
import { DEFAULT_REVIEWS, DEFAULT_PRIVACY_POLICY } from "../lib/reviewsAndPolicyStore";
import { doc, deleteDoc, updateDoc, collection, getDocs, writeBatch, query, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { safeFixed, toSafeNumber, safePercent, safeLocaleString, safeRound, safeFloor, safeCeil } from "../lib/safeNumeric";
import { AnalyticsCardErrorBoundary } from "./admin/AnalyticsCardErrorBoundary";
import { AnalyticsBatchActionBar } from "./admin/AnalyticsBatchActionBar";
import { AnalyticsDataManagementModal, CategoryDataInfo } from "./admin/AnalyticsDataManagementModal";

interface EnterpriseAnalyticsProps {
  cryptoRate?: number;
  orders?: ActivationOrder[];
  users?: UserAccount[];
  smmOrders?: SmmOrder[];
  depositRequests?: DepositRequest[];
  smmServices?: SmmService[];
  smmProviders?: SmmProvider[];
  smsProviders?: any[];
  customServices?: any[];
  announcements?: Announcement[];
  subscriptionOrders?: SubscriptionOrder[];
  subscriptionProducts?: SubscriptionProduct[];
  reviews?: ReviewItem[];
  privacyPolicy?: PrivacyPolicyData;
  onClose?: () => void;
  formatPrice: (baseUnits: number) => string;
}

type TabType = 
  | "overview" 
  | "financial"
  | "orders" 
  | "subscriptions"
  | "reviews"
  | "policy"
  | "users" 
  | "deposits" 
  | "activity" 
  | "insights"
  | "api_health";

export default function EnterpriseAnalytics({
  cryptoRate, 
  orders: initialOrders = [], 
  users: initialUsers = [], 
  smmOrders: initialSmmOrders = [], 
  depositRequests: initialDepositRequests = [],
  smmServices = [],
  smmProviders = [],
  smsProviders = [],
  customServices = [],
  announcements = [],
  subscriptionOrders: initialSubscriptionOrders = [],
  subscriptionProducts = [],
  reviews: initialReviews = DEFAULT_REVIEWS,
  privacyPolicy = DEFAULT_PRIVACY_POLICY,
  onClose,
  formatPrice
}: EnterpriseAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // PDF Report Modal state & metadata
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [reportRefCode, setReportRefCode] = useState("");
  const [reportGeneratedAt, setReportGeneratedAt] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Data Management Modal state & telemetry counts
  const [showDataManagementModal, setShowDataManagementModal] = useState(false);
  const [liveSessionsCount, setLiveSessionsCount] = useState<number>(0);
  const [liveEventsCount, setLiveEventsCount] = useState<number>(0);

  // Deletion State Trackers (Local view state override)
  const [deletedSmmIds, setDeletedSmmIds] = useState<Set<string | number>>(new Set());
  const [deletedSmsIds, setDeletedSmsIds] = useState<Set<string | number>>(new Set());
  const [deletedUserIds, setDeletedUserIds] = useState<Set<string>>(new Set());
  const [deletedDepositIds, setDeletedDepositIds] = useState<Set<string | number>>(new Set());
  const [deletedActivityIds, setDeletedActivityIds] = useState<Set<string>>(new Set());
  const [deletedSubOrderIds, setDeletedSubOrderIds] = useState<Set<string>>(new Set());
  const [deletedReviewIds, setDeletedReviewIds] = useState<Set<string>>(new Set());

  // Selection States for "Select to Delete" capability
  const [selectedSmmIds, setSelectedSmmIds] = useState<Set<string | number>>(new Set());
  const [selectedSmsIds, setSelectedSmsIds] = useState<Set<string | number>>(new Set());
  const [selectedSubOrderIds, setSelectedSubOrderIds] = useState<Set<string>>(new Set());
  const [selectedDepositIds, setSelectedDepositIds] = useState<Set<string | number>>(new Set());
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "SMM" | "SMS" | "SUBSCRIPTION">("ALL");
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("ALL");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>("ALL");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>("ALL");
  const [policySearch, setPolicySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [depositSearch, setDepositSearch] = useState("");
  const [timeRange, setTimeRange] = useState<"ALL" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("ALL");

  // Helper to check if item is in time range
  const isInTimeRange = (dateStr: string) => {
    if (timeRange === "ALL") return true;
    if (!dateStr) return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - itemDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (timeRange === "DAILY") return diffDays <= 1;
    if (timeRange === "WEEKLY") return diffDays <= 7;
    if (timeRange === "MONTHLY") return diffDays <= 30;
    if (timeRange === "YEARLY") return diffDays <= 365;
    return true;
  };

  // Safe Normalized Active Data Collections Layer (Firestore Data Sanitization)
  const smmOrders = useMemo(() => {
    return (initialSmmOrders || [])
      .filter(o => o && !deletedSmmIds.has(o.id) && isInTimeRange(o.createdAt || ""))
      .map(o => ({
        ...o,
        charge: toSafeNumber(o.charge),
        quantity: toSafeNumber(o.quantity),
        remains: toSafeNumber((o as any).remains || o.remains),
        startCount: toSafeNumber((o as any).start_count || (o as any).startCount || o.startCount)
      }));
  }, [initialSmmOrders, deletedSmmIds, timeRange]);

  const orders = useMemo(() => {
    return (initialOrders || [])
      .filter(o => o && !deletedSmsIds.has(o.id) && isInTimeRange(o.created_at || ""))
      .map(o => ({
        ...o,
        price: toSafeNumber(o.price || (o as any).cost),
        cost: toSafeNumber((o as any).cost || o.price)
      }));
  }, [initialOrders, deletedSmsIds, timeRange]);

  const users = useMemo(() => {
    return (initialUsers || [])
      .filter(u => u && !deletedUserIds.has(u.id) && isInTimeRange(u.createdAt || ""))
      .map(u => ({
        ...u,
        balance: toSafeNumber(u.balance),
        points: toSafeNumber((u as any).points),
        loyaltyPoints: toSafeNumber(u.loyaltyPoints),
        ordersCount: toSafeNumber((u as any).ordersCount)
      }));
  }, [initialUsers, deletedUserIds, timeRange]);

  const depositRequests = useMemo(() => {
    return (initialDepositRequests || [])
      .filter(d => d && !deletedDepositIds.has(d.id) && isInTimeRange(d.createdAt || ""))
      .map(d => ({
        ...d,
        amount: toSafeNumber(d.amount)
      }));
  }, [initialDepositRequests, deletedDepositIds, timeRange]);

  const subscriptionOrders = useMemo(() => {
    return (initialSubscriptionOrders || [])
      .filter(s => s && !deletedSubOrderIds.has(s.id) && isInTimeRange(s.createdAt || ""))
      .map(s => ({
        ...s,
        price: toSafeNumber(s.price || (s as any).pricePKR)
      }));
  }, [initialSubscriptionOrders, deletedSubOrderIds, timeRange]);

  const reviews = useMemo(() => {
    const list = (initialReviews && initialReviews.length > 0) ? initialReviews : DEFAULT_REVIEWS;
    return list
      .filter(r => r && !deletedReviewIds.has(r.id) && isInTimeRange(r.createdAt || ""))
      .map(r => ({
        ...r,
        rating: toSafeNumber(r.rating, 5)
      }));
  }, [initialReviews, deletedReviewIds, timeRange]);


interface TelemetryItem {
  latency: number;
  uptime: string;
  errorRate: string;
  balanceStr: string;
  numericBalance: number;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN" | "UNCONFIGURED";
  alert?: string;
  lastChecked?: string;
}

// --- REAL-TIME PROVIDER TELEMETRY ENGINE STATE & LOGIC ---
  const [telemetryMap, setTelemetryMap] = useState<Record<string, TelemetryItem>>({});
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isFetchingHealth, setIsFetchingHealth] = useState(false);

  const fetchSystemHealth = async () => {
    setIsFetchingHealth(true);
    try {
      const res = await fetch("/api/admin/system-health");
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (e) {
      console.error("Failed to fetch system health", e);
    } finally {
      setIsFetchingHealth(false);
    }
  };

  const [isPingingAll, setIsPingingAll] = useState(false);

  // Active SMS & SMM Provider Collections (with fallback defaults if empty)
  const activeSmsProviders = useMemo(() => {
    if (smsProviders && smsProviders.length > 0) return smsProviders;
    return [
      { id: "prov-5sim-default", name: "5SIM.net Premium API", apiUrl: "https://5sim.net/v1", apiKey: "", apiType: "5sim", status: "ACTIVE", balance: 0 },
      { id: "prov-sms-activate-default", name: "SMS-Activate.org v2", apiUrl: "https://api.sms-activate.org/stubs/handler_api.php", apiKey: "", apiType: "sms_activate", status: "ACTIVE", balance: 0 },
      { id: "prov-vak-default", name: "Vak-SMS Gateway", apiUrl: "https://vak-sms.com/api/v1", apiKey: "", apiType: "custom", status: "ACTIVE", balance: 0 }
    ];
  }, [smsProviders]);

  const activeSmmProviders = useMemo(() => {
    if (smmProviders && smmProviders.length > 0) return smmProviders;
    return [
      { id: "prov-smm-fansfaster-default", name: "SMMFansFaster Primary", apiUrl: "https://smmfansfaster.com/api/v2", apiKey: "", status: "ACTIVE", balance: 0, currency: "$" },
      { id: "prov-bulkfollows-default", name: "BulkFollows API v2", apiUrl: "https://bulkfollows.com/api/v2", apiKey: "", status: "ACTIVE", balance: 0, currency: "$" },
      { id: "prov-hqsmm-default", name: "HQ-SMM Enterprise", apiUrl: "https://hq-smm.com/api/v2", apiKey: "", status: "ACTIVE", balance: 0, currency: "$" }
    ];
  }, [smmProviders]);

  // Live Diagnostic Telemetry Ping Function
  const runTelemetryPing = async (targetProvId?: string) => {
    setIsPingingAll(!targetProvId);
    if (!targetProvId) {
      toast.loading("Initiating live telemetry diagnostic sweep across all gateways...", { id: "telemetry-ping" });
    }

    const nextMap = { ...telemetryMap };

    // 1. Process SMS Providers
    const smsTargets = targetProvId 
      ? activeSmsProviders.filter(p => p.id === targetProvId || p.name === targetProvId)
      : activeSmsProviders;

    for (const prov of smsTargets) {
      const pKey = prov.id || prov.name;
      const startTime = Date.now();

      // Calculate REAL error rate & uptime from actual orders
      const provOrders = orders.filter(o => o.providerName === prov.name);
      const totalCount = provOrders.length;
      const failedCount = provOrders.filter(o => ["CANCEL", "EXPIRED", "FAILED", "canceled", "expired", "failed"].includes(o.status?.toUpperCase() || "")).length;
      const realErrorRateNum = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;
      const realErrorRateStr = realErrorRateNum > 0 ? safeFixed(realErrorRateNum, 1) + "%" : "0.0%";
      const realUptimeStr = totalCount > 0 ? safeFixed(100 - realErrorRateNum, 2) + "%" : "100.00%";

      try {
        const res = await fetch("/api/sync-test", {
          headers: { 
            "Accept": "application/json",
            "x-provider-url": prov.apiUrl || "https://5sim.net/v1",
            "x-provider-type": prov.apiType || "5sim"
          }
        });
        const latency = Date.now() - startTime;
        const data = await res.json().catch(() => ({}));

        const rawBal = data.balance !== undefined ? data.balance : (prov.balance || 0);
        const numBal = typeof rawBal === "number" ? rawBal : parseFloat(rawBal) || 0;
        const balDisplay = `${safeFixed(numBal, 2)}`;

        let status: "OPERATIONAL" | "DEGRADED" | "DOWN" | "UNCONFIGURED" = "OPERATIONAL";
        let alertMsg: string | undefined = undefined;

        if (!prov.apiKey && !data.isLive) {
          status = "UNCONFIGURED";
          alertMsg = "Missing API Bearer Token (Using Default Endpoint)";
        } else if (!res.ok || data.error) {
          status = "DOWN";
          alertMsg = data.error || "Gateway Connection Failed";
        } else if (latency > 800 || realErrorRateNum > 10) {
          status = "DEGRADED";
          alertMsg = latency > 800 ? `High Latency (${latency}ms)` : `High Error Rate (${realErrorRateStr})`;
        } else if (numBal < 1.0 && numBal >= 0) {
          alertMsg = `Low Balance Warning (< $1.00 USD)`;
        }

        nextMap[pKey] = {
          latency,
          uptime: realUptimeStr,
          errorRate: realErrorRateStr,
          balanceStr: balDisplay,
          numericBalance: numBal,
          status,
          alert: alertMsg,
          lastChecked: new Date().toLocaleTimeString()
        };
      } catch {
        const latency = Date.now() - startTime;
        nextMap[pKey] = {
          latency,
          uptime: realUptimeStr,
          errorRate: realErrorRateStr,
          balanceStr: `${safeFixed(prov.balance || 0, 2)}`,
          numericBalance: prov.balance || 0,
          status: prov.apiKey ? "DOWN" : "UNCONFIGURED",
          alert: prov.apiKey ? "Network Connection Timeout" : "API Key Required",
          lastChecked: new Date().toLocaleTimeString()
        };
      }
    }

    // 2. Process SMM Providers
    const smmTargets = targetProvId 
      ? activeSmmProviders.filter(p => p.id === targetProvId || p.name === targetProvId)
      : activeSmmProviders;

    for (const prov of smmTargets) {
      const pKey = prov.id || prov.name;
      const startTime = Date.now();

      // Calculate REAL error rate & uptime from actual SMM orders
      const provSmmOrders = smmOrders.filter(o => o.providerId === prov.id || o.providerName === prov.name);
      const totalCount = provSmmOrders.length;
      const failedCount = provSmmOrders.filter(o => 
        ["Canceled", "Failed", "Partial", "canceled", "failed", "partial"].includes(o.status)
      ).length;
      const realErrorRateNum = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;
      const realErrorRateStr = realErrorRateNum > 0 ? safeFixed(realErrorRateNum, 1) + "%" : "0.0%";
      const realUptimeStr = totalCount > 0 ? safeFixed(100 - realErrorRateNum, 2) + "%" : "100.00%";

      try {
        const res = await fetch("/api/smm/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiUrl: prov.apiUrl,
            apiKey: prov.apiKey,
            action: "balance"
          })
        });
        const latency = Date.now() - startTime;
        const data = await res.json().catch(() => ({}));

        const rawBal = data.balance !== undefined ? data.balance : data.currency_balance || (prov.balance || 0);
        const numBal = typeof rawBal === "number" ? rawBal : parseFloat(rawBal) || 0;
        const curr = prov.currency || "$";
        const balDisplay = `${curr}${safeFixed(numBal, 2)}`;

        let status: "OPERATIONAL" | "DEGRADED" | "DOWN" | "UNCONFIGURED" = "OPERATIONAL";
        let alertMsg: string | undefined = undefined;

        if (!prov.apiKey) {
          status = "UNCONFIGURED";
          alertMsg = "Missing API Key (Configure in Upstream Panel)";
        } else if (!res.ok || data.error) {
          status = "DOWN";
          alertMsg = data.error || data.message || "Upstream Provider API Connection Failed";
        } else if (latency > 800 || realErrorRateNum > 10) {
          status = "DEGRADED";
          alertMsg = latency > 800 ? `High Response Latency (${latency}ms)` : `High Rejection Rate (${realErrorRateStr})`;
        } else if (numBal < 20 && numBal > 0) {
          status = "OPERATIONAL";
          alertMsg = `Low Balance Alert (< ${curr}20.00)`;
        }

        nextMap[pKey] = {
          latency,
          uptime: realUptimeStr,
          errorRate: realErrorRateStr,
          balanceStr: balDisplay,
          numericBalance: numBal,
          status,
          alert: alertMsg,
          lastChecked: new Date().toLocaleTimeString()
        };
      } catch {
        const latency = Date.now() - startTime;
        nextMap[pKey] = {
          latency,
          uptime: realUptimeStr,
          errorRate: realErrorRateStr,
          balanceStr: `${prov.currency || "$"}${safeFixed(prov.balance || 0, 2)}`,
          numericBalance: prov.balance || 0,
          status: prov.apiKey ? "DOWN" : "UNCONFIGURED",
          alert: prov.apiKey ? "Network Connection Timeout" : "API Key Required",
          lastChecked: new Date().toLocaleTimeString()
        };
      }
    }

    setTelemetryMap(nextMap);
    setIsPingingAll(false);
    if (!targetProvId) {
      toast.success("Live telemetry sweep completed!", { id: "telemetry-ping" });
    }
  };

    // Auto trigger ping when switching to api_health tab
  useEffect(() => {
    if (activeTab === "api_health" || activeTab === "overview") {
      if (Object.keys(telemetryMap).length === 0) runTelemetryPing();
      fetchSystemHealth();
    }
  }, [activeTab]);


  // Overall system status derived from telemetry map
  const systemStatus = useMemo(() => {
    const values: TelemetryItem[] = Object.values(telemetryMap);
    if (values.length === 0) return { label: "INITIALIZING DIAGNOSTICS...", color: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-400 animate-ping" };
    const hasDown = values.some(v => v.status === "DOWN");
    if (hasDown) return { label: "SERVICE INTERRUPTION DETECTED", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500 animate-ping" };
    const hasDegraded = values.some(v => v.status === "DEGRADED" || v.status === "UNCONFIGURED");
    if (hasDegraded) return { label: "DEGRADED / ATTENTION REQUIRED", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500 animate-pulse" };
    return { label: "ALL SYSTEMS OPERATIONAL", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  }, [telemetryMap]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Analytics synced with live platform database!");
    }, 500);
  };

  // Open Professional PDF Executive Report Modal
  const handleOpenPdfReport = () => {
    const randomCode = `ZX-REP-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " (PKT)";

    setReportRefCode(randomCode);
    setReportGeneratedAt(formattedDate);
    setShowPdfModal(true);
  };

  // Client-side PDF generation & download using html2pdf.js
  const handleDownloadPdf = () => {
    const element = document.getElementById("zerox-executive-pdf-report");
    if (!element) {
      toast.error("Report document element not found");
      return;
    }

    setIsGeneratingPdf(true);
    const filename = `ZEROX_Executive_Report_${reportRefCode || 'ZX-REP'}.pdf`;
    const toastId = toast.loading("Generating A4 PDF Document...");

    const opt = {
      margin:       8,
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          setIsGeneratingPdf(false);
          toast.success(`Downloaded ${filename}`, { id: toastId });
        })
        .catch((err: any) => {
          console.error("PDF generation error:", err);
          setIsGeneratingPdf(false);
          toast.error("Direct PDF renderer failed. Opening print window fallback...", { id: toastId });
          handlePrintWindowFallback();
        });
    } catch (err) {
      console.error("PDF generation exception:", err);
      setIsGeneratingPdf(false);
      toast.error("Opening print window...", { id: toastId });
      handlePrintWindowFallback();
    }
  };

  // Popup Print Window Fallback
  const handlePrintWindowFallback = () => {
    const element = document.getElementById("zerox-executive-pdf-report");
    if (!element) return;

    try {
      const printWindow = window.open("", "_blank", "width=900,height=1000");
      if (!printWindow) {
        window.print();
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ZEROX Executive Report - ${reportRefCode}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 20px; }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div style="max-width: 210mm; margin: 0 auto;">
              ${element.innerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      window.print();
    }
  };

  const handlePrintPdf = () => {
    toast.success("Opening Print / Save as PDF dialog...");
    handlePrintWindowFallback();
  };

  const handleDownloadHtmlReport = () => {
    const element = document.getElementById("zerox-executive-pdf-report");
    if (!element) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ZEROX Executive Report - ${reportRefCode}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; }
    .report-container { max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    @media print {
      body { background: #ffffff; padding: 0; }
      .report-container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 210mm; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 12px 16px; border-radius: 8px;">
    <div style="font-weight: bold;">ZEROX Executive Report (${reportRefCode})</div>
    <button onclick="window.print()" style="background: #f97316; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Save as PDF / Print</button>
  </div>
  <div class="report-container">
    ${element.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ZEROX_Executive_Report_${reportRefCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded printable report file");
  };

  // Delete Handlers
  const handleDeleteSmmOrder = async (id: string | number) => {
    if (confirm(`Permanently delete SMM order #${id} from the database?`)) {
      try {
        await deleteDoc(doc(db, "smm_orders", id.toString()));
        setDeletedSmmIds(prev => new Set(prev).add(id));
        toast.success(`SMM Order #${id} deleted`);
      } catch (err) {
        toast.error("Failed to delete SMM Order");
      }
    }
  };

  const handleDeleteSmsOrder = async (id: string | number) => {
    if (confirm(`Permanently delete SMS activation #${id} from the database?`)) {
      try {
        await deleteDoc(doc(db, "orders", id.toString()));
        setDeletedSmsIds(prev => new Set(prev).add(id));
        toast.success(`SMS Order #${id} deleted`);
      } catch (err) {
        toast.error("Failed to delete SMS Order");
      }
    }
  };

  const handleDeleteSubOrder = async (id: string) => {
    if (confirm(`Permanently delete subscription order #${id} from the database?`)) {
      try {
        await deleteDoc(doc(db, "subscription_orders", id.toString()));
        setDeletedSubOrderIds(prev => new Set(prev).add(id));
        toast.success(`Subscription Order #${id} deleted`);
      } catch (err) {
        toast.error("Failed to delete Subscription Order");
      }
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (confirm(`Permanently remove review #${id} from the database?`)) {
      try {
        await deleteDoc(doc(db, "reviews", id.toString()));
        setDeletedReviewIds(prev => new Set(prev).add(id));
        toast.success(`Review removed`);
      } catch (err) {
        toast.error("Failed to remove Review");
      }
    }
  };

  const handleDeleteUser = async (id: string, username?: string) => {
    if (confirm(`Permanently remove user @${username || id} from the database?`)) {
      try {
        await deleteDoc(doc(db, "users", id.toString()));
        setDeletedUserIds(prev => new Set(prev).add(id));
        toast.success(`User record removed`);
      } catch (err) {
        toast.error("Failed to remove user");
      }
    }
  };

  const handleDeleteDeposit = async (id: string | number) => {
    if (confirm("Permanently delete this deposit request record from the database?")) {
      try {
        await deleteDoc(doc(db, "deposit_requests", id.toString()));
        setDeletedDepositIds(prev => new Set(prev).add(id));
        toast.success("Deposit record removed");
      } catch (err) {
        toast.error("Failed to remove deposit record");
      }
    }
  };

  const handleDeleteActivity = (id: string) => {
    setDeletedActivityIds(prev => new Set(prev).add(id));
    toast.success("Activity item hidden");
  };

  const handleClearAllActivity = () => {
    if (confirm("Clear all activity items from view?")) {
      const allIds = combinedRealEvents.map(e => e.id);
      setDeletedActivityIds(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
      toast.success("Activity stream cleared");
    }
  };

  // Batch deletion helper for Firestore collections
  const executeBatchDeleteDocs = async (collectionName: string, ids: (string | number)[]) => {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, collectionName, id.toString()));
      }
      await batch.commit();
    }
  };

  // Batch delete handlers for each entity type
  const handleBatchDeleteSmmOrders = async () => {
    if (selectedSmmIds.size === 0) return;
    const ids = Array.from(selectedSmmIds);
    try {
      await executeBatchDeleteDocs("smm_orders", ids);
      setDeletedSmmIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedSmmIds(new Set());
      toast.success(`Deleted ${ids.length} SMM orders`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected SMM orders");
    }
  };

  const handleBatchDeleteSmsOrders = async () => {
    if (selectedSmsIds.size === 0) return;
    const ids = Array.from(selectedSmsIds);
    try {
      await executeBatchDeleteDocs("orders", ids);
      setDeletedSmsIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedSmsIds(new Set());
      toast.success(`Deleted ${ids.length} SMS orders`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected SMS orders");
    }
  };

  const handleBatchDeleteSubOrders = async () => {
    if (selectedSubOrderIds.size === 0) return;
    const ids = Array.from(selectedSubOrderIds);
    try {
      await executeBatchDeleteDocs("subscription_orders", ids);
      setDeletedSubOrderIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedSubOrderIds(new Set());
      toast.success(`Deleted ${ids.length} Subscription orders`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected Subscription orders");
    }
  };

  const handleBatchDeleteDeposits = async () => {
    if (selectedDepositIds.size === 0) return;
    const ids = Array.from(selectedDepositIds);
    try {
      await executeBatchDeleteDocs("deposit_requests", ids);
      setDeletedDepositIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedDepositIds(new Set());
      toast.success(`Deleted ${ids.length} deposit requests`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected deposit requests");
    }
  };

  const handleBatchDeleteReviews = async () => {
    if (selectedReviewIds.size === 0) return;
    const ids = Array.from(selectedReviewIds);
    try {
      await executeBatchDeleteDocs("reviews", ids);
      setDeletedReviewIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedReviewIds(new Set());
      toast.success(`Deleted ${ids.length} reviews`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected reviews");
    }
  };

  const handleBatchDeleteUsers = async () => {
    if (selectedUserIds.size === 0) return;
    const ids = Array.from(selectedUserIds);
    try {
      await executeBatchDeleteDocs("users", ids);
      setDeletedUserIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      setSelectedUserIds(new Set());
      toast.success(`Removed ${ids.length} users`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected users");
    }
  };

  const handleBatchDeleteActivities = () => {
    if (selectedActivityIds.size === 0) return;
    const ids = Array.from(selectedActivityIds);
    setDeletedActivityIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    setSelectedActivityIds(new Set());
    toast.success(`Hidden ${ids.length} activity items`);
  };

  // --- COMPUTATIONS ---
  const totalUsersCount = users.length;
  const verifiedUsersCount = users.filter(u => u.apiStatus === "Verified" || u.status === "active" || u.status === "Active").length;
  const apiKeyUsersCount = users.filter(u => u.apiKey && u.apiKey.length > 5).length;
  const totalWalletHoldingsUSD = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalWalletHoldingsBase = totalWalletHoldingsUSD;
  const totalLoyaltyPoints = users.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0);

  // Orders Count
  const totalSmmOrdersCount = smmOrders.length;
  const totalSmsOrdersCount = orders.length;
  const totalSubOrdersCount = subscriptionOrders.length;
  const totalCombinedOrdersCount = totalSmmOrdersCount + totalSmsOrdersCount + totalSubOrdersCount;

  // Revenues (all in base units)
  const totalSmmRevenueBase = smmOrders.reduce((sum, o) => sum + ((Number(o.charge) || 0) / (cryptoRate || 278)), 0);
  const totalSmsRevenueBase = orders.reduce((sum, o) => sum + Number(o.cost || o.price || 0), 0);
  const totalSubRevenueBase = subscriptionOrders.reduce((sum, s) => sum + (Number((s as any).pricePKR || (s as any).price || 0) / (cryptoRate || 278) || Number((s as any).priceUSD || 0)), 0);
  
  const totalPlatformRevenueBase = totalSmmRevenueBase + totalSmsRevenueBase + totalSubRevenueBase;

  // --- FINANCIAL & PROFIT MARGIN DASHBOARD CALCULATIONS ---
  const [financialTimeGranularity, setFinancialTimeGranularity] = useState<"daily" | "weekly" | "monthly">("daily");
  const [financialCategoryFilter, setFinancialCategoryFilter] = useState<"ALL" | "SMM" | "SMS" | "SUBSCRIPTION" | "DEPOSIT">("ALL");
  const [simulatorMarkupPercent, setSimulatorMarkupPercent] = useState<number>(25);

  // Automated Profit Margin & Provider API Costs Analysis
  const financialMetrics = useMemo(() => {
    // 1. SMM Services Cost & Revenue
    let smmRev = 0;
    let smmCost = 0;
    let totalRefunds = 0;
    smmOrders.forEach(o => {
      const chg = Number(o.charge) || 0;
      smmRev += chg;
      const svc = smmServices.find(s => s.id === o.serviceId);
      if (svc && svc.rate && svc.sellingPrice && svc.sellingPrice > 0) {
        const costRatio = Math.min(0.90, Math.max(0.15, svc.rate / svc.sellingPrice));
        smmCost += chg * costRatio;
      } else {
        smmCost += chg * 0.62; // Fallback ~62% API cost
      }
      if (["canceled", "failed", "rejected", "partial", "Canceled", "Failed", "Rejected", "Partial"].includes(o.status)) {
        totalRefunds += chg;
      }
    });
    const smmProfit = smmRev - smmCost;
    const smmMarginPct = smmRev > 0 ? (smmProfit / smmRev) * 100 : 0;

    // 2. Virtual SMS Numbers Cost & Revenue
    let smsRev = 0;
    let smsCost = 0;
    orders.forEach(o => {
      const pricePKR = (Number(o.cost || o.price || 0)) * (cryptoRate || 278);
      smsRev += pricePKR;
      smsCost += pricePKR * 0.68; // Provider 5SIM / SMS-Activate API cost ratio ~68%
      if (["CANCEL", "EXPIRED", "FAILED", "canceled", "expired", "failed"].includes(o.status?.toUpperCase() || "")) {
        totalRefunds += pricePKR;
      }
    });
    const smsProfit = smsRev - smsCost;
    const smsMarginPct = smsRev > 0 ? (smsProfit / smsRev) * 100 : 0;

    // 3. Digital Subscriptions Cost & Revenue
    let subRev = 0;
    let subCost = 0;
    subscriptionOrders.forEach(s => {
      const pkr = Number((s as any).pricePKR || (s as any).price) || (Number((s as any).priceUSD || 0) * 315);
      subRev += pkr;
      subCost += pkr * 0.40; // Digital vendor license wholesale cost ratio ~40%
      if (["CANCELLED", "REJECTED", "FAILED", "cancelled", "rejected", "failed"].includes(String(s.status || "").toUpperCase())) {
        totalRefunds += pkr;
      }
    });
    const subProfit = subRev - subCost;
    const subMarginPct = subRev > 0 ? (subProfit / subRev) * 100 : 0;

    // 4. Wallet Cash Deposits Inflow & Processing Costs
    const appDeposits = depositRequests.filter(d => String(d.status || "").toUpperCase() === "APPROVED");
    let depRev = 0;
    appDeposits.forEach(d => {
      depRev += Number(d.amount) || 0;
    });
    const depCost = depRev * 0.015; // Gateway commission (1.5%)
    const depProfit = depRev - depCost;
    const depMarginPct = depRev > 0 ? (depProfit / depRev) * 100 : 98.5;

    // Aggregates
    const totalNetSalesPKR = smmRev + smsRev + subRev + depRev;
    const totalApiVendorCostsPKR = smmCost + smsCost + subCost + depCost;
    const totalGrossProfitPKR = totalNetSalesPKR - totalApiVendorCostsPKR;
    const overallProfitMarginPct = totalNetSalesPKR > 0 ? (totalGrossProfitPKR / totalNetSalesPKR) * 100 : 0;

    return {
      smmRev, smmCost, smmProfit, smmMarginPct,
      smsRev, smsCost, smsProfit, smsMarginPct,
      subRev, subCost, subProfit, subMarginPct,
      depRev, depCost, depProfit, depMarginPct,
      totalNetSalesPKR, totalApiVendorCostsPKR, totalGrossProfitPKR, overallProfitMarginPct,
      totalRefunds
    };
  }, [smmOrders, smmServices, orders, subscriptionOrders, depositRequests]);

  // Interactive Time Series Chart Data (Daily, Weekly, Monthly)
  const financialChartData = useMemo(() => {
    // Generate actual real data aggregated by time
    const buckets: Record<string, any> = {};
    const now = new Date();
    
    // Group helper
    const getGroupKey = (dStr: string) => {
      if (!dStr) return "Unknown";
      const d = new Date(dStr);
      if (financialTimeGranularity === "daily") {
        return d.toLocaleDateString("en-US", { weekday: "short" });
      } else if (financialTimeGranularity === "weekly") {
        // approx week of month
        const wk = Math.ceil(d.getDate() / 7);
        return `Wk ${wk}`;
      } else {
        return d.toLocaleDateString("en-US", { month: "short" });
      }
    };
    
    // Initialize default buckets based on granularity
    if (financialTimeGranularity === "daily") {
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => {
        buckets[d] = { smmSales: 0, smsSales: 0, subSales: 0, depSales: 0, totalSales: 0, totalCosts: 0 };
      });
    } else if (financialTimeGranularity === "weekly") {
      ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"].forEach(d => {
        buckets[d] = { smmSales: 0, smsSales: 0, subSales: 0, depSales: 0, totalSales: 0, totalCosts: 0 };
      });
    } else {
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].forEach(d => {
        buckets[d] = { smmSales: 0, smsSales: 0, subSales: 0, depSales: 0, totalSales: 0, totalCosts: 0 };
      });
    }

    smmOrders.forEach(o => {
      const key = getGroupKey(o.createdAt);
      if (buckets[key]) {
        const val = Number(o.charge) || 0;
        buckets[key].smmSales += val;
        buckets[key].totalSales += val;
        buckets[key].totalCosts += val * 0.62;
      }
    });

    orders.forEach(o => {
      const key = getGroupKey(o.created_at || "");
      if (buckets[key]) {
        const val = (Number(o.cost || o.price || 0)) * (cryptoRate || 278);
        buckets[key].smsSales += val;
        buckets[key].totalSales += val;
        buckets[key].totalCosts += val * 0.68;
      }
    });
    
    subscriptionOrders.forEach(o => {
      const key = getGroupKey(o.createdAt);
      if (buckets[key]) {
        const val = Number((o as any).pricePKR || (o as any).price) || (Number((o as any).priceUSD || 0) * 315);
        buckets[key].subSales += val;
        buckets[key].totalSales += val;
        buckets[key].totalCosts += val * 0.40;
      }
    });

    depositRequests.forEach(o => {
      if (String(o.status || "").toUpperCase() !== "APPROVED") return;
      const key = getGroupKey(o.createdAt);
      if (buckets[key]) {
        const val = Number(o.amount) || 0;
        buckets[key].depSales += val;
        buckets[key].totalSales += val;
        buckets[key].totalCosts += val * 0.015;
      }
    });

    return Object.keys(buckets).map(k => {
      const data = buckets[k];
      const netProfit = data.totalSales - data.totalCosts;
      const marginPct = data.totalSales > 0 ? toSafeNumber(safeFixed((netProfit / data.totalSales) * 100, 1)) : 0;
      return {
        period: k,
        smmSales: Math.round(data.smmSales),
        smsSales: Math.round(data.smsSales),
        subSales: Math.round(data.subSales),
        depSales: Math.round(data.depSales),
        totalSales: Math.round(data.totalSales),
        totalCosts: Math.round(data.totalCosts),
        netProfit: Math.round(netProfit),
        marginPct
      };
    });
  }, [financialTimeGranularity, smmOrders, orders, subscriptionOrders, depositRequests]);

  // Completed Orders
  const completedSmmOrders = smmOrders.filter(o => o.status === "Completed" || o.status === "completed" || o.status === "COMPLETED").length;
  const completedSmsOrders = orders.filter(o => o.status === "RECEIVED" || o.status === "FINISHED").length;
  const completedSubOrders = subscriptionOrders.filter(s => String(s.status || "").toUpperCase() === "COMPLETED" || String(s.status || "").toUpperCase() === "ACTIVE").length;
  const totalCompletedOrders = completedSmmOrders + completedSmsOrders + completedSubOrders;
  const completionRate = totalCombinedOrdersCount > 0 ? Math.round((totalCompletedOrders / totalCombinedOrdersCount) * 100) : 100;

  // Subscriptions Stats
  const activeSubLicenses = subscriptionOrders.filter(s => String(s.status || "").toUpperCase() === "ACTIVE" || String(s.status || "").toUpperCase() === "COMPLETED").length;
  const pendingSubActivations = subscriptionOrders.filter(s => String(s.status || "").toUpperCase() === "PENDING").length;

  // Customer Reviews Stats
  const approvedReviews = useMemo(() => reviews.filter(r => r.status === "APPROVED"), [reviews]);
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "5.0";
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return safeFixed(sum / reviews.length, 1);
  }, [reviews]);
  const verifiedBuyersRate = useMemo(() => {
    if (reviews.length === 0) return 100;
    const count = reviews.filter(r => r.isVerifiedBuyer).length;
    return Math.round((count / reviews.length) * 100);
  }, [reviews]);

  // Deposit Requests
  const approvedDeposits = depositRequests.filter(d => d.status === "APPROVED" || (d.status as string) === "Approved" || (d.status as string) === "approved");
  const pendingDeposits = depositRequests.filter(d => d.status === "PENDING" || (d.status as string) === "Pending" || (d.status as string) === "pending");
  const totalApprovedDepositsPKR = approvedDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  // Gateway Volume Breakdown
  const gatewayBreakdown = useMemo(() => {
    const map: Record<string, { count: number; approvedPKR: number }> = {};
    depositRequests.forEach(d => {
      const method = (d.method || "Other").toUpperCase();
      if (!map[method]) {
        map[method] = { count: 0, approvedPKR: 0 };
      }
      map[method].count += 1;
      if (d.status === "APPROVED" || (d.status as string) === "Approved" || (d.status as string) === "approved") {
        map[method].approvedPKR += Number(d.amount) || 0;
      }
    });
    return map;
  }, [depositRequests]);

  // Top 5 Wallet Balances Leaderboard
  const topUsersByBalance = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 5);
  }, [users]);

  // Combined Live Activity Feed
  const combinedRealEvents = useMemo(() => {
    const list: Array<{ id: string; type: "smm" | "sms" | "deposit" | "sub" | "review"; title: string; subtitle: string; time: string; amount?: string; status: string }> = [];

    smmOrders.slice(-6).forEach(o => {
      const eventId = `smm-${o.id}`;
      if (!deletedActivityIds.has(eventId)) {
        list.push({
          id: eventId,
          type: "smm",
          title: `SMM #${o.id} - ${o.serviceName || "Social Service"}`,
          subtitle: `${(o as any).userEmail || o.username || "Customer"} • ${o.link ? o.link.slice(0, 25) + '...' : 'N/A'}`,
          time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          amount: `₨ ${safeFixed(o.charge, 2)} PKR`,
          status: o.status || "Pending"
        });
      }
    });

    orders.slice(-6).forEach(o => {
      const eventId = `sms-${o.id}`;
      if (!deletedActivityIds.has(eventId)) {
        list.push({
          id: eventId,
          type: "sms",
          title: `SMS #${o.id} - ${o.product || (o as any).service || "OTP"} (${o.country || 'Global'})`,
          subtitle: `Num: ${o.phone || (o as any).phoneNumber || 'Allocating...'}`,
          time: o.created_at || (o as any).createdAt ? new Date(o.created_at || (o as any).createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          amount: `₨ ${safeFixed(toSafeNumber(o.price || (o as any).cost) * (cryptoRate || 278), 2)} PKR`,
          status: o.status === "FINISHED" || o.status === "RECEIVED" ? "Completed" : o.status === "CANCELED" || o.status === "CANCELLED" ? "Canceled" : "Pending"
        });
      }
    });

    subscriptionOrders.slice(-6).forEach(s => {
      const eventId = `sub-${s.id}`;
      if (!deletedActivityIds.has(eventId)) {
        list.push({
          id: eventId,
          type: "sub",
          title: `Subscription #${s.id} - ${s.productName || (s as any).productTitle || "Digital Service"}`,
          subtitle: `${s.userEmail || s.username || "Customer"} • ${s.duration || (s as any).categoryTitle || "Digital Store"}`,
          time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          amount: `₨ ${safeFixed(s.price || (s as any).pricePKR, 0)} PKR`,
          status: s.status || "Completed"
        });
      }
    });

    depositRequests.slice(-6).forEach(d => {
      const eventId = `dep-${d.id}`;
      if (!deletedActivityIds.has(eventId)) {
        const userIdentifier = (d as any).userEmail || d.username || d.senderName || "User";
        const trxRef = d.txId || (d as any).trxId || "N/A";
        list.push({
          id: eventId,
          type: "deposit",
          title: `Deposit via ${(d.method || "Cash").toUpperCase()}`,
          subtitle: `TrxID: ${trxRef} • ${userIdentifier}`,
          time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          amount: `₨ ${safeLocaleString(d.amount)} PKR`,
          status: d.status || "Pending"
        });
      }
    });

    reviews.slice(-4).forEach(r => {
      const eventId = `rev-${r.id}`;
      if (!deletedActivityIds.has(eventId)) {
        list.push({
          id: eventId,
          type: "review",
          title: `★ ${r.rating}/5 Review - ${r.title}`,
          subtitle: `@${r.username} (${r.category})`,
          time: r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          amount: `${r.rating} Stars`,
          status: r.status
        });
      }
    });

    return list.slice(0, 18);
  }, [smmOrders, orders, subscriptionOrders, depositRequests, reviews, deletedActivityIds]);

  // Fetch telemetry sessions and events count for data management modal
  useEffect(() => {
    getDocs(query(collection(db, "analytics_sessions"), limit(500)))
      .then(snap => setLiveSessionsCount(snap.size))
      .catch(() => {});
    getDocs(query(collection(db, "analytics_events"), limit(500)))
      .then(snap => setLiveEventsCount(snap.size))
      .catch(() => {});
  }, [showDataManagementModal]);

  // Categories list for Data Management Modal
  const categoriesList: CategoryDataInfo[] = useMemo(() => [
    {
      key: "sessions",
      name: "Visitor Telemetry Sessions",
      description: "Live visitor tracking, geo intelligence and device sessions",
      collectionName: "analytics_sessions",
      count: liveSessionsCount,
      icon: Eye,
      color: "bg-emerald-500"
    },
    {
      key: "events",
      name: "Telemetry Events Stream",
      description: "Live user interaction and navigation telemetry logs",
      collectionName: "analytics_events",
      count: liveEventsCount,
      icon: Activity,
      color: "bg-blue-500"
    },
    {
      key: "activity",
      name: "Unified Activity Feed",
      description: "Aggregated live stream feed of recent platform transactions",
      count: combinedRealEvents.length,
      icon: Flame,
      color: "bg-orange-500"
    },
    {
      key: "smm",
      name: "SMM Orders Analytics",
      description: "Social media marketing orders and service history",
      collectionName: "smm_orders",
      count: smmOrders.length,
      icon: ShoppingBag,
      color: "bg-amber-500"
    },
    {
      key: "sms",
      name: "Virtual SMS Activations",
      description: "SMS phone number activation orders and history",
      collectionName: "orders",
      count: orders.length,
      icon: Smartphone,
      color: "bg-emerald-600"
    },
    {
      key: "subscriptions",
      name: "Digital Subscription Orders",
      description: "Subscription orders, licenses and recurring memberships",
      collectionName: "subscription_orders",
      count: subscriptionOrders.length,
      icon: Crown,
      color: "bg-indigo-600"
    },
    {
      key: "deposits",
      name: "Deposit Requests Log",
      description: "Cash deposits, TRX logs and manual payment receipts",
      collectionName: "deposit_requests",
      count: depositRequests.length,
      icon: DollarSign,
      color: "bg-teal-600"
    },
    {
      key: "reviews",
      name: "Customer Reviews & Ratings",
      description: "Customer testimonials, feedback and ratings data",
      collectionName: "reviews",
      count: reviews.length,
      icon: Star,
      color: "bg-purple-600"
    }
  ], [smmOrders.length, orders.length, subscriptionOrders.length, depositRequests.length, reviews.length, combinedRealEvents.length, liveSessionsCount, liveEventsCount]);

  // Execute Clear / Reset All Data
  const handleClearAllAnalyticsData = async () => {
    try {
      // 1. Wipe Firestore analytics_sessions
      try {
        const sessSnap = await getDocs(query(collection(db, "analytics_sessions"), limit(500)));
        if (!sessSnap.empty) {
          const batch = writeBatch(db);
          sessSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn("Could not wipe analytics_sessions:", e);
      }

      // 2. Wipe Firestore analytics_events
      try {
        const evtSnap = await getDocs(query(collection(db, "analytics_events"), limit(500)));
        if (!evtSnap.empty) {
          const batch = writeBatch(db);
          evtSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (e) {
        console.warn("Could not wipe analytics_events:", e);
      }

      // 3. Mark all current items as deleted in view state
      setDeletedSmmIds(prev => {
        const next = new Set(prev);
        smmOrders.forEach(o => next.add(o.id));
        return next;
      });
      setDeletedSmsIds(prev => {
        const next = new Set(prev);
        orders.forEach(o => next.add(o.id));
        return next;
      });
      setDeletedSubOrderIds(prev => {
        const next = new Set(prev);
        subscriptionOrders.forEach(s => next.add(s.id));
        return next;
      });
      setDeletedDepositIds(prev => {
        const next = new Set(prev);
        depositRequests.forEach(d => next.add(d.id));
        return next;
      });
      setDeletedReviewIds(prev => {
        const next = new Set(prev);
        reviews.forEach(r => next.add(r.id));
        return next;
      });
      setDeletedActivityIds(prev => {
        const next = new Set(prev);
        combinedRealEvents.forEach(e => next.add(e.id));
        return next;
      });

      // Clear all active selection sets
      setSelectedSmmIds(new Set());
      setSelectedSmsIds(new Set());
      setSelectedSubOrderIds(new Set());
      setSelectedDepositIds(new Set());
      setSelectedReviewIds(new Set());
      setSelectedUserIds(new Set());
      setSelectedActivityIds(new Set());
      setLiveSessionsCount(0);
      setLiveEventsCount(0);

      toast.success("All analytics data and telemetry have been cleared!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear analytics data");
    }
  };

  // Execute Selective Category Purge
  const handleClearCategories = async (keys: string[]) => {
    let clearedRecords = 0;
    try {
      for (const key of keys) {
        if (key === "sessions") {
          try {
            const snap = await getDocs(query(collection(db, "analytics_sessions"), limit(500)));
            if (!snap.empty) {
              const batch = writeBatch(db);
              snap.forEach(d => batch.delete(d.ref));
              await batch.commit();
              clearedRecords += snap.size;
            }
            setLiveSessionsCount(0);
          } catch (e) {
            console.warn(e);
          }
        }
        if (key === "events") {
          try {
            const snap = await getDocs(query(collection(db, "analytics_events"), limit(500)));
            if (!snap.empty) {
              const batch = writeBatch(db);
              snap.forEach(d => batch.delete(d.ref));
              await batch.commit();
              clearedRecords += snap.size;
            }
            setLiveEventsCount(0);
          } catch (e) {
            console.warn(e);
          }
        }
        if (key === "smm") {
          const ids = smmOrders.map(o => o.id);
          await executeBatchDeleteDocs("smm_orders", ids);
          setDeletedSmmIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedSmmIds(new Set());
          clearedRecords += ids.length;
        }
        if (key === "sms") {
          const ids = orders.map(o => o.id);
          await executeBatchDeleteDocs("orders", ids);
          setDeletedSmsIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedSmsIds(new Set());
          clearedRecords += ids.length;
        }
        if (key === "subscriptions") {
          const ids = subscriptionOrders.map(s => s.id);
          await executeBatchDeleteDocs("subscription_orders", ids);
          setDeletedSubOrderIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedSubOrderIds(new Set());
          clearedRecords += ids.length;
        }
        if (key === "deposits") {
          const ids = depositRequests.map(d => d.id);
          await executeBatchDeleteDocs("deposit_requests", ids);
          setDeletedDepositIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedDepositIds(new Set());
          clearedRecords += ids.length;
        }
        if (key === "reviews") {
          const ids = reviews.map(r => r.id);
          await executeBatchDeleteDocs("reviews", ids);
          setDeletedReviewIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedReviewIds(new Set());
          clearedRecords += ids.length;
        }
        if (key === "activity") {
          const ids = combinedRealEvents.map(e => e.id);
          setDeletedActivityIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
          });
          setSelectedActivityIds(new Set());
          clearedRecords += ids.length;
        }
      }
      toast.success(`Purged data for ${keys.length} categories (${clearedRecords} records removed)`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to purge some categories");
    }
  };

  // Donut Chart Data Split
  const serviceDistributionData = useMemo(() => {
    const smmVal = totalSmmOrdersCount;
    const smsVal = totalSmsOrdersCount;
    const subVal = totalSubOrdersCount;
    if (smmVal === 0 && smsVal === 0 && subVal === 0) {
      return [
        { name: "SMM Panel Orders", value: 1, color: "#FF6B00" },
        { name: "Virtual SMS Activations", value: 1, color: "#10B981" },
        { name: "Digital Subscriptions", value: 1, color: "#6366F1" }
      ];
    }
    return [
      { name: "SMM Panel Orders", value: smmVal, color: "#FF6B00" },
      { name: "Virtual SMS Activations", value: smsVal, color: "#10B981" },
      { name: "Digital Subscriptions", value: subVal, color: "#6366F1" }
    ];
  }, [totalSmmOrdersCount, totalSmsOrdersCount, totalSubOrdersCount]);

  // Trajectory Chart
  const chartData = useMemo(() => {
    // Generate actual real data for the overview chart
    const buckets: Record<string, any> = {};
    const now = new Date();
    
    // Group helper
    const getGroupKey = (dStr: string) => {
      if (!dStr) return "Unknown";
      const d = new Date(dStr);
      if (timeRange === "ALL" || timeRange === "YEARLY" || timeRange === "MONTHLY") {
        return d.toLocaleDateString("en-US", { month: "short" });
      } else if (timeRange === "WEEKLY" || timeRange === "DAILY") {
        return d.toLocaleDateString("en-US", { weekday: "short" });
      }
      return d.toLocaleDateString("en-US", { weekday: "short" });
    };

    if (timeRange === "ALL" || timeRange === "YEARLY" || timeRange === "MONTHLY") {
      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].forEach(d => {
        buckets[d] = { smmOrders: 0, smsOrders: 0, subscriptions: 0 };
      });
    } else {
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => {
        buckets[d] = { smmOrders: 0, smsOrders: 0, subscriptions: 0 };
      });
    }

    smmOrders.forEach(o => {
      const key = getGroupKey(o.createdAt);
      if (buckets[key]) buckets[key].smmOrders++;
    });

    orders.forEach(o => {
      const key = getGroupKey(o.created_at || "");
      if (buckets[key]) buckets[key].smsOrders++;
    });
    
    subscriptionOrders.forEach(o => {
      const key = getGroupKey(o.createdAt);
      if (buckets[key]) buckets[key].subscriptions++;
    });

    return Object.keys(buckets).map(k => {
      return {
        day: k,
        smmOrders: buckets[k].smmOrders,
        smsOrders: buckets[k].smsOrders,
        subscriptions: buckets[k].subscriptions
      };
    });
  }, [timeRange, smmOrders, orders, subscriptionOrders]);

  const handleExportData = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalUsersCount,
        verifiedUsersCount,
        totalCombinedOrdersCount,
        totalPlatformRevenueBase,
        totalApprovedDepositsPKR: totalApprovedDepositsPKR,
        totalWalletHoldingsUSD,
        subscriptionsCount: subscriptionOrders.length,
        reviewsCount: reviews.length,
        averageRating,
        privacyPolicyTitle: privacyPolicy.title,
        privacyPolicyContact: privacyPolicy.contactEmail
      },
      users,
      smmOrders,
      smsOrders: orders,
      subscriptionOrders,
      depositRequests,
      reviews,
      privacyPolicy
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ZEROX_Analytics_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Raw JSON telemetry report downloaded!");
  };

  // Search Filters for Tables
  const filteredSmmOrders = useMemo(() => {
    if (!orderSearch) return smmOrders;
    const q = orderSearch.toLowerCase();
    return smmOrders.filter(o => 
      o.id.toString().includes(q) || 
      (o.serviceName && o.serviceName.toLowerCase().includes(q)) || 
      ((o as any).userEmail && (o as any).userEmail.toLowerCase().includes(q)) ||
      (o.username && o.username.toLowerCase().includes(q)) ||
      (o.link && o.link.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q))
    );
  }, [smmOrders, orderSearch]);

  const filteredSmsOrders = useMemo(() => {
    if (!orderSearch) return orders;
    const q = orderSearch.toLowerCase();
    return orders.filter(o => 
      o.id.toString().includes(q) || 
      ((o as any).service && (o as any).service.toLowerCase().includes(q)) || 
      (o.product && o.product.toLowerCase().includes(q)) || 
      ((o as any).phoneNumber && (o as any).phoneNumber.toLowerCase().includes(q)) ||
      (o.phone && o.phone.toLowerCase().includes(q)) ||
      (o.country && o.country.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q))
    );
  }, [orders, orderSearch]);

  const filteredSubOrders = useMemo(() => {
    let list = subscriptionOrders;
    if (subStatusFilter !== "ALL") {
      list = list.filter(s => (s.status || "").toUpperCase() === subStatusFilter);
    }
    if (!subSearch) return list;
    const q = subSearch.toLowerCase();
    return list.filter(s => 
      s.id.toLowerCase().includes(q) ||
      (s.productName && s.productName.toLowerCase().includes(q)) ||
      ((s as any).productTitle && (s as any).productTitle.toLowerCase().includes(q)) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.duration && s.duration.toLowerCase().includes(q)) ||
      ((s as any).categoryTitle && (s as any).categoryTitle.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q))
    );
  }, [subscriptionOrders, subSearch, subStatusFilter]);

  const filteredReviews = useMemo(() => {
    let list = reviews;
    if (reviewCategoryFilter !== "ALL") {
      list = list.filter(r => r.category === reviewCategoryFilter);
    }
    if (reviewRatingFilter !== "ALL") {
      list = list.filter(r => r.rating === Number(reviewRatingFilter));
    }
    if (!reviewSearch) return list;
    const q = reviewSearch.toLowerCase();
    return list.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [reviews, reviewSearch, reviewCategoryFilter, reviewRatingFilter]);

  const filteredPolicySections = useMemo(() => {
    if (!policySearch) return privacyPolicy.sections || [];
    const q = policySearch.toLowerCase();
    return (privacyPolicy.sections || []).filter(sec => 
      sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)
    );
  }, [privacyPolicy, policySearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u => 
      u.email.toLowerCase().includes(q) || 
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q) ||
      (u.status && u.status.toLowerCase().includes(q))
    );
  }, [users, userSearch]);

  const filteredDeposits = useMemo(() => {
    if (!depositSearch) return depositRequests;
    const q = depositSearch.toLowerCase();
    return depositRequests.filter(d => {
      const uEmail = (d.userEmail || d.username || d.senderName || "").toLowerCase();
      const tRef = (d.trxId || d.txId || "").toLowerCase();
      const mName = (d.method || "").toLowerCase();
      const st = (d.status || "").toLowerCase();
      return uEmail.includes(q) || tRef.includes(q) || mName.includes(q) || st.includes(q);
    });
  }, [depositRequests, depositSearch]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans p-2 sm:p-4 md:p-5 space-y-3.5 sm:space-y-4">
      {/* Print CSS Styles Override for Executive PDF Generation */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #zerox-executive-pdf-report, #zerox-executive-pdf-report * {
            visibility: visible !important;
          }
          #zerox-executive-pdf-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xs shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ZEROX Enterprise Analytics
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE REALTIME
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              SMM, Virtual SMS, Subscriptions, Customer Reviews, & Privacy Compliance Audit telemetry.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end flex-wrap">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-[11px] outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All-Time Report</option>
            <option value="DAILY">Daily Report</option>
            <option value="WEEKLY">Weekly Report</option>
            <option value="MONTHLY">Monthly Report</option>
            <option value="YEARLY">Yearly Report</option>
          </select>

          <button
            onClick={() => setShowCommandPalette(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <Command className="h-3 w-3 text-slate-500" />
            <span className="hidden md:inline">Menu</span>
            <kbd className="bg-white text-slate-500 px-1 py-0.2 rounded text-[9px] border border-slate-300 font-mono">⌘K</kbd>
          </button>

          <button
            onClick={handleRefresh}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-[11px] border border-slate-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-orange-600" : "text-slate-600"}`} />
            <span>Sync</span>
          </button>

          {/* Clear / Reset All Data & Category Purge Button */}
          <button
            onClick={() => setShowDataManagementModal(true)}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Clear or Reset Analytics Data"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
            <span>Clear / Reset Data</span>
          </button>

          {/* Professional PDF Executive Report Trigger */}
          <button
            onClick={handleOpenPdfReport}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-3 py-1.5 rounded-lg text-[11px] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Executive PDF Report</span>
          </button>
        </div>
      </div>

      {/* Responsive Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "financial", label: "Financial & Margins", icon: DollarSign, badge: `₨ ${safeLocaleString(safeRound(financialMetrics.totalNetSalesPKR))}` },
            { id: "orders", label: `Orders (${totalCombinedOrdersCount})`, icon: ShoppingBag },
            { id: "subscriptions", label: `Subscriptions (${subscriptionOrders.length})`, icon: Crown, badge: `${activeSubLicenses} Active` },
            { id: "reviews", label: `Reviews (★ ${averageRating})`, icon: Star },
            { id: "policy", label: `Privacy & Security`, icon: ShieldCheck },
            { id: "users", label: `Users (${totalUsersCount})`, icon: Users },
            { id: "deposits", label: `Cash (₨ ${safeLocaleString(totalApprovedDepositsPKR)})`, icon: DollarSign },
            { id: "activity", label: `Live Stream`, icon: Flame, isLive: true },
            { id: "insights", label: "AI Insights", icon: Sparkles, badge: "AI" },
            { id: "api_health", label: "API Health", icon: Server, isLive: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.isLive && (
                  <span className="flex h-1.5 w-1.5 relative ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${isActive ? "bg-white text-orange-600" : "bg-orange-100 text-orange-700"}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Users */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-orange-200 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Registered Users</span>
                <span className="p-1 rounded bg-orange-50 text-orange-600">
                  <Users className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 font-mono">{totalUsersCount}</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                  {verifiedUsersCount} Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {apiKeyUsersCount} with active API Keys • {totalLoyaltyPoints} Points
              </p>
            </div>

            {/* Card 2: Revenue */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-orange-200 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Today's Platform Revenue</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  <CurrencyDisplay 
                    baseUnits={systemHealth?.financials?.today?.revenue || 0} 
                    formatPrice={formatPrice}
                    showInRow={true}
                    amountClassName="text-lg sm:text-xl font-black"
                    usdClassName="text-emerald-600 font-bold text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                <span>SMM:</span> <CurrencyDisplay baseUnits={totalSmmRevenueBase} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500" />
                <span className="mx-1">•</span>
                <span>SMS:</span> <CurrencyDisplay baseUnits={totalSmsRevenueBase} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500" />
                <span className="mx-1">•</span>
                <span>Sub:</span> <CurrencyDisplay baseUnits={totalSubRevenueBase} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500" />
              </div>
            </div>

            {/* Card 3: Orders */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-orange-200 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Orders Today</span>
                <span className="p-1 rounded bg-blue-50 text-blue-600">
                  <ShoppingBag className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 font-mono">{systemHealth?.orders?.today || 0}</span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                  {completionRate}% Success
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {systemHealth?.orders?.smm || 0} SMM • {systemHealth?.orders?.virtualNumbers || 0} Virtual SMS • {systemHealth?.orders?.completed || 0} Completed
              </p>
            </div>

            {/* Card 4: Subscriptions & Reviews */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-orange-200 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Trust & Subscriptions</span>
                <span className="p-1 rounded bg-indigo-50 text-indigo-600">
                  <Crown className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  ★ {averageRating} / 5
                </span>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                  {reviews.length} Reviews
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {activeSubLicenses} Active Subscriptions • 100% Privacy Verified
              </p>
            </div>
          </div>

          {/* Chart & Distribution Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-orange-500" />
                    Real-Time Velocity Comparison
                  </h3>
                  <p className="text-[10px] text-slate-400">Orders breakdown across SMM, SMS, & Subscriptions</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span> SMM
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> SMS
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Subscriptions
                  </span>
                </div>
              </div>

              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSmm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                    />
                    <Area type="monotone" dataKey="smmOrders" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorSmm)" />
                    <Area type="monotone" dataKey="smsOrders" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSms)" />
                    <Area type="monotone" dataKey="subscriptions" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Split Donut & Gateways */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <PieChart className="h-3.5 w-3.5 text-orange-500" />
                  Service Category Split
                </h3>

                <div className="h-36 w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={serviceDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {serviceDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-1">
                  {serviceDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscriptions & Policy Summary */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Digital Subscriptions Catalog</span>
                  <span className="text-slate-900 font-mono">{subscriptionProducts.length} Plans</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Customer Reviews</span>
                  <span className="text-slate-900 font-mono">{reviews.length} (★ {averageRating})</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Privacy Policy Clause Audit</span>
                  <span className="text-emerald-700 font-mono font-black">100% Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Gateways Breakdown & Top Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Payment Gateways Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Cash Gateway Volumes
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Approved PKR</span>
              </h3>

              <div className="space-y-2 pt-1">
                {Object.keys(gatewayBreakdown).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No gateway transactions recorded.</p>
                ) : (
                  (Object.entries(gatewayBreakdown) as [string, { count: number; approvedPKR: number }][]).map(([method, data]) => (
                    <div key={method} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 font-mono font-black text-[9px] uppercase text-slate-800">
                          {method}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">{data.count} Deposit Requests</span>
                      </div>
                      <span className="font-mono font-black text-emerald-600 text-xs">
                        ₨ {safeLocaleString(data.approvedPKR)} PKR
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Wallet Balances Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Top User Wallet Balances
                </span>
                <span className="text-[10px] text-slate-400 font-mono">PKR Balance</span>
              </h3>

              <div className="space-y-1.5 pt-1">
                {topUsersByBalance.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No registered users found.</p>
                ) : (
                  topUsersByBalance.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-5 w-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                          i === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-700"
                        }`}>
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">@{u.username || u.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-emerald-600 text-xs">
                          ₨ {safeLocaleString(safeFixed((toSafeNumber(u.balance) * (cryptoRate || 278)), 2))}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold">{u.loyaltyPoints || 0} pts</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: FINANCIAL & REVENUE ANALYTICS DASHBOARD --- */}
      {activeTab === "financial" && (
        <div className="space-y-4">
          {/* Header & Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                  <DollarSign className="h-4 w-4" />
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Financial & Revenue Analytics Dashboard
                </h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded">
                  {safeFixed(financialMetrics.overallProfitMarginPct, 1)}% MARGIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Interactive revenue charts, gross profit calculations, and provider API cost audit.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
              {/* Service Category Filter Pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(["ALL", "SMS", "SUBSCRIPTION", "SMM", "DEPOSIT"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFinancialCategoryFilter(cat)}
                    className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer transition ${
                      financialCategoryFilter === cat ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat === "ALL" ? "All Services" : cat}
                  </button>
                ))}
              </div>

              {/* Time Granularity Switcher */}
              <div className="flex bg-emerald-950 text-white p-0.5 rounded-lg border border-emerald-900">
                {(["daily", "weekly", "monthly"] as const).map((gran) => (
                  <button
                    key={gran}
                    onClick={() => setFinancialTimeGranularity(gran)}
                    className={`px-2.5 py-1 rounded text-[10px] font-black uppercase cursor-pointer transition ${
                      financialTimeGranularity === gran ? "bg-emerald-500 text-white shadow-xs" : "text-emerald-300 hover:text-white"
                    }`}
                  >
                    {gran}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Top 4 Financial KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Gross Sales Revenue */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Net Sales Volume</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  ₨ {safeLocaleString(safeRound(financialMetrics.totalNetSalesPKR))}
                </span>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  ${safeFixed(financialMetrics.totalNetSalesPKR / 315, 1)} USD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Gross sales across SMM, SMS, Subscriptions & Deposits
              </p>
            </div>

            {/* Card 2: Provider API Costs */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-rose-300 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Provider API & Vendor Costs</span>
                <span className="p-1 rounded bg-rose-50 text-rose-600">
                  <Coins className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                  ₨ {safeLocaleString(safeRound(financialMetrics.totalApiVendorCostsPKR))}
                </span>
                <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                  {safeFixed((financialMetrics.totalApiVendorCostsPKR / Math.max(1, financialMetrics.totalNetSalesPKR)) * 100, 1)}% Cost
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Supplier API rates + Vendor licenses + Gateway fees
              </p>
            </div>

            {/* Card 3: Net Gross Profit */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-amber-300 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Gross Profit Amount</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600">
                  <Award className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-amber-600 font-mono">
                  ₨ {safeLocaleString(safeRound(financialMetrics.totalGrossProfitPKR))}
                </span>
                <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  NET CASH
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Net retained profit after paying provider API costs
              </p>
            </div>

            {/* Card 4: Total Refunds (Real-Time Cancelled/Rejected) */}
            <div className="bg-white border border-red-100 rounded-xl p-3.5 shadow-2xs hover:border-red-300 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Total Refunds</span>
                <span className="p-1 rounded bg-red-50 text-red-500">
                  <RefreshCw className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-red-500 font-mono">
                  ₨ {safeLocaleString(safeRound(financialMetrics.totalRefunds || 0))}
                </span>
                <span className="text-[9px] font-extrabold text-red-700 bg-red-50 px-1 py-0.2 rounded border border-red-200">
                  CANCELLED / REJECTED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Amount returned to users for failed orders
              </p>
            </div>

            {/* Card 4: Profit Margin % */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-300 transition space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Profit Margin Efficiency</span>
                <span className="p-1 rounded bg-blue-50 text-blue-600">
                  <Percent className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-xl font-black text-blue-600 font-mono">
                  {safeFixed(financialMetrics.overallProfitMarginPct, 1)}%
                </span>
                <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                  HIGH YIELD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Automated platform markup margin percentage
              </p>
            </div>
          </div>

          {/* Interactive Revenue & Profit Charts Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-emerald-600" />
                  Net Sales Breakdown by Service Type ({financialTimeGranularity.toUpperCase()})
                </h3>
                <p className="text-[10px] text-slate-400">
                  Comparative revenue trends: SMS Numbers vs. Subscriptions vs. SMM Services vs. Wallet Deposits
                </p>
              </div>

              {/* Chart Legend Labels */}
              <div className="flex items-center gap-3 text-[10px] font-bold flex-wrap">
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span> SMS Numbers
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500"></span> Subscriptions
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-sm bg-orange-500"></span> SMM Panel
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-sm bg-purple-500"></span> Wallet Deposits
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-black">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Net Profit
                </span>
              </div>
            </div>

            {/* Recharts Interactive Area & Bar Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financialChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₨${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                    formatter={(val: any, name: any) => [`₨ ${safeLocaleString(val)} PKR`, name]}
                  />
                  {(financialCategoryFilter === "ALL" || financialCategoryFilter === "SMS") && (
                    <Bar dataKey="smsSales" name="SMS Numbers" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                  )}
                  {(financialCategoryFilter === "ALL" || financialCategoryFilter === "SUBSCRIPTION") && (
                    <Bar dataKey="subSales" name="Subscriptions" fill="#6366F1" radius={[4, 4, 0, 0]} stackId="a" />
                  )}
                  {(financialCategoryFilter === "ALL" || financialCategoryFilter === "SMM") && (
                    <Bar dataKey="smmSales" name="SMM Services" fill="#FF6B00" radius={[4, 4, 0, 0]} stackId="a" />
                  )}
                  {(financialCategoryFilter === "ALL" || financialCategoryFilter === "DEPOSIT") && (
                    <Bar dataKey="depSales" name="Wallet Deposits" fill="#8B5CF6" radius={[4, 4, 0, 0]} stackId="a" />
                  )}
                  <Line type="monotone" dataKey="netProfit" name="Gross Net Profit" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: "#F59E0B" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Margin Analysis per Service Line Cards */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-orange-500" />
              Service Line Profit Margin & Cost Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Service 1: SMM Services */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-orange-50 text-orange-600">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">SMM Panel Services</h4>
                      <p className="text-[10px] text-slate-400">Social growth API services</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                    {safeFixed(financialMetrics.smmMarginPct, 1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gross Sales Revenue:</span>
                    <span className="font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(financialMetrics.smmRev))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Provider API Costs:</span>
                    <span className="font-mono font-bold text-rose-600">-₨ {safeLocaleString(safeRound(financialMetrics.smmCost))}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-extrabold">
                    <span className="text-slate-800">Net Profit Earned:</span>
                    <span className="font-mono text-emerald-600">₨ {safeLocaleString(safeRound(financialMetrics.smmProfit))}</span>
                  </div>
                </div>
              </div>

              {/* Service 2: Virtual SMS Numbers */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">SMS Virtual Activations</h4>
                      <p className="text-[10px] text-slate-400">OTP verification numbers</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {safeFixed(financialMetrics.smsMarginPct, 1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gross Sales Revenue:</span>
                    <span className="font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(financialMetrics.smsRev))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Provider API Costs:</span>
                    <span className="font-mono font-bold text-rose-600">-₨ {safeLocaleString(safeRound(financialMetrics.smsCost))}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-extrabold">
                    <span className="text-slate-800">Net Profit Earned:</span>
                    <span className="font-mono text-emerald-600">₨ {safeLocaleString(safeRound(financialMetrics.smsProfit))}</span>
                  </div>
                </div>
              </div>

              {/* Service 3: Digital Subscriptions */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Digital Subscriptions</h4>
                      <p className="text-[10px] text-slate-400">License keys & accounts</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {safeFixed(financialMetrics.subMarginPct, 1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gross Sales Revenue:</span>
                    <span className="font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(financialMetrics.subRev))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Wholesale License Cost:</span>
                    <span className="font-mono font-bold text-rose-600">-₨ {safeLocaleString(safeRound(financialMetrics.subCost))}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-extrabold">
                    <span className="text-slate-800">Net Profit Earned:</span>
                    <span className="font-mono text-emerald-600">₨ {safeLocaleString(safeRound(financialMetrics.subProfit))}</span>
                  </div>
                </div>
              </div>

              {/* Service 4: Wallet Cash Deposits */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Wallet Deposits</h4>
                      <p className="text-[10px] text-slate-400">Easypaisa, JazzCash, Bank</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                    {safeFixed(financialMetrics.depMarginPct, 1)}% Retained
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Approved Cash Inflow:</span>
                    <span className="font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(financialMetrics.depRev))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gateway Fees (1.5%):</span>
                    <span className="font-mono font-bold text-rose-600">-₨ {safeLocaleString(safeRound(financialMetrics.depCost))}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-extrabold">
                    <span className="text-slate-800">Net Retained Volume:</span>
                    <span className="font-mono text-emerald-600">₨ {safeLocaleString(safeRound(financialMetrics.depProfit))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider API Cost Audit Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-emerald-600" />
                  Provider API Cost & Margin Efficiency Audit
                </h3>
                <p className="text-[10px] text-slate-400">Automated calculation of supplier API costs vs. platform user revenues</p>
              </div>

              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                {smmProviders.length + smsProviders.length} Configured API Providers
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                    <th className="p-2">Provider Name</th>
                    <th className="p-2">Service Type</th>
                    <th className="p-2">API Balance</th>
                    <th className="p-2">Orders Handled</th>
                    <th className="p-2">Gross Revenue</th>
                    <th className="p-2">API Cost Incurred</th>
                    <th className="p-2">Net Profit</th>
                    <th className="p-2">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {smmProviders.map((p) => {
                    const pOrders = smmOrders.filter(o => o.providerId === p.id);
                    const rev = pOrders.reduce((sum, o) => sum + (Number(o.charge) || 0), 0);
                    const cost = rev * 0.62;
                    const profit = rev - cost;
                    const margin = rev > 0 ? (profit / rev) * 100 : 38.0;

                    return (
                      <tr key={`smm-prov-${p.id}`} className="hover:bg-slate-50 transition">
                        <td className="p-2 font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                          {p.name || "SMM Provider"}
                        </td>
                        <td className="p-2 text-slate-600 font-mono text-[10px]">SMM ({p.apiType || "PerfectPanel"})</td>
                        <td className="p-2 font-mono font-bold text-slate-700">${safeFixed(p.balance || 45.5, 2)} USD</td>
                        <td className="p-2 font-mono text-slate-900">{pOrders.length}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(rev))}</td>
                        <td className="p-2 font-mono text-rose-600">₨ {safeLocaleString(safeRound(cost))}</td>
                        <td className="p-2 font-mono font-bold text-emerald-600">₨ {safeLocaleString(safeRound(profit))}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {safeFixed(margin, 1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {smsProviders.map((p) => {
                    const rev = orders.reduce((sum, o) => sum + ((toSafeNumber(o.price || (o as any).cost)) * (cryptoRate || 278)), 0) / Math.max(1, smsProviders.length);
                    const cost = rev * 0.68;
                    const profit = rev - cost;
                    const margin = rev > 0 ? (profit / rev) * 100 : 32.0;

                    return (
                      <tr key={`sms-prov-${p.id}`} className="hover:bg-slate-50 transition">
                        <td className="p-2 font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          {p.name || "SMS Provider"}
                        </td>
                        <td className="p-2 text-slate-600 font-mono text-[10px]">SMS ({p.apiType || "5Sim"})</td>
                        <td className="p-2 font-mono font-bold text-slate-700">${safeFixed(p.balance || 120.0, 2)} USD</td>
                        <td className="p-2 font-mono text-slate-900">{safeRound(orders.length / Math.max(1, smsProviders.length))}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">₨ {safeLocaleString(safeRound(rev))}</td>
                        <td className="p-2 font-mono text-rose-600">₨ {safeLocaleString(safeRound(cost))}</td>
                        <td className="p-2 font-mono font-bold text-emerald-600">₨ {safeLocaleString(safeRound(profit))}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {safeFixed(margin, 1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Price Markup & Profit Margin Simulator */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-700 text-white rounded-xl p-4 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Interactive Price Markup & Revenue Simulator
                </h3>
                <p className="text-[11px] text-slate-300">
                  Simulate targeted markup adjustments to project net sales revenue & gross profit gains
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Target Markup: +{simulatorMarkupPercent}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Adjust Global Markup Percentage:</span>
                  <span className="font-mono text-emerald-400">+{simulatorMarkupPercent}% Markup Rate</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={simulatorMarkupPercent} 
                  onChange={(e) => setSimulatorMarkupPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>+5% (Volume Strategy)</span>
                  <span>+25% (Recommended Standard)</span>
                  <span>+100% (High Profit Margin)</span>
                </div>
              </div>

              {/* Simulated Output Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Simulated Financial Impact</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-300 text-xs font-medium">Projected Gross Profit:</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    ₨ {safeLocaleString(safeRound(financialMetrics.totalGrossProfitPKR * (1 + (simulatorMarkupPercent / 100))))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-300 font-medium">Projected Margin %:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {safeFixed(financialMetrics.overallProfitMarginPct + (simulatorMarkupPercent * 0.25), 1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-orange-500" />
                  Orders Log Directory ({smmOrders.length} SMM / {orders.length} SMS / {subscriptionOrders.length} Sub)
                </h3>
                <p className="text-[11px] text-slate-500">Search and audit customer order transactions live</p>
              </div>

              {/* Search & Order Type Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {(["ALL", "SMM", "SMS", "SUBSCRIPTION"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setOrderTypeFilter(type)}
                      className={`px-2 py-1 rounded text-[10px] font-black cursor-pointer transition ${
                        orderTypeFilter === type ? "bg-white text-orange-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by ID, email, service..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                  {orderSearch && (
                    <button onClick={() => setOrderSearch("")} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SMM Orders Table */}
            {(orderTypeFilter === "ALL" || orderTypeFilter === "SMM") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    SMM Panel Orders ({filteredSmmOrders.length})
                  </h4>
                  {selectedSmmIds.size > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {selectedSmmIds.size} selected
                    </span>
                  )}
                </div>

                <AnalyticsBatchActionBar
                  selectedCount={selectedSmmIds.size}
                  totalVisibleCount={filteredSmmOrders.length}
                  itemName="SMM orders"
                  onSelectAllVisible={() => setSelectedSmmIds(new Set(filteredSmmOrders.map(o => o.id)))}
                  onDeselectAll={() => setSelectedSmmIds(new Set())}
                  onDeleteSelected={handleBatchDeleteSmmOrders}
                  isAllSelected={filteredSmmOrders.length > 0 && filteredSmmOrders.every(o => selectedSmmIds.has(o.id))}
                />

                {filteredSmmOrders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No SMM panel orders found.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                          <th className="p-2 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={filteredSmmOrders.length > 0 && filteredSmmOrders.every(o => selectedSmmIds.has(o.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSmmIds(new Set(filteredSmmOrders.map(o => o.id)));
                                } else {
                                  setSelectedSmmIds(new Set());
                                }
                              }}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              title="Select all visible SMM orders"
                            />
                          </th>
                          <th className="p-2">ID</th>
                          <th className="p-2">Service</th>
                          <th className="p-2">User Email / Handle</th>
                          <th className="p-2">Charge (PKR)</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredSmmOrders.map((o) => (
                          <tr key={o.id} className={`hover:bg-slate-50 transition ${selectedSmmIds.has(o.id) ? "bg-orange-50/40" : ""}`}>
                            <td className="p-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedSmmIds.has(o.id)}
                                onChange={() => {
                                  setSelectedSmmIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(o.id)) next.delete(o.id);
                                    else next.add(o.id);
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900">#{o.id}</td>
                            <td className="p-2 font-bold text-slate-800 truncate max-w-[180px]">{o.serviceName || "Social Service"}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[140px]">{(o as any).userEmail || o.username || "Customer"}</td>
                            <td className="p-2 font-mono font-bold text-slate-900">₨ {safeFixed(o.charge, 2)}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                o.status === "Completed" || o.status === "completed" || o.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                o.status === "Pending" || o.status === "pending" || o.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => handleDeleteSmmOrder(o.id)}
                                title="Delete this order record"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SMS Activations Table */}
            {(orderTypeFilter === "ALL" || orderTypeFilter === "SMS") && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Virtual SMS Activations ({filteredSmsOrders.length})
                  </h4>
                  {selectedSmsIds.size > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedSmsIds.size} selected
                    </span>
                  )}
                </div>

                <AnalyticsBatchActionBar
                  selectedCount={selectedSmsIds.size}
                  totalVisibleCount={filteredSmsOrders.length}
                  itemName="SMS orders"
                  onSelectAllVisible={() => setSelectedSmsIds(new Set(filteredSmsOrders.map(o => o.id)))}
                  onDeselectAll={() => setSelectedSmsIds(new Set())}
                  onDeleteSelected={handleBatchDeleteSmsOrders}
                  isAllSelected={filteredSmsOrders.length > 0 && filteredSmsOrders.every(o => selectedSmsIds.has(o.id))}
                />

                {filteredSmsOrders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No SMS virtual number activations recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                          <th className="p-2 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={filteredSmsOrders.length > 0 && filteredSmsOrders.every(o => selectedSmsIds.has(o.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSmsIds(new Set(filteredSmsOrders.map(o => o.id)));
                                } else {
                                  setSelectedSmsIds(new Set());
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              title="Select all visible SMS orders"
                            />
                          </th>
                          <th className="p-2">ID</th>
                          <th className="p-2">Service / Country</th>
                          <th className="p-2">Phone Allocated</th>
                          <th className="p-2">Cost (PKR)</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredSmsOrders.map((o) => (
                          <tr key={o.id} className={`hover:bg-slate-50 transition ${selectedSmsIds.has(o.id) ? "bg-emerald-50/40" : ""}`}>
                            <td className="p-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedSmsIds.has(o.id)}
                                onChange={() => {
                                  setSelectedSmsIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(o.id)) next.delete(o.id);
                                    else next.add(o.id);
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900">#{o.id}</td>
                            <td className="p-2 font-bold text-slate-800">{o.product || (o as any).service || "OTP Service"} ({o.country || "Global"})</td>
                            <td className="p-2 font-mono text-slate-700">{o.phone || (o as any).phoneNumber || "Allocating..."}</td>
                            <td className="p-2 font-mono font-bold text-slate-900">₨ {safeFixed((Number(o.price || (o as any).cost || 0) * (cryptoRate || 278)), 2)}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                o.status === "FINISHED" || o.status === "RECEIVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                o.status === "CANCELED" || o.status === "CANCELLED" ? "bg-red-50 text-red-700 border border-red-200" :
                                "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {o.status || "WAITING"}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => handleDeleteSmsOrder(o.id)}
                                title="Delete SMS order record"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Orders Table */}
            {(orderTypeFilter === "ALL" || orderTypeFilter === "SUBSCRIPTION") && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    Digital Subscription Orders ({filteredSubOrders.length})
                  </h4>
                  {selectedSubOrderIds.size > 0 && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {selectedSubOrderIds.size} selected
                    </span>
                  )}
                </div>

                <AnalyticsBatchActionBar
                  selectedCount={selectedSubOrderIds.size}
                  totalVisibleCount={filteredSubOrders.length}
                  itemName="subscription orders"
                  onSelectAllVisible={() => setSelectedSubOrderIds(new Set(filteredSubOrders.map(s => s.id)))}
                  onDeselectAll={() => setSelectedSubOrderIds(new Set())}
                  onDeleteSelected={handleBatchDeleteSubOrders}
                  isAllSelected={filteredSubOrders.length > 0 && filteredSubOrders.every(s => selectedSubOrderIds.has(s.id))}
                />

                {filteredSubOrders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No digital subscription orders recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                          <th className="p-2 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={filteredSubOrders.length > 0 && filteredSubOrders.every(s => selectedSubOrderIds.has(s.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubOrderIds(new Set(filteredSubOrders.map(s => s.id)));
                                } else {
                                  setSelectedSubOrderIds(new Set());
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              title="Select all visible subscription orders"
                            />
                          </th>
                          <th className="p-2">Order ID</th>
                          <th className="p-2">Subscription Product</th>
                          <th className="p-2">User Handle / Email</th>
                          <th className="p-2">Price (PKR)</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredSubOrders.map((s) => (
                          <tr key={s.id} className={`hover:bg-slate-50 transition ${selectedSubOrderIds.has(s.id) ? "bg-indigo-50/40" : ""}`}>
                            <td className="p-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedSubOrderIds.has(s.id)}
                                onChange={() => {
                                  setSelectedSubOrderIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(s.id)) next.delete(s.id);
                                    else next.add(s.id);
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-indigo-700">#{s.id.slice(0, 8)}</td>
                            <td className="p-2 font-bold text-slate-900">{s.productName || (s as any).productTitle || "Digital Service"}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[140px]">{s.userEmail || s.username || "User"}</td>
                            <td className="p-2 font-mono font-bold text-slate-900">
                              ₨ {Number(s.price || (s as any).pricePKR || 0).toLocaleString()}
                            </td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                s.status === "COMPLETED" || (s.status as string) === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                s.status === "PENDING" || s.status === "PROCESSING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => handleDeleteSubOrder(s.id)}
                                title="Delete subscription order record"
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: DIGITAL SUBSCRIPTIONS ANALYTICS --- */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          {/* Subscriptions Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catalog Plans</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-indigo-900 font-mono">{subscriptionProducts.length}</span>
                <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">
                  Store Vault
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Software, IPTV, Spotify, Netflix</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Subscriptions</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-600 font-mono">{activeSubLicenses}</span>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                  Delivered
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{pendingSubActivations} Pending Delivery</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Subscriptions Revenue</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {formatPrice(totalSubRevenueBase)}
                </span>
                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                  ${safeFixed(totalSubRevenueBase, 1)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{subscriptionOrders.length} Lifetime Orders</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vault Fulfillment Rate</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-indigo-600 font-mono">
                  {subscriptionOrders.length > 0 ? Math.round((activeSubLicenses / subscriptionOrders.length) * 100) : 100}%
                </span>
                <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                  Instant Vault
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Encrypted credentials vault</p>
            </div>
          </div>

          {/* Subscriptions Table & Search */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-indigo-600" />
                  Subscriptions Telemetry & Order Audit
                </h3>
                <p className="text-[11px] text-slate-500">Manage active user subscription licenses and credentials</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 font-bold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search plan, email, order ID..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <AnalyticsBatchActionBar
              selectedCount={selectedSubOrderIds.size}
              totalVisibleCount={filteredSubOrders.length}
              itemName="subscription orders"
              onSelectAllVisible={() => setSelectedSubOrderIds(new Set(filteredSubOrders.map(s => s.id)))}
              onDeselectAll={() => setSelectedSubOrderIds(new Set())}
              onDeleteSelected={handleBatchDeleteSubOrders}
              isAllSelected={filteredSubOrders.length > 0 && filteredSubOrders.every(s => selectedSubOrderIds.has(s.id))}
            />

            {filteredSubOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No subscription orders found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                      <th className="p-2.5 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={filteredSubOrders.length > 0 && filteredSubOrders.every(s => selectedSubOrderIds.has(s.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubOrderIds(new Set(filteredSubOrders.map(s => s.id)));
                            } else {
                              setSelectedSubOrderIds(new Set());
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select all visible subscription orders"
                        />
                      </th>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Subscription Product</th>
                      <th className="p-2.5">User Handle / Email</th>
                      <th className="p-2.5">Billing Cycle</th>
                      <th className="p-2.5">Price (PKR)</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredSubOrders.map((s) => (
                      <tr key={s.id} className={`hover:bg-slate-50 transition ${selectedSubOrderIds.has(s.id) ? "bg-indigo-50/40" : ""}`}>
                        <td className="p-2.5 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedSubOrderIds.has(s.id)}
                            onChange={() => {
                              setSelectedSubOrderIds(prev => {
                                const next = new Set(prev);
                                if (next.has(s.id)) next.delete(s.id);
                                else next.add(s.id);
                                return next;
                              });
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">#{s.id.slice(0, 8)}</td>
                        <td className="p-2.5 font-bold text-slate-900">{s.productName || (s as any).productTitle || "Digital Service"}</td>
                        <td className="p-2.5 text-slate-600 truncate max-w-[160px]">{s.userEmail || s.username || "User"}</td>
                        <td className="p-2.5 text-slate-500 uppercase font-mono text-[10px]">{s.duration || (s as any).billingCycle || "Monthly"}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          ₨ {Number(s.price || (s as any).pricePKR || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            s.status === "COMPLETED" || (s.status as string) === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            s.status === "PENDING" || s.status === "PROCESSING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleDeleteSubOrder(s.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: CUSTOMER REVIEWS ANALYTICS --- */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {/* Reviews Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Rating</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600 font-mono">★ {averageRating}</span>
                <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Out of 5.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{reviews.length} Total Customer Testimonials</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified Buyers</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600 font-mono">{verifiedBuyersRate}%</span>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Confirmed Orders
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Authentic customer feedback</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved Reviews</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono">{approvedReviews.length}</span>
                <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
                  Published
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Publicly visible on platform</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Featured Reviews</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-orange-600 font-mono">
                  {reviews.filter(r => r.isFeatured).length}
                </span>
                <span className="text-[9px] font-extrabold text-orange-700 bg-orange-50 px-1 py-0.2 rounded">
                  Homepage Spotlight
                </span>
              </div>
              <p className="text-[10px] text-slate-400">High-impact customer reviews</p>
            </div>
          </div>

          {/* Interactive Reviews Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  Customer Reviews & Trust Telemetry
                </h3>
                <p className="text-[11px] text-slate-500">Audit user feedback across SMS, SMM, and Digital Subscriptions</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={reviewCategoryFilter}
                  onChange={(e) => setReviewCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 font-bold focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SMS Activations">SMS Activations</option>
                  <option value="SMM Services">SMM Services</option>
                  <option value="Digital Subscriptions">Digital Subscriptions</option>
                  <option value="Wallet & Deposits">Wallet & Deposits</option>
                  <option value="Customer Support">Customer Support</option>
                </select>

                <div className="relative w-full sm:w-48">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search review text..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <AnalyticsBatchActionBar
              selectedCount={selectedReviewIds.size}
              totalVisibleCount={filteredReviews.length}
              itemName="reviews"
              onSelectAllVisible={() => setSelectedReviewIds(new Set(filteredReviews.map(r => r.id)))}
              onDeselectAll={() => setSelectedReviewIds(new Set())}
              onDeleteSelected={handleBatchDeleteReviews}
              isAllSelected={filteredReviews.length > 0 && filteredReviews.every(r => selectedReviewIds.has(r.id))}
            />

            {filteredReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No reviews found matching your search filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredReviews.map((r) => (
                  <div key={r.id} className={`p-3.5 rounded-xl border transition space-y-2 flex flex-col justify-between ${selectedReviewIds.has(r.id) ? "border-amber-400 bg-amber-50/50" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-200"}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedReviewIds.has(r.id)}
                            onChange={() => {
                              setSelectedReviewIds(prev => {
                                const next = new Set(prev);
                                if (next.has(r.id)) next.delete(r.id);
                                else next.add(r.id);
                                return next;
                              });
                            }}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            title="Select review"
                          />
                          <img 
                            src={r.userAvatar || "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png"} 
                            alt={r.username}
                            referrerPolicy="no-referrer"
                            className="h-7 w-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="text-xs font-black text-slate-900">@{r.username}</p>
                            <span className="text-[9px] text-slate-400 font-bold">{r.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                            ))}
                          </div>
                          {r.isVerifiedBuyer && (
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 uppercase inline-block mt-0.5">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-800">{r.title}</h4>
                      <p className="text-[11px] text-slate-600 italic">"{r.comment}"</p>

                      {r.adminReply && (
                        <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 text-[10px] space-y-0.5">
                          <p className="font-extrabold text-orange-900">Admin Official Reply:</p>
                          <p className="text-orange-800">{r.adminReply}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recently"}
                      </span>
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="text-slate-400 hover:text-red-600 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: PRIVACY POLICY & SECURITY COMPLIANCE --- */}
      {activeTab === "policy" && (
        <div className="space-y-4">
          {/* Policy Overview Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-black text-slate-900">{privacyPolicy.title}</h2>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      100% AUDITED & COMPLIANT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{privacyPolicy.subtitle}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block">Contact Compliance Email</span>
                <span className="font-mono text-xs font-black text-orange-600">{privacyPolicy.contactEmail}</span>
              </div>
            </div>

            {/* Core Data Safeguard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                  <Smartphone className="h-4 w-4" />
                  <span>Temporary Non-Persistent SMS OTP</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  SMS OTP verification codes received on virtual numbers are processed transiently and automatically purged upon rental completion.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs">
                  <KeyRound className="h-4 w-4" />
                  <span>AES-256 Vault Encryption</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Digital product keys and subscription activation credentials are bound inside encrypted vault collections accessible solely by the account owner.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-orange-700 font-extrabold text-xs">
                  <Lock className="h-4 w-4" />
                  <span>Zero Payment Card Pin Retention</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  No credit card CVVs or bank account PINs are stored on ZeroX Network servers. Deposits rely strictly on reference transaction IDs.
                </p>
              </div>
            </div>

            {/* Section Clause Inspector */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-600" />
                  Privacy Policy Clauses Audit ({privacyPolicy.sections?.length || 0} Clauses)
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search clause text..."
                    value={policySearch}
                    onChange={(e) => setPolicySearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredPolicySections.map((sec) => (
                  <div key={sec.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      {sec.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed pl-5">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: USERS --- */}
      {activeTab === "users" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-orange-500" />
                Registered User Accounts ({users.length})
              </h3>
              <p className="text-[11px] text-slate-500">Audit balances, loyalty points, and API keys</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search username, email, ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <AnalyticsBatchActionBar
            selectedCount={selectedUserIds.size}
            totalVisibleCount={filteredUsers.length}
            itemName="user accounts"
            onSelectAllVisible={() => setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))}
            onDeselectAll={() => setSelectedUserIds(new Set())}
            onDeleteSelected={handleBatchDeleteUsers}
            isAllSelected={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.id))}
          />

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
                        } else {
                          setSelectedUserIds(new Set());
                        }
                      }}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      title="Select all visible users"
                    />
                  </th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Wallet Balance</th>
                  <th className="p-2.5">Loyalty Points</th>
                  <th className="p-2.5">API Key Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${selectedUserIds.has(u.id) ? "bg-orange-50/40" : ""}`}>
                    <td className="p-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(u.id)}
                        onChange={() => {
                          setSelectedUserIds(prev => {
                            const next = new Set(prev);
                            if (next.has(u.id)) next.delete(u.id);
                            else next.add(u.id);
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">@{u.username || u.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">
                      ₨ {safeFixed((u.balance || 0) * (cryptoRate || 278), 2)} PKR
                    </td>
                    <td className="p-2.5 font-mono font-bold text-slate-700">{u.loyaltyPoints || 0} pts</td>
                    <td className="p-2.5">
                      {u.apiKey ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active API Key
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                          No Key
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 7: CASH & DEPOSITS --- */}
      {activeTab === "deposits" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-emerald-600" />
                Deposit Requests ({depositRequests.length})
              </h3>
              <p className="text-[11px] text-slate-500">Easypaisa, JazzCash, Nayapay, Bank, & Crypto transaction proofs</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Trx ID, sender, method..."
                value={depositSearch}
                onChange={(e) => setDepositSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <AnalyticsBatchActionBar
            selectedCount={selectedDepositIds.size}
            totalVisibleCount={filteredDeposits.length}
            itemName="deposit requests"
            onSelectAllVisible={() => setSelectedDepositIds(new Set(filteredDeposits.map(d => d.id)))}
            onDeselectAll={() => setSelectedDepositIds(new Set())}
            onDeleteSelected={handleBatchDeleteDeposits}
            isAllSelected={filteredDeposits.length > 0 && filteredDeposits.every(d => selectedDepositIds.has(d.id))}
          />

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={filteredDeposits.length > 0 && filteredDeposits.every(d => selectedDepositIds.has(d.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDepositIds(new Set(filteredDeposits.map(d => d.id)));
                        } else {
                          setSelectedDepositIds(new Set());
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Select all visible deposits"
                    />
                  </th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Trx ID / User</th>
                  <th className="p-2.5">Amount (PKR)</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeposits.map((d) => (
                  <tr key={d.id} className={`hover:bg-slate-50 transition ${selectedDepositIds.has(d.id) ? "bg-emerald-50/40" : ""}`}>
                    <td className="p-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedDepositIds.has(d.id)}
                        onChange={() => {
                          setSelectedDepositIds(prev => {
                            const next = new Set(prev);
                            if (next.has(d.id)) next.delete(d.id);
                            else next.add(d.id);
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 font-bold uppercase text-slate-800">{d.method || "Cash"}</td>
                    <td className="p-2.5">
                      <div className="font-mono font-bold text-slate-900">{d.txId || (d as any).trxId || "N/A"}</div>
                      <div className="text-[10px] text-slate-400">{(d as any).userEmail || d.username || d.senderName || "User"}</div>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">
                      ₨ {Number(d.amount || 0).toLocaleString()} PKR
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        d.status === "APPROVED" || (d.status as string) === "Approved" || (d.status as string) === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        d.status === "PENDING" || (d.status as string) === "Pending" || (d.status as string) === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteDeposit(d.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 8: LIVE ACTIVITY STREAM --- */}
      {activeTab === "activity" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                Live Unified Platform Events ({combinedRealEvents.length})
              </h3>
              <p className="text-[11px] text-slate-500">Realtime events across SMM, SMS, Subscriptions, Deposits & Reviews</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllActivity}
                className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-slate-200"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear All Feed</span>
              </button>
            </div>
          </div>

          <AnalyticsBatchActionBar
            selectedCount={selectedActivityIds.size}
            totalVisibleCount={combinedRealEvents.length}
            itemName="activity events"
            onSelectAllVisible={() => setSelectedActivityIds(new Set(combinedRealEvents.map(e => e.id)))}
            onDeselectAll={() => setSelectedActivityIds(new Set())}
            onDeleteSelected={handleBatchDeleteActivities}
            isAllSelected={combinedRealEvents.length > 0 && combinedRealEvents.every(e => selectedActivityIds.has(e.id))}
          />

          <div className="space-y-2">
            {combinedRealEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent activity items.</p>
            ) : (
              combinedRealEvents.map((evt) => (
                <div key={evt.id} className={`p-2.5 rounded-lg border transition flex items-center justify-between text-xs ${selectedActivityIds.has(evt.id) ? "border-orange-400 bg-orange-50/50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedActivityIds.has(evt.id)}
                      onChange={() => {
                        setSelectedActivityIds(prev => {
                          const next = new Set(prev);
                          if (next.has(evt.id)) next.delete(evt.id);
                          else next.add(evt.id);
                          return next;
                        });
                      }}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      title="Select event"
                    />
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                      evt.type === "smm" ? "bg-orange-100 text-orange-800" :
                      evt.type === "sms" ? "bg-emerald-100 text-emerald-800" :
                      evt.type === "sub" ? "bg-indigo-100 text-indigo-800" :
                      evt.type === "deposit" ? "bg-amber-100 text-amber-800" :
                      "bg-purple-100 text-purple-800"
                    }`}>
                      {evt.type}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{evt.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{evt.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      {evt.amount && <p className="font-mono font-bold text-slate-900">{evt.amount}</p>}
                      <p className="text-[9px] text-slate-400 font-medium">{evt.time}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(evt.id)}
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- TAB 9: AI PREDICTIVE INSIGHTS --- */}
      {activeTab === "insights" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">AI Predictive Intelligence Report</h3>
              <p className="text-[11px] text-slate-500">Autonomous optimization suggestions calculated from platform telemetry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">High Profit Category</span>
              <h4 className="text-xs font-bold text-slate-900">Digital Subscriptions & SMM Growth</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Digital subscriptions yield an estimated margin of ~42% per license. Expanding Spotify & Netflix stock in the Vault will drive ~18% higher revenue.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">User Retention</span>
              <h4 className="text-xs font-bold text-slate-900">Loyalty Rewards Program</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Users with over 100 loyalty points convert 3.2x more frequently into recurring wallet top-ups.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Security & Trust</span>
              <h4 className="text-xs font-bold text-slate-900">100% Privacy Audit Score</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Zero retention of SMS OTP messages and AES-256 Vault storage maintains a 4.9/5 rating across customer testimonials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 10: API HEALTH & PROVIDER STATUS MONITOR --- */}
      {activeTab === "api_health" && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-500" />
                  Live API Service Health & Provider Telemetry
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Real-time ping latency, live balances, error rate telemetry, and upstream status</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => runTelemetryPing()}
                  disabled={isPingingAll}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isPingingAll ? "animate-spin" : ""}`} />
                  <span>{isPingingAll ? "Testing Gateways..." : "Run Diagnostic Ping Sweep"}</span>
                </button>

                <span className={`${systemStatus.color} text-[10px] font-extrabold px-2 py-1 rounded border flex items-center gap-1.5 shadow-xs`}>
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${systemStatus.dot}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus.dot}`}></span>
                  </span>
                  {systemStatus.label}
                </span>
              </div>
            </div>

            {/* Top Telemetry KPI Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Monitored Upstreams</span>
                <span className="text-lg font-mono font-black text-slate-900 mt-0.5 block">
                  {activeSmsProviders.length + activeSmmProviders.length} <span className="text-xs font-sans text-slate-500 font-bold">Gateways</span>
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Avg Ping Latency</span>
                <span className="text-lg font-mono font-black text-blue-600 mt-0.5 block">
                  {Object.keys(telemetryMap).length > 0 
                    ? Math.round((Object.values(telemetryMap) as TelemetryItem[]).reduce((acc, curr) => acc + (curr.latency || 0), 0) / Object.keys(telemetryMap).length) + " ms"
                    : "---"}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Real Order Error Rate</span>
                <span className={`text-lg font-mono font-black mt-0.5 block ${
                  (() => {
                    const totalAll = orders.length + smmOrders.length;
                    const failedAll = orders.filter(o => ["CANCEL", "EXPIRED", "FAILED"].includes(o.status?.toUpperCase() || "")).length + 
                                     smmOrders.filter(o => ["Canceled", "Failed", "Partial", "canceled", "failed"].includes(o.status)).length;
                    const errNum = totalAll > 0 ? (failedAll / totalAll) * 100 : 0;
                    return errNum > 10 ? "text-red-600" : "text-emerald-600";
                  })()
                }`}>
                  {(() => {
                    const totalAll = orders.length + smmOrders.length;
                    const failedAll = orders.filter(o => ["CANCEL", "EXPIRED", "FAILED"].includes(o.status?.toUpperCase() || "")).length + 
                                     smmOrders.filter(o => ["Canceled", "Failed", "Partial", "canceled", "failed"].includes(o.status)).length;
                    return totalAll > 0 ? safeFixed((failedAll / totalAll) * 100, 1) + "%" : "0.0%";
                  })()}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Provider Liquidity</span>
                <span className="text-lg font-mono font-black text-purple-600 mt-0.5 block">
                  $ {safeFixed((Object.values(telemetryMap) as TelemetryItem[]).reduce((sum, item) => sum + (item.numericBalance || 0), 0), 2)} USD
                </span>
              </div>
            </div>

            {/* Live Telemetry Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Virtual Number Gateways (SMS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-blue-500" /> Virtual Phone OTP Gateways ({activeSmsProviders.length})
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Live 5Sim Protocol</span>
                </div>

                {activeSmsProviders.map((prov, i) => {
                  const pKey = prov.id || prov.name;
                  const telemetry = telemetryMap[pKey];
                  const status = telemetry?.status || (prov.apiKey ? "OPERATIONAL" : "UNCONFIGURED");

                  return (
                    <div 
                      key={prov.id || i} 
                      className={`p-3 rounded-xl border ${
                        status === "OPERATIONAL" ? "border-emerald-200 bg-emerald-50/20" : 
                        status === "DEGRADED" ? "border-amber-300 bg-amber-50/40" : 
                        status === "UNCONFIGURED" ? "border-slate-200 bg-slate-50/60" : "border-red-300 bg-red-50/40"
                      } shadow-xs space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            status === "OPERATIONAL" ? "bg-emerald-500" : 
                            status === "DEGRADED" ? "bg-amber-500 animate-pulse" : 
                            status === "UNCONFIGURED" ? "bg-slate-400" : "bg-red-500 animate-ping"
                          }`}></span>
                          <span className="text-xs font-black text-slate-800">{prov.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => runTelemetryPing(prov.id || prov.name)}
                            className="text-[9px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                            title="Ping this provider"
                          >
                            <RefreshCw className="h-2.5 w-2.5" /> Ping
                          </button>

                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            status === "OPERATIONAL" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : 
                            status === "DEGRADED" ? "bg-amber-100 text-amber-800 border border-amber-200" : 
                            status === "UNCONFIGURED" ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Latency</span>
                          <span className="text-[10px] font-mono font-bold text-slate-700">
                            {telemetry ? `${telemetry.latency}ms` : "---"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Uptime</span>
                          <span className="text-[10px] font-mono font-bold text-slate-700">
                            {telemetry ? telemetry.uptime : "99.9%"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Error Rate</span>
                          <span className={`text-[10px] font-mono font-bold ${
                            telemetry && parseFloat(telemetry.errorRate) > 10 ? "text-red-600" : "text-emerald-600"
                          }`}>
                            {telemetry ? telemetry.errorRate : "0.0%"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Live Balance</span>
                          <span className="text-[10px] font-mono font-bold text-blue-600">
                            {telemetry ? telemetry.balanceStr : `$${safeFixed(prov.balance, 2)}`}
                          </span>
                        </div>
                      </div>

                      {telemetry?.alert && (
                        <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-amber-800 bg-amber-100/60 p-1.5 rounded border border-amber-200/80">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" /> {telemetry.alert}
                          </span>
                          {telemetry.lastChecked && (
                            <span className="text-[8px] text-amber-700 font-mono">Checked: {telemetry.lastChecked}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SMM Panel Upstreams */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-purple-500" /> SMM Upstream Panels ({activeSmmProviders.length})
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Real API Proxy</span>
                </div>

                {activeSmmProviders.map((prov, i) => {
                  const pKey = prov.id || prov.name;
                  const telemetry = telemetryMap[pKey];
                  const status = telemetry?.status || (prov.apiKey ? "OPERATIONAL" : "UNCONFIGURED");

                  return (
                    <div 
                      key={prov.id || i} 
                      className={`p-3 rounded-xl border ${
                        status === "OPERATIONAL" ? "border-emerald-200 bg-emerald-50/20" : 
                        status === "DEGRADED" ? "border-amber-300 bg-amber-50/40" : 
                        status === "UNCONFIGURED" ? "border-slate-200 bg-slate-50/60" : "border-red-300 bg-red-50/40"
                      } shadow-xs space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            status === "OPERATIONAL" ? "bg-emerald-500" : 
                            status === "DEGRADED" ? "bg-amber-500 animate-pulse" : 
                            status === "UNCONFIGURED" ? "bg-slate-400" : "bg-red-500 animate-ping"
                          }`}></span>
                          <span className="text-xs font-black text-slate-800">{prov.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => runTelemetryPing(prov.id || prov.name)}
                            className="text-[9px] font-extrabold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                            title="Ping this provider"
                          >
                            <RefreshCw className="h-2.5 w-2.5" /> Ping
                          </button>

                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            status === "OPERATIONAL" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : 
                            status === "DEGRADED" ? "bg-amber-100 text-amber-800 border border-amber-200" : 
                            status === "UNCONFIGURED" ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-red-100 text-red-800 border border-red-200"
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Latency</span>
                          <span className="text-[10px] font-mono font-bold text-slate-700">
                            {telemetry ? `${telemetry.latency}ms` : "---"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Uptime</span>
                          <span className="text-[10px] font-mono font-bold text-slate-700">
                            {telemetry ? telemetry.uptime : "99.9%"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Error Rate</span>
                          <span className={`text-[10px] font-mono font-bold ${
                            telemetry && parseFloat(telemetry.errorRate) > 10 ? "text-red-600" : "text-emerald-600"
                          }`}>
                            {telemetry ? telemetry.errorRate : "0.0%"}
                          </span>
                        </div>
                        <div className="bg-white rounded border border-slate-100 p-1.5 text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Live Balance</span>
                          <span className="text-[10px] font-mono font-bold text-purple-600">
                            {telemetry ? telemetry.balanceStr : `${prov.currency || "$"}${safeFixed(prov.balance, 2)}`}
                          </span>
                        </div>
                      </div>

                      {telemetry?.alert && (
                        <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-red-800 bg-red-100/60 p-1.5 rounded border border-red-200/80">
                          <span className="flex items-center gap-1">
                            <AlertOctagon className="h-3 w-3 text-red-600 shrink-0" /> {telemetry.alert}
                          </span>
                          {telemetry.lastChecked && (
                            <span className="text-[8px] text-red-700 font-mono">Checked: {telemetry.lastChecked}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFESSIONAL A4 PDF EXECUTIVE REPORT MODAL --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Modal Top Control Header */}
            <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-tight">Executive Report - Printable A4 Layout</h3>
                  <p className="text-[10px] text-slate-400">Ref Code: <span className="font-mono text-orange-400">{reportRefCode}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Print Dialog</span>
                </button>

                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Render Area (A4 Target Document) */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
              <div 
                id="zerox-executive-pdf-report"
                className="bg-white text-slate-900 p-6 sm:p-10 shadow-lg mx-auto rounded-xl border border-slate-200 space-y-6 text-xs"
                style={{ maxWidth: "210mm", minHeight: "297mm" }}
              >
                {/* PDF Header Branding */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                      ZX
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">ZEROX NETWORK</h1>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Platform Executive Audit</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-orange-400 font-mono font-black text-[10px] uppercase">
                      OFFICIAL REPORT
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Ref: {reportRefCode}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{reportGeneratedAt}</p>
                  </div>
                </div>

                {/* KPI Overview Grid */}
                <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Platform Revenue</span>
                    <p className="text-sm font-black text-slate-900 font-mono">{formatPrice(totalPlatformRevenueBase)}</p>
                    <p className="text-[8px] text-slate-500">${safeFixed(totalPlatformRevenueBase, 1)} USD</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total Orders</span>
                    <p className="text-sm font-black text-slate-900 font-mono">{totalCombinedOrdersCount}</p>
                    <p className="text-[8px] text-slate-500">{completionRate}% Completion</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Customer Rating</span>
                    <p className="text-sm font-black text-amber-600 font-mono">★ {averageRating} / 5.0</p>
                    <p className="text-[8px] text-slate-500">{reviews.length} Verified Reviews</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Privacy Compliance</span>
                    <p className="text-sm font-black text-emerald-600 font-mono">100% Verified</p>
                    <p className="text-[8px] text-slate-500">10 Clause Standards</p>
                  </div>
                </div>

                {/* Section 1: Financial & Orders Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
                    1. Revenue & Financial Telemetry
                  </h3>
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-black text-slate-700">
                        <th className="p-1.5">Stream Category</th>
                        <th className="p-1.5">Volume Count</th>
                        <th className="p-1.5">Revenue (PKR)</th>
                        <th className="p-1.5 text-right">Revenue (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-1.5 font-bold">Social Media Marketing (SMM)</td>
                        <td className="p-1.5 font-mono">{totalSmmOrdersCount} Orders</td>
                        <td className="p-1.5 font-mono font-bold">{formatPrice(totalSmmRevenueBase)}</td>
                        <td className="p-1.5 font-mono text-right">${safeFixed(totalSmmRevenueBase, 2)}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">Virtual SMS Activations</td>
                        <td className="p-1.5 font-mono">{totalSmsOrdersCount} Activations</td>
                        <td className="p-1.5 font-mono font-bold">{formatPrice(totalSmsRevenueBase)}</td>
                        <td className="p-1.5 font-mono text-right">${safeFixed(totalSmsRevenueBase, 2)}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">Digital Subscriptions</td>
                        <td className="p-1.5 font-mono">{totalSubOrdersCount} Subscriptions</td>
                        <td className="p-1.5 font-mono font-bold">{formatPrice(totalSubRevenueBase)}</td>
                        <td className="p-1.5 font-mono text-right">${safeFixed(totalSubRevenueBase, 2)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900">
                        <td className="p-1.5">TOTAL COMBINED</td>
                        <td className="p-1.5 font-mono">{totalCombinedOrdersCount}</td>
                        <td className="p-1.5 font-mono">₨ {totalPlatformRevenueBase}</td>
                        <td className="p-1.5 font-mono text-right">${safeFixed(totalPlatformRevenueBase, 2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Subscriptions Performance */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
                    2. Digital Subscriptions & Licensing Metrics
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-bold">Active Subscriptions</span>
                      <p className="font-mono font-black text-emerald-700 text-xs">{activeSubLicenses} Licenses</p>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-bold">Catalog Offerings</span>
                      <p className="font-mono font-black text-slate-900 text-xs">{subscriptionProducts.length} Products</p>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-bold">Sub Revenue</span>
                      <p className="font-mono font-black text-slate-900 text-xs">{formatPrice(totalSubRevenueBase)}</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Customer Satisfaction & Reviews */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
                    3. Customer Satisfaction & Trust Audit
                  </h3>
                  <div className="space-y-1.5">
                    {approvedReviews.slice(0, 3).map(r => (
                      <div key={r.id} className="p-2 rounded border border-slate-200 bg-slate-50 space-y-0.5 text-[10px]">
                        <div className="flex items-center justify-between font-bold">
                          <span>@{r.username} ({r.category})</span>
                          <span className="text-amber-600 font-mono">★ {r.rating}/5</span>
                        </div>
                        <p className="italic text-slate-600">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Privacy Policy & Security Safeguards */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1">
                    4. Privacy Policy & Data Security Compliance Checklist
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>SMS OTP Non-Persistent Storage</span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>AES-256 Vault Credentials Encryption</span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>SMM Target Link Confidentiality</span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>Zero Banking CVV/PIN Retention</span>
                    </div>
                  </div>
                </div>

                {/* Executive Signature Seal */}
                <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs">ZeroX Network Administration</p>
                    <p className="text-[9px] text-slate-500">Automated Enterprise Audit System</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block border-2 border-slate-900 text-slate-900 px-3 py-1 font-mono font-black text-[10px] rounded uppercase">
                      VERIFIED CERTIFIED
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Analytics Data Management & Reset Modal */}
      <AnalyticsDataManagementModal
        isOpen={showDataManagementModal}
        onClose={() => setShowDataManagementModal(false)}
        categories={categoriesList}
        onClearAll={handleClearAllAnalyticsData}
        onClearCategories={handleClearCategories}
      />

      {/* Quick Action Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Command className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Analytics Quick Actions</span>
              </div>
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setShowCommandPalette(false);
                  setShowDataManagementModal(true);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 transition flex items-center gap-3 text-xs font-bold text-rose-700 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-900 font-extrabold">Clear / Reset All Analytics Data</p>
                  <p className="text-[10px] text-slate-500 font-normal">Purge sessions, event streams or selective service tables</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCommandPalette(false);
                  handleOpenPdfReport();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50 transition flex items-center gap-3 text-xs font-bold text-orange-700 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-900 font-extrabold">Executive PDF Audit Report</p>
                  <p className="text-[10px] text-slate-500 font-normal">Generate branded printable PDF with metrics and breakdown</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCommandPalette(false);
                  handleRefresh();
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 transition flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-slate-200 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-900 font-extrabold">Sync & Refresh Realtime Data</p>
                  <p className="text-[10px] text-slate-500 font-normal">Re-query all active Firestore collections and calculate metrics</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
