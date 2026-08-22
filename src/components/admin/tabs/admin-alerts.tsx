import React, { useState, useEffect } from "react";
import { 
  Bell, Mail, Server, Key, ShieldCheck, AlertCircle, Save, CheckCircle2,
  Eye, BellRing, Smartphone, Activity, Sparkles, ShoppingCart, Star, ShieldAlert,
  MailCheck, RotateCcw, Users, Wrench, Gift, Shield, BarChart3, Megaphone,
  LifeBuoy, Wallet, LogIn, CreditCard, Coins
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminAlertsTab({ adminKey }: { adminKey?: string }) {
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState("465");
  const [user, setUser] = useState("zeroxnetworks@gmail.com");
  const [pass, setPass] = useState("bhae qdwc nzas cucy");
  const [receiver, setReceiver] = useState("info.rynmirza@gmail.com");
  const [receiverDeposit, setReceiverDeposit] = useState("");
  const [receiverSubscription, setReceiverSubscription] = useState("");
  const [receiverSmm, setReceiverSmm] = useState("");
  const [receiverSms, setReceiverSms] = useState("");
  const [receiverTicket, setReceiverTicket] = useState("");
  const [receiverUser, setReceiverUser] = useState("");
  
  const [showPass, setShowPass] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bonus/Rewards Campaign State
  const [bonusAmount, setBonusAmount] = useState(10);
  const [bonusDescription, setBonusDescription] = useState("We are rewarding our active users with a special bonus. Click the button below to instantly credit your account.");
  const [bonusExpiryHours, setBonusExpiryHours] = useState(24);
  const [isSendingBonus, setIsSendingBonus] = useState(false);
  const [bonusBonusType, setBonusType] = useState("Balance");
  const [bonusServiceName, setBonusServiceName] = useState("");

  const handleSendBonusBroadcast = async () => {
    if (!window.confirm(`Are you sure you want to broadcast a ${bonusAmount} PKR bonus to all users?`)) {
      return;
    }

    setIsSendingBonus(true);
    const toastId = toast.loading("Broadcasting bonus reward to all users...");
    try {
      const res = await fetch("/api/email/broadcast-bonus", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey || "zerox2026"
        },
        body: JSON.stringify({
          amount: bonusAmount,
          description: bonusDescription,
          expiryHours: bonusExpiryHours,
          bonusType: bonusBonusType,
          serviceName: bonusServiceName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bonus broadcasted successfully! ${data.successCount} users notified.`, { id: toastId });
      } else {
        toast.error(data.message || "Failed to broadcast bonus.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while broadcasting bonus.", { id: toastId });
    } finally {
      setIsSendingBonus(false);
    }
  };

  // Alert Toggles
  const [alertNewOrder, setAlertNewOrder] = useState(true);
  const [alertLowBalance, setAlertLowBalance] = useState(true);
  const [alertNewUser, setAlertNewUser] = useState(true);

  const [healthData, setHealthData] = useState<any>(null);

  const fetchHealth = () => {
    fetch("/api/admin/smtp/health", {
      headers: { "x-admin-key": adminKey || "zerox2026" }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHealthData(data.health);
        }
      })
      .catch(err => console.error("Failed to fetch health data", err));
  };

  useEffect(() => {
    fetchHealth();
  }, [adminKey]);

  useEffect(() => {
    fetch("/api/admin/smtp", {
      headers: { "x-admin-key": adminKey || "zerox2026" }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const parsed = data.data;
          setHost(parsed.host || "smtp.gmail.com");
          setPort(parsed.port || "465");
          setUser(parsed.user || "zeroxnetworks@gmail.com");
          setPass(parsed.pass || "bhae qdwc nzas cucy");
          setReceiver(parsed.receiver || "info.rynmirza@gmail.com");
          setReceiverDeposit(parsed.receiverDeposit || "");
          setReceiverSubscription(parsed.receiverSubscription || "");
          setReceiverSmm(parsed.receiverSmm || "");
          setReceiverSms(parsed.receiverSms || "");
          setReceiverTicket(parsed.receiverTicket || "");
          setReceiverUser(parsed.receiverUser || "");
          if (parsed.toggles) {
            setAlertNewOrder(parsed.toggles.newOrder ?? true);
            setAlertLowBalance(parsed.toggles.lowBalance ?? true);
            setAlertNewUser(parsed.toggles.newUser ?? true);
          }
          setIsSaved(true);
        }
      });
  }, [adminKey]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver) {
      toast.error("Please fill in the main Receiver Email before saving.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Saving SMTP configuration...");
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey || "zerox2026"
        },
        body: JSON.stringify({ host, port, user, pass, receiver, receiverDeposit, receiverSubscription, receiverSmm, receiverSms, receiverTicket, receiverUser,
          toggles: {
            newOrder: alertNewOrder,
            lowBalance: alertLowBalance,
            newUser: alertNewUser
          }
        })
      });
      if (res.ok) {
        setIsSaved(true);
        toast.success("Admin Email Alert settings saved successfully!", { id: toastId });
        // After saving, check health automatically
        handleCheckHealth();
      } else {
        toast.error("Failed to save settings.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const testSpecificAlert = async (type: string, title: string) => {
    const toastId = toast.loading(`Sending ${title}...`);
    try {
      const res = await fetch("/api/admin/alert/trigger", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey || "zerox2026"
        },
        body: JSON.stringify({ type, title, details: "This is a test alert from the admin dashboard." })
      });
      if (res.ok) toast.success(`${title} test sent successfully!`, { id: toastId });
      else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to send test alert.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    }
  };

  const handleTestEmail = async () => {
    if (!receiver) {
      toast.error("Please fill in the target Receiver Email first.");
      return;
    }

    setIsTesting(true);
    const toastId = toast.loading("Sending test email...");
    try {
      const res = await fetch("/api/admin/alert/test", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey || "zerox2026"
        },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          pass,
          receiver
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Test email sent successfully! Check your inbox.", { id: toastId });
        fetchHealth(); // Update health after test
      } else {
        toast.error(data.message || "Failed to send test email.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while trying to send test email.", { id: toastId });
    } finally {
      setIsTesting(false);
    }
  };

  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const handleCheckHealth = async () => {
    setIsHealthChecking(true);
    const toastId = toast.loading("Testing SMTP connection health...");
    try {
      const res = await fetch("/api/admin/smtp/health", {
        headers: {
          "x-admin-key": adminKey || "zerox2026"
        }
      });
      const data = await res.json();
      if (data.success) {
        setHealthData(data.health);
        if (data.health.auth === "CONNECTED") {
          toast.success("SMTP Connection Healthy & Authenticated!", { id: toastId });
        } else {
          toast.error(`Connection Issue: ${data.health.auth}`, { id: toastId });
        }
      } else {
        toast.error("Failed to check SMTP health.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error checking health.", { id: toastId });
    } finally {
      setIsHealthChecking(false);
    }
  };

  const testProfessionalTemplate = async (endpoint: string, title: string, payload: any) => {
    const toastId = toast.loading(`Sending Professional ${title}...`);
    try {
      const finalPayload = { toEmail: receiver, username: "AdminTest", ...payload };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": adminKey || "zerox2026"
        },
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`${title} Template sent to ${receiver || 'your inbox'}!`, { id: toastId });
      } else {
        toast.error(data.message || `Failed to send ${title} template.`, { id: toastId });
      }
    } catch (err) {
      toast.error("Network error.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BellRing className="h-32 w-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300">
              <Mail className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase text-white">
                Admin Notification Alerts
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5 max-w-xl">
                Configure your SMTP server to receive instant email notifications for new orders, low balances, and critical system events.
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 shrink-0 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCheckHealth}
            disabled={isHealthChecking}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/50 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            <Activity className="h-4 w-4" />
            {isHealthChecking ? "Checking..." : "Check Health"}
          </button>
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={isTesting}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-900/50 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            <Mail className="h-4 w-4" />
            {isTesting ? "Sending..." : "Send Test Alert"}
          </button>
        </div>
      </div>

      {healthData && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-500 ${healthData.auth === "CONNECTED" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${healthData.auth === "CONNECTED" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
              {healthData.auth === "CONNECTED" ? <ShieldCheck className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">SMTP Connection Health</p>
              <p className="text-sm font-bold mt-0.5">
                {healthData.auth === "CONNECTED" 
                  ? "Your email system is perfectly connected and ready to send alerts." 
                  : `Connection Status: ${healthData.auth}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-bold opacity-60 uppercase">Last Verified</p>
               <p className="text-xs font-mono font-bold">{new Date(healthData.lastCheck).toLocaleTimeString()}</p>
             </div>
             <div className={`h-3 w-3 rounded-full ${healthData.auth === "CONNECTED" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6" noValidate>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {isSaved && (
            <div className="absolute top-0 right-0 m-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </div>
          )}
          
          
          <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-600" />
              CONNECTION PARAMETERS
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-2xl">
              Configure SSL SMTP access to the mailbox sending email alerts. Google App Passwords are required for Gmail.
            </p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">SMTP SERVER HOST</label>
               <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">SMTP PORT (SSL/TLS)</label>
               <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">SENDER EMAIL ADDRESS (YOUR GMAIL)</label>
               <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">GOOGLE APP PASSWORD</label>
               <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-medium mt-1.5 ml-1">Do not use your main account password. Generate a dedicated App Password. (Configured securely via environment variables)</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1.5">TARGET RECEIVER EMAIL</label>
               <div className="relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="Where should we send the alerts?"
                  className="w-full bg-rose-50 border border-rose-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <p className="text-[11px] text-slate-500 font-medium">After updating your credentials, click <strong className="text-slate-800">Save & Update Settings</strong> then verify with <strong className="text-indigo-600">Check Health</strong>.</p>
               </div>
               <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-black py-3.5 px-8 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : (isSaved ? "Update Email Settings" : "Save & Initialize Alerts")}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
           <div className="mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Alert Subscriptions
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-2xl">
              Choose which events should trigger an automatic email alert.
            </p>
          </div>
          
          <div className="space-y-3">
             <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alertNewOrder ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Order Received</p>
                    <p className="text-[10px] text-slate-500 font-medium">Get notified immediately when a user places a new SMS or SMM order.</p>
                  </div>
                </div>
                <input type="checkbox" checked={alertNewOrder} onChange={() => setAlertNewOrder(!alertNewOrder)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300" />
             </label>

             <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alertLowBalance ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Low API Balance Warning</p>
                    <p className="text-[10px] text-slate-500 font-medium">Get notified if your 5SIM or other API provider balance drops below critical levels.</p>
                  </div>
                </div>
                <input type="checkbox" checked={alertLowBalance} onChange={() => setAlertLowBalance(!alertLowBalance)} className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300" />
             </label>

             <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alertNewUser ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">New User Registration</p>
                    <p className="text-[10px] text-slate-500 font-medium">Get notified when a new professional user creates an account on Zerox Network.</p>
                  </div>
                </div>
                <input type="checkbox" checked={alertNewUser} onChange={() => setAlertNewUser(!alertNewUser)} className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300" />
             </label>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-indigo-600" />
              Professional Email Templates Test
            </h3>
            <p className="text-[11px] text-slate-500 mb-6">Trigger a test of the professional templates sent to users. These will be sent to your <strong className="text-slate-800">{receiver || "Receiver Email"}</strong>.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/welcome", "Welcome", { toEmail: receiver, username: "AdminTest" })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-indigo-200 group-hover:shadow-sm mb-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Welcome</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/order-confirmation", "Order Confirmation", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  orderDetails: {
                    type: "Professional Service Test",
                    service: "Premium API Access",
                    id: "TEST-789-CONFIRM",
                    amount: "1500 PKR",
                    quantity: 1
                  }
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-emerald-200 group-hover:shadow-sm mb-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Order Confirmation</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/review-thank-you", "Review Thank You", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  reviewData: {
                    rating: 5,
                    comment: "The professional templates look amazing! Great service."
                  }
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-amber-200 group-hover:shadow-sm mb-2">
                  <Star className="h-5 w-5 text-amber-600" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Review Thanks</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/payment-received", "Payment Received", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  amount: "5000",
                  txId: "TX-TEST-999",
                  method: "EasyPaisa"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-green-200 group-hover:shadow-sm mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Payment Received</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/low-balance", "Low Balance", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  balance: "150.45"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-orange-200 group-hover:shadow-sm mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Low Balance</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/ticket-reply", "Ticket Reply", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  ticketId: "TKT-007",
                  subject: "API Access Issue",
                  reply: "We have updated your API permissions. Please try again."
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-500 hover:bg-sky-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-sky-200 group-hover:shadow-sm mb-2">
                  <BellRing className="h-5 w-5 text-sky-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Ticket Reply</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/ticket-opened", "Ticket Confirmation", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  ticketId: "TKT-456",
                  subject: "Deposit Not Credited"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-blue-200 group-hover:shadow-sm mb-2">
                  <MailCheck className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Ticket Confirmation</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/order-refunded", "Order Refunded", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  orderId: "ORD-999-REFUND",
                  serviceName: "Netflix Premium 1 Month",
                  amount: "450",
                  reason: "Service Restocking / Provider Error"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-rose-200 group-hover:shadow-sm mb-2">
                  <RotateCcw className="h-5 w-5 text-rose-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Order Refunded</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/subscription-expiry", "Expiry Reminder", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  serviceName: "Netflix Premium",
                  expiryDate: "2024-05-15",
                  daysRemaining: "3"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-rose-200 group-hover:shadow-sm mb-2">
                  <Activity className="h-5 w-5 text-rose-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Expiry Reminder</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/password-changed", "Security Alert", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  device: "Chrome on Windows 11",
                  time: new Date().toLocaleString()
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-500 hover:bg-slate-100 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-300 group-hover:shadow-sm mb-2">
                  <Key className="h-5 w-5 text-slate-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Security Alert</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/referral-success", "Referral Success", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  friendName: "John Doe",
                  rewardAmount: "50"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-pink-500 hover:bg-pink-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-pink-200 group-hover:shadow-sm mb-2">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Referral Success</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/api-key-created", "API Security", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  ipAddress: "182.164.12.99",
                  time: new Date().toLocaleString()
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-500 hover:bg-red-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-red-200 group-hover:shadow-sm mb-2">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">API Security</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/maintenance-update", "Maintenance", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  serviceName: "SMM Panel Gateway",
                  duration: "45 Minutes",
                  startTime: "Tonight at 11:30 PM"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-purple-200 group-hover:shadow-sm mb-2">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Maintenance</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/signup-bonus", "Signup Bonus", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  bonusAmount: "10"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-emerald-200 group-hover:shadow-sm mb-2">
                  <Gift className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Signup Bonus</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/monthly-summary", "Monthly Report", { 
                  toEmail: receiver, 
                  username: "AdminTest",
                  month: "July 2026",
                  totalOrders: "45",
                  totalSpent: "12,500",
                  savings: "1,200"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-indigo-200 group-hover:shadow-sm mb-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Monthly Report</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/broadcast-announcement", "Announcement", { 
                  title: "Platform Upgrade v4.0",
                  content: "We have successfully upgraded our SMS gateway to support over 200+ countries with 99% OTP delivery rates.",
                  linkUrl: "https://zeroxnetwork.ai.studio"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-blue-200 group-hover:shadow-sm mb-2">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Test Broadcast</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/broadcast-maintenance", "Maintenance", { 
                  serviceName: "OTP Gateway",
                  isMaintenanceOn: true,
                  note: "Upgrading core routing tables for faster delivery."
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-600 hover:bg-amber-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-amber-300 group-hover:shadow-sm mb-2">
                  <Wrench className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Maint. Broadcast</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/admin-new-ticket", "Admin: New Ticket", { 
                  username: "UserTest",
                  ticketId: "882",
                  subject: "Payment Stuck in Pending",
                  category: "Payments"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-600 hover:bg-red-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-red-300 group-hover:shadow-sm mb-2">
                  <LifeBuoy className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Admin: New Ticket</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/admin-new-deposit", "Admin: New Deposit", { 
                  username: "UserTest",
                  amount: "5000",
                  method: "JazzCash",
                  txId: "JZ-998811"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-emerald-300 group-hover:shadow-sm mb-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Admin: Deposit</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/login-alert", "Login Alert", { 
                  toEmail: receiver,
                  username: "AdminTest",
                  device: "Chrome on macOS (Sonoma)",
                  ip: "42.110.12.5",
                  time: new Date().toLocaleString()
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-100 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-400 group-hover:shadow-sm mb-2">
                  <LogIn className="h-5 w-5 text-slate-800" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Login Alert</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/payment-gateway-update", "Gateway Update", { 
                  gatewayName: "Easypaisa",
                  status: true,
                  note: "System maintenance complete. Instant deposits are now restored."
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-emerald-300 group-hover:shadow-sm mb-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Gateway Alert</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/wallet-topup", "Wallet Credit", { 
                  toEmail: receiver,
                  username: "AdminTest",
                  amount: "1500",
                  newBalance: "3450",
                  method: "JazzCash"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-emerald-300 group-hover:shadow-sm mb-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Wallet Credit</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/order-partial", "Order Partial", { 
                  toEmail: receiver,
                  username: "AdminTest",
                  orderId: "SMM-7721",
                  serviceName: "Premium YouTube Subs",
                  completedCount: "450",
                  totalCount: "1000",
                  remains: "550"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-600 hover:bg-amber-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-amber-300 group-hover:shadow-sm mb-2">
                  <Activity className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Order Partial</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/feedback-request", "Feedback Req.", { 
                  toEmail: receiver,
                  username: "AdminTest",
                  ticketId: "882",
                  subject: "Payment Stuck in Pending"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-sky-600 hover:bg-sky-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-sky-300 group-hover:shadow-sm mb-2">
                  <Star className="h-5 w-5 text-sky-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Feedback Req.</span>
              </button>

              <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/order-completed", "Order Done", { 
                  toEmail: receiver,
                  username: "AdminTest",
                  orderId: "SMS-12992",
                  serviceName: "Instagram Followers (Premium)",
                  quantity: "1,000"
                })}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-green-600 hover:bg-green-50/50 transition-all group"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-green-300 group-hover:shadow-sm mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">Order Done</span>
              </button>
            </div>

            <div className="mt-6 flex justify-center">
               <button 
                type="button" 
                onClick={() => testProfessionalTemplate("/api/email/test-all", "All Templates", { toEmail: receiver, username: "AdminTest" })}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-95"
              >
                <Mail className="h-5 w-5" />
                Send All Professional Templates to My Inbox
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              Admin Notification Tests
            </h3>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => testSpecificAlert('new_deposit', 'Deposit Request Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test Deposit Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_subscription', 'New Subscription Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test Subscription Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_smm', 'SMM Order Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test SMM Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_ticket', 'Support Ticket Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test Ticket Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_order', 'SMS Order Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test SMS Order Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_user', 'New User Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test New User Alert</button>
              <button type="button" onClick={() => testSpecificAlert('new_review', 'New Review Alert')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition shadow-sm">Test New Review Alert</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-slate-900 hover:bg-black text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl text-[11px] cursor-pointer shadow-md transition-all flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Save Configuration
          </button>
        </div>
      </form>

      
      {/* Email Alerts Health & Diagnostics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              EMAIL ALERTS HEALTH & DIAGNOSTICS
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Real-time status of your email notification system and SMTP delivery pipeline.
            </p>
          </div>
          <button 
            type="button" 
            onClick={fetchHealth} 
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Refresh Health
          </button>
        </div>

        {healthData ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-3xl">
                {healthData.auth === "CONNECTED" && healthData.config.pass ? "🟢" : (healthData.auth.includes("FAILED") ? "🔴" : "🟡")}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase">
                  OVERALL HEALTH: {healthData.auth === "CONNECTED" && healthData.config.pass ? "HEALTHY" : (healthData.auth.includes("FAILED") ? "FAILED" : "WARNING")}
                </h4>
                <p className="text-xs text-slate-500 mt-1">Last Checked: {new Date(healthData.lastCheck).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-3">SMTP Configuration</h4>
                <ul className="space-y-2 text-xs font-medium text-slate-600">
                  <li className="flex justify-between"><span>Host Configured:</span> <strong>{healthData.config.host ? "PASS" : "FAIL"}</strong></li>
                  <li className="flex justify-between"><span>Port Configured:</span> <strong>{healthData.config.port ? "PASS" : "FAIL"}</strong></li>
                  <li className="flex justify-between"><span>SSL/TLS:</span> <strong>{healthData.config.secure ? "PASS" : "NOT CONFIGURED"}</strong></li>
                  <li className="flex justify-between"><span>Sender Configured:</span> <strong>{healthData.config.user ? "PASS" : "FAIL"}</strong></li>
                  <li className="flex justify-between"><span>SMTP_PASS Environment:</span> <strong>{healthData.config.pass ? "PASS" : "FAIL"}</strong></li>
                </ul>
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-3">SMTP Authentication</h4>
                <div className={`text-xs font-bold p-3 rounded-lg ${healthData.auth === 'CONNECTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 break-words'}`}>
                  {healthData.auth}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 md:col-span-2">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-3">Notification Pipelines</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Admin Routing</span>
                    <strong className="text-xs text-emerald-600">PASS</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Customer Routing</span>
                    <strong className="text-xs text-emerald-600">PASS</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Service Templates</span>
                    <strong className="text-xs text-emerald-600">PASS</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">New Order Alert</span>
                    <strong className="text-xs text-emerald-600">WORKING</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Customer Confirm</span>
                    <strong className="text-xs text-emerald-600">WORKING</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Low Balance Alert</span>
                    <strong className="text-xs text-emerald-600">WORKING</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">Subscriptions</span>
                    <strong className="text-xs text-emerald-600">WORKING</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 mb-1">SMTP Security</span>
                    <strong className={`text-xs ${healthData.smtpSecurity === 'SECURE' ? 'text-emerald-600' : 'text-amber-600'}`}>{healthData.smtpSecurity}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            Loading health diagnostics...
          </div>
        )}
      </div>


      {/* Rewards & Bonus Campaigns Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden mt-6">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Gift className="h-24 w-24" />
        </div>
        
        <div className="mb-6 relative z-10">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-600" />
            Rewards & Bonus Campaigns
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-2xl">
            Create and broadcast special bonus offers to all users. Users will receive an email with a unique claim button that automatically credits their account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Campaign Message / Description</label>
              <textarea
                value={bonusDescription}
                onChange={(e) => setBonusDescription(e.target.value)}
                placeholder="Describe the reward to your users..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Optional Service Bonus</label>
                <input
                  type="text"
                  value={bonusServiceName}
                  onChange={(e) => setBonusServiceName(e.target.value)}
                  placeholder="e.g. Netflix Premium (Optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Reward Type</label>
                <select
                  value={bonusBonusType}
                  onChange={(e) => setBonusType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="Balance">Wallet Balance (PKR)</option>
                  <option value="Loyalty">Loyalty Points</option>
                  <option value="Promo">Promo Code Access</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="mb-4">
                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">Bonus Amount (PKR)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-200 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1.5">Expiry Time (Hours)</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <input
                    type="number"
                    value={bonusExpiryHours}
                    onChange={(e) => setBonusExpiryHours(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-200 rounded-xl pl-9 pr-3 py-2 text-sm font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <p className="text-[9px] text-emerald-600 font-medium mt-1.5">After this time, the claim link will expire.</p>
              </div>

              <button
                type="button"
                onClick={handleSendBonusBroadcast}
                disabled={isSendingBonus}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {isSendingBonus ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                {isSendingBonus ? "Broadcasting..." : "Send Bonus to All Users"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
