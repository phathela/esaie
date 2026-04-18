'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Camera { camera_id: string; name: string; location: string; stream_url: string; type: string; status: string; }
interface LPREvent { event_id: string; camera_id: string; plate: string; flagged: boolean; flag_reason?: string; created_at: string; }

export default function MonitoringPage() {
  const { token } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<LPREvent[]>([]);
  const [tab, setTab] = useState<'cameras' | 'lpr' | 'watchlist'>('cameras');
  const [showForm, setShowForm] = useState(false);
  const [lprForm, setLprForm] = useState({ camera_id: '', plate: '' });
  const [watchPlate, setWatchPlate] = useState('');
  const [watchReason, setWatchReason] = useState('');
  const [form, setForm] = useState({ name: '', location: '', stream_url: '', type: 'ip' });
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    loadCameras();
    loadLPR();
  }, [token]);

  const loadCameras = async () => {
    const r = await axios.get(`${API}/api/monitoring/cameras`, { headers: h });
    setCameras(r.data.cameras || []);
  };

  const loadLPR = async () => {
    const r = await axios.get(`${API}/api/monitoring/lpr`, { headers: h });
    setEvents(r.data.events || []);
  };

  const addCamera = async () => {
    if (!form.name || !form.location) return;
    await axios.post(`${API}/api/monitoring/cameras`, form, { headers: h });
    setForm({ name: '', location: '', stream_url: '', type: 'ip' });
    setShowForm(false);
    await loadCameras();
  };

  const deleteCamera = async (id: string) => {
    await axios.delete(`${API}/api/monitoring/cameras/${id}`, { headers: h });
    setCameras(c => c.filter(x => x.camera_id !== id));
  };

  const logLPR = async () => {
    if (!lprForm.plate || !lprForm.camera_id) return;
    const r = await axios.post(`${API}/api/monitoring/lpr`, lprForm, { headers: h });
    setLprForm({ camera_id: '', plate: '' });
    await loadLPR();
    if (r.data.event?.flagged) alert(`ALERT: Plate ${r.data.event.plate} is on the watchlist! Reason: ${r.data.event.flag_reason}`);
  };

  const addToWatchlist = async () => {
    if (!watchPlate) return;
    await axios.post(`${API}/api/monitoring/lpr/watchlist`, { plate: watchPlate, reason: watchReason }, { headers: h });
    setWatchPlate('');
    setWatchReason('');
    alert('Plate added to watchlist');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monitoring Centre</h1>
            <p className="text-slate-500 text-sm mt-1">Cameras, LPR and security monitoring</p>
          </div>
          {tab === 'cameras' && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900">+ Add Camera</button>
          )}
        </div>

        {tab === 'cameras' && showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Camera name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <input placeholder="Stream URL (RTSP/HTTP)" value={form.stream_url} onChange={e => setForm({...form, stream_url: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="ip">IP Camera</option>
                <option value="usb">USB Camera</option>
                <option value="thermal">Thermal</option>
                <option value="ptz">PTZ Camera</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={addCamera} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium">Add</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['cameras', 'lpr', 'watchlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {t === 'cameras' ? `Cameras (${cameras.length})` : t === 'lpr' ? `LPR Events (${events.length})` : 'Watchlist'}
            </button>
          ))}
        </div>

        {tab === 'cameras' && (
          <div className="grid grid-cols-2 gap-4">
            {cameras.map(c => (
              <div key={c.camera_id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                    <button onClick={() => deleteCamera(c.camera_id)} className="text-xs text-red-400 hover:text-red-600">x</button>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-xl h-32 flex items-center justify-center">
                  {c.stream_url ? (
                    <p className="text-slate-400 text-xs">Stream: {c.stream_url}</p>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">📷</span>
                      <p className="text-slate-500 text-xs mt-1">No stream configured</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">{c.type} camera</p>
              </div>
            ))}
            {cameras.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <div className="text-4xl mb-3">📹</div>
                <p className="text-slate-500">No cameras added yet</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lpr' && (
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
              <p className="font-medium text-slate-800 mb-3">Log Plate Event</p>
              <div className="flex gap-3">
                <select value={lprForm.camera_id} onChange={e => setLprForm({...lprForm, camera_id: e.target.value})}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Select Camera</option>
                  {cameras.map(c => <option key={c.camera_id} value={c.camera_id}>{c.name}</option>)}
                </select>
                <input placeholder="Plate number" value={lprForm.plate} onChange={e => setLprForm({...lprForm, plate: e.target.value})}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none uppercase" />
                <button onClick={logLPR} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium">Log</button>
              </div>
            </div>
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.event_id} className={`bg-white border rounded-xl p-4 flex items-center justify-between ${e.flagged ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    {e.flagged && <span className="text-red-600 font-bold text-lg">!</span>}
                    <div>
                      <p className={`font-bold tracking-wider ${e.flagged ? 'text-red-700' : 'text-slate-800'}`}>{e.plate}</p>
                      {e.flag_reason && <p className="text-xs text-red-600">{e.flag_reason}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString()}</p>
                </div>
              ))}
              {events.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No LPR events yet</p>}
            </div>
          </div>
        )}

        {tab === 'watchlist' && (
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
              <p className="font-medium text-slate-800 mb-3">Add Plate to Watchlist</p>
              <div className="flex gap-3">
                <input placeholder="Plate number" value={watchPlate} onChange={e => setWatchPlate(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none uppercase" />
                <input placeholder="Reason" value={watchReason} onChange={e => setWatchReason(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                <button onClick={addToWatchlist} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">Add</button>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center py-4">Plates on the watchlist will trigger alerts when detected by LPR cameras.</p>
          </div>
        )}
      </div>
    </div>
  );
}
