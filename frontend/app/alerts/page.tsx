'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Alert { alert_id: string; title: string; body: string; category: string; severity: string; created_at: string; }

const SEV: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function AlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'Security Alerts', severity: 'info', location: '' });
  const [filterCat, setFilterCat] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  const CATEGORIES = ['Breaking News', 'Weather Warnings', 'Traffic Updates', 'Jobs/Funding',
    'Deals', 'Stock Market', 'Property', 'Security Alerts', 'Health Updates', 'Sports News'];

  useEffect(() => { if (token) loadAlerts(); }, [token]);

  const loadAlerts = async () => {
    const r = await axios.get(`${API}/api/alerts/`, { headers: h });
    setAlerts(r.data.alerts || []);
  };

  const create = async () => {
    if (!form.title) return;
    await axios.post(`${API}/api/alerts/`, form, { headers: h });
    setForm({ title: '', body: '', category: 'Security Alerts', severity: 'info', location: '' });
    setShowForm(false);
    await loadAlerts();
  };

  const filtered = filterCat ? alerts.filter(a => a.category === filterCat) : alerts;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alerts Hub</h1>
            <p className="text-slate-500 text-sm mt-1">News, warnings and custom alerts</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">+ New Alert</button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Alert title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-400" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <input placeholder="Location (optional)" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <textarea placeholder="Alert body" value={form.body} onChange={e => setForm({...form, body: e.target.value})} rows={2}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={create} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">Post Alert</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterCat ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            All ({alerts.length})
          </button>
          {CATEGORIES.filter(c => alerts.some(a => a.category === c)).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === c ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {c} ({alerts.filter(a => a.category === c).length})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(alert => (
            <div key={alert.alert_id} className={`bg-white border rounded-2xl p-5 ${SEV[alert.severity] || 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV[alert.severity] || 'bg-slate-100 text-slate-600'}`}>{alert.severity}</span>
                    <span className="text-xs text-slate-500">{alert.category}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{alert.title}</p>
                  {alert.body && <p className="text-sm text-slate-600 mt-1">{alert.body}</p>}
                </div>
                <p className="text-xs text-slate-400 whitespace-nowrap">{new Date(alert.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-slate-500">No alerts yet. Post one above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
