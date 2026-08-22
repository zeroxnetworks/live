import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { LiveTelemetryEvent } from '../types/telemetry';

export async function logTelemetryEvent({
  sessionId,
  visitorId,
  visitorName,
  type,
  description,
  severity = 'info',
  page = 'home',
  metadata = {}
}: {
  sessionId: string;
  visitorId: string;
  visitorName?: string;
  type: LiveTelemetryEvent['type'];
  description: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  page?: string;
  metadata?: Record<string, any>;
}) {
  if (!sessionId) return;

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const eventData: LiveTelemetryEvent = {
    id: eventId,
    timestamp: now,
    sessionId,
    visitorName: visitorName || 'Visitor',
    type,
    description,
    severity,
    page,
    metadata
  };

  try {
    // 1. Write to analytics_events collection
    const eventDocRef = doc(db, 'analytics_events', eventId);
    await setDoc(eventDocRef, eventData);

    // 2. Append to eventsLog array in the session document
    const sessionDocRef = doc(db, 'analytics_sessions', sessionId);
    await updateDoc(sessionDocRef, {
      eventsLog: arrayUnion(eventData),
      lastActive: now,
      isOnline: true,
      status: 'ACTIVE'
    }).catch(() => {});
  } catch (err) {
    console.warn("Telemetry log error:", err);
  }
}
