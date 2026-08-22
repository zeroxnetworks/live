import React, { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { SubscriptionProduct, SubscriptionCategory, SubscriptionOrder } from "../../../types";
import { toast } from "react-hot-toast";
import { sendNotification } from "../../../lib/notifications";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon, Link as LinkIcon, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { seedSubscriptions } from "../../../lib/seedSubscriptions";
import { Sparkles } from "lucide-react";

export default function SubscriptionsAdminTab({ cryptoRate }: { cryptoRate?: number }) {
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [categories, setCategories] = useState<SubscriptionCategory[]>([]);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);

  // Modals state
  const [editingProduct, setEditingProduct] = useState<SubscriptionProduct | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState<SubscriptionOrder | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<{type: 'category'|'product', id: string} | null>(null);

  const [subSettings, setSubSettings] = useState({ privacyPolicy: "", contactDetails: "" });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "subscription_settings"), (docSnap) => {
      if (docSnap.exists()) {
        setSubSettings({
          privacyPolicy: docSnap.data().privacyPolicy || "",
          contactDetails: docSnap.data().contactDetails || ""
        });
      }
    }, (err) => console.warn("[SubscriptionsAdminTab] Settings listener error:", err));

    const unsubProducts = onSnapshot(collection(db, "subscription_products"), (snap) => {
      const prods: SubscriptionProduct[] = [];
      snap.forEach(d => prods.push({ id: d.id, ...d.data() } as SubscriptionProduct));
      setProducts(prods);
    }, (err) => console.warn("[SubscriptionsAdminTab] Products listener error:", err));

    const unsubCategories = onSnapshot(collection(db, "subscription_categories"), (snap) => {
      const cats: SubscriptionCategory[] = [];
      snap.forEach(d => cats.push({ id: d.id, ...d.data() } as SubscriptionCategory));
      setCategories(cats);
    }, (err) => console.warn("[SubscriptionsAdminTab] Categories listener error:", err));

    const unsubOrders = onSnapshot(collection(db, "subscription_orders"), (snap) => {
      const ords: SubscriptionOrder[] = [];
      snap.forEach(d => ords.push({ id: d.id, ...d.data() } as SubscriptionOrder));
      setOrders(ords);
    }, (err) => console.warn("[SubscriptionsAdminTab] Orders listener error:", err));

    return () => { unsubProducts(); unsubCategories(); unsubOrders(); unsubSettings(); };
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "subscription_settings"), subSettings, { merge: true });
      toast.success("Subscription settings saved!");
    } catch (e) {
      toast.error("Error saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Are you sure you want to auto-populate all popular subscription services? This will add them to your database.")) return;
    setIsSeeding(true);
    const toastId = toast.loading("Seeding database with popular subscriptions...");
    const res = await seedSubscriptions();
    if (res.success) {
      toast.success("Database seeded successfully!", { id: toastId });
    } else {
      toast.error("Failed to seed database: " + res.error, { id: toastId });
    }
    setIsSeeding(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, "subscription_categories"), { name: newCategoryName, sortOrder: categories.length });
      toast.success("Category added");
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    } catch (e) { toast.error("Error adding category"); }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsConfirmDeleteOpen({ type: 'category', id });
  };

  const handleAddProduct = () => {
    const cat = categories[0]?.id || "";
    setEditingProduct({
      id: "NEW",
      categoryId: cat,
      name: "New Product",
      description: "",
      features: [""],
      duration: "1 Month",
      price: 1,
      status: "HIDDEN",
      createdAt: new Date().toISOString()
    } as any);
    setIsEditModalOpen(true);
  };

  const handleDiscountChange = (updates: Partial<SubscriptionProduct>) => {
    if (!editingProduct) return;
    const next = { ...editingProduct, ...updates };
    let finalPrice = next.price;
    
    if (next.originalPrice !== undefined && next.originalPrice >= 0) {
      if (next.discountType === 'PERCENTAGE' && next.discountValue !== undefined) {
        finalPrice = next.originalPrice * (1 - next.discountValue / 100);
      } else if (next.discountType === 'FIXED_AMOUNT' && next.discountValue !== undefined) {
        finalPrice = Math.max(0, next.originalPrice - next.discountValue);
      } else {
        finalPrice = next.originalPrice;
      }
    }
    
    setEditingProduct({ ...next, price: Number(finalPrice.toFixed(2)) });
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { id, ...data } = editingProduct;
      // Ensure features is an array
      if (!Array.isArray(data.features)) {
        data.features = ["Premium Access"];
      }
      if (id === "NEW") {
        await addDoc(collection(db, "subscription_products"), data);
        toast.success("Product created");
      } else {
        await updateDoc(doc(db, "subscription_products", id), data as any);
        toast.success("Product updated");
      }
      setIsEditModalOpen(false);
    } catch (e: any) { toast.error("Error saving product: " + e.message); }
  };

  const toggleProductStatus = async (product: SubscriptionProduct) => {
    const newStatus = product.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    try {
      await updateDoc(doc(db, "subscription_products", product.id), { status: newStatus });
      toast.success(`Product ${newStatus.toLowerCase()}`);
    } catch (e) { toast.error("Error toggling status"); }
  };

  const handleDeleteProduct = async (id: string) => {
    setIsConfirmDeleteOpen({ type: 'product', id });
  };
  
  const confirmDelete = async () => {
    if (!isConfirmDeleteOpen) return;
    try {
      if (isConfirmDeleteOpen.type === 'category') {
        await deleteDoc(doc(db, "subscription_categories", isConfirmDeleteOpen.id));
        toast.success("Category deleted");
      } else {
        await deleteDoc(doc(db, "subscription_products", isConfirmDeleteOpen.id));
        toast.success("Product deleted");
      }
    } catch (e) {
      toast.error("Error deleting");
    } finally {
      setIsConfirmDeleteOpen(null);
    }
  };

  const processOrder = async (orderId: string, status: string, notes: string = "") => {
    try {
      await updateDoc(doc(db, "subscription_orders", orderId), { 
        status, 
        activationDetails: notes, 
        updatedAt: new Date().toISOString() 
      });
      toast.success(`Order marked as ${status}`);
      
      const order = orders.find(o => o.id === orderId);
      if (order && status === 'COMPLETED') {
        sendNotification(
          order.userId,
          order.userEmail,
          order.username,
          "Order Completed",
          `Your subscription for ${order.productName} is now ACTIVE.\n\nActivation Details:\n${notes}`,
          order.whatsappNumber
        );
      }
      
      setOrderToProcess(null);
    } catch (e) { toast.error("Error updating order"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-800">Subscriptions Management</h2>
          <p className="text-xs text-slate-500">Manage categories, products, and user orders.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSeed} disabled={isSeeding} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> {isSeeding ? 'Seeding...' : 'Auto-Seed Popular'}
          </button>
          <button onClick={() => setIsAddCategoryOpen(true)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Category
          </button>
          <button onClick={handleAddProduct} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md">
            <Plus className="w-3.5 h-3.5" /> Product
          </button>
        </div>
      </div>

      
      {/* Settings Form */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Client Notice Settings</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Privacy Policy Notice</label>
            <textarea 
              value={subSettings.privacyPolicy}
              onChange={(e) => setSubSettings(prev => ({...prev, privacyPolicy: e.target.value}))}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[80px]"
              placeholder="E.g. No refunds once subscription is activated..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Details Notice</label>
            <input 
              type="text"
              value={subSettings.contactDetails}
              onChange={(e) => setSubSettings(prev => ({...prev, contactDetails: e.target.value}))}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3"
              placeholder="E.g. Contact WhatsApp: +123456789"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold transition hover:bg-indigo-600 disabled:opacity-50"
          >
            {isSavingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 text-sm">Products Inventory</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">{products.length} Items</span>
          </div>
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2">
            {categories.map(cat => (
              <div key={cat.id} className="mb-4">
                <div className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded mb-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{cat.name}</h4>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {products.filter(p => p.categoryId === cat.id).map(p => (
                    <div key={p.id} className={`p-3 rounded-lg border ${p.status === 'ACTIVE' ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 opacity-75'} flex items-center justify-between transition hover:shadow-sm`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {p.logoUrl ? <img src={p.logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-5 h-5" /></div>}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            {p.name}
                            {p.status === "HIDDEN" && <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 rounded uppercase tracking-wider">Hidden</span>}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="line-through decoration-red-500 text-emerald-500 mr-1 opacity-90">
                                Official: ₨ {(p.originalPrice * (cryptoRate || 278)).toFixed(0)}
                              </span>
                            )}
                            <span className="text-indigo-600 font-bold">
                              ₨ {(p.price * (cryptoRate || 278)).toFixed(0)}
                            </span>
                            <span className="text-slate-400 ml-1">• {p.duration}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleProductStatus(p)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Toggle Visibility">
                          {p.status === "ACTIVE" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setEditingProduct(p); setIsEditModalOpen(true); }} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {products.filter(p => p.categoryId === cat.id).length === 0 && (
                    <div className="text-center py-2 text-xs text-slate-400 italic">No products in this category</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 text-sm">Recent Orders</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{orders.length} Total</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => (
              <div key={o.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-black text-slate-800 block mb-0.5">{o.productName} <span className="text-xs text-slate-500 font-medium">({o.duration})</span></span>
                    <span className="text-[11px] text-slate-500 block">User: <span className="font-bold text-slate-700">{o.username}</span> | Email: <span className="font-bold text-slate-700">{o.userEmail}</span></span>
                    <span className="text-[11px] text-slate-500 block">WhatsApp: <span className="font-bold text-slate-700">{o.whatsappNumber}</span></span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm ${
                      o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      o.status === 'PROCESSING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      o.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                      o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>{o.status}</span>
                    <span className="block mt-1 text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                {o.customerNotes && (
                  <div className="bg-white border border-slate-200 p-3 rounded-lg text-xs text-slate-700 font-mono whitespace-pre-wrap mb-3 shadow-sm">
                    {o.customerNotes}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {o.status === 'PENDING' && (
                    <button onClick={() => processOrder(o.id, 'PROCESSING')} className="text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 px-3 py-1.5 rounded-lg shadow-sm transition">Mark Processing</button>
                  )}
                  {(o.status === 'PENDING' || o.status === 'PROCESSING') && (
                    <button onClick={() => setOrderToProcess(o)} className="text-[11px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm transition">Fulfill & Complete</button>
                  )}
                  {o.status !== 'REJECTED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                    <button onClick={() => {
                      if (confirm("Are you sure you want to reject this order? (User will need to be refunded manually if balance was deducted)")) {
                        processOrder(o.id, 'REJECTED');
                      }
                    }} className="text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition ml-auto">Reject</button>
                  )}
                  <button onClick={async () => {
                    if (confirm("Permanently delete this order record?")) {
                      await deleteDoc(doc(db, "subscription_orders", o.id));
                      toast.success("Order record deleted");
                    }
                  }} className="text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 px-3 py-1.5 rounded-lg transition ml-auto flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                  {o.status === 'COMPLETED' && o.activationDetails && (
                    <div className="w-full mt-2">
                      <p className="text-[10px] font-bold text-slate-500 mb-1">Activation Details Provided:</p>
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded text-xs text-emerald-800 font-mono whitespace-pre-wrap">
                        {o.activationDetails}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No orders yet</p>
                <p className="text-slate-400 text-xs mt-1">When users purchase subscriptions, they will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Edit className="w-5 h-5 text-indigo-600" /> Edit Product</h3>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="edit-product-form" onSubmit={saveProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Name</label>
                      <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                      <select required value={editingProduct.categoryId} onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Duration (e.g. 1 Month)</label>
                      <input type="text" required value={editingProduct.duration} onChange={e => setEditingProduct({...editingProduct, duration: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Final Selling Price (USD)</label>
                      <input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Discount Configuration (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Official/Original Price</label>
                        <input type="number" step="0.01" value={editingProduct.originalPrice || ''} onChange={e => handleDiscountChange({ originalPrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="e.g. 19.99" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                        <select value={editingProduct.discountType || 'NONE'} onChange={e => handleDiscountChange({ discountType: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                          <option value="NONE">None</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                        <input type="number" step="0.01" value={editingProduct.discountValue || ''} onChange={e => handleDiscountChange({ discountValue: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="e.g. 20" disabled={!editingProduct.discountType || editingProduct.discountType === 'NONE'} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea rows={3} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Features (one per line)</label>
                    <textarea rows={4} value={(editingProduct.features || []).join('\n')} onChange={e => setEditingProduct({...editingProduct, features: e.target.value.split('\n')})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="4K Ultra HD\n4 Screens\nGlobal Access" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL (Optional)</label>
                      <input type="text" value={editingProduct.logoUrl || ''} onChange={e => setEditingProduct({...editingProduct, logoUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banner URL (Optional)</label>
                      <input type="text" value={editingProduct.bannerUrl || ''} onChange={e => setEditingProduct({...editingProduct, bannerUrl: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Discount Badge (Optional)</label>
                      <input type="text" value={editingProduct.discountBadge || ''} onChange={e => setEditingProduct({...editingProduct, discountBadge: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="e.g. Save 20%" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">External Link (Optional)</label>
                      <input type="text" value={editingProduct.externalLink || ''} onChange={e => setEditingProduct({...editingProduct, externalLink: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="https://..." />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                <button type="submit" form="edit-product-form" className="px-5 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">Save Product</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
      {/* Add Category Modal */}
      <AnimatePresence>
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddCategoryOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200">
                <h3 className="font-black text-slate-800">Add Category</h3>
              </div>
              <form onSubmit={handleAddCategory}>
                <div className="p-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                  <input type="text" autoFocus required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" placeholder="e.g. Entertainment" />
                </div>
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">Add Category</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfirmDeleteOpen(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 bg-red-50 border-b border-red-100">
                <h3 className="font-black text-red-900 text-lg">Confirm Delete</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-700">Are you sure you want to delete this {isConfirmDeleteOpen.type}? This action cannot be undone.</p>
              </div>
              <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsConfirmDeleteOpen(null)} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fulfill Order Modal */}
      <AnimatePresence>
        {orderToProcess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOrderToProcess(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 bg-emerald-50 border-b border-emerald-100">
                <h3 className="font-black text-emerald-900 text-lg">Complete Order</h3>
                <p className="text-xs text-emerald-700">Fulfill subscription for {orderToProcess.username}</p>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">Activation Details / Credentials to send to user</label>
                <textarea 
                  id="fulfillment-notes"
                  rows={6} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Email: ...&#10;Password: ...&#10;License Key: ..." 
                />
                <p className="text-[10px] text-slate-500 mt-2">These details will be securely saved and the user will receive a confirmation notification.</p>
              </div>
              <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setOrderToProcess(null)} className="px-5 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                <button type="button" onClick={() => {
                  const val = (document.getElementById('fulfillment-notes') as HTMLTextAreaElement).value;
                  processOrder(orderToProcess.id, 'COMPLETED', val);
                }} className="px-5 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700">Complete Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
