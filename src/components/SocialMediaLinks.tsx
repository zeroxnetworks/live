import React from "react";
import { motion } from "motion/react";

export interface SocialLinkItem {
  id: string;
  name: string;
  handle: string;
  url: string;
  bgStyle: string;
  glowColor: string;
  iconSvg: React.ReactNode;
}

export const SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@ZeroxNetwok",
    url: "https://x.com/ZeroxNetwok",
    bgStyle: "bg-slate-950 text-white border-slate-800",
    glowColor: "rgba(15, 23, 42, 0.4)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@zeroxnetworks",
    url: "https://www.instagram.com/zeroxnetworks?igsh=MW1uMnUxbmExZ2hzeA==",
    bgStyle: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white border-rose-400/30",
    glowColor: "rgba(225, 29, 72, 0.45)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    )
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@zeroxnetworks",
    url: "https://www.tiktok.com/@zeroxnetworks?_r=1&_t=ZS-98knO2SerIN",
    bgStyle: "bg-black text-cyan-300 border-cyan-500/30",
    glowColor: "rgba(6, 182, 212, 0.45)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current drop-shadow-[0_0_3px_rgba(236,72,153,0.8)]" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.54-1.33 2.53-.05 1.18.59 2.33 1.58 2.92 1.05.65 2.45.62 3.49-.07.82-.53 1.34-1.46 1.43-2.43.06-2.52.02-5.04.03-7.57 0-3.08-.01-6.16-.01-9.24z" />
      </svg>
    )
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "ZeroX Network",
    url: "https://www.facebook.com/share/18iV6zQ8YU/",
    bgStyle: "bg-[#1877F2] text-white border-blue-400/30",
    glowColor: "rgba(24, 119, 242, 0.45)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  {
    id: "whatsapp",
    name: "WhatsApp Channel",
    handle: "ZeroX Channel",
    url: "https://whatsapp.com/channel/0029VbD0Hpj1SWt23eU7Sa34",
    bgStyle: "bg-[#25D366] text-white border-emerald-400/30",
    glowColor: "rgba(37, 211, 102, 0.5)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    )
  },
  {
    id: "telegram",
    name: "Telegram Channel",
    handle: "@zeroxnetworkz",
    url: "https://t.me/zeroxnetworkz",
    bgStyle: "bg-[#229ED9] text-white border-sky-400/30",
    glowColor: "rgba(34, 158, 217, 0.5)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.02 9.52c-.15.68-.56.84-1.13.52l-3.1-2.29-1.5 1.44c-.17.17-.31.31-.63.31l.22-3.17 5.77-5.21c.25-.22-.05-.35-.39-.13l-7.14 4.5-3.07-.96c-.67-.21-.68-.67.14-.99l12.01-4.63c.56-.21 1.05.13.84.89z" />
      </svg>
    )
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "Ryn Mirza",
    url: "https://www.linkedin.com/in/rynmirza?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    bgStyle: "bg-[#0A66C2] text-white border-blue-400/30",
    glowColor: "rgba(10, 102, 194, 0.5)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    )
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "@zeroxnetwork",
    url: "https://youtube.com/@zeroxnetwork?si=XHJPMSSAp0qnAJ9u",
    bgStyle: "bg-[#FF0000] text-white border-red-400/30",
    glowColor: "rgba(255, 0, 0, 0.5)",
    iconSvg: (
      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
];

export default function SocialMediaLinks() {
  return (
    <div className="p-1 sm:p-1.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-2xs flex items-center justify-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar">
      {SOCIAL_LINKS.map((item, idx) => (
        <motion.a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.35,
            delay: idx * 0.06,
            ease: [0.16, 1, 0.3, 1]
          }}
          whileHover={{
            y: -3,
            scale: 1.1,
            transition: { type: "spring", stiffness: 450, damping: 22 }
          }}
          whileTap={{ scale: 0.94 }}
          className={`group relative p-2 sm:p-2.5 rounded-xl border ${item.bgStyle} transition-shadow duration-300 shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center shrink-0`}
          style={{
            boxShadow: `0 2px 6px ${item.glowColor}`
          }}
          aria-label={item.name}
        >
          {/* Gentle continuous ambient breath on the icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: idx * 0.3,
              ease: "easeInOut"
            }}
            className="relative z-10 flex items-center justify-center"
          >
            {item.iconSvg}
          </motion.div>

          {/* Smooth shine sweep overlay on hover */}
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Elegant Tooltip */}
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-[10px] font-extrabold bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap border border-slate-700/80 z-50 flex items-center gap-1.5">
            <span>{item.name}</span>
            <span className="text-[9px] text-slate-400 font-mono font-normal">({item.handle})</span>
            {/* Tooltip triangle */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700/80" />
          </div>
        </motion.a>
      ))}
    </div>
  );
}
