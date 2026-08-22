import React from "react";
import { Landmark, Bitcoin, Globe, CreditCard, Wallet } from "lucide-react";

interface GatewayBrandIconProps {
  methodId: string;
  logoUrl?: string;
  className?: string;
  iconClassName?: string;
}

export const GatewayBrandIcon: React.FC<GatewayBrandIconProps> = ({
  methodId,
  logoUrl,
  className = "w-9 h-9",
  iconClassName = "w-5 h-5"
}) => {
  // If custom logo was uploaded/saved via Admin Portal, display it first
  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <div className={`${className} rounded-xl bg-white border border-slate-200/90 flex items-center justify-center p-1 overflow-hidden shadow-2xs shrink-0`}>
        <img
          src={logoUrl}
          alt={`${methodId} Logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image link broken
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  const id = methodId.toLowerCase();

  // Easypaisa Brand Icon (Green circle with white signature ring and dot)
  if (id === "easypaisa") {
    return (
      <div className={`${className} rounded-xl bg-[#00A859]/10 border border-[#00A859]/25 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden`}>
        <svg viewBox="0 0 40 40" className={iconClassName} fill="none">
          <circle cx="20" cy="20" r="18" fill="#00A859" />
          <path
            d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM20 14C23.314 14 26 16.686 26 20C26 23.314 23.314 26 20 26C16.686 26 14 23.314 14 20C14 16.686 16.686 14 20 14Z"
            fill="white"
          />
          <circle cx="20" cy="20" r="3.5" fill="white" />
        </svg>
      </div>
    );
  }

  // JazzCash Brand Icon (Bold Red with Yellow/White Accent)
  if (id === "jazzcash") {
    return (
      <div className={`${className} rounded-xl bg-[#E31B23]/10 border border-[#E31B23]/25 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden`}>
        <svg viewBox="0 0 40 40" className={iconClassName} fill="none">
          <rect width="40" height="40" rx="10" fill="#E31B23" />
          <circle cx="16" cy="20" r="7" fill="#FFC20E" />
          <circle cx="24" cy="20" r="7" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
    );
  }

  // NayaPay Brand Icon (Cyan / Electric Blue Arch)
  if (id === "nayapay") {
    return (
      <div className={`${className} rounded-xl bg-[#00AEEF]/10 border border-[#00AEEF]/25 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden`}>
        <svg viewBox="0 0 40 40" className={iconClassName} fill="none">
          <circle cx="20" cy="20" r="18" fill="#00AEEF" />
          <circle cx="20" cy="20" r="9" fill="white" />
          <circle cx="20" cy="20" r="4.5" fill="#00AEEF" />
        </svg>
      </div>
    );
  }

  // SadaPay Brand Icon (Teal and Coral Accent)
  if (id === "sadapay") {
    return (
      <div className={`${className} rounded-xl bg-[#1DA599]/10 border border-[#1DA599]/25 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden`}>
        <svg viewBox="0 0 40 40" className={iconClassName} fill="none">
          <circle cx="20" cy="20" r="18" fill="#1DA599" />
          <path d="M14 20C14 16.686 16.686 14 20 14C23.314 14 26 16.686 26 20C26 23.314 23.314 26 20 26" stroke="#FF7A59" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Bank Transfer / Raast
  if (id === "bank" || id === "raast") {
    return (
      <div className={`${className} rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shadow-2xs shrink-0 text-blue-600`}>
        <Landmark className={iconClassName} />
      </div>
    );
  }

  // Crypto / USDT / BTC
  if (id === "crypto" || id === "usdt" || id === "btc") {
    return (
      <div className={`${className} rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-2xs shrink-0 text-amber-500`}>
        <Bitcoin className={iconClassName} />
      </div>
    );
  }

  // RedotPay
  if (id === "redotpay") {
    return (
      <div className={`${className} rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center shadow-2xs shrink-0 text-rose-600`}>
        <Globe className={iconClassName} />
      </div>
    );
  }

  // Card Pay
  if (id === "card") {
    return (
      <div className={`${className} rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shadow-2xs shrink-0 text-indigo-600`}>
        <CreditCard className={iconClassName} />
      </div>
    );
  }

  // Default Wallet
  return (
    <div className={`${className} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0 text-slate-600`}>
      <Wallet className={iconClassName} />
    </div>
  );
};
