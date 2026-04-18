'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Summary { unread_messages: number; unread_group_messages: number; pending_tasks: number; upcoming_meetings: number; }

export default function NotificationsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) axios.get(`${API}/api/comms/notifications/summary`, { headers: h }).then(r => setSummary(r.data));
  }, [token]);

  const items = summary ? [
    { icon: '💬', label: 'Unread Messages', count: summary.unread_messages, color: 'violet' },
    { icon: '👥', label: 'Unread Group Messages', count: summary.unread_group_messages, color: 'blue' },
    { icon: '✅', label: 'Pending Tasks', count: summary.pending_tasks, color: 'amber' },
    { icon: '📅', label: 'Upcoming Meetings', count: summary.upcoming_meetings, color: 'emerald' },
  ] : [];

  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {total > 0 && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">{total} total</span>
        )}
      </div>

      {!summary && <p className="text-slate-400 text-sm">Loading...</p>}

      {summary && total === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-500 text-sm mt-1">No new notifications</p>
        </div>
      )}

      <div className="space-y-3">
        {items.filter(i => i.count > 0).map(item => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">{item.icon}</div>
              <div>
                <p className="font-medium text-slate-800">{item.label}</p>
                <p className="text-sm text-slate-500">
                  {item.count} {item.count === 1 ? 'item' : 'items'} pending
                </p>
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center">{item.count}</span>
          </div>
        ))}

        {summary && items.filter(i => i.count === 0).map(item => (
          <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl">{item.icon}</div>
            <div>
              <p className="font-medium text-slate-600">{item.label}</p>
              <p className="text-sm text-slate-400">Nothing new</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
