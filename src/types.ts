export const MINIMUM_DEPOSIT_PKR = 100;

export interface UserProfile {
  referralCode?: string;
  id: number;
  email: string;
  balance: number;
  rating: number;
  frozen: number;
}

export interface SMSMessage {
  id: number;
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string;
}

export interface ActivationOrder {
  id: number;
  phone: string;
  operator: string;
  product: string;
  service?: string;
  cost?: number;
  providerName?: string;
  price: number;
  status: string; // PENDING, RECEIVED, FINISHED, CANCELED, BANNED
  expires: string; // ISO string
  sms: SMSMessage[] | null;
  created_at: string; // ISO string
  country: string;
  isDemo?: boolean;
  userId?: string; // Associated User Account ID
}

export interface CountryData {
  key: string;
  name: string;
  emoji: string;
  code: string; // phone prefix (e.g., +1, +7)
}

export interface ServiceData {
  key: string;
  name: string;
  icon: string; // name of lucide-react icon
  popular: boolean;
}

export interface OperatorData {
  key: string;
  name: string;
}

export interface PriceDetail {
  cost: number;
  count: number;
}

export interface UserAccount {
  referralCode?: string;
  id: string;
  username: string;
  name?: string;
  email: string;
  password?: string; // Kept secure in localStorage simulated DB
  balance: number;
  createdAt: string;
  loyaltyPoints?: number;
  referredBy?: string | null;
  referralEarnings?: number;
  referralCount?: number;
  fullName?: string;
  whatsappNumber?: string;
  phone?: string;
  status?: string; // "Active", "Suspended", "Blocked"
  apiKey?: string;
  apiStatus?: "Disabled" | "Pending" | "Verified" | "Suspended";
  avatarUrl?: string;
  warningMessage?: string;
  isBanned?: boolean;
  banReason?: string;
  dailyLimit?: number;
  isVerified?: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  method: "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | string;
  amount: number;
  txId: string;
  trxId?: string;
  senderName: string;
  senderPhone?: string;
  proofImageUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "VERIFICATION_FAILED" | "ALREADY_USED" | "MANUAL_REVIEW" | "FAILED" | "ALREADY_PROCESSED" | "EXPIRED";
  createdAt: string;
  adminNotes?: string;
}

export interface CryptoAddressItem {
  id: string;
  token: string;
  network: string;
  address: string;
  qrUrl?: string;
  memo?: string;
  icon?: string;
}

export interface DepositInstruction {
  method: "card" | "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  isActive: boolean;
  isHidden?: boolean;
  qrImageUrl?: string;
  gatewayLogoUrl?: string;
  subtitle?: string;
  badges?: string[];
  headerTitle?: string;
  headerTag?: string;
  verificationBadge?: string;
  subAccounts?: { label: string; title: string; number: string }[];
  cryptoAddresses?: CryptoAddressItem[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  youtubeUrl?: string;
  isActive: boolean;
  createdAt: string;
  isOffer?: boolean;
  offerEndTime?: string;
}

export interface SmmProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  apiType: "perfectpanel" | "justanotherpanel" | "smartpanel" | "childpanels" | "custom";
  currency: string;
  status: "ACTIVE" | "INACTIVE";
  timeout: number; // in seconds
  syncInterval: "5m" | "15m" | "30m" | "1h" | "24h";
  profitPercent: number;
  fixedProfit: number;
  rateMultiplier: number;
  notes?: string;
  balance?: number;
  lastSyncTime?: string;
  healthStatus?: "HEALTHY" | "DEGRADED" | "DOWN";
  responseTime?: number; // ms
  successRate?: number; // %
}

export interface SmmCategory {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SmmService {
  id: string;
  providerId: string;
  providerServiceId: string;
  name: string;
  category: string;
  rate: number; // original cost rate per 1000 from provider
  sellingPrice: number; // calculated rate per 1000 for users
  min: number;
  max: number;
  type?: string;
  averageTime?: string;
  refill: boolean;
  cancel: boolean;
  description?: string;
  isActive: boolean;
  isHidden: boolean;
  manualOverridden?: boolean;
}

export interface SmmOrder {
  id: string;
  userId: string;
  username: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  providerId: string;
  providerName?: string;
  providerOrderId: string;
  link: string;
  quantity: number;
  charge: number; // Total price in PKR charged from user balance
  chargeUsd?: number;
  startCount: number;
  remains: number;
  status: "PENDING" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL" | "CANCELED" | "CANCELLED" | "REJECTED" | "REFUNDED" | "Pending" | "Processing" | "Completed" | "Cancelled" | string;
  refillStatus: "NONE" | "AVAILABLE" | "REQUESTED" | "REFILLING" | "COMPLETED" | "FAILED";
  cancelStatus?: "NONE" | "AVAILABLE" | "REQUESTED" | "CANCELED" | "FAILED" | "NON_CANCELLABLE";
  
  // Fail-Safe & Auto-Refund Fields (2% fee deduction)
  isRefunded?: boolean;
  refundStatus?: "NONE" | "PENDING" | "REFUNDED" | "FAILED";
  refundAmount?: number; // Net refund amount in PKR credited to user wallet
  refundAmountUsd?: number; // Net refund amount in USD
  processingFee?: number; // 2% processing fee deducted in PKR
  processingFeeUsd?: number; // 2% processing fee deducted in USD
  refundTxId?: string; // Unique transaction ID for the refund
  refundedAt?: string;
  cancellationReason?: string;
  lastSyncedAt?: string;
  providerResponse?: string;

  isDemo?: boolean;
  isFake?: boolean;
  isTest?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SmmLog {
  id: string;
  type: "api" | "sync" | "error" | "activity";
  title: string;
  content: string;
  createdAt: string;
}

export interface SmmPriceRule {
  id: string;
  targetType: "global" | "category" | "individual";
  targetId?: string; // category name or serviceId
  type: "percent" | "fixed" | "formula";
  value: number;
  roundDecimals: number;
  isActive: boolean;
}

export interface SmmSettings {
  autoSyncEnabled: boolean;
  defaultProfitPercent: number;
  defaultFixedProfit: number;
  defaultRoundDecimals: number;
  maxQueueWorkers: number;
}

export interface SmsProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  apiType: "5sim" | "sms_activate" | "grizzly_sms" | "sms_man" | "custom";
  status: "ACTIVE" | "INACTIVE";
  notes?: string;
  balance?: number;
  rating?: number;
  lastSyncTime?: string;
}

export interface CustomImageItem {
  id: string;
  name: string;
  category: "logo" | "cover" | "banner" | "avatar" | "deposit" | "subscriptions" | "reviews" | "privacy" | "legal" | "other";
  url: string;
  description?: string;
  updatedAt: string;
}

export interface SiteBrandingConfig {
  siteLogoUrl?: string;
  siteTitle?: string;
  siteTagline?: string;
  siteCoverUrl?: string;
  showSiteCover?: boolean;
  siteCoverTitle?: string;
  siteCoverSubtitle?: string;
  sellerCoverUrl?: string;
  depositCoverUrl?: string;
  aboutAvatarUrl?: string;
  smmCoverUrl?: string;
  subscriptionsCoverUrl?: string;
  reviewsCoverUrl?: string;
  privacyCoverUrl?: string;
  customImages?: CustomImageItem[];
}

export interface SubscriptionCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SubscriptionProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  features: string[];
  duration: string;
  price: number;
  originalPrice?: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "NONE";
  discountValue?: number;
  discountBadge?: string;
  status: "ACTIVE" | "HIDDEN";
  logoUrl?: string;
  bannerUrl?: string;
  externalLink?: string;
  createdAt: string;
}

export interface SubscriptionOrder {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  whatsappNumber: string;
  productId: string;
  productName: string;
  duration: string;
  price: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  customerNotes?: string;
  adminNotes?: string;
  activationDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItem {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  imageUrl?: string;
  images?: string[];
  rating: number;
  category: "SMS Activations" | "SMM Services" | "Digital Subscriptions" | "Wallet & Deposits" | "Customer Support" | "General Platform";
  title: string;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isFeatured?: boolean;
  isVerifiedBuyer?: boolean;
  adminReply?: string;
  helpfulCount?: number;
  createdAt: string;
}

export interface PrivacyPolicySection {
  id: string;
  title: string;
  icon?: string;
  content: string;
}

export interface PrivacyPolicyData {
  title?: string;
  subtitle?: string;
  lastUpdated: string;
  effectiveDate?: string;
  version?: string;
  companyName?: string;
  contactEmail: string;
  sections: PrivacyPolicySection[];
}

export type AdminRoleType = "Super Admin" | "Financial Admin" | "Support Agent" | "Content Manager";

export interface AppointedAdminPermissions {
  canManageUsers?: boolean;
  canAdjustBalance?: boolean;
  canApproveDeposits?: boolean;
  canEditPrices?: boolean;
  canManageProviders?: boolean;
  canManageBranding?: boolean;
  canPurgeAuditLogs?: boolean;
  canManageRBAC?: boolean;
}

export interface AppointedAdmin {
  id: string;
  username: string;
  email: string;
  role: AdminRoleType;
  customTitle?: string;
  status: "ACTIVE" | "SUSPENDED";
  allowedTabs: string[];
  permissions: AppointedAdminPermissions;
  appointedAt: string;
  appointedBy: string;
  lastActiveAt?: string;
  totalActionsCount?: number;
  avatarUrl?: string;
}

export interface AdminRolePermission {
  role: AdminRoleType;
  title: string;
  description: string;
  badgeColor: string;
  allowedTabs: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: "SMS_ISSUE" | "SMM_ISSUE" | "DEPOSIT_ISSUE" | "ACCOUNT_ISSUE" | "GENERAL_INQUIRY";
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: "USER" | "ADMIN";
    content: string;
    timestamp: string;
    attachments?: string[];
  }[];
  relatedOrderId?: string;
  assignedAdminId?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string; // ISO string or formatted date
  adminName: string;
  adminRole: AdminRoleType;
  ipAddress?: string;
  category: "Financial" | "Users" | "Settings" | "Security" | "Content" | "SMM" | "SMS" | "System";
  action: string;
  details: string;
  targetUserOrItem?: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
}

export type BackupType = 'MANUAL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SAFETY_PRE_RESTORE' | 'AUTO_BEFORE_CHANGE';

export type BackupStatus = 'HEALTHY' | 'WARNING' | 'CORRUPTED' | 'FAILED' | 'IN_PROGRESS';

export type StorageLocation = 'LOCAL' | 'GOOGLE_DRIVE' | 'BOTH';

export interface BackupMetadata {
  id: string;
  version: string;
  timestamp: string; // ISO string
  formattedDate: string;
  sizeBytes: number;
  formattedSize: string;
  type: BackupType;
  status: BackupStatus;
  createdByName: string;
  createdByEmail: string;
  notes?: string;
  checksum: string; // SHA-256 hash
  location: StorageLocation;
  gdriveFileId?: string;
  gdriveWebViewLink?: string;
  isEncrypted: boolean;
  isInRecycleBin?: boolean;
  deletedAt?: string;
  retentionExpiresAt?: string; // 30 days after deletion
  itemCounts: {
    users: number;
    orders: number;
    services: number;
    deposits: number;
    tickets: number;
    settings: number;
    logs: number;
    files: number;
    [key: string]: number;
  };
}

export interface BackupDataPayload {
  version: string;
  exportedAt: string;
  environment: string;
  checksum: string;
  collections: {
    users?: any[];
    orders?: any[];
    activationOrders?: any[];
    smmOrders?: any[];
    smmServices?: any[];
    smmCategories?: any[];
    depositRequests?: any[];
    globalSettings?: any;
    depositSettings?: any;
    smsProviders?: any[];
    smmProviders?: any[];
    appointedAdmins?: any[];
    supportTickets?: any[];
    announcements?: any[];
    usefulLinks?: any[];
    auditLogs?: any[];
    reviews?: any[];
    [key: string]: any;
  };
  filesAndMedia?: {
    customImages?: any[];
    cryptoAddresses?: any[];
    brandingAssets?: any[];
  };
}

export interface GoogleDriveAccountInfo {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  folderId?: string;
  folderName?: string;
  lastSyncedAt?: string;
  totalDriveStorageUsed?: string;
}

export interface BackupActivityLog {
  id: string;
  timestamp: string;
  action: 'BACKUP_CREATED' | 'BACKUP_DELETED' | 'BACKUP_RESTORED' | 'DRIVE_CONNECTED' | 'DRIVE_DISCONNECTED' | 'RESTORE_FAILED' | 'RESTORE_SUCCESSFUL' | 'VERIFICATION_PASSED' | 'VERIFICATION_FAILED';
  adminName: string;
  adminEmail: string;
  ipAddress: string;
  device: string;
  details: string;
  backupId?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface BackupSettingsConfig {
  autoDailyBackup: boolean;
  autoWeeklyBackup: boolean;
  autoMonthlyBackup: boolean;
  autoBackupBeforeMajorChange: boolean;
  dailyBackupHourUtc: number;
  retentionDays: number; // e.g. 30
  autoSyncGoogleDrive: boolean;
  encryptBackups: boolean;
  encryptionPasscode?: string;
  lastBackupAt?: string;
  nextScheduledBackupAt?: string;
}

export interface CardPaymentRecord {
  id: string; // Order ID (e.g., ZX-849302)
  orderId: string;
  transactionId: string; // Tx ref (e.g., TXN_98471928374)
  userId: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  maskedCardNumber: string; // e.g. "•••• •••• •••• 5454"
  cardBrand: "Visa" | "Mastercard" | "Amex" | "Discover" | "JCB" | "UnionPay" | "Generic";
  expiryMonth: string;
  expiryYear: string;
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  amount: number;
  currency: string; // e.g. "USD" or "PKR"
  purchasedService: string;
  packageName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  userIp?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  createdAt: string; // ISO string
  notes?: string;
}

export interface CheckoutPackageItem {
  id: string;
  serviceName: string;
  packageName: string;
  description: string;
  unitPrice: number;
  badge?: string;
  iconName?: string;
  features: string[];
}

export interface AffiliateWithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  userEmail?: string;
  amountPkr: number;
  amountUsd: number;
  feePercentage: number; // 2.0%
  feeAmountPkr: number;
  feeAmountUsd: number;
  netPayoutPkr: number;
  netPayoutUsd: number;
  payoutMethod: "jazzcash" | "easypaisa" | "bank" | "nayapay" | "sadapay" | "crypto" | string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  notes?: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  adminNotes?: string;
  transactionRef?: string;
  createdAt: string;
  processedAt?: string;
  invoiceNumber: string;
}





