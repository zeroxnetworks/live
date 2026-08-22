import React, { useState } from "react";
import { motion } from "motion/react";

interface ZXLogoProps {
  size?: number;
  interactive?: boolean;
  withBackground?: boolean;
  className?: string;
}

export const ZXLogo: React.FC<ZXLogoProps> = ({
  size = 120,
  interactive = true,
  withBackground = true,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Geometric path definitions for viewBox="0 0 100 100"
  // Symmetrical Modern Bold Z
  const zPath = "M 22 22 L 78 22 L 78 34 L 42 66 L 78 66 L 78 78 L 22 78 L 22 66 L 58 34 L 22 34 Z";

  // Stylized Symmetrical Futuristic X (composed of two crossing polygons for sharp modern overlay style)
  const xLeftBar = "M 26 22 L 38 22 L 74 78 L 62 78 Z";
  const xRightBar = "M 74 22 L 62 22 L 26 78 L 38 78 Z";

  // Outline paths for traveling neon lights (exact contours)
  const xOutlineCombined = "M 26 22 L 38 22 L 74 78 L 62 78 Z M 74 22 L 62 22 L 26 78 L 38 78 Z";

  return (
    <div
      id="zx-logo"
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Background Frame with Soft Vignette and Blue Ambient Glow */}
      {withBackground && (
        <div className="absolute inset-0 rounded-2xl bg-black overflow-hidden border border-neutral-900/40 shadow-2xl">
          {/* Ambient Blue Backlight Glow */}
          <motion.div
            className="absolute inset-0 bg-blue-600/10 blur-[35px]"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Radial Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />
        </div>
      )}

      {/* Floating Wrapper */}
      <motion.div
        className="relative flex items-center justify-center w-full h-full"
        animate={{
          y: [-2, 2, -2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: "90%", height: "90%" }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Matte Black Metal Gradient with Sharp Reflections for "Z" */}
            <linearGradient id="z-metal-base" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1e24" />
              <stop offset="35%" stopColor="#0d0d10" />
              <stop offset="50%" stopColor="#1a1a20" />
              <stop offset="75%" stopColor="#050507" />
              <stop offset="100%" stopColor="#151518" />
            </linearGradient>

            {/* Live Moving Metallic Shine Gradient */}
            <linearGradient id="z-shine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="20%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Electric Blue Gradient for "X" */}
            <linearGradient id="x-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00AEEF" />
              <stop offset="100%" stopColor="#007BFF" />
            </linearGradient>

            {/* Edge bevel highlight for 3D depth */}
            <linearGradient id="bevel-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </linearGradient>

            {/* Intense Neon Glow Filters */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="6" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Laser Draw Reveal Clip Path */}
            <clipPath id="laser-clip">
              <motion.rect
                x="-10"
                y="-10"
                height="120"
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            </clipPath>
          </defs>

          {/* LAYER 1: The Matte Black "Z" with metallic shine */}
          <g filter="url(#subtle-shadow)">
            {/* Base "Z" Path */}
            <motion.path
              d={zPath}
              fill="url(#z-metal-base)"
              stroke="url(#bevel-light)"
              strokeWidth="0.75"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            />

            {/* Animated Metallic Shine Sweep across "Z" */}
            <motion.path
              d={zPath}
              fill="url(#z-shine)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
              style={{ mixBlendMode: "overlay" }}
            />
          </g>

          {/* LAYER 2: The Electric Blue "X" Overlapping "Z" */}
          <g filter="url(#subtle-shadow)" clipPath="url(#laser-clip)">
            {/* Left part of X */}
            <motion.path
              d={xLeftBar}
              fill="url(#x-blue-gradient)"
              stroke="#ffffff"
              strokeOpacity="0.15"
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            {/* Right part of X */}
            <motion.path
              d={xRightBar}
              fill="url(#x-blue-gradient)"
              stroke="#ffffff"
              strokeOpacity="0.15"
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            />

            {/* Thin Neon-Blue Edge Glow around X */}
            <motion.path
              d={xOutlineCombined}
              fill="none"
              stroke="#00AEEF"
              strokeWidth="1.5"
              opacity="0.9"
              filter="url(#neon-glow)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ mixBlendMode: "screen" }}
            />

            {/* Beveled edge highlight on the X */}
            <path
              d={xOutlineCombined}
              fill="none"
              stroke="url(#bevel-light)"
              strokeWidth="0.75"
              style={{ mixBlendMode: "overlay" }}
              pointerEvents="none"
            />
          </g>

          {/* LAYER 3: Traveling Neon Light Spark (laser traveling around X edges) */}
          <g clipPath="url(#laser-clip)">
            <motion.path
              d={xOutlineCombined}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              filter="url(#neon-glow)"
              strokeDasharray="22 180"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -202 }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ mixBlendMode: "screen" }}
            />
          </g>
        </svg>
      </motion.div>

      {/* Interactive Hover Glow Ring */}
      {interactive && isHovered && (
        <motion.div
          className="absolute -inset-1 rounded-3xl border border-blue-500/30 bg-blue-500/5 filter blur-[2px] pointer-events-none"
          layoutId="hoverGlow"
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
};
