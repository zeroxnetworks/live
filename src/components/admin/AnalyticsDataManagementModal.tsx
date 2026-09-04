import React, { useState } from 'react';
import { 
  Trash2, RotateCcw, AlertTriangle, CheckCircle2, X, ShieldAlert, 
  Layers, Loader2, CheckSquare, Square, Flame, ShoppingBag, 
  DollarSign, Star, Activity, Eye, ShieldCheck, Crown, Smartphone
} from 'lucide-react';

export interface CategoryDataInfo {
  key: string;
  name: string;
  description: string;
  collectionName?: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface AnalyticsDataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDataInfo[];
  onClearAll: () => Promise<void>;
  onClearCategories: (categoryKeys: string[]) => Promise<void>;
}

export const AnalyticsDataManagementModal: React.FC<AnalyticsDataManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onClearAll,
  onClearCategories,
}) => {
  const [activeMode, setActiveMode] = useState<'select' | 'clear_all'>('select');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isOpen) return null;

  const totalRecordsAcrossCategories = categories.reduce((sum, c) => sum + (c.count || 0), 0);
  const totalSelectedRecords = categories
    .filter((c) => selectedKeys.has(c.key))
    .reduce((sum, c) => sum + (c.count || 0), 0);

  const handleToggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(categories.map((c) => c.key)));
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleExecuteCategoryPurge = async () => {
    if (selectedKeys.size === 0) return;
    setIsProcessing(true);
    try {
      await onClearCategories(Array.from(selectedKeys));
      setSelectedKeys(new Set());
      onClose();
    } catch (err) {
      console.error('Error clearing categories:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteClearAll = async () => {
    setIsProcessing(true);
    try {
      await onClearAll();
      setConfirmKeyword('');
      setShowConfirmDialog(false);
      onClose();
    } catch (err) {
      console.error('Error clearing all data:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Analytics Data Management & Reset
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Purge specific categories or reset all platform analytics data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveMode('select')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'select'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Select to Delete Data</span>
            {selectedKeys.size > 0 && (
              <span className="h-4 px-1.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold">
                {selectedKeys.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMode('clear_all')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'clear_all'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear / Reset All Data</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeMode === 'select' ? (
            <>
              {/* Top controls for Selection Mode */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Select categories to purge:
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Choose which analytics data collections to permanently clear
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-extrabold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isChecked = selectedKeys.has(cat.key);
                  return (
                    <div
                      key={cat.key}
                      onClick={() => handleToggleKey(cat.key)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'border-orange-500 bg-orange-50/60 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 rounded ${cat.color} text-white shrink-0`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="text-xs font-black text-slate-900 truncate">
                              {cat.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              cat.count > 0
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {cat.count.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary of Selection */}
              {selectedKeys.size > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>{selectedKeys.size}</strong> categories selected (
                      <strong>{totalSelectedRecords.toLocaleString()}</strong> records will be removed).
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Clear / Reset All Mode */
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-rose-900">
                      Clear & Reset All Analytics Data
                    </h4>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      This will reset all analytics metrics, delete visitor telemetry sessions,
                      event logs, activity feeds, and clear recorded orders from the analytics view.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-rose-200 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Total records to be wiped:</span>
                    <span className="font-mono font-black text-rose-600 text-sm">
                      {totalRecordsAcrossCategories.toLocaleString()} items
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    {categories.map((c) => (
                      <div key={c.key} className="flex justify-between items-center pr-2">
                        <span className="truncate">{c.name}:</span>
                        <span className="font-mono font-bold text-slate-700">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-rose-900 block">
                    Type <span className="font-mono uppercase bg-rose-100 px-1 py-0.5 rounded font-black text-rose-700">RESET</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmKeyword}
                    onChange={(e) => setConfirmKeyword(e.target.value)}
                    placeholder="Type RESET here"
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-rose-300 bg-white text-rose-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            Close
          </button>

          {activeMode === 'select' ? (
            <button
              type="button"
              onClick={handleExecuteCategoryPurge}
              disabled={selectedKeys.size === 0 || isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Purging Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected Categories ({selectedKeys.size})</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteClearAll}
              disabled={confirmKeyword.trim().toUpperCase() !== 'RESET' || isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Wiping All Analytics Data...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Confirm: Clear / Reset All Data</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
