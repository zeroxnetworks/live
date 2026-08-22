import React, { useEffect, useRef, useState } from "react";
import { 
  Wallet, CheckCircle2, Copy, Check, ShieldCheck, Sparkles, ArrowUpRight 
} from "lucide-react";
import { motion, useSpring, useTransform } from "motion/react";
import { UserAccount } from "../types";
import { toast } from "react-hot-toast";

interface ProfileWalletCardProps {
  currentUser: UserAccount;
  cryptoRate?: number;
  formatPrice?: (baseUnits: number) => string;
  onTopUp?: () => void;
  isAdmin?: boolean;
  adminRole?: string;
  onOpenAdminPortal?: () => void;
  className?: string;
  showAdminButton?: boolean;
}

// Interactive Background Network Canvas
function TechNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Subtle technology nodes
    const nodeCount = 18;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 1.2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint geometric grid accents
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 42;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw node with glow
        const currentRadius = node.radius + Math.sin(node.pulse) * 0.6;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.65)";
        ctx.shadowColor = "rgba(96, 165, 250, 0.8)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect with nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.18;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(165, 180, 252, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[28px]"
      style={{ opacity: 0.85 }}
    />
  );
}

// Count-up Animated Number Component
function AnimatedBalance({ value }: { value: number }) {
  const springValue = useSpring(value, {
    stiffness: 75,
    damping: 18,
    mass: 0.8,
  });

  const [displayValue, setDisplayValue] = useState(value.toFixed(2));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(latest.toFixed(2));
    });
  }, [springValue]);

  return <span>{displayValue}</span>;
}

export default function ProfileWalletCard({
  currentUser,
  cryptoRate = 278,
  formatPrice,
  onTopUp,
  isAdmin = false,
  adminRole,
  onOpenAdminPortal,
  className = "",
  showAdminButton = true,
}: ProfileWalletCardProps) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    toast.success("User ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // PKR calculation: user balance in USD * cryptoRate
  const balancePkr = (currentUser.balance || 0) * cryptoRate;
  const balanceUsd = currentUser.balance || 0;

  // Short ID display
  const shortId = currentUser.id 
    ? `${currentUser.id.slice(0, 12)}...` 
    : "ID: 0x0000...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative w-full rounded-[28px] overflow-hidden p-6 sm:p-7 text-white select-none transition-all duration-300 ${className}`}
      style={{
        background: "linear-gradient(135deg, #091129 0%, #153488 28%, #1D4ED8 58%, #4338CA 82%, #3730A3 100%)",
        boxShadow: "0 20px 40px -15px rgba(29, 78, 216, 0.45), 0 0 30px -5px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.18)"
      }}
    >
      {/* Background Animated Tech Network */}
      <TechNetworkCanvas />

      {/* Futuristic Radial Glow Highlights */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-12 w-48 h-48 bg-blue-600/30 rounded-full blur-2xl pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-between h-full gap-6 sm:gap-7">
        
        {/* TOP: Profile Area */}
        <div className="flex items-center gap-4 sm:gap-5">
          
          {/* Avatar with luminous ring and animated aura */}
          <div className="relative shrink-0">
            {/* Luminous Animated Aura Ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 opacity-70 blur-xs animate-[pulse_3s_ease-in-out_infinite]" />
            
            {/* Inner Ring with Glass Depth */}
            <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full p-[2.5px] bg-gradient-to-b from-white/90 via-cyan-300/80 to-blue-600 shadow-md flex items-center justify-center">
              <img
                src={currentUser.avatarUrl || "https://cdn.phototourl.com/member/2026-07-24-b4f94510-1a75-430c-9101-a1527cb13f05.png"}
                alt={currentUser.username || "Profile"}
                className="w-full h-full rounded-full object-cover bg-slate-900"
              />

              {/* Status Indicator (Green Online with Glass Ring & Checkmark) */}
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.7)] border-2 border-slate-950 backdrop-blur-md"
                title="Active Account Status"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
              </div>
            </div>
          </div>

          {/* User Details & Status */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-xs">
                {currentUser.username || "RynMirza"}
              </h2>

              {/* ACTIVE or Admin Badge */}
              {isAdmin ? (
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md ${
                  adminRole?.toUpperCase().includes("PRIMARY") || adminRole?.toUpperCase().includes("SUPER")
                    ? "bg-amber-400 text-slate-950 border border-amber-300"
                    : adminRole?.toUpperCase().includes("FINANCIAL")
                    ? "bg-emerald-400 text-slate-950 border border-emerald-300"
                    : "bg-cyan-300 text-slate-950 border border-cyan-200"
                }`}>
                  <ShieldCheck className="w-3 h-3 shrink-0 text-slate-950" />
                  <span>{adminRole || "ADMIN"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/25 border border-white/20 text-white shadow-2xs backdrop-blur-md transition-colors">
                  ACTIVE
                </span>
              )}
            </div>

            {/* Email Address */}
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium truncate mt-0.5 tracking-normal">
              {currentUser.email || "info.rynmirza@gmail.com"}
            </p>

            {/* User ID with one-click copy */}
            <button
              onClick={handleCopyId}
              type="button"
              className="group/id inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-blue-200/80 hover:text-white font-mono mt-1 transition-colors cursor-pointer w-fit"
              title="Click to copy User ID"
            >
              <span>ID: {shortId}</span>
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-300 animate-scale" />
              ) : (
                <Copy className="w-3 h-3 opacity-60 group-hover/id:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
        </div>

        {/* BOTTOM: Wallet Area with Strong Visual Separation */}
        <div className="pt-5 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          
          {/* Wallet Balance Display */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-widest text-blue-200/90">
                WALLET BALANCE
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              {/* Primary Balance Display (PKR / Rs format) */}
              <div className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white font-mono tracking-tight leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-100/90">Rs</span>
                <AnimatedBalance value={balancePkr} />
              </div>

              {/* Secondary USD Tag */}
              <span className="text-xs font-bold text-cyan-200/90 font-mono bg-white/10 px-2 py-0.5 rounded-md border border-white/15 backdrop-blur-xs">
                ${balanceUsd.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Action Buttons: Top Up & Admin Portal (if applicable) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {isAdmin && showAdminButton && onOpenAdminPortal && (
              <button
                onClick={onOpenAdminPortal}
                type="button"
                className="flex-1 sm:flex-initial bg-slate-950/80 hover:bg-slate-950 text-amber-300 border border-amber-400/40 hover:border-amber-300 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 backdrop-blur-md"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Premium White/Glass Top Up Button */}
            <button
              onClick={onTopUp}
              type="button"
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-700 hover:text-blue-800 font-extrabold px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 group/btn border border-white"
            >
              <Wallet className="w-4 h-4 text-blue-600 group-hover/btn:scale-110 transition-transform duration-200" />
              <span>Top Up</span>
            </button>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
