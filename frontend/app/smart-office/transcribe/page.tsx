'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TranscribePage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setFile(new File([blob], 'recording.webm', { type: 'audio/webm' }));
    };
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const transcribe = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('language', language);
      const r = await axios.post(`${API}/api/smart-office/transcribe`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setTranscription(r.data.text || r.data.transcription || JSON.stringify(r.data));
    } catch { alert('Transcription failed'); }
    finally { setLoading(false); }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([transcription]));
    a.download = 'transcription.txt';
    a.click();
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Transcribe</h1>
        <p className="text-slate-500 text-sm mt-1">Convert audio to text via AssemblyAI</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-medium text-slate-800 mb-3">Upload Audio / Video</p>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-300 transition-colors">
            <span className="text-3xl mb-2">🎵</span>
            <span className="text-sm text-slate-500">{file ? file.name : 'Click to upload'}</span>
            <input type="file" className="hidden" accept="audio/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-medium text-slate-800 mb-3">Record Live</p>
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            {recording ? (
              <>
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-2xl">🎙️</span>
                </div>
                <button onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">Stop Recording</button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎙️</span>
                </div>
                <button onClick={startRecording}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium">Start Recording</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">Language:</label>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
          <option value="en">English</option>
          <option value="af">Afrikaans</option>
          <option value="fr">French</option>
          <option value="pt">Portuguese</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
        </select>
        <button onClick={transcribe} disabled={loading || !file}
          className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {loading ? 'Transcribing...' : 'Transcribe'}
        </button>
      </div>

      {transcription && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-slate-800">Transcription</p>
            <button onClick={download} className="text-xs text-violet-600 hover:text-violet-700">Download</button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
