'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HumanCentrePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);
  if (loading || !user) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="text-3xl">👥</span>Human Centre
        </h1>
        <p className="text-slate-500 mt-1">Core features for this hub.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🌳</span><div><p className="font-medium text-slate-800">Organogram</p><p className="text-sm text-slate-500">Interactive org chart</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">💼</span><div><p className="font-medium text-slate-800">Positions</p><p className="text-sm text-slate-500">Manage roles and job profiles</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">👤</span><div><p className="font-medium text-slate-800">Members</p><p className="text-sm text-slate-500">Employee records and skills</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">🤖</span><div><p className="font-medium text-slate-800">HR Bot</p><p className="text-sm text-slate-500">AI-powered HR assistant</p></div></div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow"><span className="text-2xl">📊</span><div><p className="font-medium text-slate-800">Reports</p><p className="text-sm text-slate-500">Skills audit and demographics</p></div></div>
      </div>
    </div>
  );
}
