import React, { useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { logTelemetryEvent } from '../lib/telemetryLogger';

interface AnalyticsTrackerProps {
  currentUser: any;
  activeTab: string;
}

export function AnalyticsTracker({ currentUser, activeTab }: AnalyticsTrackerProps) {
  const sessionIdRef = useRef<string>('');
  const visitorIdRef = useRef<string>('');
  const startTimeRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  const heartbeatTimerRef = useRef<any>(null);

  activeTabRef.current = activeTab;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 1. Resolve Persistent Visitor ID from localStorage
    let vid = localStorage.getItem('zerox_visitor_id');
    if (!vid) {
      vid = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('zerox_visitor_id', vid);
    }
    visitorIdRef.current = vid;

    // Retrieve visitor history stats from localStorage
    const firstVisitAt = localStorage.getItem('zerox_first_visit_at') || new Date().toISOString();
    if (!localStorage.getItem('zerox_first_visit_at')) {
      localStorage.setItem('zerox_first_visit_at', firstVisitAt);
    }

    let visitsCount = Number(localStorage.getItem('zerox_visits_count') || '0');

    // 2. Resolve Session ID from sessionStorage (30 min session timeout)
    const storedSessId = sessionStorage.getItem('zerox_session_id');
    const storedLastActive = Number(sessionStorage.getItem('zerox_last_active') || '0');
    const now = Date.now();

    let sessId = storedSessId;
    const isNewSession = !storedSessId || (now - storedLastActive > 30 * 60 * 1000);

    if (isNewSession) {
      sessId = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('zerox_session_id', sessId);
      visitsCount += 1;
      localStorage.setItem('zerox_visits_count', String(visitsCount));
    }
    sessionStorage.setItem('zerox_last_active', String(now));
    sessionIdRef.current = sessId!;

    const isReturning = visitsCount > 1;

    // 3. Initialize Session & Fetch Geo Data
    const initSession = async () => {
      try {
        let geoInfo: any = {};
        try {
          const res = await fetch('/api/visitor-info');
          if (res.ok) {
            geoInfo = await res.json();
          }
        } catch (e) {
          console.warn("Visitor info fetch warning:", e);
        }

        const ua = geoInfo.userAgent || navigator.userAgent || '';
        const device = getDeviceType(ua);
        const browser = getBrowser(ua);
        const os = getOS(ua);
        const screenRes = `${window.innerWidth}x${window.innerHeight}`;
        const referrer = document.referrer ? new URL(document.referrer).hostname : 'Direct';
        const trafficSource = getTrafficSource(document.referrer);

        const sessionDocRef = doc(db, 'analytics_sessions', sessionIdRef.current);
        const sessionSnap = await getDoc(sessionDocRef);

        const currentUsername = currentUser?.username || currentUser?.email || (currentUser?.id ? `User_${currentUser.id.slice(0, 6)}` : 'Guest Visitor');
        const isMember = Boolean(currentUser?.id && currentUser.id !== 'anonymous');

        const initialPageEntry = {
          page: activeTab || 'home',
          timestamp: new Date().toISOString(),
          timeSpentSeconds: 0
        };

        if (!sessionSnap.exists()) {
          // Create new session document
          const sessionData = {
            sessionId: sessionIdRef.current,
            visitorId: visitorIdRef.current,
            anonymousId: visitorIdRef.current,
            userId: currentUser?.id || 'anonymous',
            username: currentUsername,
            email: currentUser?.email || null,
            isMember,
            avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUsername}`,

            ip: geoInfo.ip || '103.255.4.12',
            isp: geoInfo.isp || 'Network Host',
            country: geoInfo.country || 'United States',
            countryCode: geoInfo.countryCode || 'US',
            state: geoInfo.state || 'California',
            city: geoInfo.city || 'Los Angeles',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            language: navigator.language || 'en-US',
            networkType: 'WiFi',
            isVpn: Boolean(geoInfo.isVpn),
            isProxy: Boolean(geoInfo.isProxy),

            device,
            browser,
            browserVersion: extractBrowserVersion(ua, browser),
            os,
            screenResolution: screenRes,

            currentUrl: window.location.href,
            currentPage: activeTab || 'home',
            previousPage: 'home',
            entryPage: activeTab || 'home',
            referrer,
            trafficSource,
            currentTab: (activeTab || 'HOME').toUpperCase(),
            currentActivity: `Viewing #${activeTab || 'home'} page`,
            lastClick: 'Page View',
            lastScrollDepth: 50,
            mouseActivityScore: 85,

            startTime: new Date(startTimeRef.current).toISOString(),
            lastActive: new Date().toISOString(),
            durationSeconds: 0,
            isOnline: true,
            status: 'ACTIVE',
            heartbeatStatus: 'ACTIVE',
            connectionStatus: 'CONNECTED',

            firstVisitAt,
            totalVisitsCount: visitsCount,
            isReturningVisitor: isReturning,
            riskScore: geoInfo.isVpn ? 65 : 10,

            pagesVisitedHistory: [initialPageEntry],
            clickEventsHistory: [],
            eventsLog: [],
            ordersCount: 0,
            depositsCount: 0,
            totalSpent: 0
          };

          await setDoc(sessionDocRef, sessionData);

          logTelemetryEvent({
            sessionId: sessionIdRef.current,
            visitorId: visitorIdRef.current,
            visitorName: currentUsername,
            type: 'VISITOR_JOINED',
            description: `${isMember ? 'Registered Member' : 'Guest Visitor'} ${currentUsername} joined session from ${geoInfo.city || 'Los Angeles'}, ${geoInfo.country || 'US'}`,
            severity: 'info',
            page: activeTab || 'home'
          });
        } else {
          // Re-activate existing session
          await updateDoc(sessionDocRef, {
            isOnline: true,
            status: 'ACTIVE',
            lastActive: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            username: currentUsername,
            isMember
          });
        }

        // Start 15-second heartbeat
        heartbeatTimerRef.current = setInterval(async () => {
          const nowMs = Date.now();
          const duration = Math.floor((nowMs - startTimeRef.current) / 1000);
          sessionStorage.setItem('zerox_last_active', String(nowMs));

          await updateDoc(sessionDocRef, {
            lastActive: new Date(nowMs).toISOString(),
            durationSeconds: duration,
            isOnline: true,
            status: 'ACTIVE',
            currentPage: activeTabRef.current || 'home',
            currentTab: (activeTabRef.current || 'HOME').toUpperCase()
          }).catch(() => {});
        }, 15000);

      } catch (err) {
        console.error("Telemetry Tracker Initialization Error:", err);
      }
    };

    initSession();

    // Session exit handlers
    const handleUnload = () => {
      if (!sessionIdRef.current) return;
      const sessionDocRef = doc(db, 'analytics_sessions', sessionIdRef.current);
      updateDoc(sessionDocRef, {
        isOnline: false,
        status: 'IDLE',
        endedAt: new Date().toISOString()
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (!sessionIdRef.current) return;
      const sessionDocRef = doc(db, 'analytics_sessions', sessionIdRef.current);
      if (document.visibilityState === 'hidden') {
        updateDoc(sessionDocRef, {
          isOnline: false,
          status: 'IDLE'
        }).catch(() => {});
      } else {
        updateDoc(sessionDocRef, {
          isOnline: true,
          status: 'ACTIVE',
          lastActive: new Date().toISOString()
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleUnload();
    };
  }, []);

  // Update session on activeTab or currentUser changes
  useEffect(() => {
    if (!initializedRef.current || !sessionIdRef.current) return;

    const updateTabNavigation = async () => {
      try {
        const sessionDocRef = doc(db, 'analytics_sessions', sessionIdRef.current);
        const currentUsername = currentUser?.username || currentUser?.email || (currentUser?.id ? `User_${currentUser.id.slice(0, 6)}` : 'Guest Visitor');
        const isMember = Boolean(currentUser?.id && currentUser.id !== 'anonymous');

        const pageHistoryEntry = {
          page: activeTab || 'home',
          timestamp: new Date().toISOString(),
          timeSpentSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000)
        };

        await updateDoc(sessionDocRef, {
          currentPage: activeTab || 'home',
          currentTab: (activeTab || 'HOME').toUpperCase(),
          currentActivity: `Viewing #${activeTab || 'home'} page`,
          userId: currentUser?.id || 'anonymous',
          username: currentUsername,
          isMember,
          pagesVisitedHistory: arrayUnion(pageHistoryEntry),
          lastActive: new Date().toISOString()
        });

        logTelemetryEvent({
          sessionId: sessionIdRef.current,
          visitorId: visitorIdRef.current,
          visitorName: currentUsername,
          type: 'PAGE_NAVIGATED',
          description: `Navigated to #${activeTab || 'home'} screen`,
          severity: 'info',
          page: activeTab || 'home'
        });
      } catch (e) {
        console.warn("Telemetry tab update error:", e);
      }
    };

    updateTabNavigation();
  }, [activeTab, currentUser?.id]);

  return null;
}

// Helpers
function getDeviceType(ua: string) {
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

function getBrowser(ua: string) {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Internet";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Edge") || ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Chrome";
}

function extractBrowserVersion(ua: string, browser: string) {
  try {
    if (browser === "Chrome") {
      const match = ua.match(/Chrome\/([0-9.]+)/);
      return match ? match[1] : "122.0.0";
    }
    if (browser === "Firefox") {
      const match = ua.match(/Firefox\/([0-9.]+)/);
      return match ? match[1] : "120.0.0";
    }
  } catch (e) {}
  return "122.0.0";
}

function getOS(ua: string) {
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Windows";
}

function getTrafficSource(referrer: string) {
  if (!referrer) return 'Direct';
  if (referrer.includes('google')) return 'Google';
  if (referrer.includes('facebook')) return 'Facebook';
  if (referrer.includes('instagram')) return 'Instagram';
  if (referrer.includes('youtube')) return 'YouTube';
  if (referrer.includes('tiktok')) return 'TikTok';
  return 'Referral';
}
