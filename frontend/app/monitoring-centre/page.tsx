'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MonitoringCentrePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);
  if (loading || !user) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="text-3xl">📹</span>Monitoring Centre
        </h1>
        <p className="text-slate-500 mt-1">Core features for this hub.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">📺</span><div><p className="font-medium text-slate-800">Live View</p><p className="text-sm text-slate-500">Live camera feeds</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">📷</span><div><p className="font-medium text-slate-800">Cameras</p><p className="text-sm text-slate-500">Manage CCTV cameras</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🧠</span><div><p className="font-medium text-slate-800">AI Analytics</p><p className="text-sm text-slate-500">YOLO object detection</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🚗</span><div><p className="font-medium text-slate-800">LPR</p><p className="text-sm text-slate-500">License plate recognition</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">📼</span><div><p className="font-medium text-slate-800">Recordings</p><p className="text-sm text-slate-500">Video recording archive</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🚨</span><div><p className="font-medium text-slate-800">Alerts</p><p className="text-sm text-slate-500">Motion and intrusion alerts</p></div></div>
      </div>
    </div>
  );
}
