'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function CallsPage() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [inCall, setInCall] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');

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
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Video Calls</h1>
        <p className="text-slate-500 mt-1 text-sm">Start or join a video call using Jitsi Meet</p>
      </div>

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
    </div>
  );
}
