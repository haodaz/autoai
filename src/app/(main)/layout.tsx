import React, { Suspense } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-gradient)' }}>
      <Suspense fallback={null}><Sidebar /></Suspense>
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
        <Header />
        {children}
      </div>
      <Suspense fallback={null}><BottomNav /></Suspense>
    </div>
  );
}
