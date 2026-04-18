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
  const [tab, setTab] = useState<'overview' | 'cameras' | 'lpr' | 'watchlist' | 'ptz' | 'recordings' | 'alerts'>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [ptzCommand, setPtzCommand] = useState('pan_left');
  const [recordings, setRecordings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
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
    loadDashboard();
    loadRecordings();
    loadAlerts();
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

  const loadDashboard = async () => {
    try {
      const r = await axios.get(`${API}/api/monitoring/dashboard`, { headers: h });
      setDashboard(r.data);
    } catch (e) {
      console.error('Failed to load dashboard');
    }
  };

  const loadRecordings = async () => {
    try {
      const r = await axios.get(`${API}/api/monitoring/recordings`, { headers: h });
      setRecordings(r.data.recordings || []);
    } catch (e) {
      console.error('Failed to load recordings');
    }
  };

  const loadAlerts = async () => {
    try {
      const r = await axios.get(`${API}/api/monitoring/alerts`, { headers: h });
      setAlerts(r.data.alerts || []);
    } catch (e) {
      console.error('Failed to load alerts');
    }
  };

  const sendPTZCommand = async (camera_id: string) => {
    try {
      await axios.post(`${API}/api/monitoring/cameras/${camera_id}/ptz`,
        { command: ptzCommand, duration_seconds: 1 }, { headers: h });
    } catch (e) {
      console.error('Failed to send PTZ command');
    }
  };

  const startRecording = async (camera_id: string) => {
    try {
      await axios.post(`${API}/api/monitoring/cameras/${camera_id}/recordings`,
        { duration_minutes: 60, description: 'Manual recording' }, { headers: h });
      await loadRecordings();
    } catch (e) {
      console.error('Failed to start recording');
    }
  };

  const acknowledgeAlert = async (alert_id: string) => {
    try {
      await axios.post(`${API}/api/monitoring/alerts/${alert_id}/acknowledge`, {}, { headers: h });
      await loadAlerts();
    } catch (e) {
      console.error('Failed to acknowledge alert');
    }
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

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['overview', 'cameras', 'lpr', 'watchlist', 'ptz', 'recordings', 'alerts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {t === 'overview' ? '📊 Overview' : t === 'cameras' ? `📹 Cameras` : t === 'lpr' ? `🚗 LPR` : t === 'watchlist' ? '⚠️ Watchlist' : t === 'ptz' ? '🎮 PTZ' : t === 'recordings' ? '🎥 Recordings' : '🚨 Alerts'}
            </button>
          ))}
        </div>

        {tab === 'overview' && dashboard && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-sm text-slate-600 mb-2">Total Cameras</p>
                <p className="text-3xl font-bold text-slate-900">{dashboard.cameras.total}</p>
                <p className="text-xs text-green-600 mt-2">✓ {dashboard.cameras.online} online</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-sm text-slate-600 mb-2">Active Recordings</p>
                <p className="text-3xl font-bold text-red-600">{dashboard.recordings.active}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-sm text-slate-600 mb-2">Unacknowledged Alerts</p>
                <p className="text-3xl font-bold text-orange-600">{dashboard.alerts.unacknowledged}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-sm text-slate-600 mb-2">LPR Events</p>
                <p className="text-3xl font-bold text-slate-900">{events.length}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-medium text-slate-800 mb-4">Recent Alerts</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dashboard.alerts.recent?.slice(0, 5).map((a: any) => (
                  <div key={a.alert_id} className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="font-medium text-slate-900 text-sm">{a.rule_name}</p>
                    <p className="text-xs text-slate-600">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {tab === 'ptz' && (
          <div>
            <p className="text-sm text-slate-600 mb-4">Select a PTZ-enabled camera to control pan, tilt, and zoom</p>
            <div className="grid grid-cols-2 gap-4">
              {cameras.filter(c => c.type === 'ptz').map(c => (
                <div key={c.camera_id} className={`bg-white border-2 rounded-2xl p-5 cursor-pointer transition-colors ${selectedCamera === c.camera_id ? 'border-red-600' : 'border-slate-200 hover:border-red-300'}`}
                  onClick={() => setSelectedCamera(c.camera_id)}>
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-600">{c.location}</p>
                  {selectedCamera === c.camera_id && (
                    <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-lg">
                      <select value={ptzCommand} onChange={e => setPtzCommand(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
                        <option value="pan_left">← Pan Left</option>
                        <option value="pan_right">Pan Right →</option>
                        <option value="tilt_up">⬆ Tilt Up</option>
                        <option value="tilt_down">⬇ Tilt Down</option>
                        <option value="zoom_in">🔍 Zoom In</option>
                        <option value="zoom_out">🔍 Zoom Out</option>
                      </select>
                      <button onClick={() => sendPTZCommand(c.camera_id)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Execute</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {cameras.filter(c => c.type === 'ptz').length === 0 && (
              <p className="text-slate-500 text-center py-8">No PTZ cameras available</p>
            )}
          </div>
        )}

        {tab === 'recordings' && (
          <div>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-4">Start Recording</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {cameras.map(c => (
                  <button key={c.camera_id} onClick={() => startRecording(c.camera_id)}
                    className="px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                    🎥 {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Active & Past Recordings ({recordings.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recordings.map(r => (
                  <div key={r.recording_id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{r.duration_minutes} min · {new Date(r.started_at).toLocaleString()}</p>
                      <p className={`text-xs mt-1 ${r.status === 'recording' ? 'text-red-600' : 'text-green-600'}`}>{r.status}</p>
                    </div>
                    <a href={r.file_url} target="_blank" rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Download</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Alert History ({alerts.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.slice(0, 100).map(a => (
                <div key={a.alert_id} className={`border-l-4 rounded-lg p-4 ${a.acknowledged ? 'bg-slate-50 border-slate-400' : 'bg-red-50 border-red-600'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{a.rule_name}</p>
                      <p className="text-sm text-slate-600">{a.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    {!a.acknowledged && (
                      <button onClick={() => acknowledgeAlert(a.alert_id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Ack</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
