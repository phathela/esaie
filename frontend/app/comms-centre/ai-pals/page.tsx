'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const PALS = [
  { id: 'aria', name: 'Aria', role: 'General Assistant', icon: '🤖' },
  { id: 'leo', name: 'Leo', role: 'Legal Advisor', icon: '⚖️' },
  { id: 'nova', name: 'Nova', role: 'Data Analyst', icon: '📊' },
  { id: 'max', name: 'Max', role: 'IT Support', icon: '💻' },
];

export default function AIPalsPage() {
  const { token } = useAuth();
  const [selected, setSelected] = useState(PALS[0]);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/comms/ai-pals/chat`,
        { pal_id: selected.id, message: input, history: messages.slice(-10) },
        { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.reply }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen">
      <div className="w-56 bg-white border-r border-slate-200 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">AI Pals</p>
        {PALS.map(p => (
          <button key={p.id} onClick={() => { setSelected(p); setMessages([]); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${selected.id === p.id ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-transparent hover:bg-slate-50'}`}>
            <span className="text-xl">{p.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-500">{p.role}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
          <span className="text-2xl">{selected.icon}</span>
          <div>
            <p className="font-semibold text-slate-800">{selected.name}</p>
            <p className="text-xs text-slate-500">{selected.role}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">{selected.icon}</div>
              <p className="text-slate-600 font-medium">Hi! I&apos;m {selected.name}</p>
              <p className="text-slate-500 text-sm mt-1">{selected.role} — ask me anything!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-sm text-slate-500">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Ask ${selected.name} anything...`}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
          <button onClick={send} disabled={loading}
            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
