'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Staff { staff_id: string; name: string; email: string; position: string; department: string; reports_to: string; phone: string; }

export default function HumanCentrePage() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', position: '', department: '', reports_to: '', phone: '' });
  const [tab, setTab] = useState<'list' | 'org' | 'bot'>('list');
  const [botInput, setBotInput] = useState('');
  const [botMessages, setBotMessages] = useState<{ role: string; content: string }[]>([]);
  const [botLoading, setBotLoading] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/api/hr/staff`, { headers: h }).then(r => setStaff(r.data.staff || []));
    axios.get(`${API}/api/hr/departments`, { headers: h }).then(r => setDepartments(r.data.departments || []));
  }, [token]);

  const addStaff = async () => {
    if (!form.name || !form.position) return;
    await axios.post(`${API}/api/hr/staff`, form, { headers: h });
    setForm({ name: '', email: '', position: '', department: '', reports_to: '', phone: '' });
    setShowForm(false);
    const r = await axios.get(`${API}/api/hr/staff`, { headers: h });
    setStaff(r.data.staff || []);
    const rd = await axios.get(`${API}/api/hr/departments`, { headers: h });
    setDepartments(rd.data.departments || []);
  };

  const deleteStaff = async (id: string) => {
    await axios.delete(`${API}/api/hr/staff/${id}`, { headers: h });
    setStaff(s => s.filter(x => x.staff_id !== id));
  };

  const sendBot = async () => {
    if (!botInput.trim() || botLoading) return;
    const msg = botInput;
    setBotMessages(p => [...p, { role: 'user', content: msg }]);
    setBotInput('');
    setBotLoading(true);
    try {
      const r = await axios.post(`${API}/api/hr/bot/chat`, { message: msg, history: botMessages.slice(-8) }, { headers: h });
      setBotMessages(p => [...p, { role: 'assistant', content: r.data.reply }]);
    } finally { setBotLoading(false); }
  };

  const filtered = filter ? staff.filter(s => s.department === filter) : staff;
  const byDept = filtered.reduce((acc, s) => { (acc[s.department] = acc[s.department] || []).push(s); return acc; }, {} as Record<string, Staff[]>);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Human Centre</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700">+ Add Staff</button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['name', 'Full Name'], ['email', 'Email'], ['position', 'Position'], ['department', 'Department'], ['phone', 'Phone'], ['reports_to', 'Reports To']].map(([k, p]) => (
              <input key={k} placeholder={p} value={(form as any)[k]} onChange={e => setForm({...form, [k]: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={addStaff} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {(['list', 'org', 'bot'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t === 'list' ? 'Staff List' : t === 'org' ? 'Organogram' : 'HR Bot'}
          </button>
        ))}
        {tab === 'list' && (
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="ml-auto px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {tab === 'list' && (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.staff_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{s.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-sm text-slate-500">{s.position} · {s.department}</p>
              </div>
              {s.email && <p className="text-sm text-slate-400 hidden md:block">{s.email}</p>}
              <button onClick={() => deleteStaff(s.staff_id)} className="text-xs text-red-400 hover:text-red-600 px-2">Remove</button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No staff members found</p>}
        </div>
      )}

      {tab === 'org' && (
        <div className="space-y-6">
          {Object.entries(byDept).map(([dept, members]) => (
            <div key={dept} className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">{dept || 'No Department'}</h3>
              <div className="flex flex-wrap gap-3">
                {members.map(m => (
                  <div key={m.staff_id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{m.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bot' && (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col" style={{ height: '500px' }}>
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-800">HR Assistant</p>
            <p className="text-xs text-slate-500">Ask about policies, procedures, staff matters</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {botMessages.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Ask me anything about HR...</p>}
            {botMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-800 border border-slate-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {botLoading && <div className="flex justify-start"><div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-sm text-slate-500">Thinking...</div></div>}
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-3">
            <input value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBot()}
              placeholder="Ask HR anything..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
            <button onClick={sendBot} disabled={botLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
