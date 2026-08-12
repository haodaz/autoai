'use client';

import KbPage from '@/app/(main)/kb/page';

export const dynamic = 'force-dynamic';

export default function AgencyKbPage() {
  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-xl overflow-hidden bg-white shadow-sm">
      <KbPage />
    </div>
  );
}
