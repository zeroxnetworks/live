import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  Image as LucideImage, Upload, Palette, Layers, Copy, Save, RefreshCw, Filter, Sparkles, Trash2, Plus,
  ShoppingBag, Star, ShieldCheck, CheckCircle2, ArrowRight, Zap, Eye, EyeOff, Layout, Grid, List,
  ExternalLink, Maximize2, Download, Check, HelpCircle, AlertCircle, RotateCcw, Search, SlidersHorizontal,
  FolderOpen, Compass, Tag, FileImage, Shield, Store, Wallet, Share2, Info, User
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CustomImageItem } from "../../types";

interface BrandingImagesProps {
  siteLogoUrl?: string;
  siteTitle?: string;
  siteTagline?: string;
  siteCoverUrl?: string;
  showSiteCover?: boolean;
  siteCoverTitle?: string;
  siteCoverSubtitle?: string;
  sellerCoverUrl?: string;
  depositCoverUrl?: string;
  aboutAvatarUrl?: string;
  smmCoverUrl?: string;
  subscriptionsCoverUrl?: string;
  reviewsCoverUrl?: string;
  privacyCoverUrl?: string;
  customImages?: CustomImageItem[];
  onUpdateGlobalSettings: (settingsToUpdate: any) => Promise<void>;
}

// Preset Collection curated for ZEROX Network branding
const UNSPLASH_PRESETS = [
  {
    category: "Cyber & Tech",
    items: [
      { name: "Cyber Neon Grid", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80" },
      { name: "Matrix Code Stream", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80" },
      { name: "Global Fiber Network", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" },
      { name: "Dark Tech Mesh", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" },
    ]
  },
  {
    category: "Gaming & Subscriptions",
    items: [
      { name: "RGB Gaming Station", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80" },
      { name: "Streaming Cinema Glow", url: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1200&q=80" },
      { name: "Digital Game Vault", url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80" },
    ]
  },
  {
    category: "Trust, Reviews & Community",
    items: [
      { name: "Verified Gold Trophy", url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80" },
      { name: "Global Community Network", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" },
      { name: "Star Rating Celebration", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" },
    ]
  },
  {
    category: "Security & Legal Privacy",
    items: [
      { name: "Encrypted Cyber Shield", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80" },
      { name: "Binary Vault Data", url: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80" },
      { name: "Biometric Security Lock", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80" },
    ]
  },
  {
    category: "Logos & Icons",
    items: [
      { name: "Neon Sphere Mark", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80" },
      { name: "Glass Prism Mark", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80" },
      { name: "Cyber Wave Mark", url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=300&q=80" },
    ]
  }
];

export default function BrandingImages({
  siteLogoUrl,
  siteTitle,
  siteTagline,
  siteCoverUrl,
  showSiteCover,
  siteCoverTitle,
  siteCoverSubtitle,
  sellerCoverUrl,
  depositCoverUrl,
  aboutAvatarUrl,
  smmCoverUrl,
  subscriptionsCoverUrl,
  reviewsCoverUrl,
  privacyCoverUrl,
  customImages,
  onUpdateGlobalSettings
}: BrandingImagesProps) {
  // Navigation Section State
  const [activeTab, setActiveTab] = useState<"overview" | "header" | "covers" | "library" | "presets">("overview");

  // Draft States
  const [draftLogoUrl, setDraftLogoUrl] = useState(siteLogoUrl || "");
  const [draftTitle, setDraftTitle] = useState(siteTitle || "ZEROX NETWORK");
  const [draftTagline, setDraftTagline] = useState(siteTagline || "NETWORK");
  const [draftCoverUrl, setDraftCoverUrl] = useState(siteCoverUrl || "");
  const [draftShowCover, setDraftShowCover] = useState(showSiteCover !== undefined ? showSiteCover : true);
  const [draftCoverTitle, setDraftCoverTitle] = useState(siteCoverTitle || "One Platform. Endless Possibilities.");
  const [draftCoverSubtitle, setDraftCoverSubtitle] = useState(siteCoverSubtitle || "Everything you need to connect, automate, and grow your business.");
  const [draftSellerCover, setDraftSellerCover] = useState(sellerCoverUrl || "");
  const [draftDepositCover, setDraftDepositCover] = useState(depositCoverUrl || "");
  const [draftAboutAvatar, setDraftAboutAvatar] = useState(aboutAvatarUrl || "");
  const [draftSmmCover, setDraftSmmCover] = useState(smmCoverUrl || "");
  const [draftSubscriptionsCover, setDraftSubscriptionsCover] = useState(subscriptionsCoverUrl || "");
  const [draftReviewsCover, setDraftReviewsCover] = useState(reviewsCoverUrl || "");
  const [draftPrivacyCover, setDraftPrivacyCover] = useState(privacyCoverUrl || "");
  const [draftCustomImages, setDraftCustomImages] = useState<CustomImageItem[]>(customImages || []);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // New Image Entry Form State
  const [newImgName, setNewImgName] = useState("");
  const [newImgCategory, setNewImgCategory] = useState<"logo" | "cover" | "banner" | "avatar" | "deposit" | "subscriptions" | "reviews" | "privacy" | "legal" | "other">("subscriptions");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgDesc, setNewImgDesc] = useState("");
  const [imgFilterCat, setImgFilterCat] = useState<string>("ALL");
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; category?: string } | null>(null);

  // Last saved ref to prevent overwriting active typing
  const lastSavedRef = useRef({
    siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle,
    sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, subscriptionsCoverUrl, reviewsCoverUrl, privacyCoverUrl, customImages
  });

  // Sync Drafts with Props when Props Change from external sources
  useEffect(() => {
    if (siteLogoUrl !== undefined && siteLogoUrl !== lastSavedRef.current.siteLogoUrl) setDraftLogoUrl(siteLogoUrl);
    if (siteTitle !== undefined && siteTitle !== lastSavedRef.current.siteTitle) setDraftTitle(siteTitle);
    if (siteTagline !== undefined && siteTagline !== lastSavedRef.current.siteTagline) setDraftTagline(siteTagline);
    if (siteCoverUrl !== undefined && siteCoverUrl !== lastSavedRef.current.siteCoverUrl) setDraftCoverUrl(siteCoverUrl);
    if (showSiteCover !== undefined && showSiteCover !== lastSavedRef.current.showSiteCover) setDraftShowCover(showSiteCover);
    if (siteCoverTitle !== undefined && siteCoverTitle !== lastSavedRef.current.siteCoverTitle) setDraftCoverTitle(siteCoverTitle);
    if (siteCoverSubtitle !== undefined && siteCoverSubtitle !== lastSavedRef.current.siteCoverSubtitle) setDraftCoverSubtitle(siteCoverSubtitle);
    if (sellerCoverUrl !== undefined && sellerCoverUrl !== lastSavedRef.current.sellerCoverUrl) setDraftSellerCover(sellerCoverUrl);
    if (depositCoverUrl !== undefined && depositCoverUrl !== lastSavedRef.current.depositCoverUrl) setDraftDepositCover(depositCoverUrl);
    if (aboutAvatarUrl !== undefined && aboutAvatarUrl !== lastSavedRef.current.aboutAvatarUrl) setDraftAboutAvatar(aboutAvatarUrl);
    if (smmCoverUrl !== undefined && smmCoverUrl !== lastSavedRef.current.smmCoverUrl) setDraftSmmCover(smmCoverUrl);
    if (subscriptionsCoverUrl !== undefined && subscriptionsCoverUrl !== lastSavedRef.current.subscriptionsCoverUrl) setDraftSubscriptionsCover(subscriptionsCoverUrl);
    if (reviewsCoverUrl !== undefined && reviewsCoverUrl !== lastSavedRef.current.reviewsCoverUrl) setDraftReviewsCover(reviewsCoverUrl);
    if (privacyCoverUrl !== undefined && privacyCoverUrl !== lastSavedRef.current.privacyCoverUrl) setDraftPrivacyCover(privacyCoverUrl);
    
    if (customImages !== undefined && JSON.stringify(customImages) !== JSON.stringify(lastSavedRef.current.customImages)) {
      setDraftCustomImages(customImages);
    }
  }, [siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, subscriptionsCoverUrl, reviewsCoverUrl, privacyCoverUrl, customImages]);

  // Compute Unsaved Changes State
  const isDirty = useMemo(() => {
    return (
      draftLogoUrl !== (siteLogoUrl || "") ||
      draftTitle !== (siteTitle || "ZEROX NETWORK") ||
      draftTagline !== (siteTagline || "NETWORK") ||
      draftCoverUrl !== (siteCoverUrl || "") ||
      draftShowCover !== (showSiteCover ?? true) ||
      draftCoverTitle !== (siteCoverTitle || "One Platform. Endless Possibilities.") ||
      draftCoverSubtitle !== (siteCoverSubtitle || "Everything you need to connect, automate, and grow your business.") ||
      draftSellerCover !== (sellerCoverUrl || "") ||
      draftDepositCover !== (depositCoverUrl || "") ||
      draftAboutAvatar !== (aboutAvatarUrl || "") ||
      draftSmmCover !== (smmCoverUrl || "") ||
      draftSubscriptionsCover !== (subscriptionsCoverUrl || "") ||
      draftReviewsCover !== (reviewsCoverUrl || "") ||
      draftPrivacyCover !== (privacyCoverUrl || "") ||
      JSON.stringify(draftCustomImages) !== JSON.stringify(customImages || [])
    );
  }, [
    draftLogoUrl, siteLogoUrl, draftTitle, siteTitle, draftTagline, siteTagline,
    draftCoverUrl, siteCoverUrl, draftShowCover, showSiteCover, draftCoverTitle, siteCoverTitle,
    draftCoverSubtitle, siteCoverSubtitle, draftSellerCover, sellerCoverUrl,
    draftDepositCover, depositCoverUrl, draftAboutAvatar, aboutAvatarUrl,
    draftSmmCover, smmCoverUrl, draftSubscriptionsCover, subscriptionsCoverUrl,
    draftReviewsCover, reviewsCoverUrl, draftPrivacyCover, privacyCoverUrl,
    draftCustomImages, customImages
  ]);

  // Real-time Auto Save (Debounced)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (isDirty && !isSavingRef.current) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSaveBranding();
      }, 800);
    }
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [isDirty]);


  const handleResetDrafts = () => {
    setDraftLogoUrl(siteLogoUrl || "");
    setDraftTitle(siteTitle || "ZEROX NETWORK");
    setDraftTagline(siteTagline || "NETWORK");
    setDraftCoverUrl(siteCoverUrl || "");
    setDraftShowCover(showSiteCover !== undefined ? showSiteCover : true);
    setDraftCoverTitle(siteCoverTitle || "One Platform. Endless Possibilities.");
    setDraftCoverSubtitle(siteCoverSubtitle || "Everything you need to connect, automate, and grow your business.");
    setDraftSellerCover(sellerCoverUrl || "");
    setDraftDepositCover(depositCoverUrl || "");
    setDraftAboutAvatar(aboutAvatarUrl || "");
    setDraftSmmCover(smmCoverUrl || "");
    setDraftSubscriptionsCover(subscriptionsCoverUrl || "");
    setDraftReviewsCover(reviewsCoverUrl || "");
    setDraftPrivacyCover(privacyCoverUrl || "");
    setDraftCustomImages(customImages || []);
    toast.success("Draft changes discarded!");
  };

  const handleSaveBranding = async () => {
    if (!onUpdateGlobalSettings || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSavingBranding(true);
    
    lastSavedRef.current = {
      siteLogoUrl: draftLogoUrl,
      siteTitle: draftTitle,
      siteTagline: draftTagline,
      siteCoverUrl: draftCoverUrl,
      showSiteCover: draftShowCover,
      siteCoverTitle: draftCoverTitle,
      siteCoverSubtitle: draftCoverSubtitle,
      sellerCoverUrl: draftSellerCover,
      depositCoverUrl: draftDepositCover,
      aboutAvatarUrl: draftAboutAvatar,
      smmCoverUrl: draftSmmCover,
      subscriptionsCoverUrl: draftSubscriptionsCover,
      reviewsCoverUrl: draftReviewsCover,
      privacyCoverUrl: draftPrivacyCover,
      customImages: draftCustomImages
    };

    try {
      await onUpdateGlobalSettings(lastSavedRef.current);
      // toast.success("Branding updated in real-time!"); // Removed to be less noisy on auto-save
    } catch (err: any) {
      toast.error(err.message || "Failed to update branding settings");
    } finally {
      setIsSavingBranding(false);
      isSavingRef.current = false;
    }
  };

  const handleFileUploadHelper = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image file exceeds 3MB limit for direct upload. Please use a public image URL link for high-res assets.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
      toast.success("Image asset uploaded & attached successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomImage = () => {
    if (!newImgName.trim() || !newImgUrl.trim()) {
      toast.error("Please specify both image title and valid image URL!");
      return;
    }
    const newItem: CustomImageItem = {
      id: "img_" + Date.now(),
      name: newImgName.trim(),
      category: newImgCategory,
      url: newImgUrl.trim(),
      description: newImgDesc.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    setDraftCustomImages([newItem, ...draftCustomImages]);
    setNewImgName("");
    setNewImgUrl("");
    setNewImgDesc("");
    toast.success("Image asset added to media library! Click Save to publish.");
  };

  const handleRemoveCustomImage = (id: string) => {
    setDraftCustomImages(draftCustomImages.filter(img => img.id !== id));
    toast.success("Image removed from library.");
  };

  const handleUpdateCustomImageItem = (id: string, updates: Partial<CustomImageItem>) => {
    setDraftCustomImages(draftCustomImages.map(img => img.id === id ? { ...img, ...updates, updatedAt: new Date().toISOString() } : img));
  };

  // Filtered Library Items
  const filteredLibraryItems = useMemo(() => {
    return draftCustomImages.filter(item => {
      const matchesCat = imgFilterCat === "ALL" || item.category === imgFilterCat;
      const matchesSearch = 
        item.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
        item.category.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(librarySearch.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [draftCustomImages, imgFilterCat, librarySearch]);

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-6 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Web Identity & Universal Asset Manager</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Branding & Media Hub
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
            Customize header brand identity, cover banners for Subscriptions, Customer Reviews, Privacy Policy, Wallet, and SMM portals. Manage custom media assets and apply preset visuals instantly.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <span className="bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-white/20">
            <Sparkles className="w-4 h-4 text-blue-200" />
            Real-Time Auto-Save Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === "overview" 
                ? "bg-blue-600 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("header")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === "header" 
                ? "bg-blue-600 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Header & Logo</span>
          </button>

          <button
            onClick={() => setActiveTab("covers")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === "covers" 
                ? "bg-blue-600 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LucideImage className="w-3.5 h-3.5" />
            <span>Portal Covers</span>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === "library" 
                ? "bg-blue-600 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Media Library ({draftCustomImages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === "presets" 
                ? "bg-blue-600 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Preset Gallery</span>
                    </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Header Brand</span>
                <span className="text-sm sm:text-base font-black text-slate-900 truncate block">{draftTitle || "ZEROX"}</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-6">
            <LucideImage className="w-4 h-4 text-indigo-500" />
            <span>Active Cover Banners Preview</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {/* Subscriptions Banner */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative group h-36 flex flex-col justify-between p-3.5">
              {draftSubscriptionsCover ? (
                <img src={draftSubscriptionsCover} alt="Subscriptions Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 opacity-90" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                  Subscriptions
                </span>
                <button 
                  onClick={() => setLightboxImage({ url: draftSubscriptionsCover || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80", title: "Subscriptions Store Cover Banner" })}
                  className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative z-10">
                  <h4 className="text-xs font-black text-white">Subscriptions Store Cover</h4>
                  <p className="text-[10px] text-slate-300 truncate">Applied on Subscriptions Tab Header</p>
                </div>
              </div>

              {/* Reviews Banner */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative group h-36 flex flex-col justify-between p-3.5">
                {draftReviewsCover ? (
                  <img src={draftReviewsCover} alt="Reviews Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                    Customer Reviews
                  </span>
                  <button 
                    onClick={() => setLightboxImage({ url: draftReviewsCover || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80", title: "Customer Reviews Cover Banner" })}
                    className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative z-10">
                  <h4 className="text-xs font-black text-white">Customer Reviews Cover</h4>
                  <p className="text-[10px] text-slate-300 truncate">Applied on Reviews Portal Header</p>
                </div>
              </div>

              {/* Privacy Policy Banner */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative group h-36 flex flex-col justify-between p-3.5">
                {draftPrivacyCover ? (
                  <img src={draftPrivacyCover} alt="Privacy Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                    Privacy Policy
                  </span>
                  <button 
                    onClick={() => setLightboxImage({ url: draftPrivacyCover || "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80", title: "Privacy Policy Cover Banner" })}
                    className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative z-10">
                  <h4 className="text-xs font-black text-white">Privacy & Legal Banner</h4>
                  <p className="text-[10px] text-slate-300 truncate">Applied on Privacy Policy Portal Header</p>
                </div>
              </div>

              {/* Deposit Gateway Cover */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative group h-36 flex flex-col justify-between p-3.5">
                {draftDepositCover ? (
                  <img src={draftDepositCover} alt="Deposit Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                    Cash Deposit
                  </span>
                </div>

                <div className="relative z-10">
                  <h4 className="text-xs font-black text-white">Cash Deposit Topup Banner</h4>
                  <p className="text-[10px] text-slate-300 truncate">Applied on Wallet & Deposit modal</p>
                </div>
              </div>

              {/* SMM Store Banner */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative group h-36 flex flex-col justify-between p-3.5">
                {draftSmmCover ? (
                  <img src={draftSmmCover} alt="SMM Banner" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-400/30">
                    SMM Social Hub
                  </span>
                </div>

                <div className="relative z-10">
                  <h4 className="text-xs font-black text-white">SMM Social Store Cover</h4>
                  <p className="text-[10px] text-slate-300 truncate">Applied on SMM Panel services portal</p>
                </div>
              </div>

            </div>
          </div>
      )}

      {/* TAB 2: HEADER BRAND & LOGO */}
      {activeTab === "header" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                <span>Header Brand Identity & Logo Settings</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure top navigation logo, site name, and tagline visible to all web visitors
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              
              {/* Logo URL input with upload */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Website Header Logo Image Asset
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={draftLogoUrl}
                    onChange={(e) => setDraftLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png (Leave empty for default SVG icon)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200 shrink-0">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadHelper(e, setDraftLogoUrl)}
                    />
                  </label>
                </div>
                {draftLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setDraftLogoUrl("")}
                    className="text-[11px] font-bold text-red-600 hover:underline inline-block cursor-pointer"
                  >
                    Reset to default vector logo
                  </button>
                )}
              </div>

              {/* Title and Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Website Main Brand Title
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="ZEROX NETWORK"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Tagline / Subtitle Text
                  </label>
                  <input
                    type="text"
                    value={draftTagline}
                    onChange={(e) => setDraftTagline(e.target.value)}
                    placeholder="NETWORK"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Select Quick Logo Preset:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftLogoUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80")}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                    <span>Neon Sphere</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftLogoUrl("https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80")}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                    <span>Glass Prism</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftLogoUrl("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=150&q=80")}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Cyber Wave</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sandbox Live Header Bar Simulation */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">
                  Live Navigation Bar Simulation
                </span>

                {/* Light Mode Simulation */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 block">Light Theme Navbar Preview:</span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {draftLogoUrl ? (
                        <img src={draftLogoUrl} alt="Logo Preview" className="w-9 h-9 object-contain rounded-xl border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-2xs">
                          ZX
                        </div>
                      )}
                      <div className="flex flex-col leading-none">
                        <span className="text-base font-black tracking-tighter text-slate-900 uppercase">
                          {draftTitle || "ZEROX NETWORK"}
                        </span>
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono mt-0.5">
                          {draftTagline || "NETWORK"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Live Sync
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dark Mode Simulation */}
                <div className="space-y-3 pt-4">
                  <span className="text-[11px] font-bold text-slate-500 block">Dark Theme Navbar Preview:</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      {draftLogoUrl ? (
                        <img src={draftLogoUrl} alt="Logo Preview" className="w-9 h-9 object-contain rounded-xl border border-slate-700" />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-2xs">
                          ZX
                        </div>
                      )}
                      <div className="flex flex-col leading-none">
                        <span className="text-base font-black tracking-tighter text-white uppercase">
                          {draftTitle || "ZEROX NETWORK"}
                        </span>
                        <span className="text-[9px] font-black tracking-widest text-slate-400 font-mono mt-0.5">
                          {draftTagline || "NETWORK"}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-400/30">
                      Dark Bar
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic pt-2">
                Note: Changes to title and logo affect the top website banner immediately upon clicking Save.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PORTAL COVERS */}
      {activeTab === "covers" && (
        <div className="space-y-6">
          
          {/* Main Dashboard Hero Section Settings */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Main Website Dashboard Hero Banner</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Controls the prominent welcome banner displayed at the top of the main store page
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 px-2">Show Dashboard Banner:</span>
                <button
                  type="button"
                  onClick={() => setDraftShowCover(!draftShowCover)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    draftShowCover ? "bg-emerald-600 text-white shadow-2xs" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {draftShowCover ? "ENABLED" : "DISABLED"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Banner Background Image URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={draftCoverUrl}
                      onChange={(e) => setDraftCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-slate-200">
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadHelper(e, setDraftCoverUrl)}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Banner Headline Title
                  </label>
                  <input
                    type="text"
                    value={draftCoverTitle}
                    onChange={(e) => setDraftCoverTitle(e.target.value)}
                    placeholder="One Platform. Endless Possibilities."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Banner Subtitle / Description
                  </label>
                  <input
                    type="text"
                    value={draftCoverSubtitle}
                    onChange={(e) => setDraftCoverSubtitle(e.target.value)}
                    placeholder="Everything you need to connect, automate, and grow..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md h-52 sm:h-auto min-h-[180px] flex items-end p-5 bg-slate-900 group">
                {draftCoverUrl ? (
                  <img src={draftCoverUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 opacity-90" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest bg-blue-500/20 px-2.5 py-0.5 rounded border border-blue-400/30">
                    Live Hero Banner Preview
                  </span>
                  <h4 className="text-base font-black text-white leading-tight">
                    {draftCoverTitle || "One Platform. Endless Possibilities."}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {draftCoverSubtitle || "Everything you need to connect..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Portal Section Covers Grid */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Dedicated Portal & Section Cover Headers</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Set customized header cover backgrounds for Subscriptions, Reviews, Privacy Policy, SMM, Wallet, and Seller portals
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Digital Subscriptions Cover Card */}
              <div className="bg-slate-50 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Digital Subscriptions Store</h4>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded">
                    Subscriptions
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">Cover Banner URL</label>
                  <input
                    type="text"
                    value={draftSubscriptionsCover}
                    onChange={(e) => setDraftSubscriptionsCover(e.target.value)}
                    placeholder="Subscriptions Banner Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-300">
                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadHelper(e, setDraftSubscriptionsCover)}
                      />
                    </label>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDraftSubscriptionsCover("https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Gaming
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftSubscriptionsCover("https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Streaming
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 group">
                  {draftSubscriptionsCover ? (
                    <img src={draftSubscriptionsCover} alt="Subscriptions Banner Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center text-white text-xs font-bold p-3 text-center">
                      Default Gradient Banner
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Reviews Cover Card */}
              <div className="bg-slate-50 border border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <Star className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Customer Reviews Portal</h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                    Reviews
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">Cover Banner URL</label>
                  <input
                    type="text"
                    value={draftReviewsCover}
                    onChange={(e) => setDraftReviewsCover(e.target.value)}
                    placeholder="Reviews Cover Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-300">
                      <Upload className="h-3.5 w-3.5 text-amber-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadHelper(e, setDraftReviewsCover)}
                      />
                    </label>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDraftReviewsCover("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-amber-50 hover:text-amber-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Trust Gold
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftReviewsCover("https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-amber-50 hover:text-amber-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Community
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 group">
                  {draftReviewsCover ? (
                    <img src={draftReviewsCover} alt="Reviews Banner Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 flex items-center justify-center text-white text-xs font-bold p-3 text-center">
                      Default Verified Banner
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Policy Cover Card */}
              <div className="bg-slate-50 border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Privacy Policy & Terms</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Privacy
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">Cover Banner URL</label>
                  <input
                    type="text"
                    value={draftPrivacyCover}
                    onChange={(e) => setDraftPrivacyCover(e.target.value)}
                    placeholder="Privacy Policy Banner Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-300">
                      <Upload className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUploadHelper(e, setDraftPrivacyCover)}
                      />
                    </label>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDraftPrivacyCover("https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Cyber Lock
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftPrivacyCover("https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=800&q=80")}
                        className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 px-2 py-1 rounded cursor-pointer"
                      >
                        Data Vault
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 group">
                  {draftPrivacyCover ? (
                    <img src={draftPrivacyCover} alt="Privacy Banner Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 flex items-center justify-center text-white text-xs font-bold p-3 text-center">
                      Default Shield Banner
                    </div>
                  )}
                </div>
              </div>

              {/* Deposit Gateway Cover Card */}
              <div className="bg-slate-50 border border-blue-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Cash Deposit Topup Banner</h4>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                    Wallet
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={draftDepositCover}
                    onChange={(e) => setDraftDepositCover(e.target.value)}
                    placeholder="Deposit Banner Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-slate-300 w-full">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Upload Deposit Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadHelper(e, setDraftDepositCover)}
                    />
                  </label>
                </div>

                {draftDepositCover && (
                  <div className="h-24 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900">
                    <img src={draftDepositCover} alt="Deposit Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* SMM Store Cover Card */}
              <div className="bg-slate-50 border border-purple-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">SMM Panel Store Cover</h4>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded">
                    SMM Store
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={draftSmmCover}
                    onChange={(e) => setDraftSmmCover(e.target.value)}
                    placeholder="SMM Cover Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-slate-300 w-full">
                    <Upload className="h-3.5 w-3.5 text-purple-600" />
                    <span>Upload SMM Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadHelper(e, setDraftSmmCover)}
                    />
                  </label>
                </div>

                {draftSmmCover && (
                  <div className="h-24 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900">
                    <img src={draftSmmCover} alt="SMM Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Founder Avatar Photo */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-slate-900">Founder Avatar Photo</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded">
                    About Portal
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={draftAboutAvatar}
                    onChange={(e) => setDraftAboutAvatar(e.target.value)}
                    placeholder="Founder / Developer Profile Avatar Image URL"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />

                  <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-slate-300 w-full">
                    <Upload className="h-3.5 w-3.5 text-slate-700" />
                    <span>Upload Avatar</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadHelper(e, setDraftAboutAvatar)}
                    />
                  </label>
                </div>

                {draftAboutAvatar && (
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 relative mx-auto shadow-sm">
                    <img src={draftAboutAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNIVERSAL MEDIA LIBRARY */}
      {activeTab === "library" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <span>Custom Media Assets & Saved Links</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Save external URLs or uploaded images to quickly apply them as portal cover banners or header logos
              </p>
            </div>

            <span className="text-xs font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {draftCustomImages.length} Assets Stored
            </span>
          </div>

          {/* Form: Add New Media Link */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Add Custom Image Asset
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Asset Name / Title</label>
                <input
                  type="text"
                  value={newImgName}
                  onChange={(e) => setNewImgName(e.target.value)}
                  placeholder="e.g. Subscriptions Cyber Banner"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Target Category</label>
                <select
                  value={newImgCategory}
                  onChange={(e) => setNewImgCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none font-bold cursor-pointer"
                >
                  <option value="subscriptions">Subscriptions Portal</option>
                  <option value="reviews">Reviews Portal</option>
                  <option value="privacy">Privacy & Terms</option>
                  <option value="legal">Legal & Compliance</option>
                  <option value="logo">Header Logo</option>
                  <option value="cover">Hero Cover</option>
                  <option value="banner">Banner Asset</option>
                  <option value="avatar">Avatar / Profile</option>
                  <option value="deposit">Deposit Gateway</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newImgDesc}
                  onChange={(e) => setNewImgDesc(e.target.value)}
                  placeholder="Short note or source link"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700">Image URL Link or Local File Upload</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or click Upload"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="flex gap-2 shrink-0">
                  <label className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUploadHelper(e, setNewImgUrl)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomImage}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save Asset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search, Filter Category and View Mode Controls */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search media items..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* View Toggle and Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  value={imgFilterCat}
                  onChange={(e) => setImgFilterCat(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="reviews">Reviews</option>
                  <option value="privacy">Privacy</option>
                  <option value="legal">Legal</option>
                  <option value="logo">Logo</option>
                  <option value="cover">Cover</option>
                  <option value="banner">Banner</option>
                  <option value="avatar">Avatar</option>
                  <option value="deposit">Deposit</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Asset Items Display */}
            {filteredLibraryItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <LucideImage className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No Image Assets Found in Library</p>
                <p className="text-[11px] text-slate-400">Add custom URLs above or browse presets in the Preset Gallery tab.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLibraryItems.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 transition shadow-2xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">{item.name}</span>
                        <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md shrink-0">
                          {item.category}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-500 italic truncate">{item.description}</p>
                      )}

                      <div className="h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative group">
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: item.url, title: item.name, category: item.category })}
                          className="absolute top-2 right-2 p-1.5 bg-slate-950/70 text-white rounded-lg hover:bg-slate-950 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold uppercase text-slate-400">Image Asset URL</label>
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => handleUpdateCustomImageItem(item.id, { url: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                        />
                      </div>

                      {/* Quick Apply Actions */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">1-Click Apply To:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftSubscriptionsCover(item.url);
                              toast.success("Applied to Subscriptions Banner!");
                            }}
                            className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            + Subscriptions
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftReviewsCover(item.url);
                              toast.success("Applied to Customer Reviews Banner!");
                            }}
                            className="text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            + Reviews
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftPrivacyCover(item.url);
                              toast.success("Applied to Privacy Policy Banner!");
                            }}
                            className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            + Privacy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftLogoUrl(item.url);
                              toast.success("Applied to Header Logo!");
                            }}
                            className="text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            + Logo
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          toast.success("Image URL copied!");
                        }}
                        className="text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveCustomImage(item.id)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {filteredLibraryItems.map((item) => (
                  <div key={item.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <img src={item.url} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900">{item.name}</h4>
                          <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">{item.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          toast.success("Copied link!");
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Copy Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomImage(item.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Remove Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PRESET GALLERY */}
      {activeTab === "presets" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Curated High-Res Preset Image Gallery</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instant 1-click preset visuals categorized for Subscriptions, Reviews, Privacy Policy, Cyber themes, and Logos
            </p>
          </div>

          <div className="space-y-8">
            {UNSPLASH_PRESETS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>{group.category}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.items.map((preset, pIdx) => (
                    <div key={pIdx} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2 hover:border-slate-300 transition shadow-2xs flex flex-col justify-between">
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900 truncate mb-1.5">{preset.name}</h5>
                        <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative group">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url: preset.url, title: preset.name, category: group.category })}
                            className="absolute top-2 right-2 p-1.5 bg-slate-950/70 text-white rounded-lg hover:bg-slate-950 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">1-Click Apply Preset:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftSubscriptionsCover(preset.url);
                              toast.success(`Set ${preset.name} as Subscriptions Cover!`);
                            }}
                            className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded transition cursor-pointer border border-indigo-200"
                          >
                            + Subscriptions
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftReviewsCover(preset.url);
                              toast.success(`Set ${preset.name} as Reviews Cover!`);
                            }}
                            className="text-[9px] font-extrabold bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-0.5 rounded transition cursor-pointer border border-amber-200"
                          >
                            + Reviews
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftPrivacyCover(preset.url);
                              toast.success(`Set ${preset.name} as Privacy Cover!`);
                            }}
                            className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded transition cursor-pointer border border-emerald-200"
                          >
                            + Privacy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDraftCoverUrl(preset.url);
                              toast.success(`Set ${preset.name} as Hero Cover!`);
                            }}
                            className="text-[9px] font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded transition cursor-pointer border border-blue-200"
                          >
                            + Hero Cover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 relative border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{lightboxImage.title}</h3>
                {lightboxImage.category && (
                  <span className="text-[10px] font-extrabold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {lightboxImage.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-[60vh] flex items-center justify-center">
              <img src={lightboxImage.url} alt={lightboxImage.title} className="max-h-[60vh] w-auto object-contain" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <input
                type="text"
                readOnly
                value={lightboxImage.url}
                className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lightboxImage.url);
                    toast.success("Image URL copied!");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
