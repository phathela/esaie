'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Contract { contract_id: string; employee_id: string; period: string; status: string; objectives: { title: string; weight: number; target: string }[]; notes: string; created_at: string; }
interface Staff { staff_id: string; name: string; position: string; }

export default function PerformancePage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [form, setForm] = useState({ employee_id: '', period: '', notes: '' });
  const [objectives, setObjectives] = useState<{ title: string; weight: number; target: string }[]>([]);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/api/hr/performance`, { headers: h }).then(r => setContracts(r.data.contracts || []));
    axios.get(`${API}/api/hr/staff`, { headers: h }).then(r => setStaff(r.data.staff || []));
  }, [token]);

  const addObjective = () => setObjectives([...objectives, { title: '', weight: 20, target: '' }]);
  const updateObj = (i: number, field: string, val: string | number) => {
    setObjectives(objectives.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  };

  const create = async () => {
    if (!form.employee_id || !form.period) return;
    await axios.post(`${API}/api/hr/performance`, { ...form, objectives }, { headers: h });
    setForm({ employee_id: '', period: '', notes: '' });
    setObjectives([]);
    setShowForm(false);
    const r = await axios.get(`${API}/api/hr/performance`, { headers: h });
    setContracts(r.data.contracts || []);
  };

  const getStaffName = (id: string) => staff.find(s => s.staff_id === id)?.name || id;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700">+ New Contract</button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">New Performance Contract</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
              <option value="">Select Employee</option>
              {staff.map(s => <option key={s.staff_id} value={s.staff_id}>{s.name} — {s.position}</option>)}
            </select>
            <input placeholder="Period (e.g. Jan–Mar 2025)" value={form.period} onChange={e => setForm({...form, period: e.target.value})}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Objectives / KPAs</p>
              <button onClick={addObjective} className="text-xs text-emerald-600 hover:text-emerald-700">+ Add Objective</button>
            </div>
            {objectives.map((o, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                <input placeholder="Objective title" value={o.title} onChange={e => updateObj(i, 'title', e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                <input placeholder="Target" value={o.target} onChange={e => updateObj(i, 'target', e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                <input type="number" placeholder="Weight %" value={o.weight} onChange={e => updateObj(i, 'weight', +e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </div>
            ))}
          </div>

          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none mb-4 resize-none" />

          <div className="flex gap-3">
            <button onClick={create} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contracts ({contracts.length})</p>
          {contracts.map(c => (
            <div key={c.contract_id} onClick={() => setSelected(c)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.contract_id === c.contract_id ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <p className="text-sm font-medium text-slate-800">{getStaffName(c.employee_id)}</p>
              <p className="text-xs text-slate-500">{c.period}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
            </div>
          ))}
          {contracts.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No contracts yet</p>}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="font-semibold text-slate-800 mb-1">{getStaffName(selected.employee_id)}</p>
              <p className="text-sm text-slate-500 mb-4">{selected.period}</p>
              <div className="space-y-2">
                {(selected.objectives || []).map((o, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{o.title}</p>
                      <p className="text-xs text-slate-500">Target: {o.target}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{o.weight}%</span>
                  </div>
                ))}
                {(!selected.objectives || selected.objectives.length === 0) && (
                  <p className="text-slate-400 text-sm text-center py-4">No objectives defined</p>
                )}
              </div>
              {selected.notes && <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">{selected.notes}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-3">📈</div>
                <p className="text-slate-500 text-sm">Select a contract to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
