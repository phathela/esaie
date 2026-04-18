'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface KDoc { doc_id: string; title: string; category: string; description: string; tags: string[]; author_name: string; views: number; created_at: string; }

const CATS = ['SOP', 'Policy', 'Template', 'Form', 'Report', 'Guide', 'Other'];
const CAT_ICONS: Record<string, string> = { SOP: '📋', Policy: '📜', Template: '📁', Form: '📄', Report: '📊', Guide: '📖', Other: '📎' };

export default function KnowledgePage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<KDoc[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<KDoc | null>(null);
  const [form, setForm] = useState({ title: '', category: 'SOP', description: '', content: '', tags: '' });
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadDocs(); }, [token]);

  const loadDocs = async (cat = catFilter, q = search) => {
    const params = new URLSearchParams();
    if (cat) params.append('category', cat);
    if (q) params.append('search', q);
    const r = await axios.get(`${API}/api/knowledge/?${params}`, { headers: h });
    setDocs(r.data.docs || []);
  };

  const create = async () => {
    if (!form.title) return;
    await axios.post(`${API}/api/knowledge/`, {
      ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    }, { headers: h });
    setForm({ title: '', category: 'SOP', description: '', content: '', tags: '' });
    setShowForm(false);
    await loadDocs();
  };

  const handleSearch = (q: string) => { setSearch(q); loadDocs(catFilter, q); };
  const handleCat = (c: string) => { setCatFilter(c); loadDocs(c, search); };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Knowledge Hub</h1>
            <p className="text-slate-500 text-sm mt-1">SOPs, policies, templates and guides</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">+ Add Document</button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <textarea placeholder="Short description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
              <textarea placeholder="Content (full text)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={create} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-5">
          <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search documents..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400" />
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => handleCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!catFilter ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>All</button>
          {CATS.map(c => (
            <button key={c} onClick={() => handleCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${catFilter === c ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {CAT_ICONS[c]} {c}
            </button>
          ))}
        </div>

        {selected ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs text-indigo-600 font-medium">{selected.category}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selected.title}</h2>
                <p className="text-sm text-slate-500 mt-1">by {selected.author_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg">x</button>
            </div>
            {selected.description && <p className="text-slate-700 mb-4">{selected.description}</p>}
            {selected.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selected.tags.map(t => <span key={t} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">{t}</span>)}
              </div>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          {docs.map(doc => (
            <div key={doc.doc_id} onClick={() => setSelected(doc)}
              className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{CAT_ICONS[doc.category] || '📎'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.category} · {doc.author_name}</p>
                  {doc.description && <p className="text-xs text-slate-400 mt-1 truncate">{doc.description}</p>}
                  {doc.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {doc.tags.slice(0, 3).map(t => <span key={t} className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {docs.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <div className="text-4xl mb-3">🧠</div>
            <p className="text-slate-500">No documents yet. Add your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
