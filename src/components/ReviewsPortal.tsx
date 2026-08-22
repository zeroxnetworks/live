import React, { useState, useEffect } from "react";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  X, 
  CornerDownRight, 
  User, 
  Send,
  Award,
  AlertCircle,
  Download,
  Printer,
  Check
} from "lucide-react";
import { ReviewItem, UserAccount, PrivacyPolicyData } from "../types";
import { DEFAULT_REVIEWS, DEFAULT_PRIVACY_POLICY } from "../lib/reviewsAndPolicyStore";
import { collection, onSnapshot, addDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { generatePolicyAndReviewsPDF } from "../lib/pdfGenerator";
import { sanitizeUrl, isSafeUrl, sanitizeInput } from "../lib/security";

interface ReviewsPortalProps {
  currentUser?: UserAccount | null;
  onNavigateToTab?: (tab: any) => void;
  coverUrl?: string;
}

export default function ReviewsPortal({ currentUser, onNavigateToTab, coverUrl }: ReviewsPortalProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [policyData, setPolicyData] = useState<PrivacyPolicyData>(DEFAULT_PRIVACY_POLICY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | "All">("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState<boolean>(false);

  // New review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newCategory, setNewCategory] = useState<ReviewItem["category"]>("SMS Activations");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newComment, setNewComment] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  // Helpful click tracker in localStorage
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  // Lightbox image preview modal state
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [customUsername, setCustomUsername] = useState<string>("");
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>("");
  const [customProofImageUrl, setCustomProofImageUrl] = useState<string>("");

  useEffect(() => {
    // Load local helpful state
    try {
      const saved = localStorage.getItem("zerox_helpful_reviews");
      if (saved) setHelpfulClicked(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading helpful states", e);
    }

    // Subscribe to Privacy Policy settings for PDF generator
    try {
      onSnapshot(doc(db, "settings", "privacy_policy"), (snap) => {
        if (snap.exists()) setPolicyData(snap.data() as PrivacyPolicyData);
      });
    } catch (e) {}

    // Subscribe to Firestore 'reviews' collection
    let unsubscribe = () => {};
    try {
      const reviewsRef = collection(db, "reviews");
      unsubscribe = onSnapshot(reviewsRef, async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed default reviews into Firestore so Firestore is the single source of truth
          try {
            const batchPromises = DEFAULT_REVIEWS.map(rev => setDoc(doc(db, "reviews", rev.id), rev, { merge: true }));
            await Promise.all(batchPromises);
          } catch (e) {
            console.error("Error seeding default reviews:", e);
          }
          setReviews(DEFAULT_REVIEWS);
        } else {
          const fetched: ReviewItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Partial<ReviewItem>;
            let avatar = data.userAvatar;
            if (!avatar || avatar.includes("unsplash.com")) {
              avatar = "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png";
            }
            fetched.push({ 
              id: docSnap.id, 
              status: data.status || "APPROVED", 
              ...data, 
              userAvatar: avatar 
            } as ReviewItem);
          });
          fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setReviews(fetched);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn("Firestore reviews sync error:", err);
        setIsLoading(false);
      });
    } catch (e) {
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const loadDefaultReviews = () => {
    setReviews(DEFAULT_REVIEWS);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePolicyAndReviewsPDF(policyData, reviews);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Update state when reviews change
  const updateLocalCache = (newReviews: ReviewItem[]) => {
    setReviews(newReviews);
  };

  // Filter approved reviews for users (treat status omitted as APPROVED)
  const approvedReviews = reviews.filter(r => !r.status || (r.status as string) === "APPROVED" || (r.status as string) === "approved");

  // Calculate statistics
  const totalApproved = approvedReviews.length;
  const avgRating = totalApproved > 0 
    ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / totalApproved).toFixed(1)
    : "5.0";

  const starCounts = {
    5: approvedReviews.filter(r => r.rating === 5).length,
    4: approvedReviews.filter(r => r.rating === 4).length,
    3: approvedReviews.filter(r => r.rating === 3).length,
    2: approvedReviews.filter(r => r.rating === 2).length,
    1: approvedReviews.filter(r => r.rating === 1).length,
  };

  // Filtered reviews list
  const filteredReviews = approvedReviews.filter(review => {
    const matchesCategory = selectedCategory === "All" || review.category === selectedCategory;
    const matchesRating = selectedRatingFilter === "All" || review.rating === selectedRatingFilter;
    const matchesSearch = searchQuery.trim() === "" || 
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesRating && matchesSearch;
  });

  const handleHelpfulClick = async (reviewId: string) => {
    if (helpfulClicked[reviewId]) return;

    const newHelpful = { ...helpfulClicked, [reviewId]: true };
    setHelpfulClicked(newHelpful);
    localStorage.setItem("zerox_helpful_reviews", JSON.stringify(newHelpful));

    const updated = reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, helpfulCount: (r.helpfulCount || 0) + 1 };
      }
      return r;
    });
    updateLocalCache(updated);

    try {
      const target = reviews.find(r => r.id === reviewId);
      if (target) {
        await updateDoc(doc(db, "reviews", reviewId), {
          helpfulCount: (target.helpfulCount || 0) + 1
        });
      }
    } catch (e) {
      console.warn("Firestore helpful update skipped", e);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newTitle.trim()) {
      setFormError("Please enter a title for your review.");
      return;
    }

    if (!newComment.trim() || newComment.trim().length < 10) {
      setFormError("Please write at least 10 characters in your review comment.");
      return;
    }

    if (customAvatarUrl.trim() && !isSafeUrl(customAvatarUrl)) {
      setFormError("The avatar URL contains an unsafe protocol or format.");
      return;
    }

    if (customProofImageUrl.trim() && !isSafeUrl(customProofImageUrl)) {
      setFormError("The screenshot image URL contains an unsafe protocol or format.");
      return;
    }

    setIsSubmitting(true);

    const cleanAvatar = customAvatarUrl.trim() ? sanitizeUrl(customAvatarUrl) : (currentUser?.avatarUrl || "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png");
    const cleanProof = customProofImageUrl.trim() ? sanitizeUrl(customProofImageUrl) : "";

    const payload = {
      rating: newRating,
      category: newCategory,
      title: sanitizeInput(newTitle.trim()),
      comment: sanitizeInput(newComment.trim()),
      username: sanitizeInput(customUsername.trim()) || currentUser?.username || "Verified Customer",
      userId: currentUser?.id || `anon-${Math.floor(Math.random() * 10000)}`,
      userEmail: currentUser?.email || "",
      userAvatar: cleanAvatar,
      imageUrl: cleanProof
    };

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save review to database.");
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        setNewTitle("");
        setNewComment("");
        setNewRating(5);
        setCustomUsername("");
        setCustomAvatarUrl("");
        setCustomProofImageUrl("");
      }, 1800);

    } catch (err: any) {
      console.error("Review submission error:", err);
      setIsSubmitting(false);
      setFormError(err.message || "Failed to submit review. Please check your connection and try again.");
    }
  };

  const categoriesList = [
    "All",
    "SMS Activations",
    "SMM Services",
    "Digital Subscriptions",
    "Wallet & Deposits",
    "Customer Support",
    "General Platform"
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header Banner */}
      <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs relative overflow-hidden ${coverUrl ? "text-white" : ""}`}>
        {coverUrl && (
          <>
            <img src={coverUrl} alt="Reviews Cover" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px]"></div>
          </>
        )}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${coverUrl ? "bg-white/20 border border-white/30 text-white" : "bg-blue-50 border border-blue-200/60 text-[#00AEEF]"}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Customer Feedback</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${coverUrl ? "text-white" : "text-slate-900"}`}>
              Customer Reviews & Ratings
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${coverUrl ? "text-slate-200" : "text-slate-500"}`}>
              Explore authentic 5-star ratings and experiences regarding Virtual SMS OTPs, SMM panel, subscriptions, and wallet services.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setShowLoginRequiredModal(true);
                } else {
                  setShowSubmitModal(true);
                }
              }}
              className="flex items-center gap-1.5 bg-[#00AEEF] hover:bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>

        </div>
      </div>

      {/* Ratings Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
        
        {/* Left Score Summary */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200/60 rounded-xl text-center space-y-1.5">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">{avgRating}</span>
          
          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-5 h-5 fill-amber-400 text-amber-400 ${
                  Number(avgRating) >= star ? "fill-amber-400" : "fill-slate-200 text-slate-200"
                }`} 
              />
            ))}
          </div>

          <p className="text-xs font-bold text-slate-500 pt-0.5">
            Based on <span className="text-slate-800 font-extrabold">{totalApproved}</span> verified reviews
          </p>

          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Authentic Customer Ratings</span>
          </div>
        </div>

        {/* Right Star Distribution Breakdown */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2 px-1 sm:px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
            Rating Breakdown
          </h3>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = starCounts[star as keyof typeof starCounts];
            const percentage = totalApproved > 0 ? Math.round((count / totalApproved) * 100) : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRatingFilter(selectedRatingFilter === star ? "All" : star)}
                className={`w-full flex items-center gap-3 group text-left transition p-1 rounded-lg cursor-pointer ${
                  selectedRatingFilter === star ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1 min-w-[50px] text-xs font-bold text-slate-700">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                </div>

                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="min-w-[60px] text-right text-[11px] font-semibold text-slate-500">
                  <span>{count} ({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition shadow-2xs"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Active Filter Indicators */}
        {(selectedRatingFilter !== "All" || searchQuery.trim() !== "" || selectedCategory !== "All") && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
            <span className="font-bold">Active Filters:</span>
            {selectedCategory !== "All" && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-200 text-[11px] flex items-center gap-1">
                {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory("All")} className="hover:text-blue-900">✕</button>
              </span>
            )}
            {selectedRatingFilter !== "All" && (
              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold border border-amber-200 text-[11px] flex items-center gap-1">
                {selectedRatingFilter} Stars
                <button type="button" onClick={() => setSelectedRatingFilter("All")} className="hover:text-amber-900">✕</button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedRatingFilter("All");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-red-600 hover:underline ml-1"
            >
              Clear Filters
            </button>
          </div>
        )}

      </div>

      {/* Reviews Cards List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Reviews Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No customer reviews match your filter. Be the first to share your experience!
            </p>
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setShowLoginRequiredModal(true);
                } else {
                  setShowSubmitModal(true);
                }
              }}
              className="inline-flex items-center gap-1.5 bg-[#00AEEF] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-blue-600 transition shadow-xs mt-1 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div 
              key={review.id}
              className="bg-white border border-slate-200/80 hover:border-slate-300 transition-all rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs"
            >
              
              {/* Review Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                
                {/* Author Info */}
                <div className="flex items-center gap-2.5">
                  <div 
                    className="relative shrink-0 cursor-pointer group"
                    onClick={() => {
                      if (review.userAvatar) setSelectedImageModal(review.userAvatar);
                    }}
                    title={review.userAvatar ? "Click to view full photo" : review.username}
                  >
                    {review.userAvatar ? (
                      <img 
                        src={review.userAvatar} 
                        alt={review.username}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white ring-2 ring-slate-200/90 shadow-2xs group-hover:ring-[#00AEEF] group-hover:scale-105 transition-all duration-200"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs ${review.userAvatar ? 'hidden' : ''}`}>
                      {review.username ? review.username.charAt(0).toUpperCase() : <User className="w-5 h-5 text-slate-500" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{review.username}</h4>
                      {review.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0" title="Verified Customer Purchase">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Rating Stars & Category Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                    {review.category}
                  </span>

                  <div className="flex items-center gap-1 text-amber-400 bg-amber-50/60 px-2.5 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3.5 h-3.5 ${
                          review.rating >= star ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                        }`} 
                      />
                    ))}
                    <span className="text-xs font-black text-amber-800 ml-0.5">{review.rating}.0</span>
                  </div>
                </div>

              </div>

              {/* Review Content */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900">{review.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {review.comment}
                </p>

                {/* Optional Attached Review Images */}
                {(review.imageUrl || (review.images && review.images.length > 0)) && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {review.imageUrl && (
                      <div 
                        onClick={() => setSelectedImageModal(review.imageUrl!)}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs hover:border-[#00AEEF] transition"
                      >
                        <img 
                          src={review.imageUrl} 
                          alt="Review attachment proof" 
                          referrerPolicy="no-referrer"
                          className="max-h-40 w-auto object-cover rounded-xl group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1 p-2 text-center">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>View Proof Photo</span>
                        </div>
                      </div>
                    )}
                    {review.images && review.images.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedImageModal(img)}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs hover:border-[#00AEEF] transition"
                      >
                        <img 
                          src={img} 
                          alt={`Attachment ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          className="max-h-40 w-auto object-cover rounded-xl group-hover:scale-105 transition duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Official Admin Reply Box */}
              {review.adminReply && (
                <div className="bg-slate-50 border-l-2 border-[#00AEEF] rounded-r-xl p-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#00AEEF]" />
                    <span>Response from ZeroX Team</span>
                  </div>
                  <p className="text-xs text-slate-600 pl-5 leading-relaxed">
                    {review.adminReply}
                  </p>
                </div>
              )}

              {/* Card Footer: Helpful button */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-400">
                <span className="text-[11px]">Was this review helpful?</span>
                <button
                  type="button"
                  onClick={() => handleHelpfulClick(review.id)}
                  disabled={helpfulClicked[review.id]}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer ${
                    helpfulClicked[review.id]
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${helpfulClicked[review.id] ? "fill-blue-600" : ""}`} />
                  <span>Helpful</span>
                  <span className="bg-slate-200/80 text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                    {review.helpfulCount || 0}
                  </span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Submit Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden shadow-2xl flex flex-col my-auto">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#00AEEF]/20 text-[#00AEEF] rounded-lg">
                  <Star className="w-4 h-4 fill-[#00AEEF]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Write a Review</h3>
                  <p className="text-[11px] text-slate-400">Share your experience with ZeroX Network</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {submitSuccess ? (
              <div className="p-8 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Review Published!</h3>
                <p className="text-xs text-slate-500">
                  Thank you for reviewing ZeroX Network.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Rating Picker */}
                  <div className="space-y-1 text-center bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Your Rating
                    </label>

                    <div className="flex items-center justify-center gap-1.5 py-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star 
                            className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                              (hoverRating || newRating) >= star 
                                ? "fill-amber-400 text-amber-400" 
                                : "fill-slate-200 text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <span className="text-xs font-bold text-amber-600">
                      {newRating === 5 && "⭐ Excellent - Highly Satisfied!"}
                      {newRating === 4 && "⭐ Very Good - Great Service!"}
                      {newRating === 3 && "⭐ Good - Satisfactory"}
                      {newRating === 2 && "⭐ Fair - Needs Improvement"}
                      {newRating === 1 && "⭐ Poor"}
                    </span>
                  </div>

                  {/* Service Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      Service Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: "SMS Activations", label: "SMS Activations" },
                        { id: "SMM Services", label: "SMM Panel" },
                        { id: "Digital Subscriptions", label: "Digital Subs" },
                        { id: "Wallet & Deposits", label: "Wallet & Top-ups" },
                        { id: "Customer Support", label: "Support" },
                        { id: "General Platform", label: "General Exp." }
                      ].map((cat) => {
                        const isSelected = newCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNewCategory(cat.id as any)}
                            className={`px-2.5 py-2 rounded-xl text-[11px] font-bold text-left transition border cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-50 border-[#00AEEF] text-[#00AEEF] shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="truncate">{cat.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00AEEF] shrink-0 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      Review Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Instant WhatsApp OTP & superb support!"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  {/* Detailed Comment */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      Your Feedback
                    </label>
                    <textarea
                      rows={2.5}
                      placeholder="Write details about your experience with ZeroX Network..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  {/* Your Name / Handle */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      Your Display Name / Username <span className="text-[10px] text-slate-400 font-normal">(Optional for visitors)</span>
                    </label>
                    <input
                      type="text"
                      placeholder={currentUser?.username ? `Logged in as ${currentUser.username}` : "e.g. Rynmirza or Guest Visitor"}
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  {/* Optional Custom User Avatar URL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700">
                        Profile Picture / Avatar Link <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomAvatarUrl("https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png")}
                        className="text-[10px] font-bold text-[#00AEEF] hover:underline cursor-pointer"
                      >
                        + Use Default Photo
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://cdn.phototourl.com/free/..."
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>

                  {/* Optional Attached Screenshot / Proof Link */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      Attach Proof Photo / Screenshot Link <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={customProofImageUrl}
                      onChange={(e) => setCustomProofImageUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
                    />
                  </div>
                </div>

                {/* Actions (Sticky Bottom) */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#00AEEF] hover:bg-blue-600 text-white text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Posting..." : "Post Review"}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 bg-slate-800/90 p-2 rounded-full backdrop-blur-xs transition cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImageModal} 
              alt="Full size view" 
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl border-2 border-white/20 shadow-2xl object-contain bg-slate-950"
            />
            <div className="mt-3 flex items-center gap-2">
              <a
                href={sanitizeUrl(selectedImageModal)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open Original Image Link</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal for Visitor Review Submission */}
      {showLoginRequiredModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl space-y-0">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#00AEEF]/20 text-[#00AEEF] rounded-xl border border-[#00AEEF]/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Login Required</h3>
                  <p className="text-[11px] text-slate-400">Sign in to publish your customer review</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLoginRequiredModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-50 text-[#00AEEF] rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
                <User className="w-7 h-7 text-[#00AEEF]" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-extrabold text-slate-900">
                  Account Login Required to Post
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Visitors can read all customer reviews! To write and post your review, please log in or create a free ZeroX Network account.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Why is login required for reviews?</span>
                </div>
                <p className="text-[11px] text-slate-500 pl-5">
                  We verify user accounts to ensure 100% authentic ratings and prevent fake review submissions.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginRequiredModal(false);
                    if (onNavigateToTab) {
                      onNavigateToTab("wallet");
                    } else {
                      window.dispatchEvent(new CustomEvent("request-login"));
                    }
                  }}
                  className="w-full bg-[#00AEEF] hover:bg-blue-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Log In / Register Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLoginRequiredModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Continue Browsing Reviews as Guest
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
