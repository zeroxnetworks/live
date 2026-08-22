import React, { useState, useEffect } from "react";
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Award, 
  Search, 
  CornerDownRight, 
  ShieldCheck, 
  Sparkles, 
  Filter,
  Send,
  AlertCircle,
  X,
  Download
} from "lucide-react";
import { ReviewItem } from "../../../types";
import { DEFAULT_REVIEWS } from "../../../lib/reviewsAndPolicyStore";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { sanitizeUrl, isSafeUrl } from "../../../lib/security";

export default function ReviewsAdminTab() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
  const [avatarInputUrl, setAvatarInputUrl] = useState<string>("");
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleUpdateAvatar = async (id: string, newUrl: string) => {
    if (!newUrl.trim()) return;
    const updated = reviews.map(r => r.id === id ? { ...r, userAvatar: newUrl.trim() } : r);
    updateCacheAndState(updated);
    showToast("Review picture updated successfully!");
    setEditingAvatarId(null);
    setAvatarInputUrl("");

    try {
      await updateDoc(doc(db, "reviews", id), { userAvatar: newUrl.trim() });
    } catch (e) {
      console.warn("Firestore avatar update skipped", e);
    }
  };

  useEffect(() => {
    // Listen to Firestore reviews collection
    let unsubscribe = () => {};
    try {
      const reviewsRef = collection(db, "reviews");
      unsubscribe = onSnapshot(reviewsRef, async (snapshot) => {
        if (snapshot.empty) {
          try {
            const batchPromises = DEFAULT_REVIEWS.map(rev => setDoc(doc(db, "reviews", rev.id), rev, { merge: true }));
            await Promise.all(batchPromises);
          } catch (e) {
            console.error("Error seeding default reviews:", e);
          }
          setReviews(DEFAULT_REVIEWS);
        } else {
          const list: ReviewItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, status: docSnap.data().status || "APPROVED", ...docSnap.data() } as ReviewItem);
          });
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setReviews(list);
        }
      }, (err) => {
        console.warn("Firestore reviews sync error", err);
      });
    } catch (e) {
      console.error(e);
    }

    return () => unsubscribe();
  }, []);

  const updateCacheAndState = (updatedList: ReviewItem[]) => {
    setReviews(updatedList);
  };

  const handleApprove = async (id: string) => {
    const updated = reviews.map(r => r.id === id ? { ...r, status: "APPROVED" as const } : r);
    updateCacheAndState(updated);
    showToast("Review approved and published!");

    try {
      await updateDoc(doc(db, "reviews", id), { status: "APPROVED" });
    } catch (e) {
      console.warn("Firestore update skipped", e);
    }
  };

  const handleReject = async (id: string) => {
    const updated = reviews.map(r => r.id === id ? { ...r, status: "REJECTED" as const } : r);
    updateCacheAndState(updated);
    showToast("Review status set to Rejected.");

    try {
      await updateDoc(doc(db, "reviews", id), { status: "REJECTED" });
    } catch (e) {
      console.warn("Firestore update skipped", e);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    const newFeatured = !currentFeatured;
    const updated = reviews.map(r => r.id === id ? { ...r, isFeatured: newFeatured } : r);
    updateCacheAndState(updated);
    showToast(newFeatured ? "Review featured on top!" : "Review unfeatured.");

    try {
      await updateDoc(doc(db, "reviews", id), { isFeatured: newFeatured });
    } catch (e) {
      console.warn("Firestore update skipped", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    const updated = reviews.filter(r => r.id !== id);
    updateCacheAndState(updated);
    showToast("Review deleted.");

    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (e) {
      console.warn("Firestore delete skipped", e);
    }
  };

  const handleSaveReply = async (id: string) => {
    if (!replyText.trim()) return;

    const updated = reviews.map(r => r.id === id ? { ...r, adminReply: replyText.trim() } : r);
    updateCacheAndState(updated);
    setReplyingToId(null);
    setReplyText("");
    showToast("Admin response posted successfully!");

    try {
      await updateDoc(doc(db, "reviews", id), { adminReply: replyText.trim() });
    } catch (e) {
      console.warn("Firestore update skipped", e);
    }
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  // Metrics
  const totalCount = reviews.length;
  const pendingCount = reviews.filter(r => r.status === "PENDING").length;
  const approvedCount = reviews.filter(r => r.status === "APPROVED").length;
  const featuredCount = reviews.filter(r => r.isFeatured).length;
  const avgRating = totalCount > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / totalCount).toFixed(1) : "5.0";

  // Filtered
  const filtered = reviews.filter(r => {
    const matchesStatus = 
      filterStatus === "All" ||
      (filterStatus === "PENDING" && r.status === "PENDING") ||
      (filterStatus === "APPROVED" && r.status === "APPROVED") ||
      (filterStatus === "FEATURED" && r.isFeatured) ||
      (filterStatus === "REJECTED" && r.status === "REJECTED");

    const matchesSearch = searchQuery.trim() === "" ||
      r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>Admin Control Panel</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Customer Reviews Management</h2>
          <p className="text-xs text-slate-400">
            Moderate user ratings, approve feedback, pin featured reviews, and post official responses.
          </p>
        </div>

        {statusMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Reviews</span>
          <span className="text-2xl font-black text-slate-900">{totalCount}</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-1 bg-amber-50/30 shadow-2xs">
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Pending Approval</span>
          <span className="text-2xl font-black text-amber-800">{pendingCount}</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-1 bg-emerald-50/30 shadow-2xs">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Published Approved</span>
          <span className="text-2xl font-black text-emerald-800">{approvedCount}</span>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-4 space-y-1 bg-blue-50/30 shadow-2xs">
          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">Average Rating</span>
          <span className="text-2xl font-black text-blue-800">{avgRating} ★</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["All", "PENDING", "APPROVED", "FEATURED", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "PENDING" && `Pending (${pendingCount})`}
              {st === "APPROVED" && "Approved"}
              {st === "FEATURED" && `Featured (${featuredCount})`}
              {st === "REJECTED" && "Rejected"}
              {st === "All" && `All (${totalCount})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* Reviews Table / Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No reviews match your filter parameters.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div 
              key={item.id}
              className={`bg-white border rounded-2xl p-5 sm:p-6 space-y-3 transition ${
                item.status === "PENDING"
                  ? "border-amber-300 bg-amber-50/10"
                  : item.isFeatured
                  ? "border-blue-300 bg-blue-50/10"
                  : "border-slate-200"
              }`}
            >
              
              {/* Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative group shrink-0">
                    <img 
                      src={item.userAvatar || "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png"} 
                      alt={item.username} 
                      referrerPolicy="no-referrer"
                      onClick={() => setPreviewImageModal(item.userAvatar || "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png")}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 cursor-pointer hover:scale-105 hover:border-blue-500 transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{item.username}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAvatarId(editingAvatarId === item.id ? null : item.id);
                          setAvatarInputUrl(item.userAvatar || "");
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                      >
                        {editingAvatarId === item.id ? "Cancel Photo" : "Change Photo"}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rating & Action status tags */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-3.5 h-3.5 ${s <= item.rating ? "fill-amber-400" : "fill-slate-200 text-slate-200"}`} 
                      />
                    ))}
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                    item.status === "APPROVED" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : item.status === "REJECTED"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Inline Avatar Photo Editor */}
              {editingAvatarId === item.id && (
                <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900">Update User Profile Picture Link:</label>
                    <button
                      type="button"
                      onClick={() => setAvatarInputUrl("https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png")}
                      className="text-[10px] font-extrabold text-blue-700 hover:underline cursor-pointer"
                    >
                      + Use Provided Photo Link
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={avatarInputUrl}
                      onChange={(e) => setAvatarInputUrl(e.target.value)}
                      placeholder="https://cdn.phototourl.com/free/..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateAvatar(item.id, avatarInputUrl)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Save Picture
                    </button>
                  </div>
                </div>
              )}

              {/* Title & Comment */}
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.comment}
                </p>

                {/* Optional Attached Proof Photo */}
                {item.imageUrl && (
                  <div className="pt-1">
                    <img 
                      src={item.imageUrl} 
                      alt="Proof Attachment" 
                      referrerPolicy="no-referrer"
                      onClick={() => setPreviewImageModal(item.imageUrl!)}
                      className="max-h-36 w-auto rounded-xl border border-slate-200 cursor-pointer hover:border-blue-500 transition shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Admin reply section if present or editing */}
              {item.adminReply && replyingToId !== item.id && (
                <div className="bg-slate-50 border-l-4 border-blue-500 p-3 rounded-r-xl text-xs space-y-1">
                  <span className="font-extrabold text-blue-800 block">Response from ZeroX Team:</span>
                  <p className="text-slate-600">{item.adminReply}</p>
                </div>
              )}

              {replyingToId === item.id && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Write Official Response:</label>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="e.g. Thank you for your feedback! We appreciate your support."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveReply(item.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Save Reply</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  {item.status !== "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {item.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleReject(item.id)}
                      className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(item.id, item.isFeatured)}
                    className={`flex items-center gap-1 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer border ${
                      item.isFeatured
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{item.isFeatured ? "Featured ★" : "Feature Review"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyingToId(item.id);
                      setReplyText(item.adminReply || "");
                    }}
                    className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.adminReply ? "Edit Reply" : "Reply"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 bg-slate-800/90 p-2 rounded-full backdrop-blur-xs transition cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageModal} 
              alt="Full resolution preview" 
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl border-2 border-white/20 shadow-2xl object-contain bg-slate-950"
            />
            <div className="mt-3 flex items-center gap-2">
              <a
                href={sanitizeUrl(previewImageModal)}
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

    </div>
  );
}
