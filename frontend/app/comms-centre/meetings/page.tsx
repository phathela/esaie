'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
interface Meeting { meeting_id: string; title: string; description: string; scheduled_at: string; duration_minutes: number; organizer_name: string; join_link: string; status: string; }

export default function MeetingsPage() {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', duration_minutes: 60 });
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) axios.get(`${API}/api/comms/meetings`, { headers: h }).then(r => setMeetings(r.data.meetings)); }, [token]);

  const create = async () => {
    if (!form.title || !form.scheduled_at) return;
    await axios.post(`${API}/api/comms/meetings`, form, { headers: h });
    setForm({ title: '', description: '', scheduled_at: '', duration_minutes: 60 });
    setShowForm(false);
    const r = await axios.get(`${API}/api/comms/meetings`, { headers: h });
    setMeetings(r.data.meetings);
  };

  const upcoming = meetings.filter(m => new Date(m.scheduled_at) >= new Date() && m.status !== 'cancelled');
  const past = meetings.filter(m => new Date(m.scheduled_at) < new Date());

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">+ Schedule</button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">New Meeting</h2>
          <div className="space-y-3">
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Meeting title"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description (optional)"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
            <div className="flex gap-3">
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <select value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: +e.target.value})}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {[30, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={create} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-semibold text-slate-700 mb-3">Upcoming ({upcoming.length})</h2>
        <div className="space-y-3">
          {upcoming.map(m => (
            <div key={m.meeting_id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{m.title}</p>
                <p className="text-sm text-slate-500 mt-1">{new Date(m.scheduled_at).toLocaleString()} · {m.duration_minutes} min · {m.organizer_name}</p>
                {m.description && <p className="text-sm text-slate-600 mt-1">{m.description}</p>}
              </div>
              <a href={m.join_link} target="_blank" rel="noreferrer"
                className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 whitespace-nowrap">Join</a>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-slate-400 text-sm">No upcoming meetings. Schedule one above.</p>}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Past</h2>
          {past.map(m => (
            <div key={m.meeting_id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
              <p className="text-sm font-medium text-slate-600">{m.title} &middot; {new Date(m.scheduled_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
