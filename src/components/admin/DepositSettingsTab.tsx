import React from 'react';
import { useAdminContext } from './AdminContext';
import { Cpu, ToggleRight, ToggleLeft, Percent, Landmark, Check, Save, CreditCard, Copy, Trash2, ShieldCheck, Server, X, Upload, Camera, Link, Plus } from 'lucide-react';

export default function DepositSettingsTab() {
  const ctx = useAdminContext();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Deposit Automation & Gateways Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2 mb-2 gap-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-600" />
            Deposit Automation & Gateways Controls
          </h3>
          {ctx.hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto bg-amber-50 border border-amber-200 rounded-lg p-1 px-2 animate-pulse">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Unsaved Changes pending</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Automation Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase">Auto-Approve Local Deposits</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instantly credit PKR deposit requests</p>
            </div>
            <button
              type="button"
              onClick={() => ctx.setDraftAutoApproveDeposits(!ctx.draftAutoApproveDeposits)}
              className="cursor-pointer"
            >
              {ctx.draftAutoApproveDeposits ? (
                <ToggleRight className="h-8 w-8 text-blue-600" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-300" />
              )}
            </button>
          </div>

          {/* Crypto Automation Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
            <div>
              <h4 className="text-xs font-black text-amber-700 uppercase">Auto-Approve Crypto Deposits</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instantly credit USDT deposits</p>
            </div>
            <button
              type="button"
              onClick={() => ctx.setDraftAutoApproveCrypto(!ctx.draftAutoApproveCrypto)}
              className="cursor-pointer"
            >
              {ctx.draftAutoApproveCrypto ? (
                <ToggleRight className="h-8 w-8 text-amber-500" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-slate-300" />
              )}
            </button>
          </div>

          {/* Crypto Exchange Rate */}
          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
            <h4 className="text-xs font-black text-slate-700 uppercase mb-2 flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-blue-600" />
              Crypto to PKR Exchange Rate
            </h4>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₨</span>
                <input
                  type="number"
                  value={ctx.draftCryptoRate}
                  onChange={(e) => ctx.setDraftCryptoRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Per 1 USDT</span>
            </div>
          </div>

          {/* Minimum Deposits */}
          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex gap-4">
             <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-700 uppercase mb-2">Min Crypto Deposit</h4>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    value={ctx.draftCryptoMinDeposit}
                    onChange={(e) => ctx.setDraftCryptoMinDeposit(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
             </div>
             <div className="flex-1">
                <h4 className="text-[10px] font-black text-slate-700 uppercase mb-2">Min Local Deposit</h4>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₨</span>
                  <input
                    type="number"
                    value={ctx.draftLocalMinDeposit}
                    onChange={(e) => ctx.setDraftLocalMinDeposit(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={ctx.handleSaveGlobalSettings}
            disabled={!ctx.hasUnsavedChanges || ctx.isSavingGlobalSettings}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-lg flex items-center gap-2 transition-all ${
              ctx.hasUnsavedChanges && !ctx.isSavingGlobalSettings
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {ctx.isSavingGlobalSettings ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save Automation Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
