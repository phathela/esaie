'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface CallDetail {
  call_id: string;
  room_name: string;
  initiator_name: string;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  participants: number;
  recording_url?: string;
  transcription?: string;
  notes?: string;
}

export default function CallDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const call_id = params.call_id as string;
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);

  useEffect(() => {
    if (token && call_id) loadCall();
  }, [token, call_id]);

  const loadCall = async () => {
    try {
      const r = await axios.get(`${API}/api/comms/calls/${call_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCall(r.data.call);
      setNotes(r.data.call.notes || '');
    } catch (e) {
      console.error('Failed to load call');
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    try {
      await axios.post(
        `${API}/api/comms/calls/${call_id}/notes`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error('Failed to save notes');
    }
  };

  if (loading || !call) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{call.room_name}</h1>
        <p className="text-slate-600 mt-2">Initiated by {call.initiator_name}</p>
      </div>

      {/* Call Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-600">Duration</p>
          <p className="text-2xl font-bold text-slate-900">{call.duration_minutes}m</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-600">Participants</p>
          <p className="text-2xl font-bold text-slate-900">{call.participants}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-600">Started</p>
          <p className="text-sm font-mono text-slate-900">{new Date(call.started_at).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-600">Status</p>
          <p className={`text-lg font-bold ${call.ended_at ? 'text-red-600' : 'text-green-600'}`}>
            {call.ended_at ? 'Ended' : 'Active'}
          </p>
        </div>
      </div>

      {/* Recording & Transcription */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {call.recording_url && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">🎥 Recording</h3>
            <video src={call.recording_url} controls className="w-full rounded-lg mb-4" />
            <a
              href={call.recording_url}
              download
              className="inline-block px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              Download
            </a>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4">📝 Notes</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this call..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:border-violet-400"
            rows={4}
          />
          <button
            onClick={saveNotes}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            Save Notes
          </button>
        </div>
      </div>

      {/* Transcription */}
      {call.transcription && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-semibold text-slate-900">🎤 Transcription</h3>
            <span className="text-slate-400">{showTranscription ? '▼' : '▶'}</span>
          </button>
          {showTranscription && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {call.transcription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
