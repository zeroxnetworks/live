import React, { useState } from "react";
import { 
  Code2, Copy, Check, Eye, EyeOff, Terminal, Key, ShieldCheck, 
  HelpCircle, ChevronRight, Zap, RefreshCw, Layers, CheckCircle2, 
  AlertTriangle, Play, ArrowUpRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserAccount } from "../types";

interface ApiDocsProps {
  currentUser: any; // UserAccount | null
  setActiveTab: (tab: any) => void;
}

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  actionName: string;
  desc: string;
  params: { name: string; type: string; required: boolean; desc: string }[];
  snippets: {
    curl: string;
    python: string;
    javascript: string;
    go: string;
  };
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "profile",
    method: "GET",
    path: "/api/v1/user/profile",
    actionName: "Retrieve Profile & Balance",
    desc: "Fetch details of the authenticated account, including current balance, user privileges, and rating thresholds.",
    params: [],
    snippets: {
      curl: `curl -X GET "https://zeroxnetwork.ai.studio/api/v1/user/profile" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      python: `import requests

url = "https://zeroxnetwork.ai.studio/api/v1/user/profile"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
      javascript: `fetch("https://zeroxnetwork.ai.studio/api/v1/user/profile", {
  method: "GET",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      go: `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {
	req, _ := http.NewRequest("GET", "https://zeroxnetwork.ai.studio/api/v1/user/profile", nil)
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
    },
    response: `{
  "status": "success",
  "data": {
    "user_id": "usr_9a8b7c6d",
    "email": "developer@example.com",
    "balance": 450.50,
    "rating": 4.8,
    "currency": "PKR",
    "active_orders_count": 0
  }
}`
  },
  {
    id: "purchase",
    method: "POST",
    path: "/api/v1/purchase/number",
    actionName: "Request Virtual Number",
    desc: "Order a temporary virtual number for a specific country and service. This will reserve the line and deduct the cost from your balance.",
    params: [
      { name: "country", type: "string", required: true, desc: "Name or key identifier of the country (e.g. 'pakistan', 'united_kingdom')" },
      { name: "service", type: "string", required: true, desc: "Target service application (e.g. 'whatsapp', 'telegram', 'google')" }
    ],
    snippets: {
      curl: `curl -X POST "https://zeroxnetwork.ai.studio/api/v1/purchase/number" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "pakistan",
    "service": "whatsapp"
  }'`,
      python: `import requests

url = "https://zeroxnetwork.ai.studio/api/v1/purchase/number"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "country": "pakistan",
    "service": "whatsapp"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
      javascript: `fetch("https://zeroxnetwork.ai.studio/api/v1/purchase/number", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    country: "pakistan",
    service: "whatsapp"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      go: `package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io"
)

func main() {
	jsonData := []byte(\`{"country": "pakistan", "service": "whatsapp"}\`)
	req, _ := http.NewRequest("POST", "https://zeroxnetwork.ai.studio/api/v1/purchase/number", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
    },
    response: `{
  "status": "success",
  "data": {
    "order_id": "ord_5521948",
    "phone_number": "+923129876543",
    "country": "pakistan",
    "service": "whatsapp",
    "price": 180.00,
    "expires_at": "2026-07-23T13:10:00Z",
    "sms_received": null
  }
}`
  },
  {
    id: "check",
    method: "GET",
    path: "/api/v1/check/{order_id}",
    actionName: "Fetch Code / Status",
    desc: "Poll the activation status of your purchased number. If an SMS arrives, the OTP code will be returned inside the payload.",
    params: [
      { name: "order_id", type: "string", required: true, desc: "The unique order identifier received during purchase." }
    ],
    snippets: {
      curl: `curl -X GET "https://zeroxnetwork.ai.studio/api/v1/check/ord_5521948" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      python: `import requests

url = "https://zeroxnetwork.ai.studio/api/v1/check/ord_5521948"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
print(response.json())`,
      javascript: `fetch("https://zeroxnetwork.ai.studio/api/v1/check/ord_5521948", {
  method: "GET",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
      go: `package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {
	req, _ := http.NewRequest("GET", "https://zeroxnetwork.ai.studio/api/v1/check/ord_5521948", nil)
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
    },
    response: `{
  "status": "success",
  "data": {
    "order_id": "ord_5521948",
    "status": "received",
    "sms_text": "Your WhatsApp code: 294-817",
    "otp_code": "294817",
    "received_at": "2026-07-23T12:54:12Z"
  }
}`
  },
  {
    id: "complete",
    method: "POST",
    path: "/api/v1/order/status",
    actionName: "Complete or Cancel Order",
    desc: "Finalize a transaction once the activation is successful, or cancel/refund a line if no SMS is received.",
    params: [
      { name: "order_id", type: "string", required: true, desc: "The order identifier." },
      { name: "action", type: "string", required: true, desc: "Transition state: 'cancel' to release and refund, 'finish' to seal successfully." }
    ],
    snippets: {
      curl: `curl -X POST "https://zeroxnetwork.ai.studio/api/v1/order/status" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ord_5521948",
    "action": "finish"
  }'`,
      python: `import requests

url = "https://zeroxnetwork.ai.studio/api/v1/order/status"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "order_id": "ord_5521948",
    "action": "finish"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
      javascript: `fetch("https://zeroxnetwork.ai.studio/api/v1/order/status", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    order_id: "ord_5521948",
    action: "finish"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
      go: `package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io"
)

func main() {
	jsonData := []byte(\`{"order_id": "ord_5521948", "action": "finish"}\`)
	req, _ := http.NewRequest("POST", "https://zeroxnetwork.ai.studio/api/v1/order/status", bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
    },
    response: `{
  "status": "success",
  "message": "Order ord_5521948 successfully finalized."
}`
  }
];

export default function ApiDocs({ currentUser, setActiveTab }: ApiDocsProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [selectedLang, setSelectedLang] = useState<"curl" | "python" | "javascript" | "go">("curl");
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Simulation Interactive state
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResponse, setSimulationResponse] = useState<string | null>(null);

  const rawKey = currentUser?.apiKey || "";
  const apiStatus = currentUser?.apiStatus || "Disabled";

  const handleGenerateKey = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    try {
      const newKey = "sk_live_" + Math.random().toString(36).substr(2, 24) + Date.now().toString(36);
      await updateDoc(doc(db, "users", currentUser.id), { 
        apiKey: newKey,
        apiStatus: apiStatus === "Disabled" ? "Pending" : apiStatus
      });

      // Trigger API Key Security Alert Email
      fetch("/api/email/api-key-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: currentUser.email,
          username: currentUser.username,
          ipAddress: "User Terminal",
          time: new Date().toLocaleString()
        })
      }).catch(err => console.error("API Security alert failed", err));

      toast.success("New API key generated successfully. Awaiting approval if not already verified.");
    } catch (e) {
      toast.error("Failed to generate API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyKey = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopiedKey(true);
    toast.success("API Token copied securely!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimulationResponse(null);
    setTimeout(() => {
      setSimulating(false);
      setSimulationResponse(selectedEndpoint.response);
      toast.success("Sandbox API request finished successfully!");
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-800">
      
      {/* Premium Elegant Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none transform select-none">
          <Code2 className="w-[500px] h-[500px]" />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-indigo-300">
              <Zap className="w-3 h-3 text-amber-400" />
              Developer API Portal v1.0
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-2 text-slate-100">
              Automated API Integration
            </h2>
          </div>

          <p className="max-w-3xl text-slate-300 text-sm sm:text-base leading-relaxed font-light">
            Empower your infrastructure with programmatic virtual line access. Streamline temporary SMS verifications, OTP activations, and social promotions directly through our reliable and low-latency REST endpoints.
          </p>
        </div>
      </div>

      {/* API Key Credentials Panel */}
      {currentUser ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Your Secure API Credentials</h3>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase flex items-center gap-1 ${
              apiStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60' : 
              apiStatus === 'Suspended' ? 'bg-red-50 text-red-700 border-red-100/60' : 
              apiStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100/60' : 
              'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" /> {apiStatus === 'Verified' ? 'Authorization Active' : apiStatus}
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                API Secret Key (Bearer Token)
              </label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <input
                    type={isKeyVisible ? "text" : "password"}
                    readOnly
                    value={rawKey ? rawKey : "No API key generated."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3.5 pr-12 py-2.5 text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={isKeyVisible ? "Hide Key" : "Show Key"}
                  >
                    {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    disabled={!rawKey}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-amber-600 bg-amber-50 border border-amber-200/60 p-3 rounded-xl text-xs leading-relaxed font-light">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Confidentiality Warning:</strong> Keep this API key private at all times. Programmatic access authorizes instant purchases directly from your primary store balance.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-600" />
              Programmatic API Credentials
            </h3>
            <p className="text-xs text-slate-600 font-light leading-relaxed">
              Authenticate your requests using personalized Bearer keys. Log in or create an account to provision your keys instantly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95 cursor-pointer shrink-0 self-start md:self-center"
          >
            Authenticate / Log In
          </button>
        </div>
      )}

      {/* Interactive Docs Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Endpoint Navigation & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-6">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
              API Reference Index
            </h4>

            {/* Endpoints Selection Stack */}
            <div className="space-y-2.5">
              {ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setSimulationResponse(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer outline-none ${
                      isSelected
                        ? "bg-indigo-50/60 border-indigo-300 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                          ep.method === "GET" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                            : "bg-blue-50 text-blue-700 border border-blue-200/50"
                        }`}>
                          {ep.method}
                        </span>
                        <span className={`font-mono text-[11px] truncate ${isSelected ? "text-indigo-900 font-bold" : "text-slate-600 font-semibold"}`}>
                          {ep.path}
                        </span>
                      </div>
                      <span className="block text-xs font-bold text-slate-800 leading-snug">
                        {ep.actionName}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition ${isSelected ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:text-slate-400"}`} />
                  </button>
                );
              })}
            </div>

            {/* Description card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Endpoint Description
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-light">
                {selectedEndpoint.desc}
              </p>
            </div>

            {/* Parameters Block */}
            <div className="space-y-3.5">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Query / Body Parameters
              </span>

              {selectedEndpoint.params.length > 0 ? (
                <div className="space-y-3">
                  {selectedEndpoint.params.map((p) => (
                    <div key={p.name} className="flex items-start gap-3 text-xs">
                      <div className="space-y-0.5 shrink-0 w-24">
                        <span className="font-mono font-bold text-indigo-700 block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 italic font-mono block">
                          {p.type} {p.required ? "• required" : ""}
                        </span>
                      </div>
                      <p className="text-slate-500 font-light leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No parameters required for this request.</p>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Code Snippets & Response Sandbox (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Playground Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Developer Sandbox</h3>
              </div>

              {/* Languages Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(["curl", "python", "javascript", "go"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition uppercase tracking-wider cursor-pointer ${
                      selectedLang === lang
                        ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {lang === "javascript" ? "Node.JS" : lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Window */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Request Snippet ({selectedLang})</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedEndpoint.snippets[selectedLang])}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950 text-[10px] font-mono text-slate-400">
                  <span>code_example.{selectedLang === "javascript" ? "js" : selectedLang === "python" ? "py" : selectedLang === "go" ? "go" : "sh"}</span>
                  <span className="text-indigo-400">Live Workspace</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre select-all">
                    {selectedEndpoint.snippets[selectedLang]}
                  </pre>
                </div>
              </div>
            </div>

            {/* Sandbox Execution Trigger */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Trigger Sandbox Test</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                  Simulate a real call to this API endpoint using mock test credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={runSimulation}
                disabled={simulating}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-55 cursor-pointer shrink-0"
              >
                {simulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                )}
                <span>{simulating ? "Executing..." : "Run Test Call"}</span>
              </button>
            </div>

            {/* Response Output Console */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                API Response Payload (JSON)
              </span>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950 text-[10px] font-mono text-slate-400">
                  <span>response_payload.json</span>
                  <span className="text-emerald-400">HTTP/1.1 200 OK</span>
                </div>
                <div className="p-4 overflow-x-auto min-h-[140px] flex flex-col justify-start">
                  <AnimatePresence mode="wait">
                    {simulating ? (
                      <motion.div
                        key="simulating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-6 text-slate-500 gap-2 font-mono text-xs"
                      >
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        <span>HTTP GET Request sent, waiting...</span>
                      </motion.div>
                    ) : simulationResponse ? (
                      <motion.pre
                        key="payload"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-indigo-300 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all"
                      >
                        {simulationResponse}
                      </motion.pre>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-6 text-slate-600 gap-1.5 text-center"
                      >
                        <Terminal className="w-6 h-6 text-slate-700" />
                        <span className="font-mono text-xs">Console Idle. Run Test Call above.</span>
                        <p className="text-[10px] text-slate-500 leading-normal max-w-xs font-light">
                          Clicking "Run Test Call" performs a real-time visualization of the response schema.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Integration FAQ Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
          Integration FAQs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-light leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              What are the daily rate limits?
            </h4>
            <p className="text-slate-500 pl-5">
              Standard accounts can perform up to 100 requests per minute. Contact administrators through support tickets to elevate limits for larger bots or production deployments.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              Do virtual numbers get instantly refunded?
            </h4>
            <p className="text-slate-500 pl-5">
              Yes. If an active number expires or is canceled using the order status endpoint without receiving an SMS, your balance is refunded fully.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              How secure is the Bearer key?
            </h4>
            <p className="text-slate-500 pl-5">
              Extremely secure. All communication is routed over SSL. We advise loading API keys in environment variables and proxying requests server-side.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              Is there webhook support?
            </h4>
            <p className="text-slate-500 pl-5">
              Webhooks are currently on the technical roadmap. For now, we recommend a rapid polling rate of once every 4–5 seconds to check message arrivals.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
