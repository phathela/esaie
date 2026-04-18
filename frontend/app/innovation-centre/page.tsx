'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Idea { idea_id: string; title: string; description: string; category: string; impact: string; stage: string; votes: number; submitter_name: string; created_at: string; }

const STAGES = ['Submitted', 'Under Review', 'Approved', 'In Development', 'Launched', 'Rejected'];
const STAGE_COLORS: Record<string, string> = {
  Submitted: 'bg-slate-100 text-slate-700', 'Under Review': 'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700', 'In Development': 'bg-blue-100 text-blue-700',
  Launched: 'bg-violet-100 text-violet-700', Rejected: 'bg-red-100 text-red-700',
};
const IMPACT_COLORS: Record<string, string> = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-green-600' };

export default function InnovationPage() {
  const { token } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stageFilter, setStageFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'board' | 'bot'>('board');
  const [form, setForm] = useState({ title: '', description: '', category: 'General', impact: 'medium', tags: '' });
  const [botMessages, setBotMessages] = useState<{ role: string; content: string }[]>([]);
  const [botInput, setBotInput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const h = { Authorization: `Bearer ${token}` };

  const CATS = ['General', 'Product', 'Process', 'Technology', 'People', 'Customer'];

  useEffect(() => { if (token) loadIdeas(); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [botMessages]);

  const loadIdeas = async (stage = stageFilter) => {
    const params = stage ? `?stage=${stage}` : '';
    const r = await axios.get(`${API}/api/innovation/ideas${params}`, { headers: h });
    setIdeas(r.data.ideas || []);
  };

  const submit = async () => {
    if (!form.title) return;
    await axios.post(`${API}/api/innovation/ideas`, {
      ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    }, { headers: h });
    setForm({ title: '', description: '', category: 'General', impact: 'medium', tags: '' });
    setShowForm(false);
    await loadIdeas();
  };

  const vote = async (idea_id: string) => {
    await axios.post(`${API}/api/innovation/ideas/vote`, { idea_id }, { headers: h });
    await loadIdeas();
  };

  const sendBot = async () => {
    if (!botInput.trim() || botLoading) return;
    const msg = botInput;
    setBotMessages(p => [...p, { role: 'user', content: msg }]);
    setBotInput('');
    setBotLoading(true);
    try {
      const r = await axios.post(`${API}/api/innovation/bot`, { message: msg, history: botMessages.slice(-8) }, { headers: h });
      setBotMessages(p => [...p, { role: 'assistant', content: r.data.reply }]);
    } finally { setBotLoading(false); }
  };

  const filterStage = (s: string) => { setStageFilter(s); loadIdeas(s); };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Innovation Centre</h1>
            <p className="text-slate-500 text-sm mt-1">Share ideas, vote, and build the future</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">+ Submit Idea</button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Idea title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.impact} onChange={e => setForm({...form, impact: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="low">Low Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="high">High Impact</option>
              </select>
              <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <textarea placeholder="Describe your idea in detail..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={submit} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium">Submit</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          {(['board', 'bot'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {t === 'board' ? 'Ideas Board' : 'Innovation Bot'}
            </button>
          ))}
        </div>

        {tab === 'board' && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              <button onClick={() => filterStage('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!stageFilter ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                All ({ideas.length})
              </button>
              {STAGES.map(s => (
                <button key={s} onClick={() => filterStage(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${stageFilter === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {ideas.map(idea => (
                <div key={idea.idea_id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[idea.stage]}`}>{idea.stage}</span>
                        <span className="text-xs text-slate-500">{idea.category}</span>
                        <span className={`text-xs font-medium ${IMPACT_COLORS[idea.impact]}`}>{idea.impact} impact</span>
                      </div>
                      <p className="font-semibold text-slate-800">{idea.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{idea.description}</p>
                      <p className="text-xs text-slate-400 mt-2">by {idea.submitter_name}</p>
                    </div>
                    <button onClick={() => vote(idea.idea_id)}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors min-w-[60px]">
                      <span className="text-lg">👍</span>
                      <span className="text-sm font-bold text-slate-700">{idea.votes}</span>
                    </button>
                  </div>
                </div>
              ))}
              {ideas.length === 0 && (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                  <div className="text-4xl mb-3">💡</div>
                  <p className="text-slate-500">No ideas yet. Be the first to submit one!</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'bot' && (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col" style={{ height: '500px' }}>
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-800">Innovation Bot</p>
              <p className="text-xs text-slate-500">Get AI help to develop, refine, and evaluate your ideas</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {botMessages.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Ask for help brainstorming or refining ideas...</p>}
              {botMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-800 border border-slate-200'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {botLoading && <div className="flex justify-start"><div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-sm text-slate-500">Thinking...</div></div>}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <input value={botInput} onChange={e => setBotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendBot()}
                placeholder="Ask about innovation, ideas, or get feedback..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
              <button onClick={sendBot} disabled={botLoading} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
