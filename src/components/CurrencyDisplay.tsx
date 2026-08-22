import React from "react";

interface CurrencyDisplayProps {
  baseUnits: number | string | any;
  formatPrice: (baseUnits: number) => string;
  className?: string;
  amountClassName?: string;
  usdClassName?: string;
  showInRow?: boolean;
  inline?: boolean;
}

export default function CurrencyDisplay({ 
  baseUnits, 
  formatPrice, 
  className = "", 
  amountClassName = "text-[11px] sm:text-sm font-black text-slate-900",
  usdClassName = "text-emerald-600 font-bold text-[9.5px] sm:text-[10px]",
  showInRow = false,
  inline = false
}: CurrencyDisplayProps) {
  const safeBase = Number.isFinite(Number(baseUnits)) ? Number(baseUnits) : 0;
  const usdPrice = safeBase.toFixed(2);
  
  if (inline) {
    return (
      <span className={className}>
        <span className={amountClassName}>{formatPrice(safeBase)}</span> <span className={usdClassName}>(${usdPrice})</span>
      </span>
    );
  }
  
  return (
    <div className={`flex ${showInRow ? "flex-row items-baseline gap-1.5" : "flex-col"} ${className}`}>
      <span className={`leading-none ${amountClassName}`}>{formatPrice(safeBase)}</span>
      {usdClassName !== "hidden" && (
        <span className={`leading-none mt-0.5 font-mono ${usdClassName}`}>
          ${usdPrice} USD
        </span>
      )}
    </div>
  );
}
