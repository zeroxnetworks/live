import React, { useState, useEffect } from "react";
import { 
  MessageCircle, Sparkles, Bell, Calendar, ChevronRight, ChevronLeft,
  ExternalLink, ArrowUpRight, Search, Zap, Layers, RefreshCw,
  Clock, ShieldCheck, Megaphone, CheckCircle2, ChevronDown, Play, X
} from "lucide-react";
import { Announcement } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { sanitizeUrl } from "../lib/security";

interface PlatformUpdatesProps {
  announcements: Announcement[];
}

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.substring(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2];
      } else {
        videoId = parsed.searchParams.get("v") || "";
      }
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
};

const getYoutubeThumbnailUrl = (url: string) => {
  if (!url) return null;
  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.substring(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2];
      } else {
        videoId = parsed.searchParams.get("v") || "";
      }
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 120 : -120,
    opacity: 0,
    scale: 0.98,
  }),
};

export default function PlatformUpdates({ announcements }: PlatformUpdatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "new" | "system" | "maintenance" | "offer">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = slide left (next), -1 = slide right (prev)
  const [isPaused, setIsPaused] = useState(false);

  const activeAnnouncements = announcements.filter(a => a.isActive);

  // Auto-categorize announcements based on keywords for a more dynamic filter system
  const getCategory = (ann: Announcement): "new" | "system" | "maintenance" | "offer" => {
    if (ann.isOffer) return "offer";
    const title = ann.title.toLowerCase();
    const content = ann.content.toLowerCase();
    if (title.includes("maintenance") || content.includes("maintenance") || title.includes("down") || title.includes("offline")) {
      return "maintenance";
    }
    if (title.includes("system") || title.includes("api") || title.includes("server") || title.includes("database") || title.includes("security")) {
      return "system";
    }
    return "new";
  };

  const filtered = activeAnnouncements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ann.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    return getCategory(ann) === activeCategory && matchesSearch;
  });

  // Ensure index remains in bounds when filters change
  useEffect(() => {
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(0);
    }
  }, [filtered.length, currentIndex]);

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (filtered.length <= 1 || isPaused || expandedId !== null) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % filtered.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [filtered.length, isPaused, expandedId]);

  const handleNext = () => {
    if (filtered.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    if (filtered.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  const safeIndex = currentIndex < filtered.length ? currentIndex : 0;
  const currentAnn = filtered[safeIndex];

  return (
    <div id="platform-updates-footer" className="mt-16 pt-10 border-t border-slate-200/80 space-y-6 text-slate-800">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Megaphone className="w-4 h-4 text-indigo-500 drop-shadow-[0_0_6px_rgba(99,102,241,0.6)] animate-pulse" />
            </span>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
              Platform Ledger
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Platform Updates
          </h3>
          <p className="text-xs text-slate-500 font-light max-w-xl leading-relaxed">
            Stay updated with the latest improvements, system changes, and new features.
          </p>
        </div>

        {/* Dynamic Navigation & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              placeholder="Search announcements..."
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 transition"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
            {(["all", "offer", "new", "system", "maintenance"] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer ${
                  activeCategory === cat 
                    ? "bg-white text-indigo-700 shadow-sm font-extrabold" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Single Card Carousel Container */}
      <div 
        className="max-w-[460px] mx-auto pt-2 pb-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
          >
            <Bell className="h-8 w-8 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">No active bulletins match your search</p>
              <p className="text-[10px] text-slate-400 font-light max-w-xs mx-auto">
                Try adjusting your filter settings or search terms to inspect other platform records.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Active Card Slider Frame */}
            <div className="relative w-full overflow-hidden min-h-[220px] py-1 px-1">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                {currentAnn && (
                  <motion.div
                    key={currentAnn.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 280, damping: 28 },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, { offset }) => {
                      if (offset.x < -40) {
                        handleNext();
                      } else if (offset.x > 40) {
                        handlePrev();
                      }
                    }}
                    className="w-full relative group cursor-grab active:cursor-grabbing"
                  >
                    {/* Outer Frame with Subtle Traveling Neon Light Border */}
                    <div className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                      {/* Traveling Neon Light Beam (Subtle Conic Glow) */}
                      <div 
                        className="absolute -inset-[150%] animate-[spin_5s_linear_infinite] pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                        style={{
                          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.7) 310deg, rgba(99, 102, 241, 0.8) 335deg, rgba(168, 85, 247, 0.7) 350deg, transparent 360deg)'
                        }}
                      />
                      
                      {/* Soft Ambient Glow Background */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-purple-500/5 pointer-events-none" />

                      {/* Card Inner Content Body */}
                      <div className={`relative bg-white rounded-[14px] p-5 flex flex-col h-full ${
                        expandedId === currentAnn.id ? "border border-indigo-200" : ""
                      }`}>
                        {/* Visual Accent Top Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/30 via-indigo-500/40 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-[14px]" />

                        {/* Header Image or Video Thumbnail if Present */}
                        {(currentAnn.imageUrl || currentAnn.youtubeUrl) && (
                          <div className="w-full h-40 mb-4 rounded-xl overflow-hidden shrink-0 border border-slate-100/50 relative group/media">
                            {currentAnn.youtubeUrl ? (
                              <>
                                <img 
                                  src={currentAnn.imageUrl || getYoutubeThumbnailUrl(currentAnn.youtubeUrl) || ""} 
                                  alt={currentAnn.title} 
                                  className="w-full h-full object-cover group-hover/media:scale-[1.02] transition-transform duration-500" 
                                  referrerPolicy="no-referrer" 
                                />
                                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center transition-colors group-hover/media:bg-slate-900/40">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPlayingVideoUrl(getYoutubeEmbedUrl(currentAnn.youtubeUrl!));
                                    }}
                                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-red-600 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                  >
                                    <Play className="w-5 h-5 ml-1 fill-current" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <img 
                                src={currentAnn.imageUrl} 
                                alt={currentAnn.title} 
                                className="w-full h-full object-cover group-hover/media:scale-[1.02] transition-transform duration-500" 
                                referrerPolicy="no-referrer" 
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
                          </div>
                        )}

                        {/* Header tags & timestamps */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {(() => {
                            const cat = getCategory(currentAnn);
                            const isExpired = currentAnn.isOffer && currentAnn.offerEndTime && new Date(currentAnn.offerEndTime).getTime() < Date.now();
                            const endsInText = currentAnn.isOffer && currentAnn.offerEndTime && !isExpired 
                              ? `Ends ${new Date(currentAnn.offerEndTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                              : null;
                            const formattedDate = currentAnn.createdAt 
                              ? new Date(currentAnn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Active bulletin";

                            return (
                              <>
                                <span className={`text-[8.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide ${
                                  cat === "offer" ? "bg-indigo-600 text-white border-indigo-700 shadow-sm animate-pulse-slow" :
                                  cat === "maintenance" ? "bg-amber-50 text-amber-700 border-amber-200/40" :
                                  cat === "system" ? "bg-indigo-50 text-indigo-700 border-indigo-200/40" :
                                  "bg-emerald-50 text-emerald-700 border-emerald-200/40"
                                }`}>
                                  {cat}
                                </span>
                                
                                {endsInText ? (
                                  <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {endsInText}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 font-light">
                                    <Calendar className="w-3 h-3 text-slate-300" />
                                    {formattedDate}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Main text content */}
                        <div className="space-y-2 flex-grow">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                            {currentAnn.title}
                          </h4>
                          
                          <p className={`text-xs text-slate-500 leading-relaxed font-light ${
                            expandedId === currentAnn.id ? "whitespace-pre-wrap" : "line-clamp-3"
                          }`}>
                            {currentAnn.content}
                          </p>
                        </div>

                        {/* Expand / Collapse trigger if text is long */}
                        {currentAnn.content.length > 130 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === currentAnn.id ? null : currentAnn.id);
                            }}
                            className="mt-3.5 text-slate-400 hover:text-indigo-600 transition flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none self-start"
                          >
                            <span>{expandedId === currentAnn.id ? "Collapse Detail" : "Expand Detail"}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedId === currentAnn.id ? "rotate-180 text-indigo-500" : ""}`} />
                          </button>
                        )}

                        {/* Attachment links */}
                        {currentAnn.linkUrl && (
                          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <a 
                              href={sanitizeUrl(currentAnn.linkUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group/link"
                            >
                              <span>Inspect External Resource</span>
                              <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Carousel Navigation Controls & Indicator Dots */}
            {filtered.length > 1 && (
              <div className="flex items-center justify-center gap-3 mt-3 pt-1">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition cursor-pointer"
                  title="Previous Announcement"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="flex items-center gap-1.5 px-3">
                  {filtered.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDirection(idx > safeIndex ? 1 : -1);
                        setCurrentIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === safeIndex 
                          ? "w-6 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 shadow-sm" 
                          : "w-2 bg-slate-200 hover:bg-slate-300"
                      }`}
                      title={`Go to announcement ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:text-indigo-600 text-slate-500 flex items-center justify-center transition cursor-pointer"
                  title="Next Announcement"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
            onClick={() => setPlayingVideoUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video"
            >
              <button
                onClick={() => setPlayingVideoUrl(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-[110]"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe
                src={playingVideoUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full absolute inset-0"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
