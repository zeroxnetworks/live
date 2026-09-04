import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, ShieldAlert, Lock, UserCheck, Clock, Search, Filter,
  Download, Trash2, CheckCircle2, AlertTriangle, Info, Eye, RefreshCw,
  SlidersHorizontal, Check, UserX, Key, Layers, Activity, FileSpreadsheet,
  AlertCircle, Sparkles, ChevronRight, Shield, Database, Users, Settings,
  DollarSign, Tag, ExternalLink, Terminal, UserPlus, Edit3, X, XCircle,
  Plus, Power
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminAuditLog, AdminRoleType, AdminRolePermission, AppointedAdmin, AppointedAdminPermissions } from "../../../types";
import { useAdminContext } from "../AdminContext";

interface AuditLogsTabProps {
  auditLogs?: AdminAuditLog[];
  onClearAuditLogs?: () => void;
  onAddAuditLog?: (log: Omit<AdminAuditLog, "id" | "timestamp">) => void;
  activeAdminRole?: AdminRoleType;
  onChangeAdminRole?: (role: AdminRoleType) => void;
}

// Preset Role Permissions Definitions
export const ROLE_PERMISSIONS_MATRIX: AdminRolePermission[] = [
  {
    role: "Supreme Super Admin",
    title: "Primary Supreme Super Admin (Root Authority)",
    description: "Inviolable highest root authority with complete, unrestricted access across all platform modules, API gateways, database, user security, and administrator management.",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300 font-black",
    allowedTabs: [
      "general", "analytics", "deposit-requests", "deposit-settings", "users",
      "smm", "sms-providers", "sms-orders", "services", "custom", "subscriptions",
      "announcements", "branding", "reviews", "privacy", "tab-maintenance", "links",
      "loyalty", "imap", "audit-logs", "support-tickets"
    ]
  },
  {
    role: "Super Admin",
    title: "Master System Administrator",
    description: "Unrestricted access to all admin tabs, global API keys, audit logs, RBAC controls, and system maintenance.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    allowedTabs: [
      "general", "analytics", "deposit-requests", "deposit-settings", "users",
      "smm", "sms-providers", "sms-orders", "services", "custom", "subscriptions",
      "announcements", "branding", "reviews", "privacy", "tab-maintenance", "links",
      "loyalty", "imap", "audit-logs", "support-tickets"
    ]
  },
  {
    role: "Financial Admin",
    title: "Treasury & Payments Director",
    description: "Authorized for deposit approvals/rejections, deposit payment instructions, user balance adjustments, IMAP automation, and analytics.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    allowedTabs: [
      "analytics", "deposit-requests", "deposit-settings", "users", "loyalty", "imap", "audit-logs"
    ]
  },
  {
    role: "Support Agent",
    title: "Customer Support & Operations",
    description: "Authorized to view user accounts, handle tickets, verify deposit requests, inspect SMS & SMM order logs, and manage announcements.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    allowedTabs: [
      "users", "deposit-requests", "sms-orders", "smm", "announcements", "reviews", "audit-logs", "support-tickets"
    ]
  },
  {
    role: "Content Manager",
    title: "Media & Platform Branding",
    description: "Authorized for Branding & Media Hub, announcements, custom services, site links, reviews moderation, privacy policies, and tab maintenance.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    allowedTabs: [
      "branding", "announcements", "links", "custom", "services", "subscriptions", "reviews", "privacy", "tab-maintenance", "audit-logs"
    ]
  }
];

export const ALL_ADMIN_TABS = [
  { id: "general", name: "System Keys & Credentials", desc: "API Keys, Secret Hashes & Live Configuration" },
  { id: "analytics", name: "Business Analytics", desc: "Revenue, Growth & Traffic Metrics" },
  { id: "deposit-requests", name: "Deposit Requests", desc: "Verify & Approve Cash Deposit Proofs" },
  { id: "deposit-settings", name: "Deposit Accounts", desc: "Bank Accounts, QR Codes & Wallet Addresses" },
  { id: "users", name: "User Accounts & Balances", desc: "User Directory, Wallet Adjustment & Bans" },
  { id: "smm", name: "SMM Panel & Services", desc: "Social Media Marketing Providers & Orders" },
  { id: "sms-providers", name: "SMS Gateways", desc: "5Sim, Virtual Number API Gateways" },
  { id: "sms-orders", name: "SMS Orders Trail", desc: "Live Number Activations & OTP Logs" },
  { id: "services", name: "Price Markup & Override", desc: "Global Price Markup & Service Toggles" },
  { id: "custom", name: "Custom Services Catalog", desc: "Add or Edit Custom Platform Offerings" },
  { id: "subscriptions", name: "Subscriptions Store", desc: "Manage Recurring Bundles & VIP Plans" },
  { id: "announcements", name: "Platform Announcements", desc: "Banners, Alerts & Broadcast Messages" },
  { id: "branding", name: "Branding & Media Hub", desc: "Logos, Header Covers & Hero Images" },
  { id: "reviews", name: "Reviews Moderation", desc: "Approve, Reject or Delete Testimonials" },
  { id: "privacy", name: "Privacy Policy Editor", desc: "Terms of Service & Compliance Legal Text" },
  { id: "tab-maintenance", name: "Tab Maintenance Locks", desc: "Toggle Maintenance Mode per Module" },
  { id: "links", name: "Custom Navigation Links", desc: "Add Custom Header & Footer External Links" },
  { id: "loyalty", name: "Loyalty Rewards Engine", desc: "Points Multiplier & Bonus Cash Rules" },
  { id: "imap", name: "IMAP Payment Automation", desc: "Automated Bank SMS & Email Verification" },
  { id: "audit-logs", name: "Audit Trail & RBAC", desc: "Security Logs & Appointed Admins Management" },
  { id: "support-tickets", name: "Support Helpdesk", desc: "Customer Support Live Chat & Tickets" }
];

export const FEATURE_PERMISSIONS_LIST: { key: keyof AppointedAdminPermissions; label: string; desc: string }[] = [
  { key: "canManageUsers", label: "Manage User Accounts", desc: "Ban/unban users, send warning notices, edit limits" },
  { key: "canAdjustBalance", label: "Adjust Wallet Balances", desc: "Credit or deduct PKR/USD funds directly" },
  { key: "canApproveDeposits", label: "Approve/Reject Deposits", desc: "Verify payment proofs and credit balances" },
  { key: "canEditPrices", label: "Edit Service Prices & Markup", desc: "Modify markup rates and service catalog items" },
  { key: "canManageProviders", label: "Manage API Gateways", desc: "Edit SMS/SMM provider API keys & URLs" },
  { key: "canManageBranding", label: "Branding & Media Controls", desc: "Replace site logos, cover banners, images" },
  { key: "canPurgeAuditLogs", label: "Clear Security Audit Logs", desc: "Purge or export historical audit trail data" },
  { key: "canManageRBAC", label: "Appoint & Manage Admins", desc: "Appoint admins, customize permissions & roles" }
];

export default function AuditLogsTab(props: AuditLogsTabProps) {
  let context: any = null;
  try {
    context = useAdminContext();
  } catch (e) {
    // context not available, fallback to props
  }

  const auditLogs: AdminAuditLog[] = context?.auditLogs || props.auditLogs || [];
  const handleClearAuditLogs = context?.handleClearAuditLogs || props.onClearAuditLogs || (() => {});
  const activeAdminRole: AdminRoleType = context?.activeAdminRole || props.activeAdminRole || "Super Admin";
  const onChangeAdminRole = context?.setActiveAdminRole || props.onChangeAdminRole || (() => {});
  
  const appointedAdmins: AppointedAdmin[] = context?.appointedAdmins || [];
  const handleAddAppointedAdmin = context?.handleAddAppointedAdmin || (async () => {});
  const handleUpdateAppointedAdmin = context?.handleUpdateAppointedAdmin || (async () => {});
  const handleDeleteAppointedAdmin = context?.handleDeleteAppointedAdmin || (async () => {});
  const registeredUsers: any[] = context?.registeredUsers || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [selectedAdminActorFilter, setSelectedAdminActorFilter] = useState<string>("ALL");
  const [selectedLogModal, setSelectedLogModal] = useState<AdminAuditLog | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<"logs" | "appointed" | "rbac">("appointed");

  // Appoint Admin Modal & Form States
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AppointedAdmin | null>(null);
  const [appointFormUsername, setAppointFormUsername] = useState("");
  const [appointFormEmail, setAppointFormEmail] = useState("");
  const [appointFormRole, setAppointFormRole] = useState<AdminRoleType>("Support Agent");
  const [appointFormTitle, setAppointFormTitle] = useState("");
  const [appointFormAllowedTabs, setAppointFormAllowedTabs] = useState<string[]>([
    "users", "deposit-requests", "sms-orders", "smm", "announcements", "reviews", "audit-logs", "support-tickets"
  ]);
  const [appointFormPermissions, setAppointFormPermissions] = useState<AppointedAdminPermissions>({
    canManageUsers: true,
    canAdjustBalance: false,
    canApproveDeposits: true,
    canEditPrices: false,
    canManageProviders: false,
    canManageBranding: false,
    canPurgeAuditLogs: false,
    canManageRBAC: false
  });
  const [appointSearchUser, setAppointSearchUser] = useState("");
  const [appointedSearchTerm, setAppointedSearchTerm] = useState("");

  // Filtering audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesCategory = selectedCategory === "ALL" || log.category === selectedCategory;
      const matchesStatus = selectedStatus === "ALL" || log.status === selectedStatus;
      const matchesRole = selectedRoleFilter === "ALL" || log.adminRole === selectedRoleFilter;
      const matchesActor = selectedAdminActorFilter === "ALL" || 
        log.adminName.toLowerCase().includes(selectedAdminActorFilter.toLowerCase()) ||
        (log.targetUserOrItem && log.targetUserOrItem.toLowerCase().includes(selectedAdminActorFilter.toLowerCase()));
      
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.adminName.toLowerCase().includes(term) ||
        (log.targetUserOrItem && log.targetUserOrItem.toLowerCase().includes(term)) ||
        log.category.toLowerCase().includes(term)
      );
      return matchesCategory && matchesStatus && matchesRole && matchesActor && matchesSearch;
    });
  }, [auditLogs, selectedCategory, selectedStatus, selectedRoleFilter, selectedAdminActorFilter, searchTerm]);

  // Filter appointed admins
  const filteredAppointedAdmins = useMemo(() => {
    const term = appointedSearchTerm.toLowerCase().trim();
    if (!term) return appointedAdmins;
    return appointedAdmins.filter(a => 
      a.username.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.role.toLowerCase().includes(term) ||
      (a.customTitle && a.customTitle.toLowerCase().includes(term))
    );
  }, [appointedAdmins, appointedSearchTerm]);

  // Handle Export Audit Logs
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No audit logs available to export");
      return;
    }
    const headers = ["Timestamp", "Admin", "Role", "Category", "Action", "Status", "Details", "Target", "IP Address"];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.adminName}"`,
      `"${l.adminRole}"`,
      `"${l.category}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${(l.targetUserOrItem || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zerox_admin_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit trail logs exported as CSV successfully!");
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      toast.error("No audit logs available to export");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zerox_admin_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Audit logs exported as JSON file!");
  };

  // Modal open helper for new or edit
  const handleOpenAppointModal = (admin?: AppointedAdmin) => {
    if (admin) {
      setEditingAdmin(admin);
      setAppointFormUsername(admin.username);
      setAppointFormEmail(admin.email);
      setAppointFormRole(admin.role);
      setAppointFormTitle(admin.customTitle || "");
      setAppointFormAllowedTabs(admin.allowedTabs || []);
      setAppointFormPermissions(admin.permissions || {
        canManageUsers: true,
        canAdjustBalance: false,
        canApproveDeposits: true,
        canEditPrices: false,
        canManageProviders: false,
        canManageBranding: false,
        canPurgeAuditLogs: false,
        canManageRBAC: false
      });
    } else {
      setEditingAdmin(null);
      setAppointFormUsername("");
      setAppointFormEmail("");
      setAppointFormRole("Support Agent");
      setAppointFormTitle("Customer Operations Agent");
      setAppointFormAllowedTabs([
        "users", "deposit-requests", "sms-orders", "smm", "announcements", "reviews", "audit-logs", "support-tickets"
      ]);
      setAppointFormPermissions({
        canManageUsers: true,
        canAdjustBalance: false,
        canApproveDeposits: true,
        canEditPrices: false,
        canManageProviders: false,
        canManageBranding: false,
        canPurgeAuditLogs: false,
        canManageRBAC: false
      });
    }
    setAppointSearchUser("");
    setIsAppointModalOpen(true);
  };

  // Preset role selection updater inside modal
  const handleRoleSelectInModal = (role: AdminRoleType) => {
    setAppointFormRole(role);
    const preset = ROLE_PERMISSIONS_MATRIX.find(r => r.role === role);
    if (preset) {
      setAppointFormAllowedTabs([...preset.allowedTabs]);
      if (role === "Super Admin") {
        setAppointFormPermissions({
          canManageUsers: true,
          canAdjustBalance: true,
          canApproveDeposits: true,
          canEditPrices: true,
          canManageProviders: true,
          canManageBranding: true,
          canPurgeAuditLogs: true,
          canManageRBAC: true
        });
      } else if (role === "Financial Admin") {
        setAppointFormPermissions({
          canManageUsers: true,
          canAdjustBalance: true,
          canApproveDeposits: true,
          canEditPrices: false,
          canManageProviders: false,
          canManageBranding: false,
          canPurgeAuditLogs: false,
          canManageRBAC: false
        });
      } else if (role === "Support Agent") {
        setAppointFormPermissions({
          canManageUsers: true,
          canAdjustBalance: false,
          canApproveDeposits: true,
          canEditPrices: false,
          canManageProviders: false,
          canManageBranding: false,
          canPurgeAuditLogs: false,
          canManageRBAC: false
        });
      } else if (role === "Content Manager") {
        setAppointFormPermissions({
          canManageUsers: false,
          canAdjustBalance: false,
          canApproveDeposits: false,
          canEditPrices: true,
          canManageProviders: false,
          canManageBranding: true,
          canPurgeAuditLogs: false,
          canManageRBAC: false
        });
      }
    }
  };

  // Submit Appointed Admin Form
  const handleSaveAppointedAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointFormEmail.trim() || !appointFormUsername.trim()) {
      toast.error("Please enter both Username and Email address");
      return;
    }

    if (editingAdmin) {
      await handleUpdateAppointedAdmin(editingAdmin.id, {
        username: appointFormUsername.trim(),
        email: appointFormEmail.trim(),
        role: appointFormRole,
        customTitle: appointFormTitle.trim() || appointFormRole,
        allowedTabs: appointFormAllowedTabs,
        permissions: appointFormPermissions
      });
    } else {
      await handleAddAppointedAdmin({
        username: appointFormUsername.trim(),
        email: appointFormEmail.trim(),
        role: appointFormRole,
        customTitle: appointFormTitle.trim() || appointFormRole,
        status: "ACTIVE",
        allowedTabs: appointFormAllowedTabs,
        permissions: appointFormPermissions,
        appointedBy: "pandapals.manager@gmail.com",
        lastActiveAt: new Date().toISOString(),
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
      });
    }
    setIsAppointModalOpen(false);
  };

  const currentRoleObj = ROLE_PERMISSIONS_MATRIX.find(r => r.role === activeAdminRole) || ROLE_PERMISSIONS_MATRIX[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Zero-Trust Enterprise Access Control & RBAC</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Admin RBAC & Appointed Managers</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Appoint administrators, customize granular tab access per account, enforce role-based safety boundaries, and monitor real-time activity audit trails.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => handleOpenAppointModal()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer border border-purple-400/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Appoint New Admin</span>
          </button>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Your Active Role</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-black border border-purple-500/30">
                  {activeAdminRole}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 max-w-[200px] leading-snug">
                {currentRoleObj.title} ({currentRoleObj.allowedTabs.length} tabs accessible)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTabSection("appointed")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTabSection === "appointed" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Appointed Admins ({appointedAdmins.length})</span>
          </button>

          <button
            onClick={() => setActiveTabSection("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTabSection === "logs" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Activity Trail Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTabSection("rbac")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTabSection === "rbac" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>Preset Role Hierarchy Matrix</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: APPOINTED ADMINS MANAGEMENT */}
      {activeTabSection === "appointed" && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appointedSearchTerm}
                onChange={(e) => setAppointedSearchTerm(e.target.value)}
                placeholder="Search appointed admin by name, email, or role title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Total Admins: <span className="font-extrabold text-slate-900">{appointedAdmins.length}</span>
              </span>
              <button
                onClick={() => handleOpenAppointModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Appoint Admin</span>
              </button>
            </div>
          </div>

          {/* Appointed Admins Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAppointedAdmins.map((admin) => {
              const rolePreset = ROLE_PERMISSIONS_MATRIX.find(r => r.role === admin.role);
              const isActive = admin.status === "ACTIVE";

              return (
                <div
                  key={admin.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${admin.email.toLowerCase() === 'zeroxnetworks@gmail.com' ? 'bg-amber-100 border border-amber-300 text-amber-900' : 'bg-purple-100 border border-purple-200 text-purple-700'} overflow-hidden shrink-0 flex items-center justify-center font-black text-base shadow-2xs`}>
                          {admin.avatarUrl ? (
                            <img src={admin.avatarUrl} alt={admin.username} className="w-full h-full object-cover" />
                          ) : (
                            admin.username.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <span>{admin.username}</span>
                            {admin.email.toLowerCase() === 'zeroxnetworks@gmail.com' && (
                              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                Root Authority
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium font-mono">{admin.email}</p>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold ${admin.email.toLowerCase() === 'zeroxnetworks@gmail.com' ? 'text-amber-900 bg-amber-50 border border-amber-200' : 'text-purple-700 bg-purple-50 border border-purple-100'} px-2 py-0.5 rounded`}>
                            {admin.customTitle || admin.role}
                          </span>
                        </div>
                      </div>

                      {admin.email.toLowerCase() === 'zeroxnetworks@gmail.com' ? (
                        <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900 flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Permanent Root</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const newStatus = isActive ? "SUSPENDED" : "ACTIVE";
                            handleUpdateAppointedAdmin(admin.id, { status: newStatus });
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center gap-1 shrink-0 ${
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Click to toggle Active/Suspended status"
                        >
                          <Power className="w-3 h-3" />
                          <span>{admin.status}</span>
                        </button>
                      )}
                    </div>

                    {/* Role Badge & Tabs Count */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${rolePreset?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                        {admin.role}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {admin.allowedTabs?.length || 0} / {ALL_ADMIN_TABS.length} Tabs Accessible
                      </span>
                    </div>

                    {/* Feature Permissions Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Granted Privileges</span>
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions?.canManageUsers && <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">User Management</span>}
                        {admin.permissions?.canAdjustBalance && <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Balance Adjust</span>}
                        {admin.permissions?.canApproveDeposits && <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Approve Deposits</span>}
                        {admin.permissions?.canEditPrices && <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Price Override</span>}
                        {admin.permissions?.canManageProviders && <span className="text-[9px] font-extrabold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-200">API Gateways</span>}
                        {admin.permissions?.canManageBranding && <span className="text-[9px] font-extrabold bg-pink-50 text-pink-700 px-2 py-0.5 rounded border border-pink-200">Media Branding</span>}
                        {admin.permissions?.canManageRBAC && <span className="text-[9px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">RBAC Admin</span>}
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-[10px] grid grid-cols-2 gap-2 text-slate-500 font-medium">
                      <div>
                        <span className="block font-bold text-slate-400">Total Audit Actions:</span>
                        <span className="font-extrabold text-slate-900 font-mono text-xs">{admin.totalActionsCount || 0}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400">Last Active:</span>
                        <span className="font-bold text-slate-800">{admin.lastActiveAt ? new Date(admin.lastActiveAt).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenAppointModal(admin)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Customize Access</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAdminActorFilter(admin.email);
                        setActiveTabSection("logs");
                        toast.success(`Filtered activity trail for @${admin.username}`);
                      }}
                      className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition cursor-pointer border border-slate-200"
                      title="View Live Activity Logs for this admin"
                    >
                      <Activity className="w-4 h-4" />
                    </button>

                    {admin.email.toLowerCase() !== 'zeroxnetworks@gmail.com' && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to revoke administrative access for ${admin.username} (${admin.email})?`)) {
                            handleDeleteAppointedAdmin(admin.id);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer border border-rose-200"
                        title="Revoke Admin Status"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAppointedAdmins.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Appointed Admins Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No administrators matched your search query. Click "Appoint New Admin" to delegate access to team members.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: ACTIVITY TRAIL LOGS */}
      {activeTabSection === "logs" && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              
              {/* Search Box */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs by keyword..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Event Categories</option>
                  <option value="Finance">Finance & Deposits</option>
                  <option value="Users">User Accounts & Balances</option>
                  <option value="Pricing">Services & Pricing</option>
                  <option value="System">System Settings & Keys</option>
                  <option value="Branding">Branding & Media</option>
                  <option value="Security">Security & RBAC</option>
                  <option value="API">API Gateways</option>
                </select>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Admin Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Financial Admin">Financial Admin</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Content Manager">Content Manager</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Event Statuses</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="WARNING">WARNING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            {/* Admin Actor Filter Indicator */}
            {selectedAdminActorFilter !== "ALL" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-blue-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Filtered for Admin Actor: <span className="font-mono text-blue-900">{selectedAdminActorFilter}</span></span>
                </div>
                <button
                  onClick={() => setSelectedAdminActorFilter("ALL")}
                  className="text-[11px] font-black text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">System Audit Trail</h3>
                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredLogs.length} events
                </span>
              </div>

              {handleClearAuditLogs && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to purge all audit trail logs? This action is permanent.")) {
                      handleClearAuditLogs();
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Logs</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admin Actor</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredLogs.map((log) => {
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.adminName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.adminRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {log.targetUserOrItem || "System Global"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            log.status === "WARNING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedLogModal(log)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Inspect Event Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No audit events recorded matching filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: ROLE PERMISSIONS PRESET MATRIX */}
      {activeTabSection === "rbac" && (
        <div className="space-y-6">
          
          {/* Active Role Selector Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>Admin Role Switcher & Permission Hierarchy</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your active administrative role to test restricted tab access and permission boundaries
                </p>
              </div>

              <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                Active Role: {activeAdminRole}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLE_PERMISSIONS_MATRIX.map((r) => {
                const isSelected = activeAdminRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => {
                      onChangeAdminRole(r.role);
                      toast.success(`Switched active admin role to ${r.role}`);
                    }}
                    className={`border rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-4 relative ${
                      isSelected 
                        ? "bg-purple-50/50 border-purple-400 ring-2 ring-purple-500/20 shadow-md" 
                        : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${r.badgeColor}`}>
                          {r.role}
                        </span>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-purple-600 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900">{r.title}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-extrabold">
                      <span className="text-slate-500">{r.allowedTabs.length} Tabs Allowed</span>
                      <span className={isSelected ? "text-purple-700" : "text-slate-400"}>
                        {isSelected ? "Active Role" : "Click to Switch"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Tab Permission Breakdown Matrix */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Granular Tab Permission Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Overview of default administrative tabs unlocked for each preset role
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Admin Portal Tab</th>
                    {ROLE_PERMISSIONS_MATRIX.map(r => (
                      <th key={r.role} className="py-3 px-4 text-center">
                        {r.role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {ALL_ADMIN_TABS.map(tab => (
                    <tr key={tab.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-extrabold text-slate-900">
                        {tab.name}
                      </td>
                      {ROLE_PERMISSIONS_MATRIX.map(r => {
                        const isAllowed = r.allowedTabs.includes(tab.id);
                        return (
                          <td key={r.role} className="py-2.5 px-4 text-center">
                            {isAllowed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Allowed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Restricted</span>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: APPOINT / EDIT ADMIN PERMISSIONS MODAL */}
      {isAppointModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    {editingAdmin ? `Customize Admin: ${editingAdmin.username}` : "Appoint New Administrator"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Assign role tier, customize granular tab access, and set feature permissions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAppointModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAppointedAdminSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* User Selection & Identity */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>1. User Identity & Account Information</span>
                </h4>

                {/* Pick registered user search */}
                {!editingAdmin && registeredUsers.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                      Quick Pick From Registered Users
                    </label>
                    <select
                      onChange={(e) => {
                        const u = registeredUsers.find(usr => usr.id === e.target.value);
                        if (u) {
                          setAppointFormUsername(u.username || u.name || "");
                          setAppointFormEmail(u.email || "");
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Choose a registered platform user --</option>
                      {registeredUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username || u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Username / Full Name *</label>
                    <input
                      type="text"
                      required
                      value={appointFormUsername}
                      onChange={(e) => setAppointFormUsername(e.target.value)}
                      placeholder="e.g. Finance Officer"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={appointFormEmail}
                      onChange={(e) => setAppointFormEmail(e.target.value)}
                      placeholder="e.g. admin@zerox.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Base Role Preset</label>
                    <select
                      value={appointFormRole}
                      onChange={(e) => handleRoleSelectInModal(e.target.value as AdminRoleType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-purple-700 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Super Admin">Super Admin (Full Access)</option>
                      <option value="Financial Admin">Financial Admin (Treasury & Cash)</option>
                      <option value="Support Agent">Support Agent (Customer Desk)</option>
                      <option value="Content Manager">Content Manager (Branding & Media)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Custom Title / Designation</label>
                    <input
                      type="text"
                      value={appointFormTitle}
                      onChange={(e) => setAppointFormTitle(e.target.value)}
                      placeholder="e.g. Lead Payment Verifier"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Granular Tabs Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>2. Granular Tab Access Controls ({appointFormAllowedTabs.length} Selected)</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointFormAllowedTabs(ALL_ADMIN_TABS.map(t => t.id))}
                      className="text-[10px] font-black text-purple-600 hover:bg-purple-50 px-2 py-1 rounded cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointFormAllowedTabs([])}
                      className="text-[10px] font-black text-slate-500 hover:bg-slate-100 px-2 py-1 rounded cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {ALL_ADMIN_TABS.map(tab => {
                    const isChecked = appointFormAllowedTabs.includes(tab.id);
                    return (
                      <label
                        key={tab.id}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked 
                            ? "bg-purple-50/80 border-purple-300 text-purple-950 font-bold" 
                            : "bg-white border-slate-200 hover:bg-slate-100/50 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAppointFormAllowedTabs(prev => [...prev, tab.id]);
                            } else {
                              setAppointFormAllowedTabs(prev => prev.filter(t => t !== tab.id));
                            }
                          }}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 h-4 w-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold block leading-snug">{tab.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium leading-tight block truncate">{tab.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Fine-Grained Feature Permissions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Action Privileges & Feature Toggles</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURE_PERMISSIONS_LIST.map(p => {
                    const val = appointFormPermissions[p.key];
                    return (
                      <div
                        key={p.key}
                        onClick={() => setAppointFormPermissions(prev => ({ ...prev, [p.key]: !val }))}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          val 
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950" 
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-black block">{p.label}</span>
                          <span className="text-[10px] text-slate-500 font-medium block">{p.desc}</span>
                        </div>

                        <div className={`w-8 h-5 rounded-full transition p-0.5 flex items-center ${val ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAppointModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition shadow-lg shadow-purple-600/30 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingAdmin ? "Save Custom Permissions" : "Appoint Administrator"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG DETAILS INSPECTOR MODAL */}
      {selectedLogModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Audit Event Inspector</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedLogModal.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Timestamp</span>
                  <span className="font-bold text-slate-800">{selectedLogModal.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Admin Actor</span>
                  <span className="font-bold text-slate-800">{selectedLogModal.adminName} ({selectedLogModal.adminRole})</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Category</span>
                  <span className="font-bold text-slate-800">{selectedLogModal.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLogModal.ipAddress || "182.185.12.98"}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Action Performed</label>
                <div className="p-3 bg-slate-900 text-purple-300 rounded-xl font-mono text-xs font-bold">
                  {selectedLogModal.action}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Target Entity / User</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 font-bold">
                  {selectedLogModal.targetUserOrItem || "Global System Setting"}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Audit Log Details & Diff</label>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 leading-relaxed">
                  {selectedLogModal.details}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLogModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
