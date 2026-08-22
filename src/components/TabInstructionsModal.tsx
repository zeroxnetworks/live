import React from "react";
import { X, Store, Globe, LayoutDashboard, Wallet, Briefcase, Code2, Ticket, Info, CheckCircle2, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TabInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export default function TabInstructionsModal({ isOpen, onClose, activeTab }: TabInstructionsModalProps) {
  if (!isOpen) return null;

  const tabDetails: Record<string, { title: string; icon: React.FC<any>; description: string; steps: string[] }> = {
    store: {
      title: "Virtual Numbers (SMS Gateway)",
      icon: Store,
      description: "Instantly purchase secure virtual numbers for SMS verifications. Perfect for creating accounts on platforms like WhatsApp, Telegram, Google, and more.",
      steps: [
        "Select your desired country from the catalog.",
        "Choose the service (e.g., WhatsApp, Telegram) you want to verify.",
        "Click on 'Get Virtual Number' to allocate your secure line.",
        "Use the provided number on the target platform.",
        "Wait for the SMS code to arrive on this dashboard.",
        "If the code doesn't arrive within 20 minutes, cancel the order to automatically refund your balance."
      ]
    },
    smm: {
      title: "SMM Services",
      icon: Globe,
      description: "Boost your social media presence with our high-quality SMM (Social Media Marketing) services.",
      steps: [
        "Browse the available categories (e.g., Instagram Followers, YouTube Views).",
        "Select a specific service that meets your requirements.",
        "Enter the target link (URL) where the service should be delivered.",
        "Specify the quantity (e.g., number of followers/likes).",
        "Review the calculated charge and place your order.",
        "Track the progress of your orders in the active orders section."
      ]
    },
    subscriptions: {
      title: "Premium Subscriptions",
      icon: Crown,
      description: "Get instant access to top-tier entertainment and digital services at unbeatable prices.",
      steps: [
        "Browse the available subscriptions in the store.",
        "Filter by category or search for a specific service.",
        "Click on 'Buy Now' for the desired subscription.",
        "Fill out the required details in the order form.",
        "Submit your order and wait for the administration to fulfill it.",
        "Check 'My Subscriptions' to view your order status and activation details."
      ]
    },
    dashboard: {
      title: "User Dashboard",
      icon: LayoutDashboard,
      description: "Your personalized command center for tracking activities, statistics, and recent interactions.",
      steps: [
        "Monitor your account balance and total expenditures.",
        "Review your recent SMS verification orders and their status.",
        "Track your recent SMM service orders.",
        "Access quick links to manage your profile and settings."
      ]
    },
    wallet: {
      title: "Wallet & Deposits",
      icon: Wallet,
      description: "Manage your funds, add balance to your account, and view your transaction history securely.",
      steps: [
        "Choose a preferred payment method (e.g., Easypaisa, JazzCash, Crypto).",
        "Follow the provided instructions to send the exact amount.",
        "Enter the transaction ID (TID) or Hash for verification.",
        "Submit the deposit request.",
        "Wait for the system or administrator to verify and approve your deposit.",
        "Once approved, your balance will be updated instantly."
      ]
    },
    seller: {
      title: "Reseller Portal",
      icon: Briefcase,
      description: "Start your own business by utilizing our reseller tools, API keys, and wholesale pricing.",
      steps: [
        "Access your unique Developer API Key for integrations.",
        "Review wholesale pricing and discount tiers.",
        "Integrate our API into your own platform or application.",
        "Track your reseller statistics and profit margins.",
        "Contact support if you need a customized bulk pricing plan."
      ]
    },
    api: {
      title: "Developer API",
      icon: Code2,
      description: "Comprehensive documentation for developers to integrate our services programmatically.",
      steps: [
        "Generate or retrieve your API Key.",
        "Read the endpoints documentation for purchasing numbers, fetching prices, and getting SMS.",
        "Use the provided code snippets (cURL, Python, Node.js) to test endpoints.",
        "Ensure you pass your API Key securely in the headers.",
        "Handle webhooks or polling efficiently as per the guidelines."
      ]
    },
    tickets: {
      title: "Support Tickets",
      icon: Ticket,
      description: "Need help? Create a support ticket to reach our administration team directly.",
      steps: [
        "Click on 'Create New Ticket'.",
        "Provide a clear subject summarizing your issue.",
        "Describe your problem in detail, including order IDs or transaction IDs if applicable.",
        "Submit the ticket and wait for a response.",
        "You can reply to open tickets and close them once the issue is resolved."
      ]
    },
    about: {
      title: "About Network",
      icon: Info,
      description: "Learn more about our platform's mission, terms of service, and official contact channels.",
      steps: [
        "Read about our core values and operational standards.",
        "Review our terms of service and privacy policies.",
        "Find official links to our Telegram channels, WhatsApp support, or social media.",
        "Check system status and network health."
      ]
    }
  };

  const info = tabDetails[activeTab] || tabDetails["store"];
  const Icon = info.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">How to use this tab</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{info.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {info.description}
            </p>

            <div className="space-y-4">
              <h3 className="text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Step-by-Step Guide</h3>
              {info.steps.map((step, index) => (
                <div key={index} className="flex gap-3 items-start group">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed pt-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Got it, thanks!
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
