import React from "react";
import * as Icons from "lucide-react";

export interface ServiceIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getServiceConfig(serviceKey: string = ""): ServiceIconConfig {
  const key = (serviceKey || "").toLowerCase().trim();

  if (key.includes("whatsapp") || key === "wa") {
    return {
      icon: Icons.MessageSquare,
      name: "WhatsApp",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-950/40",
      textClass: "text-emerald-500",
      borderClass: "border-emerald-500/20"
    };
  }
  if (key.includes("telegram") || key === "tg") {
    return {
      icon: Icons.Send,
      name: "Telegram",
      bgClass: "bg-sky-500/10 dark:bg-sky-950/40",
      textClass: "text-sky-500",
      borderClass: "border-sky-500/20"
    };
  }
  if (key.includes("google") || key.includes("gmail") || key === "go") {
    return {
      icon: Icons.Chrome,
      name: "Google / Gmail",
      bgClass: "bg-red-500/10 dark:bg-red-950/40",
      textClass: "text-red-500",
      borderClass: "border-red-500/20"
    };
  }
  if (key.includes("openai") || key.includes("chatgpt") || key.includes("gpt")) {
    return {
      icon: Icons.Cpu,
      name: "OpenAI / ChatGPT",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-950/40",
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/30"
    };
  }
  if (key.includes("tiktok") || key.includes("douyin")) {
    return {
      icon: Icons.Music,
      name: "TikTok",
      bgClass: "bg-pink-500/10 dark:bg-pink-950/40",
      textClass: "text-pink-500",
      borderClass: "border-pink-500/20"
    };
  }
  if (key.includes("discord") || key === "ds") {
    return {
      icon: Icons.Gamepad2,
      name: "Discord",
      bgClass: "bg-indigo-500/10 dark:bg-indigo-950/40",
      textClass: "text-indigo-400",
      borderClass: "border-indigo-500/20"
    };
  }
  if (key.includes("facebook") || key.includes("meta") || key === "fb") {
    return {
      icon: Icons.Share2,
      name: "Facebook",
      bgClass: "bg-blue-600/10 dark:bg-blue-950/40",
      textClass: "text-blue-500",
      borderClass: "border-blue-500/20"
    };
  }
  if (key.includes("instagram") || key.includes("insta") || key === "ig") {
    return {
      icon: Icons.Camera,
      name: "Instagram",
      bgClass: "bg-pink-600/10 dark:bg-pink-950/40",
      textClass: "text-pink-500",
      borderClass: "border-pink-500/20"
    };
  }
  if (key.includes("twitter") || key.includes("x.com") || key === "tw") {
    return {
      icon: Icons.AtSign,
      name: "Twitter / X",
      bgClass: "bg-slate-500/10 dark:bg-slate-900/60",
      textClass: "text-slate-400",
      borderClass: "border-slate-500/20"
    };
  }
  if (key.includes("netflix")) {
    return {
      icon: Icons.Film,
      name: "Netflix",
      bgClass: "bg-red-600/10 dark:bg-red-950/40",
      textClass: "text-red-500",
      borderClass: "border-red-500/20"
    };
  }
  if (key.includes("amazon") || key.includes("aws")) {
    return {
      icon: Icons.ShoppingBag,
      name: "Amazon",
      bgClass: "bg-amber-500/10 dark:bg-amber-950/40",
      textClass: "text-amber-500",
      borderClass: "border-amber-500/20"
    };
  }
  if (key.includes("microsoft") || key.includes("outlook") || key.includes("hotmail")) {
    return {
      icon: Icons.LayoutGrid,
      name: "Microsoft",
      bgClass: "bg-blue-500/10 dark:bg-blue-950/40",
      textClass: "text-blue-400",
      borderClass: "border-blue-500/20"
    };
  }
  if (key.includes("apple") || key.includes("icloud")) {
    return {
      icon: Icons.Smartphone,
      name: "Apple",
      bgClass: "bg-slate-400/10 dark:bg-slate-800/40",
      textClass: "text-slate-300",
      borderClass: "border-slate-400/20"
    };
  }
  if (key.includes("steam")) {
    return {
      icon: Icons.Gamepad,
      name: "Steam",
      bgClass: "bg-blue-700/10 dark:bg-blue-950/40",
      textClass: "text-blue-400",
      borderClass: "border-blue-500/20"
    };
  }
  if (key.includes("tinder")) {
    return {
      icon: Icons.Flame,
      name: "Tinder",
      bgClass: "bg-rose-500/10 dark:bg-rose-950/40",
      textClass: "text-rose-500",
      borderClass: "border-rose-500/20"
    };
  }
  if (key.includes("uber")) {
    return {
      icon: Icons.Car,
      name: "Uber",
      bgClass: "bg-slate-600/10 dark:bg-slate-900/50",
      textClass: "text-slate-300",
      borderClass: "border-slate-500/20"
    };
  }
  if (key.includes("paypal")) {
    return {
      icon: Icons.CreditCard,
      name: "PayPal",
      bgClass: "bg-blue-600/10 dark:bg-blue-950/40",
      textClass: "text-blue-400",
      borderClass: "border-blue-500/20"
    };
  }
  if (key.includes("snapchat")) {
    return {
      icon: Icons.Sparkles,
      name: "Snapchat",
      bgClass: "bg-yellow-400/10 dark:bg-yellow-950/40",
      textClass: "text-yellow-400",
      borderClass: "border-yellow-500/20"
    };
  }

  // Default fallback
  const displayName = serviceKey ? serviceKey.charAt(0).toUpperCase() + serviceKey.slice(1) : "SMS Activation";
  return {
    icon: Icons.Hash,
    name: displayName,
    bgClass: "bg-cyan-500/10 dark:bg-cyan-950/40",
    textClass: "text-[#00AEEF]",
    borderClass: "border-cyan-500/20"
  };
}

export function DynamicServiceIcon({ serviceKey, className = "h-5 w-5" }: { serviceKey: string; className?: string }) {
  const config = getServiceConfig(serviceKey);
  const IconComp = config.icon;
  return <IconComp className={className} />;
}
