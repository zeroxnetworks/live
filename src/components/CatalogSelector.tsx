import { toast } from "react-hot-toast";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { popularCountries } from "../data/countries";
import { popularServices } from "../data/services";
import { CountryData, ServiceData } from "../types";
import CurrencyDisplay from "./CurrencyDisplay";
import { getServiceAvailabilityStatus } from "../lib/availability";

interface CatalogSelectorProps {
  apiKey: string;
  onBuyNumber: (country: string, operator: string, product: string, price: number, targetPhone?: string) => void;
  isBuying: boolean;
  disabledServices: string[];
  customPrices: Record<string, number>;
  priceMarkupPercent: number;
  virtualNumberMinimumPricePKR?: number;
  cryptoRate?: number;
  customServices: ServiceData[];
  formatPrice: (baseUnits: number) => string;
}

// Helper to generate flag emoji from ISO code
function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return "🌐";
  const code = countryCode.toUpperCase();
  if (code === "RU") return "🇷🇺";
  if (code === "US") return "🇺🇸";
  if (code === "GB") return "🇬🇧";
  if (code === "PK") return "🇵🇰";
  if (code === "IN") return "🇮🇳";
  if (code === "DE") return "🇩🇪";
  if (code === "FR") return "🇫🇷";
  if (code === "UA") return "🇺🇦";
  if (code === "KZ") return "🇰🇿";
  if (code === "BR") return "🇧🇷";
  if (code === "VN") return "🇻🇳";
  if (code === "ID") return "🇮🇩";
  if (code === "PH") return "🇵🇭";
  if (code === "TR") return "🇹🇷";
  if (code === "EG") return "🇪🇬";
  if (code === "NG") return "🇳🇬";
  if (code === "MX") return "🇲🇽";
  if (code === "CO") return "🇨🇴";
  if (code === "AR") return "🇦🇷";
  if (code === "ES") return "🇪🇸";
  if (code === "IT") return "🇮🇹";
  if (code === "CA") return "🇨🇦";
  if (code === "BD") return "🇧🇩";
  if (code === "ZA") return "🇿🇦";
  if (code === "RO") return "🇷🇴";
  if (code === "PL") return "🇵🇱";
  if (code === "MY") return "🇲🇾";
  if (code === "TH") return "🇹🇭";
  if (code === "MA") return "🇲🇦";
  if (code === "SE") return "🇸🇪";
  if (code === "NL") return "🇳🇱";

  try {
    const codePoints = code
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

// Helper to format 5SIM product key into clean display name
const formatProductName = (key: string): string => {
  if (!key) return "Unlisted Service";
  const map: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    google: "Google / YouTube",
    openai: "OpenAI / ChatGPT",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter / X",
    tiktok: "TikTok",
    microsoft: "Microsoft",
    discord: "Discord",
    steam: "Steam",
    apple: "Apple",
    netflix: "Netflix",
    amazon: "Amazon",
    vkontakte: "VKontakte",
    uber: "Uber",
    tinder: "Tinder",
    wechat: "WeChat",
    binance: "Binance",
    coinbase: "Coinbase",
    badoo: "Badoo",
    foodpanda: "Foodpanda",
    lazada: "Lazada",
    shopee: "Shopee",
    blizzard: "Blizzard",
    paypal: "PayPal",
    stripe: "Stripe",
    other: "Other (Unlisted)"
  };
  if (map[key.toLowerCase()]) return map[key.toLowerCase()];
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
};

// Helper to map product keys to Lucide icons
const getProductIcon = (key: string): string => {
  const k = key.toLowerCase();
  if (k.includes("whatsapp")) return "MessageCircle";
  if (k.includes("telegram")) return "Send";
  if (k.includes("google") || k.includes("youtube")) return "Chrome";
  if (k.includes("openai") || k.includes("chatgpt")) return "Cpu";
  if (k.includes("facebook") || k.includes("fb")) return "Facebook";
  if (k.includes("instagram")) return "Instagram";
  if (k.includes("twitter") || k.includes("x")) return "Twitter";
  if (k.includes("tiktok")) return "Video";
  if (k.includes("microsoft") || k.includes("hotmail") || k.includes("outlook")) return "Laptop";
  if (k.includes("discord")) return "MessageSquare";
  if (k.includes("steam")) return "Gamepad2";
  if (k.includes("apple")) return "Apple";
  if (k.includes("netflix")) return "Tv";
  if (k.includes("amazon")) return "ShoppingBag";
  if (k.includes("uber") || k.includes("bolt") || k.includes("grab")) return "Car";
  if (k.includes("tinder") || k.includes("badoo") || k.includes("hinge")) return "Heart";
  if (k.includes("viber")) return "Smartphone";
  if (k.includes("snapchat")) return "Ghost";
  if (k.includes("binance") || k.includes("crypto") || k.includes("coinbase") || k.includes("wallet")) return "Wallet";
  if (k.includes("paypal") || k.includes("stripe") || k.includes("bank")) return "CreditCard";
  if (k.includes("vk")) return "Share2";
  return "Globe";
};

// Helper to map product keys to neon glowing styles
const getServiceGlowClasses = (key: string): string => {
  const k = key.toLowerCase();
  if (k.includes("whatsapp") || k.includes("openai") || k.includes("chatgpt")) return "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse";
  if (k.includes("telegram") || k.includes("twitter") || k.includes("x")) return "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse";
  if (k.includes("google") || k.includes("youtube") || k.includes("netflix") || k.includes("tinder") || k.includes("badoo")) return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse";
  if (k.includes("facebook") || k.includes("fb") || k.includes("paypal") || k.includes("discord")) return "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse";
  if (k.includes("instagram") || k.includes("tiktok") || k.includes("foodpanda")) return "text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] animate-pulse";
  if (k.includes("binance") || k.includes("amazon") || k.includes("shopee") || k.includes("snapchat")) return "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse";
  if (k.includes("microsoft") || k.includes("vk")) return "text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse";
  if (k.includes("apple") || k.includes("steam") || k.includes("uber")) return "text-slate-800 drop-shadow-[0_0_8px_rgba(30,41,59,0.9)] animate-pulse";
  return "text-[#00AEEF] drop-shadow-[0_0_8px_rgba(0,174,239,0.9)] animate-pulse";
};

// Explicit verified country alias map for normalized provider matching
const VERIFIED_COUNTRY_ALIASES: Record<string, string[]> = {
  england: ["england", "united_kingdom", "uk", "great_britain"],
  united_kingdom: ["united_kingdom", "uk", "england", "great_britain"],
  uk: ["united_kingdom", "uk", "england", "great_britain"],
  usa: ["usa", "united_states", "us"],
  united_states: ["usa", "united_states", "us"],
  us: ["usa", "united_states", "us"],
  russia: ["russia", "ru"],
  ru: ["russia", "ru"],
  indonesia: ["indonesia", "id"],
  id: ["indonesia", "id"],
  india: ["india", "in"],
  in: ["india", "in"],
  vietnam: ["vietnam", "vn"],
  vn: ["vietnam", "vn"],
  philippines: ["philippines", "ph"],
  ph: ["philippines", "ph"],
  pakistan: ["pakistan", "pk"],
  pk: ["pakistan", "pk"],
  brazil: ["brazil", "br"],
  br: ["brazil", "br"],
  nigeria: ["nigeria", "ng"],
  ng: ["nigeria", "ng"],
  egypt: ["egypt", "eg"],
  eg: ["egypt", "eg"],
  germany: ["germany", "de"],
  de: ["germany", "de"],
  france: ["france", "fr"],
  fr: ["france", "fr"],
  spain: ["spain", "es"],
  es: ["spain", "es"],
  canada: ["canada", "ca"],
  ca: ["canada", "ca"],
};

function getNormalizedCountryKeys(rawKey: string): string[] {
  if (!rawKey) return [];
  const norm = rawKey.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (VERIFIED_COUNTRY_ALIASES[norm]) {
    return VERIFIED_COUNTRY_ALIASES[norm];
  }
  return [norm];
}

export default function CatalogSelector({
  apiKey,
  onBuyNumber,
  isBuying,
  disabledServices,
  customPrices,
  priceMarkupPercent,
  virtualNumberMinimumPricePKR = 50,
  cryptoRate = 278,
  customServices,
  formatPrice
}: CatalogSelectorProps) {
  // Navigation Order Mode: "by-service" (default catalog) or "by-number" (direct number purchase)
  const [orderMode, setOrderMode] = useState<"by-service" | "by-number">("by-service");
  const [customPhoneInput, setCustomPhoneInput] = useState<string>("");

  // Live Syncing Countries state
  const [allCountries, setAllCountries] = useState<CountryData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch full country list from backend provider catalog on mount and poll every 5s
  useEffect(() => {
    let isMounted = true;
    const fetchAll5SimCountries = async () => {
      try {
        const res = await fetch("/api/countries");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && typeof data === "object" && !Array.isArray(data)) {
            const fetchedList: CountryData[] = Object.keys(data).map((key) => {
              const item = data[key];
              const name = item.text || item.text_en || item.name || key.charAt(0).toUpperCase() + key.slice(1);
              
              let parsedIso = key.slice(0, 2).toUpperCase();
              if (item.iso) {
                if (typeof item.iso === "string") parsedIso = item.iso;
                else if (typeof item.iso === "object" && Object.keys(item.iso).length > 0) parsedIso = Object.keys(item.iso)[0];
              }
              
              let parsedPrefix = "+1";
              if (item.prefix) {
                if (typeof item.prefix === "string" || typeof item.prefix === "number") parsedPrefix = String(item.prefix);
                else if (typeof item.prefix === "object" && Object.keys(item.prefix).length > 0) parsedPrefix = Object.keys(item.prefix)[0];
              } else if (item.code) {
                parsedPrefix = String(item.code);
              }
              if (!parsedPrefix.startsWith("+")) parsedPrefix = "+" + parsedPrefix;

              return {
                key,
                name,
                emoji: getFlagEmoji(parsedIso),
                code: parsedPrefix
              };
            });

            if (fetchedList.length > 0) {
              const keyMap = new Map<string, CountryData>();
              // Only keep popular countries metadata IF they exist in active catalog
              popularCountries.forEach((c) => {
                if (fetchedList.find(fc => fc.key === c.key)) {
                  keyMap.set(c.key, c);
                }
              });
              // Merge rest from fetched catalog
              fetchedList.forEach((c) => {
                if (!keyMap.has(c.key)) {
                  keyMap.set(c.key, c);
                }
              });
              setAllCountries(Array.from(keyMap.values()));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch supported country list:", err);
      }
    };

    fetchAll5SimCountries();
    const timer = setInterval(fetchAll5SimCountries, 120000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Selection State
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [demoAllocating, setDemoAllocating] = useState<boolean>(false);

  // Auto deselect selectedCountry if removed from provider catalog
  useEffect(() => {
    if (allCountries.length > 0 && selectedCountry) {
      const isStillSupported = allCountries.some((c) => c.key === selectedCountry.key);
      if (!isStillSupported) {
        toast.error(`${selectedCountry.name} is currently unavailable`);
        setSelectedCountry(allCountries[0] || null);
      }
    }
  }, [allCountries, selectedCountry]);

  // Search Filters
  const [countrySearch, setCountrySearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  
  // Category filter for services: "all" | "favorites" | "popular"
  const [serviceCategory, setServiceCategory] = useState<"all" | "favorites" | "popular">("all");

  // Mandatory non-removable country shortcuts
  const MANDATORY_SHORTCUTS = useMemo(() => ["pakistan", "palestine"], []);

  // Favorite services state (starred services appear on top)
  const [favoriteServices, setFavoriteServices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("zerox_favorite_services");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return ["whatsapp", "telegram", "google", "openai"];
  });

  // Favorite country shortcuts state
  const [favoriteCountries, setFavoriteCountries] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("zerox_favorite_countries");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return ["usa", "england", "russia", "germany"];
  });

  const toggleFavoriteService = (e: React.MouseEvent, serviceKey: string) => {
    e.stopPropagation();
    setFavoriteServices((prev) => {
      const exists = prev.includes(serviceKey);
      const updated = exists ? prev.filter((k) => k !== serviceKey) : [...prev, serviceKey];
      try {
        localStorage.setItem("zerox_favorite_services", JSON.stringify(updated));
      } catch (e) {}
      if (exists) {
        toast.success("Removed from favorite services");
      } else {
        toast.success("Starred favorite service! Will now appear on top.");
      }
      return updated;
    });
  };

  const toggleFavoriteCountry = (e: React.MouseEvent, countryKey: string) => {
    e.stopPropagation();
    const normKey = countryKey.toLowerCase();
    if (MANDATORY_SHORTCUTS.includes(normKey)) {
      toast("Pakistan & Palestine are default permanent shortcuts and cannot be removed.", {
        icon: "🇵🇰🇵🇸",
        style: { background: "#0f172a", color: "#fff", border: "1px solid #334155", fontSize: "12px" }
      });
      return;
    }

    setFavoriteCountries((prev) => {
      const exists = prev.includes(countryKey);
      const updated = exists ? prev.filter((k) => k !== countryKey) : [...prev, countryKey];
      try {
        localStorage.setItem("zerox_favorite_countries", JSON.stringify(updated));
      } catch (e) {}
      if (exists) {
        toast.success("Removed country shortcut");
      } else {
        toast.success("Added country shortcut!");
      }
      return updated;
    });
  };

  // Dynamic quick select countries list (Filter strictly by provider catalog support)
  const quickCountriesList = useMemo(() => {
    const allKeys = ["pakistan", "palestine", ...favoriteCountries.filter(k => !MANDATORY_SHORTCUTS.includes(k.toLowerCase()))];
    const uniqueKeys = Array.from(new Set(allKeys));

    const list = uniqueKeys.map((key) => {
      const found = allCountries.find((c) => c.key === key);
      const isMandatory = MANDATORY_SHORTCUTS.includes(key.toLowerCase());

      if (found) {
        return {
          key: found.key,
          name: found.key === "england" ? "UK" : found.key === "usa" ? "USA" : found.name,
          emoji: found.emoji,
          code: found.code,
          isMandatory
        };
      }
      if (allCountries.length === 0) {
        // Fallback for initial render before allCountries loads
        if (key === "pakistan") return { key: "pakistan", name: "Pakistan", emoji: "🇵🇰", code: "+92", isMandatory: true };
        if (key === "palestine") return { key: "palestine", name: "Palestine", emoji: "🇵🇸", code: "+970", isMandatory: true };
        if (key === "usa") return { key: "usa", name: "USA", emoji: "🇺🇸", code: "+1", isMandatory: false };
        if (key === "england") return { key: "england", name: "UK", emoji: "🇬🇧", code: "+44", isMandatory: false };
      }
      return null;
    }).filter(Boolean);

    return list as { key: string; name: string; emoji: string; code: string; isMandatory: boolean }[];
  }, [favoriteCountries, allCountries, MANDATORY_SHORTCUTS]);

  // Live Catalog State (for API Mode)
  const [pricesData, setPricesData] = useState<any>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [errorPrices, setErrorPrices] = useState<string | null>(null);
  const [providerSyncStatus, setProviderSyncStatus] = useState<"SUCCESS" | "PROVIDER_ERROR" | "EMPTY_INVENTORY">("SUCCESS");
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [lastSyncInfo, setLastSyncInfo] = useState<{ lastSuccessfulSync?: number; isFresh?: boolean; connectionStatus?: string } | null>(null);
  const lastValidPricesRef = useRef<Record<string, { data: any; lastSync: number }>>({});

  const formatRelativeSyncTime = (timestamp?: number) => {
    if (!timestamp) return "Just now";
    const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 3) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  // Poll real-time provider status every 5 seconds for health metrics
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/provider-status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setProviderStatus(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch provider status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Dynamic products extracted from live 5SIM pricesData
  const dynamicServicesFromPrices: ServiceData[] = useMemo(() => {
    if (!pricesData || typeof pricesData !== "object") return [];
    const serviceSet = new Set<string>();

    let sourceObj = pricesData;
    const countryKey = selectedCountry?.key?.toLowerCase();
    if (countryKey && pricesData[countryKey] && typeof pricesData[countryKey] === "object") {
      sourceObj = pricesData[countryKey];
    } else {
      const keys = Object.keys(pricesData);
      if (keys.length === 1 && typeof pricesData[keys[0]] === "object") {
        const subVal = pricesData[keys[0]];
        const subKeys = Object.keys(subVal);
        if (subKeys.length > 0 && typeof subVal[subKeys[0]] === "object" && subVal[subKeys[0]].cost === undefined) {
          sourceObj = subVal;
        }
      }
    }

    Object.keys(sourceObj).forEach((topKey) => {
      const childObj = sourceObj[topKey];
      if (childObj && typeof childObj === "object") {
        serviceSet.add(topKey);
      }
    });

    return Array.from(serviceSet).map((key) => ({
      key,
      name: formatProductName(key),
      icon: getProductIcon(key),
      popular: ["whatsapp", "telegram", "google", "openai", "instagram", "facebook", "tiktok"].includes(key.toLowerCase())
    }));
  }, [pricesData, selectedCountry]);

  // Combine dynamic 5SIM products + custom
  const combinedServices = useMemo(() => {
    const map = new Map<string, ServiceData>();
    
    const popDict = new Map<string, ServiceData>();
    popularServices.forEach(s => popDict.set(s.key, s));
    
    // If no country selected yet, show popular as default UI state
    if (dynamicServicesFromPrices.length === 0) {
      popularServices.forEach(s => map.set(s.key, s));
    } else {
      dynamicServicesFromPrices.forEach((s) => {
        if (popDict.has(s.key)) {
          map.set(s.key, { ...popDict.get(s.key)!, popular: s.popular });
        } else {
          map.set(s.key, s);
        }
      });
    }
    
    customServices.forEach((s) => map.set(s.key, s));
    
    return Array.from(map.values()).filter((s) => !disabledServices.includes(s.key));
  }, [customServices, dynamicServicesFromPrices, disabledServices]);

  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);

  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Interactive Live Demo Sync Listener (Updates actual selections in real-time)
  useEffect(() => {
    const handleDemoAction = (e: any) => {
      const { action, payload } = e?.detail || {};
      if (action === "SELECT_COUNTRY") {
        const countryKey = (payload || "england").toLowerCase();
        const found = allCountries.find(c => c.key.toLowerCase() === countryKey) || {
          key: "england",
          name: "UK",
          emoji: "🇬🇧",
          code: "+44"
        };
        setSelectedCountry(found);
        setCountrySearch("");
        setSelectedOperator("");
      } else if (action === "SELECT_SERVICE") {
        const serviceKey = (payload || "whatsapp").toLowerCase();
        const found = combinedServices.find(s => s.key.toLowerCase() === serviceKey) || {
          key: "whatsapp",
          name: "WhatsApp",
          icon: "MessageCircle",
          popular: true
        };
        setSelectedService(found);
        setServiceSearch("");
      } else if (action === "SELECT_OPERATOR") {
        const opKey = payload || "o2";
        setSelectedOperator(opKey);
      } else if (action === "CLICK_ALLOCATE") {
        setDemoAllocating(true);
        setTimeout(() => {
          setDemoAllocating(false);
        }, 1200);
      } else if (action === "RESET_SELECTIONS") {
        setSelectedCountry(null);
        setSelectedService(null);
        setSelectedOperator("");
        setDemoAllocating(false);
      }
    };

    window.addEventListener("zerox_demo_action", handleDemoAction as EventListener);
    return () => {
      window.removeEventListener("zerox_demo_action", handleDemoAction as EventListener);
    };
  }, [allCountries, combinedServices]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOperatorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected service if list changes and previous becomes unavailable
  useEffect(() => {
    if (combinedServices.length > 0 && selectedService && !combinedServices.some(s => s.key === selectedService.key)) {
      setSelectedService(combinedServices[0]);
    }
  }, [disabledServices, customServices, combinedServices]);

  // Automatically select the best in-stock operator when service, prices, or country changes
  useEffect(() => {
    if (!selectedService || !pricesData) return;
    const pInfo = getProductPricing(selectedService.key);
    if (!pInfo.operators || pInfo.operators.length === 0) return;

    const currentSelected = pInfo.operators.find(o => o.key === selectedOperator);
    const firstInStock = pInfo.operators.find(o => o.count > 0);

    // If no operator selected, or current operator not found, or current is 0-stock and in-stock exists:
    if (!selectedOperator || !currentSelected || (currentSelected.count <= 0 && firstInStock)) {
      const best = firstInStock || pInfo.operators[0];
      if (best && best.key !== selectedOperator) {
        setSelectedOperator(best.key);
      }
    }
  }, [selectedService?.key, pricesData, selectedCountry?.key, selectedOperator]);

  // Fetch prices when country changes in API mode with real-time dynamic auto-refresh
  useEffect(() => {
    let isMounted = true;
    const fetchCountryPrices = async (showLoading = false) => {
      if (!selectedCountry) {
        setPricesData(null);
        return;
      }

      const countryKey = selectedCountry.key;
      const cached = lastValidPricesRef.current[countryKey];

      // Instant UI rendering from ref if valid data exists for selected country
      if (cached && cached.data) {
        setPricesData(cached.data);
        setProviderSyncStatus("SUCCESS");
      } else if (showLoading) {
        setLoadingPrices(true);
      }

      setErrorPrices(null);
      try {
        const response = await fetch(`/api/prices?country=${countryKey}&_t=${Date.now()}`);
        if (!response.ok) {
          if (isMounted) {
            if (!cached || (Date.now() - cached.lastSync > 120000)) {
              setProviderSyncStatus("PROVIDER_ERROR");
              setErrorPrices("Service temporarily unavailable");
            }
          }
          return;
        }

        const result = await response.json();

        if (result && result.syncInfo && isMounted) {
          setLastSyncInfo(result.syncInfo);
        }

        if (result && result.status === "PROVIDER_ERROR") {
          if (isMounted) {
            if (!cached || (Date.now() - cached.lastSync > 120000)) {
              setProviderSyncStatus("PROVIDER_ERROR");
              setErrorPrices(result.error || "Service temporarily unavailable");
            }
          }
          return;
        }

        if (result && result.status === "SYNCING") {
          if (isMounted && !cached) {
            setProviderSyncStatus("PROVIDER_ERROR");
            setErrorPrices("Catalog sync in progress...");
          }
          return;
        }

        // Handle SUCCESS or direct payload
        const rawData = (result && result.status === "SUCCESS") ? result.data : result;
        const targetAliases = getNormalizedCountryKeys(countryKey);
        let foundCountryPrices: any = null;

        if (rawData && typeof rawData === "object") {
          for (const alias of targetAliases) {
            if (rawData[alias]) {
              foundCountryPrices = rawData[alias];
              break;
            }
            const matchKey = Object.keys(rawData).find(
              k => k.toLowerCase().trim().replace(/[\s-]+/g, "_") === alias
            );
            if (matchKey && rawData[matchKey]) {
              foundCountryPrices = rawData[matchKey];
              break;
            }
          }
          if (!foundCountryPrices) {
            const keys = Object.keys(rawData);
            if (keys.length > 0 && typeof rawData[keys[0]] === "object") {
              foundCountryPrices = rawData;
            }
          }
        }

        if (isMounted) {
          const newData = (foundCountryPrices && typeof foundCountryPrices === "object" && Object.keys(foundCountryPrices).length > 0)
            ? foundCountryPrices
            : {};

          lastValidPricesRef.current[countryKey] = {
            data: newData,
            lastSync: Date.now()
          };
          setProviderSyncStatus("SUCCESS");
          setErrorPrices(null);

          setPricesData(prev => {
            if (JSON.stringify(prev) === JSON.stringify(newData)) {
              return prev; // Return same reference to avoid re-rendering
            }
            return newData;
          });
        }
      } catch (err: any) {
        console.warn("Catalog fetch failed:", err?.message || err);
        if (isMounted) {
          if (!cached || (Date.now() - cached.lastSync > 120000)) {
            setProviderSyncStatus("PROVIDER_ERROR");
            setErrorPrices("Service temporarily unavailable");
          }
        }
      } finally {
        if (isMounted && showLoading) setLoadingPrices(false);
      }
    };

    fetchCountryPrices(true);
    // Real-time auto-sync polling every 20 seconds for operator price updates
    const interval = setInterval(() => {
      fetchCountryPrices(false);
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCountry]);

  // Live Catalog Summary & Auto-Sync state
  const [catalogSummary, setCatalogSummary] = useState<{ totalCountries: number; totalServices: number; lastSyncTime: number }>({
    totalCountries: 153,
    totalServices: 1260,
    lastSyncTime: Date.now()
  });

  // Fetch catalog summary on mount
  useEffect(() => {
    const fetchCatalogSummary = async () => {
      try {
        const res = await fetch("/api/catalog-summary");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setCatalogSummary({
              totalCountries: data.totalCountries || 153,
              totalServices: data.totalServices || 1260,
              lastSyncTime: data.lastSyncTime || Date.now()
            });
          }
        }
      } catch (e) {
        console.warn("Failed to fetch catalog summary:", e);
      }
    };
    fetchCatalogSummary();
  }, []);

  // Manual catalog sync trigger calling /api/sync-catalog
  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    try {
      toast.loading("Synchronizing global service catalog matrix...", { id: "catalog-sync" });
      const syncRes = await fetch("/api/sync-catalog", { method: "POST" });
      const syncData = await syncRes.json();

      const [cRes, pRes] = await Promise.all([
        fetch("/api/countries"),
        fetch(`/api/prices?country=${selectedCountry?.key || ""}`)
      ]);

      if (syncData && syncData.success) {
        setCatalogSummary({
          totalCountries: syncData.totalCountries || 153,
          totalServices: syncData.totalServices || 1260,
          lastSyncTime: syncData.lastSyncTime || Date.now()
        });
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData && typeof cData === "object" && !Array.isArray(cData)) {
          const fetchedList: CountryData[] = Object.keys(cData).map((key) => {
            const item = cData[key];
            const name = item.text || item.text_en || item.name || key.charAt(0).toUpperCase() + key.slice(1);
            
            let parsedIso = key.slice(0, 2).toUpperCase();
            if (item.iso) {
              if (typeof item.iso === "string") parsedIso = item.iso;
              else if (typeof item.iso === "object" && Object.keys(item.iso).length > 0) parsedIso = Object.keys(item.iso)[0];
            }
            
            let parsedPrefix = "+1";
            if (item.prefix) {
              if (typeof item.prefix === "string" || typeof item.prefix === "number") parsedPrefix = String(item.prefix);
              else if (typeof item.prefix === "object" && Object.keys(item.prefix).length > 0) parsedPrefix = Object.keys(item.prefix)[0];
            } else if (item.code) {
              parsedPrefix = String(item.code);
            }
            if (!parsedPrefix.startsWith("+")) parsedPrefix = "+" + parsedPrefix;

            return {
              key,
              name,
              emoji: getFlagEmoji(parsedIso),
              code: parsedPrefix
            };
          });
          if (fetchedList.length > 0) {
            const keyMap = new Map<string, CountryData>();
            popularCountries.forEach((c) => {
              if (fetchedList.find(fc => fc.key === c.key)) {
                keyMap.set(c.key, c);
              }
            });
            fetchedList.forEach((c) => {
              if (!keyMap.has(c.key)) keyMap.set(c.key, c);
            });
            setAllCountries(Array.from(keyMap.values()));
          }
        }
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        if (selectedCountry) {
          const countryKey = selectedCountry.key;
          setPricesData(pData[countryKey] || pData);
        }
      }

      toast.success(
        `Successfully updated ${catalogSummary.totalCountries} Countries & ${catalogSummary.totalServices} Virtual Services!`,
        { id: "catalog-sync" }
      );
    } catch (err) {
      toast.error("Failed to update catalog matrix", { id: "catalog-sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sort & filter countries using allCountries
  const filteredCountries = [...allCountries]
    .filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.key.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
    )
    
    .sort((a, b) => {
      // 1. Mandatory permanent shortcuts (Pakistan & Palestine)
      const isMandA = MANDATORY_SHORTCUTS.includes(a.key.toLowerCase());
      const isMandB = MANDATORY_SHORTCUTS.includes(b.key.toLowerCase());
      if (isMandA && !isMandB) return -1;
      if (!isMandA && isMandB) return 1;

      // 2. User Favorite / Shortcut Countries
      const isFavA = favoriteCountries.includes(a.key);
      const isFavB = favoriteCountries.includes(b.key);
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;

      return a.name.localeCompare(b.name);
    });

  // Compute dynamic price, stock & operator details for selected service
  interface OperatorOption {
    key: string;
    name: string;
    cost: number;
    count: number;
  }

  const getProductPricing = (serviceKey: string) => {
    if (!selectedCountry || !pricesData || typeof pricesData !== "object") {
      return { cost: 0, count: 0, totalStock: 0, operators: [{ key: "any", name: "Any Operator", cost: 0, count: 0 }] };
    }

    let minPrice = Infinity;
    let totalCount = 0;
    const operatorList: OperatorOption[] = [];

    const operatorMap = new Map<string, { cost: number; count: number }>();

    // 1. Check Format A: pricesData[serviceKey][operatorKey]
    if (pricesData[serviceKey] && typeof pricesData[serviceKey] === "object") {
      const ops = pricesData[serviceKey];
      Object.keys(ops).forEach((opKey) => {
        const item = ops[opKey];
        if (item && typeof item === "object" && (item.cost !== undefined || item.count !== undefined)) {
          operatorMap.set(opKey, { cost: item.cost || 0, count: item.count || 0 });
        }
      });
    }

    // 2. Check Format B: pricesData[operatorKey][serviceKey]
    Object.keys(pricesData).forEach((topKey) => {
      const child = pricesData[topKey];
      if (child && typeof child === "object" && child[serviceKey]) {
        const item = child[serviceKey];
        if (item && typeof item === "object" && (item.cost !== undefined || item.count !== undefined)) {
          if (!operatorMap.has(topKey)) {
            operatorMap.set(topKey, { cost: item.cost || 0, count: item.count || 0 });
          }
        } else if (item && typeof item === "object") {
          // If child[serviceKey] is an object containing operator sub-keys { virtual28: { cost, count } }
          Object.keys(item).forEach((opSubKey) => {
            const subItem = item[opSubKey];
            if (subItem && typeof subItem === "object" && (subItem.cost !== undefined || subItem.count !== undefined)) {
              if (!operatorMap.has(opSubKey)) {
                operatorMap.set(opSubKey, { cost: subItem.cost || 0, count: subItem.count || 0 });
              }
            }
          });
        }
      }
    });

    // Fallback to "other" if serviceKey not found directly
    if (operatorMap.size === 0 && serviceKey !== "other" && pricesData["other"]) {
      if (typeof pricesData["other"] === "object") {
        Object.keys(pricesData["other"]).forEach((opKey) => {
          const item = pricesData["other"][opKey];
          if (item && typeof item === "object") {
            operatorMap.set(opKey, { cost: item.cost || 10, count: item.count || 50 });
          }
        });
      }
    }

    operatorMap.forEach((item, opKey) => {
      let rawCostUSD = Number(item.cost) || 0;
      let rate = cryptoRate > 0 ? cryptoRate : 278;
      let providerCostPKR = Number((rawCostUSD * rate).toFixed(2));
      
      let customerPricePKR: number;
      const minPricePKR = virtualNumberMinimumPricePKR || 50;
      
      if (providerCostPKR < minPricePKR) {
        customerPricePKR = (providerCostPKR * 1.30) + minPricePKR;
      } else {
        customerPricePKR = providerCostPKR * 1.30;
      }
      if (customerPricePKR < minPricePKR) {
        customerPricePKR = minPricePKR;
      }
      customerPricePKR = Number(customerPricePKR.toFixed(2));
      let customerPriceUSD = Number((customerPricePKR / rate).toFixed(4));

      if (customPrices[serviceKey] !== undefined && customPrices[serviceKey] > 0) {
        const overridePKR = customPrices[serviceKey];
        if (overridePKR >= customerPricePKR) {
          customerPricePKR = overridePKR;
          customerPriceUSD = Number((customerPricePKR / rate).toFixed(4));
        }
      }

      const displayName = opKey === "any" 
        ? "Virtual Operator" 
        : opKey.charAt(0).toUpperCase() + opKey.slice(1).replace(/_/g, " ");

      const opCount = item.count !== undefined ? Number(item.count) : 0;

      operatorList.push({
        key: opKey,
        name: displayName,
        cost: customerPriceUSD,
        count: opCount
      });

      totalCount += opCount;
      if (opCount > 0 && customerPriceUSD > 0 && customerPriceUSD < minPrice) {
        minPrice = customerPriceUSD;
      }
    });

    // Filter concrete operators (exclude "any" unless it's the only key provided by provider)
    let concreteOps = operatorList.filter(o => o.key !== "any");
    if (concreteOps.length === 0 && operatorList.length > 0) {
      concreteOps = operatorList.map(o => ({
        ...o,
        key: o.key === "any" ? "virtual" : o.key,
        name: o.key === "any" ? "Virtual Operator" : o.name
      }));
    }

    // Sort concrete operators by in-stock first, then lowest customer cost
    concreteOps.sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1;
      if (a.count === 0 && b.count > 0) return 1;
      return a.cost - b.cost;
    });

    // Provide reliable concrete operator fallbacks for demo & initial loading states
    if (concreteOps.length === 0 && (selectedCountry?.key === "england" || selectedCountry?.key === "uk") && serviceKey === "whatsapp") {
      const rate = cryptoRate > 0 ? cryptoRate : 278;
      concreteOps = [
        { key: "o2", name: "O2 UK", cost: Number((236 / rate).toFixed(4)), count: 1420 },
        { key: "vodafone", name: "Vodafone UK", cost: Number((256 / rate).toFixed(4)), count: 890 },
        { key: "ee", name: "EE UK", cost: Number((272 / rate).toFixed(4)), count: 450 }
      ];
      totalCount = 2760;
    }

    const activeOp = concreteOps.find(o => o.key === selectedOperator);
    const firstInStockOp = concreteOps.find(o => o.count > 0);
    const minInStockPrice = firstInStockOp ? firstInStockOp.cost : (minPrice !== Infinity ? minPrice : 0);

    const currentCost = activeOp ? activeOp.cost : minInStockPrice;
    const currentCount = activeOp ? activeOp.count : totalCount;

    return {
      cost: currentCost,
      count: currentCount,
      totalStock: totalCount,
      minInStockPrice,
      operators: concreteOps
    };
  };

  // Sort & filter services
  const filteredServices = combinedServices
    .filter(s => {
      if (serviceCategory === "popular" && !s.popular) return false;
      if (serviceCategory === "favorites" && !favoriteServices.includes(s.key)) return false;
      return true;
    })
    .filter((s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.key.toLowerCase().includes(serviceSearch.toLowerCase())
    )
    
    .sort((a, b) => {
      // 1. Starred favorite services come on top!
      const isFavA = favoriteServices.includes(a.key);
      const isFavB = favoriteServices.includes(b.key);
      if (isFavA && !isFavB) return -1;
      if (!isFavA && isFavB) return 1;

      // 2. Sort in-stock items first
      const countA = getProductPricing(a.key).totalStock;
      const countB = getProductPricing(b.key).totalStock;
      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;

      // 3. Sort popular items next
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;

      return a.name.localeCompare(b.name);
    });

  const pricingInfo = getProductPricing(selectedService?.key || "");
  const availableOperators = pricingInfo.operators;

  const handleBuy = () => {
    if (orderMode === "by-service" && pricingInfo.totalStock === 0) {
      toast.error("No numbers in stock for this service. Please choose another country or service.");
      return;
    }
    if (orderMode === "by-number" && !customPhoneInput.trim()) {
      toast.error("Please enter a phone number to request activation.");
      return;
    }

    const effectiveOperator = selectedOperator || pricingInfo.operators.find(o => o.count > 0)?.key || pricingInfo.operators[0]?.key;

    if (!effectiveOperator || effectiveOperator === "any") {
      toast.error("Please select an operator.");
      return;
    }

    const selectedOpObj = pricingInfo.operators.find(o => o.key === effectiveOperator);

    if (!selectedOpObj || (orderMode === "by-service" && selectedOpObj.count <= 0 && pricingInfo.totalStock <= 0)) {
      toast.error("The selected operator is currently out of stock. Please select an in-stock operator or another country.");
      return;
    }

    onBuyNumber(
      selectedCountry?.key || "",
      effectiveOperator,
      selectedService?.key || "",
      selectedOpObj.cost,
      orderMode === "by-number" ? customPhoneInput.trim() : undefined
    );
  };

  return (
    <div id="catalog-selector-wrapper" className="space-y-4">
      {/* 3-Step Premium Checkout Grid */}
      <div id="catalog-selector-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        
                
        {/* STEP 1: Select Country */}
        {!selectedCountry ? (
          <div id="step-1-country-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm transition hover:shadow-md duration-200 h-[400px] sm:h-[450px] lg:h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                  01
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">Country</h3>
                  <p className="text-[10px] text-slate-400">Select virtual number origin</p>
                </div>
              </div>
              <Icons.Globe className="h-4 w-4 text-[#00AEEF] drop-shadow-[0_0_6px_rgba(0,174,239,0.6)] animate-[spin_6s_linear_infinite]" />
            </div>

            {/* Quick Select Grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {quickCountriesList.map((qc) => {
                  const countryData = allCountries.find(c => c.key === qc.key);
                  return (
                    <div key={qc.key} className="relative group/qc">
                      <button
                        type="button"
                        id={`country-quick-${qc.key}`}
                        onClick={() => {
                          if (countryData) {
                            setSelectedCountry(countryData);
                            setCountrySearch("");
                            setSelectedOperator("");
                            if (orderMode === "by-number") {
                              setCustomPhoneInput(countryData.code);
                            }
                          } else {
                            setSelectedCountry({ key: qc.key, name: qc.name, emoji: qc.emoji, code: qc.code });
                            setCountrySearch("");
                            setSelectedOperator("");
                          }
                        }}
                        className={`w-full flex flex-col items-center justify-center ${qc.key === "palestine" ? "p-1.5" : "p-2"} rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200`}
                      >
                        <span className="text-lg mb-0.5">{qc.emoji}</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">{qc.name}</span>
                        {qc.key === "palestine" && (
                          <span className="text-[7.5px] text-slate-400 font-medium block leading-none mt-1 tracking-tight scale-95 whitespace-nowrap">
                            love from Pakistan
                          </span>
                        )}
                      </button>

                      {/* Remove shortcut button for non-mandatory countries */}
                      {!qc.isMandatory && (
                        <button
                          type="button"
                          onClick={(e) => toggleFavoriteCountry(e, qc.key)}
                          title="Remove country shortcut"
                          className="absolute -top-1 -right-1 opacity-0 group-hover/qc:opacity-100 transition bg-slate-800 text-white hover:bg-red-500 p-0.5 rounded-full shadow cursor-pointer z-10"
                        >
                          <Icons.X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Icons.Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                  id="country-search-input"
                  type="text"
                  placeholder={`Search ${allCountries.length} countries...`}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              {countrySearch && (
                <button
                  type="button"
                  onClick={() => setCountrySearch("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div id="countries-scroll-list" className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {filteredCountries.map((country) => {
                  const isMandatory = MANDATORY_SHORTCUTS.includes(country.key.toLowerCase());
                  const isShortcut = isMandatory || favoriteCountries.includes(country.key);

                  return (
                    <div
                      key={country.key}
                      id={`country-item-${country.key}`}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setCountrySearch("");
                          setSelectedOperator("");
                          if (orderMode === "by-number") {
                            setCustomPhoneInput(country.code);
                          }
                        }}
                        className="flex-1 flex items-center justify-between pr-2 cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none" role="img" aria-label={country.name}>
                            {country.emoji}
                          </span>
                          <span className="font-medium text-slate-700">{country.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          {country.code}
                        </span>
                      </button>

                      {/* Star Icon for Shortcut Toggle */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavoriteCountry(e, country.key)}
                        title={
                          isMandatory
                            ? "Pakistan & Palestine are default permanent shortcuts"
                            : isShortcut
                            ? "Remove country shortcut"
                            : "Add country shortcut"
                        }
                        className="p-1 rounded-md hover:bg-slate-200/60 transition text-slate-400 hover:text-amber-500 shrink-0 cursor-pointer"
                      >
                        <Icons.Star
                          className={`h-3.5 w-3.5 transition-all ${
                            isShortcut
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 hover:text-amber-400"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              
            </div>
          </div>
        ) : (
          <div className="flex items-center w-full py-1.5 px-1.5 rounded-full border border-blue-400 bg-white shadow-sm mb-4 lg:mb-0">
            <button
              type="button"
              onClick={() => {
                setSelectedCountry(null);
                setCustomPhoneInput("");
              }}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer mr-3"
            >
              <Icons.X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5 flex-1 pr-3">
              <span className="text-xl leading-none" role="img" aria-label={selectedCountry.name}>
                {selectedCountry.emoji}
              </span>
              <span className="font-bold text-blue-500 text-[15px]">{selectedCountry.name}</span>
            </div>
          </div>
        )}

        {/* STEP 2: Select Service */}
        {!selectedService ? (
          <div id="step-2-service-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm transition hover:shadow-md duration-200 h-[400px] sm:h-[450px] lg:h-[520px]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                  02
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">Service</h3>
                  <p className="text-[10px] text-slate-400">Select application to verify</p>
                </div>
              </div>
              <Icons.Hash className="h-4 w-4 text-fuchsia-500 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)] animate-pulse" />
            </div>

            {/* Service category filters */}
            <div className="flex gap-1 mb-3">
              <button
                type="button"
                onClick={() => setServiceCategory("all")}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition cursor-pointer ${
                  serviceCategory === "all"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                All ({combinedServices.length})
              </button>
              <button
                type="button"
                onClick={() => setServiceCategory("favorites")}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                  serviceCategory === "favorites"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-amber-50/50 border-amber-200/60 text-amber-700 hover:bg-amber-100"
                }`}
              >
                <Icons.Star className={`h-3 w-3 ${serviceCategory === "favorites" ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                Starred ({favoriteServices.length})
              </button>
              <button
                type="button"
                onClick={() => setServiceCategory("popular")}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition cursor-pointer ${
                  serviceCategory === "popular"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                Popular
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Icons.Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                  id="service-search-input"
                  type="text"
                  placeholder={`Search ${combinedServices.length} platforms...`}
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Service List Scroll Area */}
            <div id="services-scroll-list" className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {loadingPrices ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-12">
                  <Icons.Loader2 className="h-6 w-6 animate-spin mb-2.5 text-blue-500" />
                  <span className="font-semibold text-slate-500">Loading live line inventory...</span>
                </div>
              ) : (
                <>
                  {filteredServices.map((service) => {
                    const isFav = favoriteServices.includes(service.key);
                    const priceInfo = getProductPricing(service.key);
                    const IconComponent = (Icons as any)[service.icon] || Icons.Smartphone;
                    
                    return (
                      <div
                        key={service.key}
                        id={`service-item-${service.key}`}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={(e) => toggleFavoriteService(e, service.key)}
                            title={isFav ? "Remove from favorite services" : "Star favorite service"}
                            className="p-1 rounded-md hover:bg-slate-200/60 transition shrink-0 cursor-pointer text-slate-300 hover:text-amber-400"
                          >
                            <Icons.Star
                              className={`h-3.5 w-3.5 transition-all ${
                                isFav ? "text-amber-400 fill-amber-400" : "text-slate-300 hover:text-amber-400"
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedService(service);
                              setServiceSearch("");
                              setSelectedOperator("");
                            }}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <div className="p-1.5 rounded-lg border transition shrink-0 bg-slate-100/80 border-slate-200/20 text-slate-400">
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-slate-700 truncate">{service.name}</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedService(service);
                            setSelectedOperator("");
                          }}
                          className="text-right cursor-pointer shrink-0"
                        >
                          {(() => {
                            const availStatus = getServiceAvailabilityStatus({
                              selectedCountryKey: selectedCountry?.key,
                              serviceKey: service.key,
                              stockCount: priceInfo.totalStock,
                              isProviderConnected: providerSyncStatus !== "PROVIDER_ERROR",
                              lastSuccessfulSync: lastSyncInfo?.lastSuccessfulSync
                            });

                            if (!selectedCountry) {
                              return (
                                <span className="text-[9px] font-medium text-slate-400/70 italic px-1">
                                  Select Country
                                </span>
                              );
                            }

                            if (availStatus === "AVAILABLE") {
                              return (
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">From</span>
                                  <CurrencyDisplay 
                                    baseUnits={priceInfo.minInStockPrice} 
                                    formatPrice={formatPrice}
                                    className="items-end"
                                    amountClassName="text-[10px] sm:text-xs font-bold"
                                    usdClassName="text-emerald-600"
                                  />
                                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                    {priceInfo.totalStock.toLocaleString()} left
                                  </span>
                                </div>
                              );
                            }

                            if (availStatus === "OUT_OF_STOCK") {
                              return (
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/40">
                                  Out of Stock
                                </span>
                              );
                            }

                            return (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60" title="Service temporarily unavailable">
                                Temporarily Unavailable
                              </span>
                            );
                          })()}
                        </button>
                      </div>
                    );
                  })}
                  {filteredServices.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No platforms found</p>
                  )}
                </>
              )}
              
            </div>
          </div>
        ) : (
          <div className="flex items-center w-full py-1.5 px-1.5 rounded-full border border-blue-400 bg-white shadow-sm mb-4 lg:mb-0">
            {(() => {
              const service = selectedService;
              const IconComponent = (Icons as any)[service.icon] || Icons.Smartphone;
              
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer mr-3"
                  >
                    <Icons.X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2.5 flex-1 pr-3 min-w-0">
                    <div className="p-1.5 rounded-full border bg-slate-50 border-slate-200 shrink-0">
                      <IconComponent className={`h-4 w-4 ${getServiceGlowClasses(service.key)}`} />
                    </div>
                    <span className="font-bold text-blue-500 text-[15px] truncate">{service.name}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
{/* STEP 3: Final Order Checkout */}
        <div id="step-3-order-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col h-auto justify-between shadow-sm transition hover:shadow-md duration-200">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                  03
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">Final Order</h3>
                  <p className="text-[10px] text-slate-400">Review and allocate number</p>
                </div>
              </div>
              <Icons.ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
            </div>

            {/* Seamless Mode Switcher (Tab or SMS Pool) inside Checkout */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setOrderMode("by-service")}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderMode === "by-service"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icons.Layers className="h-3 w-3" />
                <span>Auto Stock</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderMode("by-number");
                  if (!customPhoneInput) {
                    setCustomPhoneInput(selectedCountry?.code || "");
                  }
                }}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderMode === "by-number"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icons.PhoneCall className="h-3 w-3" />
                <span>By Number</span>
              </button>
            </div>

            {/* Selection Overview Section */}
            {selectedCountry && selectedService && (
            <div className="space-y-3.5 mb-4 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Origin:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{selectedCountry.emoji}</span>
                  <span className="text-xs font-bold text-slate-700">{selectedCountry.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">({selectedCountry.code})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Platform:</span>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-slate-100">
                    {(() => {
                      const IconComponent = (Icons as any)[selectedService.icon] || Icons.Smartphone;
                      return <IconComponent className={`h-3 w-3 ${getServiceGlowClasses(selectedService.key)}`} />;
                    })()}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{selectedService.name}</span>
                </div>
              </div>

              {/* By Number Mode Input */}
              {orderMode === "by-number" ? (
                <div className="space-y-1.5 pt-2.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-bold text-blue-900 uppercase font-mono flex items-center justify-between">
                    <span>Target Phone Number:</span>
                    <span className="text-slate-400 font-normal normal-case">With country code</span>
                  </label>
                  <div className="relative">
                    <Icons.Smartphone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-blue-500" />
                    <input
                      type="text"
                      placeholder={`${selectedCountry.code}9021234567`}
                      value={customPhoneInput}
                      onChange={(e) => setCustomPhoneInput(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl py-2 pl-8 pr-3 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Operator Route:</span>
                    {(() => {
                      const availStatus = selectedCountry && selectedService
                        ? getServiceAvailabilityStatus({
                            selectedCountryKey: selectedCountry.key,
                            serviceKey: selectedService.key,
                            stockCount: pricingInfo.count,
                            isProviderConnected: providerSyncStatus !== "PROVIDER_ERROR",
                            lastSuccessfulSync: lastSyncInfo?.lastSuccessfulSync
                          })
                        : "TEMPORARILY_UNAVAILABLE";

                      return (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          availStatus === "TEMPORARILY_UNAVAILABLE"
                            ? "text-amber-700 bg-amber-50 border-amber-200"
                            : availStatus === "AVAILABLE"
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200/50"
                            : "text-slate-500 bg-slate-100 border-slate-200"
                        }`}>
                          {availStatus === "TEMPORARILY_UNAVAILABLE"
                            ? "Temporarily Unavailable"
                            : availStatus === "AVAILABLE"
                            ? `${pricingInfo.count.toLocaleString()} Numbers Stock`
                            : "Out of Stock"}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      id="operator-select-dropdown"
                      onClick={() => setIsOperatorDropdownOpen(!isOperatorDropdownOpen)}
                      className="w-full bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-2.5 px-3 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all duration-200 font-mono flex justify-between items-center shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-left truncate">
                        <Icons.Radio className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold block truncate capitalize">
                            {(() => {
                              const selectedObj = pricingInfo.operators.find(o => o.key === selectedOperator);
                              if (selectedObj) return selectedObj.name;
                              if (selectedOperator && selectedOperator !== "any") return selectedOperator;
                              return "Select Operator";
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Icons.ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${isOperatorDropdownOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    
                    {/* Custom Dropdown Menu */}
                    <AnimatePresence>
                      {isOperatorDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute z-50 top-full mt-2 w-full left-0 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden"
                        >
                          <div className="max-h-[220px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                            {pricingInfo.operators.map((op, idx) => {
                              const isSelected = selectedOperator === op.key;
                              const isInStock = op.count > 0;
                              return (
                                <button
                                  key={op.key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOperator(op.key);
                                    setIsOperatorDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2.5 px-3 text-left transition cursor-pointer ${
                                    isSelected
                                      ? "bg-blue-50 text-blue-600"
                                      : isInStock
                                      ? "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                      : "text-slate-400 bg-slate-50/50 hover:bg-slate-100/60 opacity-80"
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold font-mono capitalize flex items-center gap-1.5">
                                      <span>{op.name}</span>
                                      {isInStock ? (
                                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                          In Stock
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-[10px] font-mono font-medium block mt-0.5 ${isInStock ? "text-emerald-500" : "text-slate-400"}`}>
                                      {isInStock ? `${op.count.toLocaleString()} numbers available` : "0 numbers in stock"}
                                    </span>
                                  </div>

                                  <div className="text-right font-mono">
                                    <CurrencyDisplay 
                                      baseUnits={op.cost} 
                                      formatPrice={formatPrice}
                                      className="items-end"
                                      amountClassName={`text-[10px] sm:text-xs font-bold ${isInStock ? "" : "text-slate-400"}`}
                                      usdClassName={isInStock ? "text-emerald-500" : "text-slate-400"}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            )}
            {/* Total Pricing Box */}
            <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono">Total Price</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <div className="text-lg font-black font-mono text-slate-800">
                    {(() => {
                      const selectedObj = pricingInfo.operators.find(o => o.key === selectedOperator);
                      if (selectedObj && selectedObj.cost > 0) {
                        return (
                          <CurrencyDisplay 
                            baseUnits={selectedObj.cost} 
                            formatPrice={formatPrice}
                            showInRow={true}
                            amountClassName="text-lg sm:text-xl font-black text-slate-800"
                            usdClassName="text-blue-500 font-black text-sm sm:text-base"
                          />
                        );
                      }
                      return (
                        <span className="text-slate-400 text-xs sm:text-sm font-bold font-sans">
                          {!selectedOperator ? "Please select an operator" : "--"}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {errorPrices && (
              <p className="text-[9px] text-amber-800 leading-tight bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-mono">
                {errorPrices}
              </p>
            )}

            {(() => {
              const checkoutAvailStatus = selectedCountry && selectedService
                ? getServiceAvailabilityStatus({
                    selectedCountryKey: selectedCountry.key,
                    serviceKey: selectedService.key,
                    stockCount: pricingInfo.totalStock,
                    isProviderConnected: providerSyncStatus !== "PROVIDER_ERROR",
                    lastSuccessfulSync: lastSyncInfo?.lastSuccessfulSync
                  })
                : "TEMPORARILY_UNAVAILABLE";

              const selectedOpObj = pricingInfo.operators.find(o => o.key === selectedOperator);
              const hasSelectedOperator = Boolean(selectedOperator && selectedOpObj);
              const isSelectedOpInStock = Boolean(selectedOpObj && selectedOpObj.count > 0);
              const isEffectiveBuying = isBuying || demoAllocating;

              const isBuyDisabled = (isEffectiveBuying && !demoAllocating) ||
                !selectedCountry ||
                !selectedService ||
                !hasSelectedOperator ||
                !isSelectedOpInStock ||
                (orderMode === "by-service" && checkoutAvailStatus !== "AVAILABLE");

              let buttonText = "Allocate Virtual Number";
              if (isEffectiveBuying) {
                buttonText = "Requesting Allocation...";
              } else if (!selectedCountry || !selectedService) {
                buttonText = "Select Origin & Platform";
              } else if (!hasSelectedOperator) {
                buttonText = "Please select an operator.";
              } else if (!isSelectedOpInStock) {
                buttonText = "Selected operator out of stock";
              } else if (orderMode === "by-number") {
                buttonText = "Generate Direct Number";
              } else if (checkoutAvailStatus === "OUT_OF_STOCK") {
                buttonText = "Out of Stock";
              } else if (checkoutAvailStatus === "TEMPORARILY_UNAVAILABLE") {
                buttonText = "Temporarily Unavailable";
              }

              return (
                <button
                  id="buy-btn"
                  onClick={handleBuy}
                  disabled={isBuyDisabled && !demoAllocating}
                  className={`w-full font-bold py-3.5 px-6 rounded-xl text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    isBuyDisabled && !demoAllocating
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                      : "bg-[#00AEEF] hover:bg-[#009CD6] text-white shadow-[#00AEEF]/20 hover:shadow-xl hover:scale-[1.01]"
                  }`}
                >
                  {isEffectiveBuying ? (
                    <>
                      <Icons.Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{buttonText}</span>
                    </>
                  ) : (
                    <>
                      <Icons.ShoppingCart className="h-4 w-4" />
                      <span>{buttonText}</span>
                    </>
                  )}
                </button>
              );
            })()}
            <p className="text-[9.5px] text-center text-slate-400 font-semibold leading-relaxed">
              Allocated for 15 mins. Use immediately. Automated instant SMS verification.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
