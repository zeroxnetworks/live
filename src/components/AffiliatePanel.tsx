import React, { useState, useEffect, useRef } from "react";
import { Copy, Users, DollarSign, Share2, Award, Zap } from "lucide-react";
import { UserProfile } from "../types";
import { toast } from "react-hot-toast";

interface AffiliatePanelProps {
  profile: UserProfile | null;
}

// Highly optimized canvas component for neon green dollar rain
function DollarRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;

    // Dollar drop structure
    interface Drop {
      x: number;
      y: number;
      speed: number;
      size: number;
      opacity: number;
      char: string;
    }

    let drops: Drop[] = [];
    const maxDrops = 30; // Kept low for perfect performance & subtle aesthetic

    const chars = ["$", "$", "₨", "$", "+₨", "+$"];

    const spawnDrop = (xPos?: number, yPos?: number): Drop => {
      return {
        x: xPos !== undefined ? xPos : Math.random(),
        y: yPos !== undefined ? yPos : -0.1 - Math.random() * 0.2,
        speed: 0.0015 + Math.random() * 0.003,
        size: 9 + Math.floor(Math.random() * 12),
        opacity: 0.15 + Math.random() * 0.4,
        char: chars[Math.floor(Math.random() * chars.length)],
      };
    };

    // Initialize drops
    for (let i = 0; i < maxDrops; i++) {
      drops.push(spawnDrop(Math.random(), Math.random()));
    }

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(canvas);
    updateSize();

    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Translucent clear to leave very soft trails
      ctx.fillStyle = "rgba(4, 7, 14, 0.15)";
      ctx.fillRect(0, 0, w, h);

      // Render drops
      drops.forEach((drop, idx) => {
        drop.y += drop.speed;

        // Reset drop if it falls off bottom
        if (drop.y > 1.1) {
          drops[idx] = spawnDrop(Math.random(), -0.1);
          return;
        }

        const px = drop.x * w;
        const py = drop.y * h;

        ctx.font = `black ${drop.size}px "JetBrains Mono", monospace, "SF Mono"`;
        ctx.fillStyle = `rgba(16, 185, 129, ${drop.opacity})`; // Emerald green color
        
        // Add minimal glow for aesthetic cyberpunk feel
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = drop.size > 15 ? 4 : 1;
        ctx.fillText(drop.char, px, py);
        ctx.shadowBlur = 0; // Reset shadow immediately
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.4]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

export default function AffiliatePanel({ profile }: AffiliatePanelProps) {
  const referralCode = profile?.referralCode || "USER" + (profile?.id?.toString().substring(0, 6).toUpperCase() || "123456");
  const referralLink = `https://zeroxnetwork.ai.studio/ref/${referralCode}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 border border-slate-900 rounded-2xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-emerald-500/20 mt-6">
      
      {/* Dynamic green dollar rain animation */}
      <DollarRainBackground />

      {/* Cyber gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_80%)] pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-10 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-wider font-sans uppercase">
                Affiliate & Referral Engine
              </h3>
              <span className="text-[8.5px] font-black font-mono px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 rounded border border-emerald-500/20 tracking-widest uppercase">
                ACTIVE REVENUE
              </span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            INVITE • STREAM EARNINGS
          </p>
        </div>

        {/* Affiliate Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Total Referrals */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-slate-900 flex items-center gap-4 group hover:border-slate-800 transition duration-300">
            <div className="p-3 bg-slate-950 rounded-xl text-indigo-400 border border-slate-800/80 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Total Referrals
              </p>
              <p className="text-xl font-black font-mono text-slate-100">
                0
              </p>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-slate-900 flex items-center gap-4 group hover:border-slate-800 transition duration-300">
            <div className="p-3 bg-slate-950 rounded-xl text-emerald-400 border border-slate-800/80 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Total Earnings
              </p>
              <p className="text-xl font-black font-mono text-emerald-400">
                ₨ 0.0
              </p>
            </div>
          </div>

          {/* Commission Structure Box */}
          <div className="relative overflow-hidden bg-emerald-950/10 border border-emerald-900/40 rounded-xl p-4 sm:p-5 flex flex-col justify-center space-y-1 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-black font-mono text-emerald-400 uppercase">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Earn 5.0% on Deposits</span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Share your link and instantly accumulate earnings in real-time on every deposit they secure.
            </p>
          </div>

        </div>

        {/* Copy Referral Link Input Box */}
        <div className="space-y-2 pt-2">
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            YOUR SECURE REFERRAL NODE
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="flex-1 bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
            />
            <button 
              onClick={handleCopy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.2)] active:scale-[0.98]"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
