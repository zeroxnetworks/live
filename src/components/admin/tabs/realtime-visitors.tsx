import React from 'react';
import LiveVisitorDashboard from '../LiveVisitorDashboard';
import { AdminErrorBoundary } from '../AdminErrorBoundary';

export default function RealtimeVisitorsTab() {
  return (
    <AdminErrorBoundary tabName="Realtime Visitor Intelligence">
      <div className="animate-fade-in">
        <LiveVisitorDashboard />
      </div>
    </AdminErrorBoundary>
  );
}
