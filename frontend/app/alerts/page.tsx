'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AlertsHubPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);
  if (loading || !user) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="text-3xl">🔔</span>Alerts Hub
        </h1>
        <p className="text-slate-500 mt-1">Core features for this hub.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">📰</span><div><p className="font-medium text-slate-800">Breaking News</p><p className="text-sm text-slate-500">Latest news alerts</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🌦</span><div><p className="font-medium text-slate-800">Weather</p><p className="text-sm text-slate-500">Weather warnings</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🚦</span><div><p className="font-medium text-slate-800">Traffic</p><p className="text-sm text-slate-500">Traffic updates</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🛡</span><div><p className="font-medium text-slate-800">Security</p><p className="text-sm text-slate-500">Security alerts near you</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">💊</span><div><p className="font-medium text-slate-800">Health</p><p className="text-sm text-slate-500">Health updates</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">⚽</span><div><p className="font-medium text-slate-800">Sports</p><p className="text-sm text-slate-500">Sports news</p></div></div>
      </div>
    </div>
  );
}
