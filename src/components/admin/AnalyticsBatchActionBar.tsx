import React, { useState } from 'react';
import { Trash2, X, CheckSquare, Loader2, AlertTriangle } from 'lucide-react';

interface AnalyticsBatchActionBarProps {
  selectedCount: number;
  totalVisibleCount: number;
  itemName?: string;
  onSelectAllVisible: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => Promise<void> | void;
  isAllSelected?: boolean;
}

export const AnalyticsBatchActionBar: React.FC<AnalyticsBatchActionBarProps> = ({
  selectedCount,
  totalVisibleCount,
  itemName = 'records',
  onSelectAllVisible,
  onDeselectAll,
  onDeleteSelected,
  isAllSelected = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (selectedCount === 0) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteSelected();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Batch delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 sm:px-4 sm:py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-rose-600 text-white font-mono text-[11px] font-black">
            {selectedCount}
          </span>
          <span className="text-xs font-bold text-rose-900">
            {selectedCount === 1 ? `1 ${itemName.replace(/s$/, '')}` : `${selectedCount} ${itemName}`} selected
          </span>

          <span className="text-slate-300 mx-1">|</span>

          {!isAllSelected ? (
            <button
              onClick={onSelectAllVisible}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <CheckSquare className="h-3 w-3" />
              <span>Select All Visible ({totalVisibleCount})</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
              ✓ All {totalVisibleCount} visible selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onDeselectAll}
            disabled={isDeleting}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-rose-100/60 transition cursor-pointer flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            <span>Cancel</span>
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isDeleting}
            className="px-3 py-1 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Confirm Deletion</h4>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the <strong className="text-slate-900 font-bold">{selectedCount} selected {itemName}</strong> from the database?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Keep Records
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Delete {selectedCount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
