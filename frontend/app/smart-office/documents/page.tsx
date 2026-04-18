'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Doc { file_id: string; filename: string; analysis: string; size: number; created_at: string; }

export default function DocumentsPage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) loadDocs();
  }, [token]);

  const loadDocs = async () => {
    const r = await axios.get(`${API}/api/smart-office/documents`, { headers: h });
    setDocs(r.data.documents || []);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await axios.post(`${API}/api/smart-office/documents/upload`, fd, { headers: { ...h, 'Content-Type': 'multipart/form-data' } });
      setSelected(r.data);
      await loadDocs();
    } catch { alert('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const ask = async () => {
    if (!selected || !question.trim()) return;
    setAsking(true);
    try {
      const r = await axios.post(`${API}/api/smart-office/documents/query`, { file_id: selected.file_id, question }, { headers: h });
      setAnswer(r.data.answer);
    } finally { setAsking(false); }
  };

  const deleteDoc = async (file_id: string) => {
    await axios.delete(`${API}/api/smart-office/documents/${file_id}`, { headers: h });
    if (selected?.file_id === file_id) { setSelected(null); setAnswer(''); }
    await loadDocs();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <label className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer">
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={upload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">My Documents ({docs.length})</p>
          {docs.map(doc => (
            <div key={doc.file_id}
              onClick={() => { setSelected(doc); setAnswer(''); setQuestion(''); }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.file_id === doc.file_id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(doc.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteDoc(doc.file_id); }}
                  className="text-slate-300 hover:text-red-500 text-xs px-1">x</button>
              </div>
            </div>
          ))}
          {docs.length === 0 && !uploading && <p className="text-slate-400 text-sm text-center py-8">No documents yet</p>}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-semibold text-slate-800 mb-1">{selected.filename}</h2>
              <p className="text-xs text-slate-400 mb-4">{new Date(selected.created_at).toLocaleString()}</p>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Analysis</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.analysis}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Ask a question about this document</p>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="What is the main topic? Summarize key points..."
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none" />
                <button onClick={ask} disabled={asking || !question.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                  {asking ? 'Thinking...' : 'Ask'}
                </button>
                {answer && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-slate-500 text-sm">Select a document to view and query it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
