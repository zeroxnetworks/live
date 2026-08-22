import React, { useState, useEffect } from "react";
import { 
  Database, Activity, RefreshCw, Plus, Edit, Trash2, CheckCircle2, 
  XCircle, Search, Sliders, AlertTriangle, TrendingUp, Settings2, 
  Layers, Copy, Check, Eye, EyeOff, Play, Square, Terminal, ArrowUpRight, 
  Settings, Loader2, HelpCircle, Globe, ShoppingCart
} from "lucide-react";
import { toast } from "react-hot-toast";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { 
  SmmProvider, SmmService, SmmCategory, SmmOrder, 
  SmmLog, SmmPriceRule, SmmSettings, UserAccount 
} from "../types";
import SmmOrdersMonitor from "./SmmOrdersMonitor";

interface SmmManagementProps {
  smmProviders: SmmProvider[];
  setSmmProviders: React.Dispatch<React.SetStateAction<SmmProvider[]>>;
  smmServices: SmmService[];
  setSmmServices: React.Dispatch<React.SetStateAction<SmmService[]>>;
  smmCategories: SmmCategory[];
  setSmmCategories: React.Dispatch<React.SetStateAction<SmmCategory[]>>;
  smmOrders: SmmOrder[];
  setSmmOrders: React.Dispatch<React.SetStateAction<SmmOrder[]>>;
  smmPriceRules: SmmPriceRule[];
  setSmmPriceRules: React.Dispatch<React.SetStateAction<SmmPriceRule[]>>;
  smmLogs: SmmLog[];
  setSmmLogs: React.Dispatch<React.SetStateAction<SmmLog[]>>;
  smmSettings: SmmSettings;
  setSmmSettings: React.Dispatch<React.SetStateAction<SmmSettings>>;
  registeredUsers: UserAccount[];
  onUpdateUserBalance: (userId: string, newBalance: number) => void;
}

export default function SmmManagement({
  smmProviders,
  setSmmProviders,
  smmServices,
  setSmmServices,
  smmCategories,
  setSmmCategories,
  smmOrders,
  setSmmOrders,
  smmPriceRules,
  setSmmPriceRules,
  smmLogs,
  setSmmLogs,
  smmSettings,
  setSmmSettings,
  registeredUsers,
  onUpdateUserBalance
}: SmmManagementProps) {
  // Navigation inside Plugin
  const [subTab, setSubTab] = useState<
    "dashboard" | "providers" | "services" | "categories" | "pricing" | "sync" | "health" | "logs" | "settings" | "orders"
  >("dashboard");

  // Local helper states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedProviderFilter, setSelectedProviderFilter] = useState("all");

  // Forms
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SmmProvider | null>(null);
  const [providerForm, setProviderForm] = useState<Partial<SmmProvider>>({
    name: "",
    apiUrl: "",
    apiKey: "",
    apiType: "perfectpanel",
    currency: "USD",
    status: "ACTIVE",
    timeout: 15,
    syncInterval: "30m",
    profitPercent: 20,
    fixedProfit: 0,
    rateMultiplier: 278,
    notes: ""
  });

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SmmPriceRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Partial<SmmPriceRule>>({
    targetType: "global",
    targetId: "",
    type: "percent",
    value: 20,
    roundDecimals: 2,
    isActive: true
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<SmmService | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<SmmService>>({
    name: "",
    category: "",
    sellingPrice: 100,
    min: 10,
    max: 10000,
    refill: true,
    cancel: true,
    description: "",
    isActive: true,
    isHidden: false
  });

  // Log filter states
  const [logTypeFilter, setLogTypeFilter] = useState<"all" | "api" | "sync" | "error" | "activity">("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const addLog = (type: SmmLog["type"], title: string, content: string) => {
    const newLog: SmmLog = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      type,
      title,
      content,
      createdAt: new Date().toISOString()
    };
    setSmmLogs(prev => [newLog, ...prev]);
  };

  // Provider Form Actions
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name || !providerForm.apiUrl || !providerForm.apiKey) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const toastId = toast.loading("Saving and verifying provider connection...");

    let initialBalance = 0;
    let healthStatus: "HEALTHY" | "DOWN" | "DEGRADED" = "HEALTHY";

    try {
      const res = await fetch("/api/smm/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: providerForm.apiUrl,
          apiKey: providerForm.apiKey,
          action: "balance"
        })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        const rawBal = data.balance !== undefined ? data.balance : data.currency_balance || data.raw || 0;
        initialBalance = parseFloat(rawBal) || 0;
      } else {
        healthStatus = "DOWN";
      }
    } catch (err) {
      healthStatus = "DOWN";
    }

    if (editingProvider) {
      const updated: SmmProvider = {
        ...editingProvider,
        ...providerForm,
        balance: initialBalance || editingProvider.balance || 0,
        healthStatus
      } as SmmProvider;

      setSmmProviders(prev => prev.map(p => p.id === editingProvider.id ? updated : p));
      try {
        await setDoc(doc(db, "smm_providers", editingProvider.id), updated);
      } catch (e) {
        console.error("Firestore provider save failed:", e);
      }
      addLog("activity", "Provider Updated", `SMM provider "${providerForm.name}" details edited. Real Balance: $${initialBalance.toFixed(2)}.`);
      toast.success(`Provider "${providerForm.name}" updated! Real Balance: $${initialBalance.toFixed(2)}`, { id: toastId });
      // Auto-sync after edit
      setTimeout(() => handleSyncAll(updated), 500);
    } else {
      const providerId = "prov_" + Math.random().toString(36).substr(2, 9);
      const newProvider: SmmProvider = {
        id: providerId,
        ...(providerForm as Omit<SmmProvider, "id">),
        balance: initialBalance,
        healthStatus,
        responseTime: 120,
        successRate: 100
      };
      setSmmProviders(prev => [...prev, newProvider]);
      try {
        await setDoc(doc(db, "smm_providers", providerId), newProvider);
      } catch (e) {
        console.error("Firestore provider create failed:", e);
      }
      addLog("activity", "Provider Added", `New SMM provider "${newProvider.name}" registered. Real Balance: $${initialBalance.toFixed(2)}.`);
      toast.success(`Provider "${newProvider.name}" added! Real Balance: $${initialBalance.toFixed(2)}`, { id: toastId });
      // Auto-sync after adding
      setTimeout(() => handleSyncAll(newProvider), 500);
    }
    setShowProviderModal(false);
    setEditingProvider(null);
  };

  const handleTestConnection = async (prov: SmmProvider) => {
    toast.loading("Testing connection to " + prov.name + " API...", { id: "test-conn" });
    const startTime = Date.now();
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

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (!res.ok || data.error) {
        const errorMsg = data.error || data.message || "Failed to connect to provider API";
        const updatedProv: SmmProvider = {
          ...prov,
          healthStatus: "DOWN",
          responseTime: latency
        };
        setSmmProviders(prev => prev.map(p => p.id === prov.id ? updatedProv : p));
        try {
          await setDoc(doc(db, "smm_providers", prov.id), updatedProv);
        } catch (e) {}
        addLog("error", "API Connection Failed", `Error connecting to ${prov.name} (${prov.apiUrl}): ${errorMsg}`);
        toast.error(`Connection Failed: ${errorMsg}`, { id: "test-conn" });
        return;
      }

      const rawBal = data.balance !== undefined ? data.balance : data.currency_balance || data.raw || 0;
      const numBal = parseFloat(rawBal) || 0;

      const updatedProv: SmmProvider = {
        ...prov,
        responseTime: latency,
        healthStatus: "HEALTHY",
        balance: numBal
      };

      setSmmProviders(prev => prev.map(p => p.id === prov.id ? updatedProv : p));
      
      try {
        await setDoc(doc(db, "smm_providers", prov.id), updatedProv);
      } catch (e) {
        console.error("Failed to save provider balance to Firestore:", e);
      }

      addLog("api", "API Connection Test", `Successfully pinged ${prov.name} (${prov.apiUrl}). Balance: $${numBal.toFixed(2)}, Latency: ${latency}ms.`);
      toast.success(`Connected to ${prov.name}! Real Balance: $${numBal.toFixed(2)} (${latency}ms)`, { id: "test-conn" });
    } catch (err: any) {
      const latency = Date.now() - startTime;
      const updatedProv: SmmProvider = {
        ...prov,
        healthStatus: "DOWN",
        responseTime: latency
      };
      setSmmProviders(prev => prev.map(p => p.id === prov.id ? updatedProv : p));
      try {
        await setDoc(doc(db, "smm_providers", prov.id), updatedProv);
      } catch (e) {}
      addLog("error", "API Connection Failed", `Network error for ${prov.name}: ${err.message}`);
      toast.error(`Connection Error: ${err.message || "Network Error"}`, { id: "test-conn" });
    }
  };

  const handleDeleteProvider = async (id: string) => {
    const prov = smmProviders.find(p => p.id === id);
    if (!prov) return;
    if (confirm(`Are you sure you want to delete SMM Provider "${prov.name}"? This will delete ALL associated services and categories linked only to this provider.`)) {
      const toastId = toast.loading(`Deleting provider "${prov.name}" and cleaning up services...`);
      
      // 1. Remove from local state
      setSmmProviders(prev => prev.filter(p => p.id !== id));
      const servicesToDelete = smmServices.filter(s => s.providerId === id);
      setSmmServices(prev => prev.filter(s => s.providerId !== id));

      try {
        // 2. Delete provider doc
        await deleteDoc(doc(db, "smm_providers", id));

        // 3. Delete all associated services from Firestore in batches
        if (servicesToDelete.length > 0) {
          for (let i = 0; i < servicesToDelete.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = servicesToDelete.slice(i, i + 400);
            chunk.forEach(s => {
              batch.delete(doc(db, "smm_services", s.id));
            });
            await batch.commit();
          }
        }

        // 4. Cleanup empty categories
        const remainingServices = smmServices.filter(s => s.providerId !== id);
        const activeCategoryNames = new Set(remainingServices.map(s => s.category));
        const categoriesToDelete = smmCategories.filter(c => !activeCategoryNames.has(c.name));
        
        if (categoriesToDelete.length > 0) {
          const batch = writeBatch(db);
          categoriesToDelete.forEach(c => {
            batch.delete(doc(db, "smm_categories", c.id));
          });
          await batch.commit();
          setSmmCategories(prev => prev.filter(c => activeCategoryNames.has(c.name)));
        }

        addLog("activity", "Provider Deleted", `Provider "${prov.name}" and ${servicesToDelete.length} associated services were permanently deleted.`);
        toast.success(`Provider "${prov.name}" and ${servicesToDelete.length} services deleted successfully.`, { id: toastId });
      } catch (e: any) {
        console.error("Firestore provider delete failed:", e);
        toast.error(`Deletion failed: ${e.message}`, { id: toastId });
      }
    }
  };

  const handleSyncBalances = async () => {
    const activeProviders = smmProviders.filter(p => p.status === "ACTIVE");
    if (activeProviders.length === 0) {
      toast.error("No active providers to sync.");
      return;
    }

    const toastId = toast.loading("Syncing all provider balances...");
    let successCount = 0;

    for (const prov of activeProviders) {
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

        const data = await res.json();
        if (res.ok && !data.error) {
          const rawBal = data.balance !== undefined ? data.balance : data.currency_balance || data.raw || 0;
          const numBal = parseFloat(rawBal) || 0;

          const updatedProv: SmmProvider = {
            ...prov,
            balance: numBal,
            healthStatus: "HEALTHY",
            lastSyncTime: new Date().toISOString()
          };

          setSmmProviders(prev => prev.map(p => p.id === prov.id ? updatedProv : p));
          await setDoc(doc(db, "smm_providers", prov.id), updatedProv);
          successCount++;
        }
      } catch (err) {
        console.error(`Balance sync failed for ${prov.name}:`, err);
      }
    }

    toast.success(`Synced ${successCount}/${activeProviders.length} balances successfully.`, { id: toastId });
  };

  const handleCleanupOrphanedServices = async () => {
    const providerIds = new Set(smmProviders.map(p => p.id));
    const orphanedServices = smmServices.filter(s => s.providerId !== "local" && !providerIds.has(s.providerId));

    if (orphanedServices.length === 0) {
      toast.success("No orphaned services found.");
      return;
    }

    if (confirm(`Found ${orphanedServices.length} services belonging to non-existent providers. Clean them up now?`)) {
      const toastId = toast.loading(`Cleaning up ${orphanedServices.length} orphaned services...`);
      
      try {
        // 1. Remove from local state
        setSmmServices(prev => prev.filter(s => !orphanedServices.find(os => os.id === s.id)));

        // 2. Delete from Firestore in batches
        for (let i = 0; i < orphanedServices.length; i += 400) {
          const batch = writeBatch(db);
          const chunk = orphanedServices.slice(i, i + 400);
          chunk.forEach(s => {
            batch.delete(doc(db, "smm_services", s.id));
          });
          await batch.commit();
        }

        // 3. Cleanup empty categories
        const remainingServices = smmServices.filter(s => !orphanedServices.find(os => os.id === s.id));
        const activeCategoryNames = new Set(remainingServices.map(s => s.category));
        const categoriesToDelete = smmCategories.filter(c => !activeCategoryNames.has(c.name));
        
        if (categoriesToDelete.length > 0) {
          const batch = writeBatch(db);
          categoriesToDelete.forEach(c => {
            batch.delete(doc(db, "smm_categories", c.id));
          });
          await batch.commit();
          setSmmCategories(prev => prev.filter(c => activeCategoryNames.has(c.name)));
        }

        addLog("activity", "Orphaned Cleanup", `Permanently removed ${orphanedServices.length} orphaned services.`);
        toast.success(`Cleaned up ${orphanedServices.length} orphaned services.`, { id: toastId });
      } catch (e: any) {
        console.error("Orphaned cleanup failed:", e);
        toast.error(`Cleanup failed: ${e.message}`, { id: toastId });
      }
    }
  };

  // Sync Action
  const handleSyncAll = async (providerOrId?: string | SmmProvider) => {
    setIsSyncing(true);
    const toastId = toast.loading(providerOrId ? "Connecting to SMM Provider API..." : "Connecting & syncing all SMM Provider catalogs...");

    let activeProviders: SmmProvider[] = [];
    if (typeof providerOrId === "object" && providerOrId !== null) {
      activeProviders = [providerOrId];
    } else if (typeof providerOrId === "string") {
      activeProviders = smmProviders.filter(p => p.id === providerOrId);
    } else {
      activeProviders = smmProviders.filter(p => p.status === "ACTIVE");
    }

    if (activeProviders.length === 0) {
      setIsSyncing(false);
      toast.error("No active SMM providers found to synchronize.", { id: toastId });
      return;
    }

    let totalSyncedServices = 0;
    let totalSyncedCategories = 0;
    const nowStr = new Date().toISOString();

    for (const prov of activeProviders) {
      try {
        const res = await fetch("/api/smm/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiUrl: prov.apiUrl,
            apiKey: prov.apiKey,
            action: "services"
          })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const errDetail = data.error || data.message || "Failed to fetch services";
          toast.error(`Sync error from ${prov.name}: ${errDetail}`, { id: toastId });
          addLog("error", "Sync Failed", `Could not fetch services from provider "${prov.name}": ${errDetail}`);
          continue;
        }

        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.services)) {
            rawList = data.services;
          } else if (Array.isArray(data.data)) {
            rawList = data.data;
          } else if (Array.isArray(data.result)) {
            rawList = data.result;
          } else {
            const vals = Object.values(data);
            if (vals.length > 0 && typeof vals[0] === "object" && vals[0] !== null) {
              rawList = vals as any[];
            }
          }
        }
        
        if (!rawList || rawList.length === 0) {
          toast.error(`Provider "${prov.name}" returned 0 services or empty list.`, { id: toastId });
          addLog("error", "Empty Service List", `Provider "${prov.name}" returned 0 services.`);
          continue;
        }

        const multiplier = prov.rateMultiplier || 278;
        const markup = prov.profitPercent || 20;
        const fixedProfit = prov.fixedProfit || 0;

        const newServices: SmmService[] = [];
        const categoriesMap = new Map<string, SmmCategory>();

        rawList.forEach((item: any, idx: number) => {
          const svcNum = item.service !== undefined ? String(item.service) : (item.id !== undefined ? String(item.id) : String(idx + 1));
          const name = item.name || `Service #${svcNum}`;
          const catName = (item.category || "General Services").trim();
          const usdRate = parseFloat(item.rate) || 0;
          const min = parseInt(item.min) || 10;
          const max = parseInt(item.max) || 10000;

          // Formula: Selling PKR = (CostUSD * Multiplier * (1 + Markup/100)) + Fixed
          const rawPricePKR = (usdRate * multiplier * (1 + markup / 100)) + fixedProfit;
          const sellingPrice = Number(rawPricePKR.toFixed(2));

          const serviceId = `svc_${prov.id}_${svcNum}`;
          const serviceObj: SmmService = {
            id: serviceId,
            providerId: prov.id,
            providerServiceId: svcNum,
            name: name,
            category: catName,
            rate: usdRate,
            sellingPrice: sellingPrice,
            min: min,
            max: max,
            type: item.type || "Default",
            refill: Boolean(item.refill),
            cancel: Boolean(item.cancel),
            averageTime: item.average_time || item.averageTime || item.avg_time || item.time || "Instant / Fast",
            description: item.desc || item.description || item.details || (item.dripfeed ? "Supports Drip Feed" : "Instant delivery service package."),
            isActive: true,
            isHidden: false
          };

          newServices.push(serviceObj);

          if (!categoriesMap.has(catName)) {
            const catId = "cat_" + catName.toLowerCase().replace(/[^a-z0-9]/g, "_");
            categoriesMap.set(catName, {
              id: catId,
              name: catName,
              isActive: true,
              sortOrder: categoriesMap.size + 1
            });
          }
        });

        // Batch update Firestore (Optimized with writeBatch)
        const newCatList = Array.from(categoriesMap.values());
        
        try {
          const allDocs = [...newServices.map(s => ({ collection: "smm_services", data: s })), ...newCatList.map(c => ({ collection: "smm_categories", data: c }))];
          
          for (let i = 0; i < allDocs.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = allDocs.slice(i, i + 400);
            
            for (const item of chunk) {
              const docRef = doc(db, item.collection, item.data.id);
              batch.set(docRef, item.data);
            }
            
            await batch.commit();
          }
        } catch (err) {
          console.error("Error batch saving to Firestore:", err);
        }

        // Update provider lastSyncTime and balance
        const updatedProv: SmmProvider = {
          ...prov,
          lastSyncTime: nowStr,
          healthStatus: "HEALTHY"
        };
        try {
          await setDoc(doc(db, "smm_providers", prov.id), updatedProv);
        } catch (e) {
          console.error("Error updating provider in Firestore:", e);
        }

        // Update React state in memory
        setSmmProviders(prev => prev.map(p => p.id === prov.id ? updatedProv : p));

        setSmmServices(prev => {
          const otherServices = prev.filter(s => s.providerId !== prov.id);
          return [...otherServices, ...newServices];
        });

        setSmmCategories(prev => {
          const catMap = new Map<string, SmmCategory>();
          prev.forEach(c => catMap.set(c.name, c));
          newCatList.forEach(c => {
            if (!catMap.has(c.name)) catMap.set(c.name, c);
          });
          return Array.from(catMap.values());
        });
        
        totalSyncedServices += newServices.length;
        totalSyncedCategories += newCatList.length;

        addLog("sync", "Provider Synced", `Successfully synced ${newServices.length} real services in ${newCatList.length} categories from ${prov.name}.`);

      } catch (err: any) {
        toast.error(`Sync error for ${prov.name}: ${err.message}`, { id: toastId });
        addLog("error", "Sync Error", `Failed to sync provider ${prov.name}: ${err.message}`);
      }
    }

    setIsSyncing(false);
    toast.success(`Sync Complete! Synced ${totalSyncedServices} services from provider APIs.`, { id: toastId });
  };

  // Pricing Rules
  const handleSavePriceRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      setSmmPriceRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, ...ruleForm } as SmmPriceRule : r));
      addLog("activity", "Price Rule Updated", `Price Markup Rule was updated.`);
      toast.success("Pricing Rule updated.");
    } else {
      const newRule: SmmPriceRule = {
        id: "rule_" + Math.random().toString(36).substr(2, 9),
        ...(ruleForm as Omit<SmmPriceRule, "id">)
      };
      setSmmPriceRules(prev => [...prev, newRule]);
      addLog("activity", "Price Rule Added", `New pricing rule added for target "${newRule.targetType}".`);
      toast.success("New pricing rule added.");
    }
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this price rule?")) {
      setSmmPriceRules(prev => prev.filter(r => r.id !== id));
      addLog("activity", "Price Rule Deleted", `Markup rule deleted.`);
      toast.success("Pricing Rule removed.");
    }
  };

  // Service Edit manual override
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (editingService) {
      setSmmServices(prev => prev.map(s => s.id === editingService.id ? { 
        ...s, 
        ...serviceForm,
        manualOverridden: true // flag that custom settings won't be overwritten automatically
      } as SmmService : s));
      addLog("activity", "Service Manually Edited", `SMM Service "${serviceForm.name}" was updated manually.`);
      toast.success("Service updated & locked from automatic overwriting.");
    } else {
      const newService: SmmService = {
        id: "smm_" + Math.random().toString(36).substr(2, 9),
        providerId: "local",
        providerServiceId: "manual",
        rate: 0,
        ...(serviceForm as Omit<SmmService, "id" | "providerId" | "providerServiceId" | "rate">),
        manualOverridden: true
      };
      setSmmServices(prev => [...prev, newService]);
      addLog("activity", "Custom Service Created", `Custom localized SMM service "${newService.name}" created.`);
      toast.success("Custom service added.");
    }
    setShowServiceModal(false);
    setEditingService(null);
  };

  // Bulk operation actions
  const handleBulkStatusChange = (status: boolean) => {
    setSmmServices(prev => prev.map(s => {
      // Apply filters if set
      const matchCat = selectedCategoryFilter === "all" || s.category === selectedCategoryFilter;
      const matchProv = selectedProviderFilter === "all" || s.providerId === selectedProviderFilter;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (matchCat && matchProv && matchSearch) {
        return { ...s, isActive: status };
      }
      return s;
    }));
    addLog("activity", "Bulk Status Shift", `Bulk status update applied to filtered services: ${status ? 'ENABLED' : 'DISABLED'}`);
    toast.success(`Bulk status update complete. Services ${status ? 'enabled' : 'disabled'}.`);
  };

  const handleBulkDelete = () => {
    if (confirm("Are you sure you want to bulk delete ALL currently filtered SMM services? This action is irreversible.")) {
      setSmmServices(prev => prev.filter(s => {
        const matchCat = selectedCategoryFilter === "all" || s.category === selectedCategoryFilter;
        const matchProv = selectedProviderFilter === "all" || s.providerId === selectedProviderFilter;
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return !(matchCat && matchProv && matchSearch); // Keep non-matching services
      }));
      addLog("activity", "Bulk Services Deleted", `Filtered services bulk deleted.`);
      toast.success("Bulk delete complete.");
    }
  };

  // Simulated Log Clears
  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all SMM logs?")) {
      setSmmLogs([]);
      toast.success("SMM logs cleared.");
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Sync Log Filters
  const filteredLogs = smmLogs.filter(log => {
    const matchType = logTypeFilter === "all" || log.type === logTypeFilter;
    const matchSearch = log.title.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                        log.content.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // Category list extraction
  const categoriesList = Array.from(new Set(smmServices.map(s => s.category)));

  // Filtered Services list
  const filteredServices = smmServices.filter(s => {
    const matchCat = selectedCategoryFilter === "all" || s.category === selectedCategoryFilter;
    const matchProv = selectedProviderFilter === "all" || s.providerId === selectedProviderFilter;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchProv && matchSearch;
  });

  // Calculate Metrics
  const totalProviders = smmProviders.length;
  const activeProviders = smmProviders.filter(p => p.status === "ACTIVE").length;
  const totalServices = smmServices.length;
  const hiddenServices = smmServices.filter(s => s.isHidden).length;
  const activeServices = smmServices.filter(s => s.isActive).length;
  const failedApis = smmProviders.filter(p => p.healthStatus === "DOWN" || p.healthStatus === "DEGRADED").length;
  const totalSmmOrders = smmOrders.length;
  const ordersToday = smmOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;
  
  const providerBalanceSum = smmProviders.reduce((sum, p) => sum + (p.balance || 0), 0);

  return (
    <div id="smm-plugin-container" className="space-y-6">
      {/* Plugin Main Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="h-40 w-40" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/25 border border-indigo-500/35 text-indigo-300 font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-md">
                Enterprise Module
              </span>
              <span className="bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-md">
                v2.1 Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
              <Database className="h-6 w-6 text-indigo-400" />
              SMM Panel Gateway Module
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-xl mt-1 uppercase tracking-wide">
              Manage API Providers, Service Feeds, Auto Pricing rules, and order forwarding seamlessly.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSyncAll()}
              disabled={isSyncing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Sync All Catalogs</span>
            </button>
            <button
              onClick={() => {
                setEditingProvider(null);
                setProviderForm({
                  name: "",
                  apiUrl: "",
                  apiKey: "",
                  apiType: "perfectpanel",
                  currency: "USD",
                  status: "ACTIVE",
                  timeout: 15,
                  syncInterval: "30m",
                  profitPercent: 20,
                  fixedProfit: 0,
                  rateMultiplier: 278,
                  notes: ""
                });
                setShowProviderModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Add Provider</span>
            </button>
          </div>
        </div>

        {/* Inner Tab switching */}
        <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 mt-6 border-t border-slate-800/80 pt-4 pb-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "providers", label: "Providers API", icon: Globe },
            { id: "services", label: "Service Feed", icon: Sliders },
            { id: "categories", label: "Categories", icon: Layers },
            { id: "pricing", label: "Price Markups", icon: Settings2 },
            { id: "orders", label: "Global Order Monitor", icon: ShoppingCart },
            { id: "health", label: "Health Monitor", icon: Activity },
            { id: "logs", label: "Gateway Logs", icon: Terminal },
            { id: "settings", label: "Sync Engine", icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  subTab === tab.id 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB CONTENT: DASHBOARD */}
      {subTab === "dashboard" && (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSyncBalances}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
              <span>Sync All Balances Only</span>
            </button>
            <button
              onClick={handleCleanupOrphanedServices}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>Cleanup Orphaned Services</span>
            </button>
          </div>

          {/* Dashboard Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Total API Providers</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">{totalProviders}</h3>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-indigo-600">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mt-3 flex items-center gap-1.5 border-t border-slate-50 pt-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeProviders} Active Providers Live</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Synced SMM Services</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">{totalServices}</h3>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg text-blue-600">
                  <Sliders className="h-5 w-5" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                <span>{activeServices} Active Feed</span>
                <span className="text-amber-600">{hiddenServices} Hidden</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Provider Balance Sum</p>
                  <h3 className="text-2xl font-black text-emerald-700 mt-1 font-mono">${providerBalanceSum.toFixed(2)}</h3>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-emerald-600">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-3 flex items-center gap-1 border-t border-slate-50 pt-2.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>Auto balance synced in USD</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Orders Today (Forwarded)</p>
                  <h3 className="text-2xl font-black text-indigo-700 mt-1 font-mono">{ordersToday}</h3>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-lg text-purple-600">
                  <RefreshCw className="h-5 w-5" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5">
                <span>Total Forwarded: {totalSmmOrders}</span>
                <span className="text-emerald-600 font-extrabold font-mono">100% API Success</span>
              </div>
            </div>
          </div>

          {/* Quick Stats & System Health Bento Block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Health Monitor Overview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  API Health Monitor Overview
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  All Systems Operational
                </span>
              </div>

              <div className="space-y-3.5">
                {smmProviders.map(prov => {
                  const statusColors = {
                    HEALTHY: "bg-emerald-500",
                    DEGRADED: "bg-amber-500 animate-pulse",
                    DOWN: "bg-red-500"
                  };
                  return (
                    <div key={prov.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusColors[prov.healthStatus || "HEALTHY"]}`}></span>
                        <div>
                          <h4 className="text-xs font-black text-slate-700 uppercase">{prov.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold font-mono uppercase mt-0.5">{prov.apiUrl}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[10px] font-bold text-slate-600 justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0">
                        <div>
                          <span className="text-slate-400 uppercase mr-1">LATENCY:</span>
                          <span className="text-slate-700">{prov.responseTime || 120}ms</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase mr-1">SUCCESS:</span>
                          <span className="text-slate-700">{prov.successRate || 100}%</span>
                        </div>
                        <button
                          onClick={() => handleTestConnection(prov)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition shadow-sm"
                        >
                          Ping
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sync Feed Engine Overview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-3">
                <Settings2 className="h-4 w-4 text-indigo-500" />
                Sync Engine Status
              </h3>
              
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Automatic Service Sync</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px]">Active</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Global Price Check</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase text-[10px]">Every 15m</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Price Adjustment Rule</span>
                  <span className="font-bold text-slate-700 font-mono text-[10px]">{smmPriceRules.length} Rule(s) Active</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Active Workers Pool</span>
                  <span className="font-bold text-slate-700 font-mono text-[10px]">4 Queue Workers</span>
                </div>
                
                <div className="bg-slate-50 border border-slate-250 p-3 rounded-lg space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Last Sync Job Executed</p>
                  <p className="text-xs text-slate-700 font-mono font-bold">
                    {smmProviders[0]?.lastSyncTime 
                      ? new Date(smmProviders[0].lastSyncTime).toLocaleTimeString() 
                      : "Not executed yet in this session"}
                  </p>
                </div>

                <button
                  onClick={() => handleSyncAll()}
                  disabled={isSyncing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Manual Full Catalog Sync</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: PROVIDERS API */}
      {subTab === "providers" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Registered SMM API Providers
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {smmProviders.length} Providers Found
              </span>
            </div>

            {smmProviders.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-700 uppercase">No Providers Configured</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Add your first SMM API Provider above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                      <th className="py-3 px-4">Provider Details</th>
                      <th className="py-3 px-4">API Type & Endpoint</th>
                      <th className="py-3 px-4">API Key</th>
                      <th className="py-3 px-4">Sync / Markup</th>
                      <th className="py-3 px-4">API Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {smmProviders.map(prov => (
                      <tr key={prov.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-800 uppercase">{prov.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">ID: {prov.id}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px]">
                          <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 uppercase text-[9px] mr-1.5">
                            {prov.apiType}
                          </span>
                          <span className="text-slate-500 font-semibold">{prov.apiUrl}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span>••••••••••••{prov.apiKey.substring(prov.apiKey.length - 4)}</span>
                            <button
                              onClick={() => handleCopyText(prov.apiKey)}
                              className="text-slate-400 hover:text-slate-600"
                              title="Copy API Key"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[10px] font-mono text-slate-600">
                          <div><span className="text-slate-400">SYNC:</span> Every {prov.syncInterval}</div>
                          <div className="mt-0.5 text-indigo-600 font-bold">
                            <span className="text-slate-400">MARKUP:</span> +{prov.profitPercent}% 
                            {prov.fixedProfit > 0 ? ` + ₨${prov.fixedProfit}` : ""}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono">
                          <div className="text-slate-800 font-extrabold">${prov.balance?.toFixed(2) || "0.00"}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-sans mt-0.5">USD currency</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            prov.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${prov.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                            <span>{prov.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleTestConnection(prov)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition shadow-sm inline-flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Test Connection
                          </button>
                          <button
                            onClick={() => {
                              setEditingProvider(prov);
                              setProviderForm({ ...prov });
                              setShowProviderModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProvider(prov.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            Delete
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

      {/* SUBTAB CONTENT: SERVICES LISTING */}
      {subTab === "services" && (
        <div className="space-y-6 animate-fade-in">
          {/* Daily Sync & Refresh Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-indigo-300" />
                Sync Daily SMM Services & Service Packages
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Fetch real-time updates, price markups, and new service packages directly from connected SMM Providers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSyncAll()}
              disabled={isSyncing}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
            >
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>Sync All SMM Services Now</span>
            </button>
          </div>

          {/* Services filter & control toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search SMM services by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">📁 All Categories ({categoriesList.length})</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedProviderFilter}
                onChange={(e) => setSelectedProviderFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">🌍 All Providers</option>
                {smmProviders.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="local">🔐 Local Custom Services</option>
              </select>
            </div>

            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
                title="Enable all filtered services in bulk"
              >
                Bulk Enable
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
                title="Disable all filtered services in bulk"
              >
                Bulk Disable
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
                title="Delete all filtered services in bulk"
              >
                Bulk Delete
              </button>
            </div>
          </div>

          {/* Service Feed Feed Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Imported Service Feed Catalog
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono bg-indigo-50 px-2 py-0.5 rounded">
                Displaying {filteredServices.length} of {totalServices} Services
              </span>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <Sliders className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-700 uppercase">No Services Match</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Try adjusting search parameters or trigger sync center.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Service Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Cost Rate (1K)</th>
                      <th className="py-3 px-4">Selling PKR (1K)</th>
                      <th className="py-3 px-4">Limits (Min/Max)</th>
                      <th className="py-3 px-4">Controls</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredServices.map(svc => {
                      const providerName = smmProviders.find(p => p.id === svc.providerId)?.name || "Local / Manual";
                      return (
                        <tr key={svc.id} className="hover:bg-slate-50/30 transition">
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">#{svc.id}</td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="font-extrabold text-slate-800 line-clamp-2">{svc.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150">
                                Prov ID: {svc.providerServiceId}
                              </span>
                              <span>•</span>
                              <span className="text-indigo-600">{providerName}</span>
                              {svc.manualOverridden && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Locked / Override</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold max-w-[200px] truncate">{svc.category}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">
                            {svc.providerId === "local" ? "N/A" : `$${svc.rate.toFixed(4)}`}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <div className="text-slate-800 font-black text-xs">₨ {svc.sellingPrice.toFixed(2)}</div>
                            <div className="text-[9px] text-emerald-600 font-extrabold mt-0.5">
                              Est: ${(svc.sellingPrice / 278).toFixed(4)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            <div>MIN: <span className="text-slate-700 font-bold">{svc.min}</span></div>
                            <div className="mt-0.5">MAX: <span className="text-slate-700 font-bold">{svc.max}</span></div>
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                              <span>Refill:</span>
                              <span className={svc.refill ? "text-emerald-600 uppercase" : "text-slate-400 uppercase"}>{svc.refill ? "Yes" : "No"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                              <span>Cancel:</span>
                              <span className={svc.cancel ? "text-emerald-600 uppercase" : "text-slate-400 uppercase"}>{svc.cancel ? "Yes" : "No"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSmmServices(prev => prev.map(s => s.id === svc.id ? { ...s, isHidden: !s.isHidden } : s));
                                addLog("activity", "Service Toggle Visibility", `Toggled visibility for SMM Service #${svc.id}.`);
                                toast.success(svc.isHidden ? "Service is now visible to customers." : "Service hidden from customers.");
                              }}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer transition"
                              title={svc.isHidden ? "Unhide Service" : "Hide Service"}
                            >
                              {svc.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setSmmServices(prev => prev.map(s => s.id === svc.id ? { ...s, isActive: !s.isActive } : s));
                                addLog("activity", "Service Toggle Status", `Toggled status for SMM Service #${svc.id}.`);
                                toast.success(svc.isActive ? "Service Disabled." : "Service Enabled.");
                              }}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer transition"
                              title={svc.isActive ? "Disable Service" : "Enable Service"}
                            >
                              {svc.isActive ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingService(svc);
                                setServiceForm({ ...svc });
                                setShowServiceModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this SMM service: "${svc.name}"?`)) {
                                  setSmmServices(prev => prev.filter(s => s.id !== svc.id));
                                  addLog("activity", "Service Deleted", `Deleted SMM Service #${svc.id} ("${svc.name}").`);
                                  toast.success("Service deleted successfully.");
                                }
                              }}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: CATEGORIES */}
      {subTab === "categories" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Imported SMM Categories
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {categoriesList.length} Categories Detected
              </span>
            </div>

            {categoriesList.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-700 uppercase">No SMM Categories Found</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Categories will import automatically when providers sync.</p>
              </div>
            ) : (
              <div className="p-5 space-y-3.5">
                {categoriesList.map((cat, idx) => {
                  const servicesInCat = smmServices.filter(s => s.category === cat);
                  const activeInCat = servicesInCat.filter(s => s.isActive).length;
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 border border-slate-150 rounded-xl gap-3">
                      <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase">{cat}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            {servicesInCat.length} Services ({activeInCat} Active)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => {
                            const newName = prompt("Enter a new name for this SMM Category:", cat);
                            if (newName && newName.trim()) {
                              setSmmServices(prev => prev.map(s => s.category === cat ? { ...s, category: newName.trim() } : s));
                              addLog("activity", "Category Renamed", `SMM Category "${cat}" was renamed to "${newName.trim()}".`);
                              toast.success("Category renamed successfully.");
                            }
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm flex-1 sm:flex-initial text-center"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete Category "${cat}"? This will delete all ${servicesInCat.length} services inside.`)) {
                              setSmmServices(prev => prev.filter(s => s.category !== cat));
                              addLog("activity", "Category Deleted", `SMM Category "${cat}" and all its services were deleted.`);
                              toast.success("Category deleted.");
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition flex-1 sm:flex-initial text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: PRICE MARKUP RULES */}
      {subTab === "pricing" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Pricing Margin & Profit Rules
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                Automatically calculate selling prices when providers update costs.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  targetType: "global",
                  targetId: "",
                  type: "percent",
                  value: 20,
                  roundDecimals: 2,
                  isActive: true
                });
                setShowRuleModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Price Rule</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Active Price Formulas</h4>
            </div>

            {smmPriceRules.length === 0 ? (
              <div className="text-center py-12">
                <Settings2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-700 uppercase">No Price Rules Set</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Selling prices will fallback to provider profit defaults.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                      <th className="py-3 px-4">Target Scope</th>
                      <th className="py-3 px-4">Rule Formula Type</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Decimals Round</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {smmPriceRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-bold text-slate-800 uppercase font-mono">
                          <span className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-700 text-[10px] font-bold mr-2">
                            {rule.targetType}
                          </span>
                          {rule.targetType === "global" ? "All Services" : rule.targetId || "Specific Target"}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600">
                          {rule.type === "percent" ? "Percentage Markup (Profit %)" : "Fixed Amount Markup (Profit PKR)"}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-slate-800">
                          {rule.type === "percent" ? `+${rule.value}%` : `+₨${rule.value}`}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-500">
                          Round to {rule.roundDecimals} decimal places
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            rule.isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <span>{rule.isActive ? "ACTIVE" : "DISABLED"}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSmmPriceRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
                              toast.success("Price rule status changed.");
                            }}
                            className="text-slate-600 hover:text-slate-900 font-bold"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setRuleForm({ ...rule });
                              setShowRuleModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            Delete
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

      {/* SUBTAB CONTENT: HEALTH MONITOR */}
      {subTab === "health" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                API Connection Logs & Latency Monitor
              </h3>
              <button
                onClick={() => {
                  toast.success("Refreshing statuses...");
                  handleSyncAll();
                }}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Trigger Ping Check
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smmProviders.map(prov => (
                <div key={prov.id} className="border border-slate-200 rounded-xl p-4 space-y-3.5 bg-slate-50/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800 uppercase">{prov.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">{prov.apiUrl}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white border border-slate-150 rounded-lg p-2.5">
                      <p className="text-[8px] font-black uppercase text-slate-400">LATENCY</p>
                      <p className="text-xs font-bold font-mono text-slate-700 mt-1">{prov.responseTime || 120}ms</p>
                    </div>
                    <div className="bg-white border border-slate-150 rounded-lg p-2.5">
                      <p className="text-[8px] font-black uppercase text-slate-400">SUCCESS RATE</p>
                      <p className="text-xs font-bold font-mono text-emerald-600 mt-1">{prov.successRate || 100}%</p>
                    </div>
                    <div className="bg-white border border-slate-150 rounded-lg p-2.5">
                      <p className="text-[8px] font-black uppercase text-slate-400">HEALTH STATUS</p>
                      <p className="text-xs font-extrabold uppercase text-indigo-600 mt-1">{prov.healthStatus || "HEALTHY"}</p>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 font-bold uppercase flex justify-between border-t border-slate-100 pt-2.5">
                    <span>API VERSION: REST V2</span>
                    <span>SSL STATUS: SECURED (TLS 1.3)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: GATEWAY LOGS */}
      {subTab === "logs" && (
        <div className="space-y-6 animate-fade-in">
          {/* Logs filtering header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search SMM logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
              {[
                { id: "all", label: "All Logs" },
                { id: "api", label: "API Calls" },
                { id: "sync", label: "Sync Tasks" },
                { id: "error", label: "Errors" },
                { id: "activity", label: "Activity" }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setLogTypeFilter(item.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    logTypeFilter === item.id 
                      ? "bg-slate-900 text-white" 
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end items-center">
              <button
                onClick={handleClearLogs}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Clear SMM Logs
              </button>
            </div>
          </div>

          {/* Logs Display Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                System Log Stream
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                {filteredLogs.length} Entries Recorded
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Terminal className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-black text-slate-700 uppercase">Log Stream Empty</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Logs will capture automatically as actions run.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map(log => {
                  const logBadgeColors = {
                    api: "bg-blue-50 text-blue-700 border-blue-200",
                    sync: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    error: "bg-red-50 text-red-700 border-red-200",
                    activity: "bg-slate-100 text-slate-600 border-slate-200"
                  };
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-start gap-3.5">
                      <span className="text-[10px] text-slate-400 shrink-0 font-bold">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase shrink-0 ${logBadgeColors[log.type]}`}>
                        {log.type}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">{log.title}</h4>
                        <p className="text-slate-500 font-medium text-[11px] mt-0.5">{log.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: SYNC SYSTEM SETTINGS */}
      {subTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="h-4 w-4 text-indigo-500" />
              Auto Synchronize System Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase">Background Auto Synchronization</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Let background workers query feed updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSmmSettings(prev => ({ ...prev, autoSyncEnabled: !prev.autoSyncEnabled }));
                    toast.success(smmSettings.autoSyncEnabled ? "Auto-Sync Stopped" : "Auto-Sync Enabled");
                  }}
                  className="cursor-pointer font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg"
                >
                  {smmSettings.autoSyncEnabled ? "ENABLED (ON)" : "DISABLED (OFF)"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase">Max Concurrent Threads</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Control concurrent requests limits</p>
                </div>
                <select
                  value={smmSettings.maxQueueWorkers}
                  onChange={(e) => setSmmSettings(prev => ({ ...prev, maxQueueWorkers: Number(e.target.value) }))}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {[1, 2, 4, 8, 16].map(num => (
                    <option key={num} value={num}>{num} Threads</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Default Profit %</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={smmSettings.defaultProfitPercent}
                  onChange={(e) => setSmmSettings(prev => ({ ...prev, defaultProfitPercent: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Default Fixed Profit (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={smmSettings.defaultFixedProfit}
                  onChange={(e) => setSmmSettings(prev => ({ ...prev, defaultFixedProfit: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Decimals Rounding</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={smmSettings.defaultRoundDecimals}
                  onChange={(e) => setSmmSettings(prev => ({ ...prev, defaultRoundDecimals: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: GLOBAL ORDER MONITOR */}
      {subTab === "orders" && (
        <SmmOrdersMonitor 
          orders={smmOrders}
          users={registeredUsers}
          services={smmServices}
          onRefresh={() => {}}
        />
      )}

      {/* MODAL: ADD/EDIT PROVIDER */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                {editingProvider ? "Edit SMM Provider" : "Add New SMM Provider"}
              </h3>
              <button
                onClick={() => {
                  setShowProviderModal(false);
                  setEditingProvider(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Provider Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMM Kings Feed"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Engine Type *</label>
                  <select
                    value={providerForm.apiType}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, apiType: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="perfectpanel">PerfectPanel API</option>
                    <option value="justanotherpanel">JustAnotherPanel (JAP)</option>
                    <option value="smartpanel">SmartPanel</option>
                    <option value="childpanels">Child Panel API</option>
                    <option value="custom">Custom JSON REST API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Base Currency *</label>
                  <select
                    value={providerForm.currency}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="PKR">PKR (₨)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API URL Endpoint *</label>
                <input
                  type="url"
                  required
                  placeholder="https://brandpanel.com/api/v2"
                  value={providerForm.apiUrl}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Secret Access Key *</label>
                <input
                  type="password"
                  required
                  placeholder="Paste your developer API Secret Token"
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sync Frequency</label>
                  <select
                    value={providerForm.syncInterval}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, syncInterval: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="5m">Every 5 Minutes</option>
                    <option value="15m">Every 15 Minutes</option>
                    <option value="30m">Every 30 Minutes</option>
                    <option value="1h">Hourly Sync</option>
                    <option value="24h">Daily Sync</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Exchange Multiplier (PKR per USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={providerForm.rateMultiplier}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, rateMultiplier: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Profit Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={providerForm.profitPercent}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, profitPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fixed Extra Profit (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={providerForm.fixedProfit}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, fixedProfit: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Save Provider Setup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProviderModal(false);
                    setEditingProvider(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SERVICE */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                {editingService ? "Customize Service Details" : "Create Custom Service"}
              </h3>
              <button onClick={() => { setShowServiceModal(false); setEditingService(null); }} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Headline Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instagram Followers"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Override Selling Price (₨ per 1K)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.sellingPrice}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={serviceForm.refill}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, refill: e.target.checked }))}
                    />
                    Refill Support
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={serviceForm.cancel}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, cancel: e.target.checked }))}
                    />
                    Cancel Support
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Minimum Order Qty</label>
                  <input
                    type="number"
                    value={serviceForm.min}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, min: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Maximum Order Qty</label>
                  <input
                    type="number"
                    value={serviceForm.max}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, max: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Service Description Details</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe service features, speed, quality and guidelines..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold cursor-pointer">Save Service Updates</button>
                <button type="button" onClick={() => { setShowServiceModal(false); setEditingService(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT PRICE MARGIN RULE */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                {editingRule ? "Edit Markup Formula" : "Add Pricing Markup Rule"}
              </h3>
              <button onClick={() => { setShowRuleModal(false); setEditingRule(null); }} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePriceRule} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Scope</label>
                <select
                  value={ruleForm.targetType}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, targetType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="global">Global (All Services)</option>
                  <option value="category">Specific Category</option>
                  <option value="individual">Individual Service ID</option>
                </select>
              </div>

              {ruleForm.targetType !== "global" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Category Name or Service ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instagram Followers"
                    value={ruleForm.targetId}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, targetId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Markup Type</label>
                <select
                  value={ruleForm.type}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="percent">Percentage Markup (%)</option>
                  <option value="fixed">Fixed Extra Cost (PKR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Markup Markup Value *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={ruleForm.value}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Round Price Decimals</label>
                <select
                  value={ruleForm.roundDecimals}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, roundDecimals: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value={0}>0 (Whole numbers e.g. ₨ 156)</option>
                  <option value={1}>1 decimal place (e.g. ₨ 156.4)</option>
                  <option value={2}>2 decimal places (e.g. ₨ 156.40)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold cursor-pointer">Save Markup Rule</button>
                <button type="button" onClick={() => { setShowRuleModal(false); setEditingRule(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
