export interface LiveVisitorSession {
  sessionId: string;
  visitorId: string;
  anonymousId: string;
  userId?: string;
  username?: string;
  email?: string;
  memberId?: string;
  isMember: boolean;
  avatarUrl?: string;

  // Geolocation & Network
  ip: string;
  isp: string;
  country: string;
  countryCode: string;
  state: string;
  city: string;
  timezone: string;
  language: string;
  networkType: 'WiFi' | '4G' | '5G' | 'Ethernet' | 'Unknown';
  isVpn: boolean;
  isProxy: boolean;

  // Device & Environment
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Edge' | 'Firefox' | 'Safari' | 'Opera' | 'Samsung Internet' | 'Other';
  browserVersion: string;
  os: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'Other';
  screenResolution: string;

  // Navigation & Activity
  currentUrl: string;
  currentPage: string;
  previousPage: string;
  entryPage: string;
  exitPage?: string;
  referrer: string;
  trafficSource: 'Direct' | 'Google' | 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Referral' | 'Other';
  currentTab: string;
  currentActivity: string;
  lastClick: string;
  lastScrollDepth: number; // percentage 0 - 100
  mouseActivityScore: number;

  // Session Timestamps & Status
  startTime: string;
  lastActive: string;
  durationSeconds: number;
  isOnline: boolean;
  heartbeatStatus: 'ACTIVE' | 'IDLE' | 'DISCONNECTED';
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'CLOSED';
  
  // History & Risk Metrics
  firstVisitAt: string;
  totalVisitsCount: number;
  isReturningVisitor: boolean;
  riskScore: number; // 0 - 100

  // Interaction Log
  pagesVisitedHistory: { page: string; timestamp: string; timeSpentSeconds: number }[];
  clickEventsHistory: { element: string; timestamp: string; page: string }[];
  eventsLog: LiveTelemetryEvent[];
  ordersCount: number;
  depositsCount: number;
  totalSpent: number;
}

export interface LiveTelemetryEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  visitorName: string;
  type: 
    | 'VISITOR_JOINED' 
    | 'VISITOR_LEFT' 
    | 'PAGE_NAVIGATED' 
    | 'USER_LOGIN' 
    | 'USER_LOGOUT' 
    | 'USER_REGISTERED' 
    | 'EMAIL_VERIFIED' 
    | 'ORDER_CREATED' 
    | 'ORDER_COMPLETED' 
    | 'PAYMENT_STARTED' 
    | 'PAYMENT_COMPLETED' 
    | 'DEPOSIT_SUCCESS' 
    | 'WITHDRAWAL_REQUEST' 
    | 'VPN_DETECTED' 
    | 'SUSPICIOUS_ACTIVITY'
    | 'TAB_SWITCHED'
    | 'CLICK_EVENT';
  description: string;
  page?: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  metadata?: Record<string, any>;
}

export interface VisitorAnalyticsKPIs {
  activeVisitors: number;
  registeredMembers: number;
  anonymousGuests: number;
  newVisitorsToday: number;
  returningVisitors: number;
  totalSessions: number;
  todaySessions: number;
  weeklySessions: number;
  monthlySessions: number;
  yearlySessions: number;
  peakConcurrentUsers: number;
  avgSessionDurationSeconds: number;
  bounceRatePercent: number;
  conversionRatePercent: number;
  activeCountriesCount: number;
  activeCitiesCount: number;
  onlineDevicesCount: number;
  liveOrdersCount: number;
  liveDepositsCount: number;
  liveRevenue: number;
  liveWithdrawalsCount: number;
  todayRevenue: number;
  avgVisitTimeSeconds: number;
}
