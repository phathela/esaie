'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface XFile { file_id: string; filename: string; sheet_count: number; created_at: string; }

export default function ExcelPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState<XFile[]>([]);
  const [selected, setSelected] = useState<XFile | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadFiles(); }, [token]);

  const loadFiles = async () => {
    const r = await axios.get(`${API}/api/smart-office/excel/files`, { headers: h });
    setFiles(r.data.files || []);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await axios.post(`${API}/api/smart-office/excel/upload`, fd, {
        headers: { ...h, 'Content-Type': 'multipart/form-data' }
      });
      await loadFiles();
      const fresh = await axios.get(`${API}/api/smart-office/excel/files`, { headers: h });
      const f = (fresh.data.files || []).find((x: XFile) => x.file_id === r.data.file_id);
      if (f) setSelected(f);
    } catch { alert('Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const ask = async () => {
    if (!selected || !question.trim()) return;
    setAsking(true);
    try {
      const r = await axios.post(`${API}/api/smart-office/excel/query`, { file_id: selected.file_id, question }, { headers: h });
      setAnswer(r.data.answer);
    } finally { setAsking(false); }
  };

  const suggestions = [
    'What is the total revenue?', 'Show the top 5 entries by value',
    'What are the column headers?', 'Find any errors or anomalies',
    'Calculate the average', 'Compare values across rows',
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Excel / Spreadsheet AI</h1>
          <p className="text-slate-500 text-sm mt-1">Ask questions about your spreadsheets</p>
        </div>
        <label className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer">
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" className="hidden" accept=".xlsx,.csv,.xls" onChange={upload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Files ({files.length})</p>
          {files.map(f => (
            <div key={f.file_id} onClick={() => { setSelected(f); setAnswer(''); setQuestion(''); }}
              className={`p-3 rounded-xl border cursor-pointer mb-2 transition-all ${selected?.file_id === f.file_id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <p className="text-sm font-medium text-slate-800 truncate">{f.filename}</p>
              <p className="text-xs text-slate-400 mt-0.5">{f.sheet_count} sheets</p>
            </div>
          ))}
          {files.length === 0 && !uploading && <p className="text-slate-400 text-sm text-center py-8">No files yet</p>}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="font-semibold text-slate-800 mb-4">{selected.filename}</p>

              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Questions</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setQuestion(s)}
                      className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-violet-50 hover:text-violet-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <textarea value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Ask anything about your data..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none mb-3" />
              <button onClick={ask} disabled={asking || !question.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {asking ? 'Analyzing...' : 'Ask AI'}
              </button>

              {answer && (
                <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-violet-700 mb-2">Answer</p>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-slate-500 text-sm">Upload a spreadsheet and ask questions about it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
