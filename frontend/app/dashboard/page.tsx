'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const HUBS = [
  { title: 'Smart Office', desc: 'Documents, Excel insights, translate, transcribe, smart files.', href: '/smart-office/documents', color: 'rose', icon: '🗂️' },
  { title: 'Comms Centre', desc: 'Chat, groups, meetings, tasks, calls, AI pals.', href: '/comms-centre/chat', color: 'violet', icon: '💬' },
  { title: 'Human Centre', desc: 'Organogram, positions, members, performance.', href: '/hr-hub/human-centre', color: 'emerald', icon: '👥' },
  { title: 'Monitoring Centre', desc: 'Live cameras, AI analytics, LPR, alerts.', href: '/monitoring-centre', color: 'red', icon: '📹' },
  { title: 'Learning Centre', desc: 'Courses, modules, progress tracking.', href: '/learning-centre', color: 'blue', icon: '📚' },
  { title: 'Innovation Centre', desc: 'Submit ideas, track pipeline, innovation bot.', href: '/innovation-centre', color: 'green', icon: '💡' },
  { title: 'Knowledge Hub', desc: 'SOPs, forms, templates, document repository.', href: '/knowledge-hub', color: 'purple', icon: '📖' },
  { title: 'Alerts Hub', desc: 'Breaking news, weather, traffic, security alerts.', href: '/alerts', color: 'blue', icon: '🔔' },
  { title: 'Rewards Centre', desc: 'Aipps balance, competitions, offers, history.', href: '/rewards', color: 'amber', icon: '🏆' },
];

const COLOR_MAP: Record<string, string> = {
  rose: 'border-rose-200 hover:border-rose-400',
  violet: 'border-violet-200 hover:border-violet-400',
  emerald: 'border-emerald-200 hover:border-emerald-400',
  red: 'border-red-200 hover:border-red-400',
  amber: 'border-amber-200 hover:border-amber-400',
  purple: 'border-purple-200 hover:border-purple-400',
  cyan: 'border-cyan-200 hover:border-cyan-400',
  blue: 'border-blue-200 hover:border-blue-400',
  green: 'border-green-200 hover:border-green-400',
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/'); }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold">E</div>
          <span className="text-slate-900 font-semibold text-lg">ESAIE</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Credits */}
          <Link href="/aipps" className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-sm hover:bg-amber-100 transition-colors">
            <span className="text-amber-600 font-medium">⚡ {user.credits} Aipps</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-600 font-medium text-xs">Buy</span>
          </Link>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600">
            🔔
          </button>

          {/* User menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {user.username}
              <span className="text-slate-400 text-xs">▾</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Choose a hub to get started.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HUBS.map(hub => (
            <Link key={hub.title} href={hub.href}
              className={`block bg-white border-2 ${COLOR_MAP[hub.color]} rounded-2xl p-6 transition-all hover:shadow-md group`}
              onClick={() => setShowMenu(false)}>
              <div className="text-3xl mb-3">{hub.icon}</div>
              <h3 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">{hub.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{hub.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
