'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface CallRecord {
  call_id: string;
  room_name: string;
  initiator_name: string;
  started_at: string;
  duration_minutes: number;
  participants: number;
}

export default function CallsPage() {
  const { user, token } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [tab, setTab] = useState<'start' | 'history'>('start');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) loadCallHistory();
  }, [token]);

  const loadCallHistory = async () => {
    try {
      const r = await axios.get(`${API}/api/comms/calls/history`, { headers: h });
      setCallHistory(r.data.calls);
    } catch (e) {
      console.error('Failed to load call history');
    }
  };

  const startCall = () => {
    const room = roomName.trim() || `esaie-${user?.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setActiveRoom(room);
    setInCall(true);
  };

  if (inCall) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">Video Call</p>
            <p className="text-xs text-slate-500">Room: {activeRoom}</p>
          </div>
          <button onClick={() => setInCall(false)}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
            Leave Call
          </button>
        </div>
        <div className="flex-1">
          <iframe
            src={`https://meet.jit.si/${activeRoom}#userInfo.displayName="${encodeURIComponent(user?.name || 'User')}"`}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; display-capture"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Video Calls</h1>
        <p className="text-slate-500 mt-1 text-sm">Start or join a video call using Jitsi Meet</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setTab('start')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${tab === 'start' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Start Call
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${tab === 'history' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Call History ({callHistory.length})
        </button>
      </div>

      {tab === 'start' && (
        <>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Start or Join a Call</h2>
        <div className="flex gap-3">
          <input value={roomName} onChange={e => setRoomName(e.target.value)}
            placeholder="Room name (leave blank for a new room)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
          <button onClick={startCall}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
            Join
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: '📹', title: 'HD Video', desc: 'High-quality video powered by Jitsi Meet' },
          { icon: '🔒', title: 'Encrypted', desc: 'End-to-end encrypted calls' },
          { icon: '🖥️', title: 'Screen Share', desc: 'Share your screen with participants' },
          { icon: '📼', title: 'Recording', desc: 'Record meetings for later review' },
        ].map(f => (
          <div key={f.title} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="font-medium text-slate-800 text-sm">{f.title}</p>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {tab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Calls</h2>
          {callHistory.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No call history yet</p>
          ) : (
            <div className="space-y-3">
              {callHistory.map(call => (
                <Link
                  key={call.call_id}
                  href={`/comms-centre/calls/${call.call_id}`}
                  className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-violet-600">📞 {call.room_name}</h3>
                      <p className="text-sm text-slate-600 mt-1">By {call.initiator_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(call.started_at).toLocaleString()} · {call.duration_minutes} min · {call.participants} participants
                      </p>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
