import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Save, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  Mail
} from "lucide-react";
import { PrivacyPolicyData, PrivacyPolicySection } from "../../../types";
import { DEFAULT_PRIVACY_POLICY } from "../../../lib/reviewsAndPolicyStore";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function PrivacyPolicyAdminTab() {
  const [policyData, setPolicyData] = useState<PrivacyPolicyData>(DEFAULT_PRIVACY_POLICY);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    const docRef = doc(db, "settings", "privacy_policy");
    const unsub = onSnapshot(docRef, async (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as PrivacyPolicyData;
        if (!remoteData.contactEmail || remoteData.contactEmail !== "zeroxnetworks@gmail.com") {
          remoteData.contactEmail = "zeroxnetworks@gmail.com";
          try {
            await setDoc(docRef, { contactEmail: "zeroxnetworks@gmail.com" }, { merge: true });
          } catch (e) {}
        }
        setPolicyData(remoteData);
      } else {
        try {
          await setDoc(docRef, DEFAULT_PRIVACY_POLICY, { merge: true });
        } catch (e) {
          console.error("Error auto-seeding privacy policy in admin:", e);
        }
        setPolicyData(DEFAULT_PRIVACY_POLICY);
      }
    }, (err) => {
      console.warn("Privacy policy admin listener warning:", err);
    });
    return () => unsub();
  }, []);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    const updatedData = {
      ...policyData,
      lastUpdated: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };

    setPolicyData(updatedData);

    // Save directly to Firestore
    try {
      await setDoc(doc(db, "settings", "privacy_policy"), updatedData);
    } catch (e) {
      console.warn("Firestore save error:", e);
    }

    setIsSaving(false);
    showToast("Privacy Policy saved & published globally!");
  };

  const handleResetToDefault = () => {
    if (!window.confirm("Are you sure you want to reset the Privacy Policy to default template?")) return;
    setPolicyData(DEFAULT_PRIVACY_POLICY);
    showToast("Reset to default template.");
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleSectionChange = (index: number, key: keyof PrivacyPolicySection, val: string) => {
    const newSections = [...policyData.sections];
    newSections[index] = { ...newSections[index], [key]: val };
    setPolicyData({ ...policyData, sections: newSections });
  };

  const handleAddSection = () => {
    const newSec: PrivacyPolicySection = {
      id: `sec-${Date.now()}`,
      title: `${policyData.sections.length + 1}. New Policy Section`,
      icon: "ShieldCheck",
      content: "Enter the legal details and policy guidelines for this section here..."
    };
    setPolicyData({ ...policyData, sections: [...policyData.sections, newSec] });
  };

  const handleDeleteSection = (index: number) => {
    if (policyData.sections.length <= 1) {
      alert("At least one policy section is required.");
      return;
    }
    const newSections = policyData.sections.filter((_, i) => i !== index);
    setPolicyData({ ...policyData, sections: newSections });
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= policyData.sections.length) return;

    const newSections = [...policyData.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setPolicyData({ ...policyData, sections: newSections });
  };

  const iconOptions = [
    "ShieldCheck",
    "Database",
    "Smartphone",
    "Share2",
    "Crown",
    "Wallet",
    "Lock",
    "KeyRound",
    "UserCheck",
    "AlertOctagon",
    "Mail",
    "Zap",
    "FileText"
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-[#00AEEF] font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy Management</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Edit Website Privacy Policy</h2>
          <p className="text-xs text-slate-400">
            Customize complete terms, privacy rules for virtual numbers, SMM panel, subscriptions, and wallet security.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#00AEEF]" />
            <span>{showPreview ? "Edit Mode" : "Live Preview"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer"
            title="Reset to default template"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSavePolicy}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#00AEEF] hover:bg-blue-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-[#00AEEF]/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Policy"}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Form Fields */}
      {!showPreview ? (
        <div className="space-y-6">
          
          {/* Main Title & Subtitle Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
              Header Title & Contact Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Page Main Title</label>
                <input
                  type="text"
                  value={policyData.title}
                  onChange={(e) => setPolicyData({ ...policyData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00AEEF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Support / Legal Email</label>
                <input
                  type="email"
                  value={policyData.contactEmail}
                  onChange={(e) => setPolicyData({ ...policyData, contactEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00AEEF]"
                />
              </div>

            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Subtitle / Tagline</label>
              <textarea
                rows={2}
                value={policyData.subtitle}
                onChange={(e) => setPolicyData({ ...policyData, subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00AEEF]"
              />
            </div>
          </div>

          {/* Section List Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Policy Sections ({policyData.sections.length})
              </h3>

              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#00AEEF] border border-blue-200 font-extrabold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Section</span>
              </button>
            </div>

            {policyData.sections.map((sec, idx) => (
              <div 
                key={sec.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleSectionChange(idx, "title", e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-[#00AEEF]"
                    />
                  </div>

                  {/* Icon choice & actions */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={sec.icon || "ShieldCheck"}
                      onChange={(e) => handleSectionChange(idx, "icon", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700"
                    >
                      {iconOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleMoveSection(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 text-slate-600"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveSection(idx, "down")}
                      disabled={idx === policyData.sections.length - 1}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-30 text-slate-600"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSection(idx)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Section Content</label>
                  <textarea
                    rows={4}
                    value={sec.content}
                    onChange={(e) => handleSectionChange(idx, "content", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00AEEF] whitespace-pre-line"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* Live Preview Mode */
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <span>This is how your Privacy Policy looks live to users across the website.</span>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-2">
              <h1 className="text-xl font-extrabold">{policyData.title}</h1>
              <p className="text-xs text-slate-300">{policyData.subtitle}</p>
              <div className="text-[11px] text-slate-400 font-semibold pt-2">
                Last Updated: {policyData.lastUpdated} | Contact: {policyData.contactEmail}
              </div>
            </div>

            {policyData.sections.map((sec) => (
              <div key={sec.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                  {sec.title}
                </h3>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
