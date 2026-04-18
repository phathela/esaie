'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const REPORT_TYPES = [
  'Executive Summary', 'Analysis/Assessment', 'Business Case',
  'Project Plan', 'Guideline', 'Production Report', 'Plan',
];

interface Doc { file_id: string; filename: string; analysis: string; size: number; created_at: string; }

export default function DocumentsPage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [tab, setTab] = useState<'qa' | 'report'>('qa');
  const [reportType, setReportType] = useState('Executive Summary');
  const [report, setReport] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadDocs(); }, [token]);

  const loadDocs = async () => {
    const r = await axios.get(`${API}/api/smart-office/documents`, { headers: h });
    setDocs(r.data.documents || []);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await axios.post(`${API}/api/smart-office/documents/upload`, fd, {
        headers: { ...h, 'Content-Type': 'multipart/form-data' }
      });
      await loadDocs();
      const allDocs = await axios.get(`${API}/api/smart-office/documents`, { headers: h });
      const fresh = (allDocs.data.documents || []).find((d: Doc) => d.file_id === r.data.file_id);
      if (fresh) { setSelected(fresh); setAnswer(''); setReport(''); setQuestion(''); }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Upload failed');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const ask = async () => {
    if (!selected || !question.trim()) return;
    setAsking(true); setError('');
    try {
      const r = await axios.post(`${API}/api/smart-office/documents/query`,
        { file_id: selected.file_id, question }, { headers: h });
      setAnswer(r.data.answer);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Query failed');
    } finally { setAsking(false); }
  };

  const generateReport = async () => {
    if (!selected) return;
    setGenerating(true); setError(''); setReport('');
    try {
      const r = await axios.post(`${API}/api/smart-office/documents/report`,
        { file_id: selected.file_id, report_type: reportType }, { headers: h });
      setReport(r.data.report);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Report generation failed');
    } finally { setGenerating(false); }
  };

  const deleteDoc = async (file_id: string) => {
    await axios.delete(`${API}/api/smart-office/documents/${file_id}`, { headers: h });
    if (selected?.file_id === file_id) { setSelected(null); setAnswer(''); setReport(''); }
    await loadDocs();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Upload PDFs or text files — AI analyses, answers questions and generates reports</p>
        </div>
        <label className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer">
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" className="hidden" accept=".pdf,.txt,.docx,.md,.csv" onChange={upload} disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">My Documents ({docs.length})</p>
          {docs.map(doc => (
            <div key={doc.file_id}
              onClick={() => { setSelected(doc); setAnswer(''); setQuestion(''); setReport(''); setError(''); }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.file_id === doc.file_id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(doc.size / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteDoc(doc.file_id); }}
                  className="text-slate-300 hover:text-red-500 text-sm leading-none px-1 mt-0.5">×</button>
              </div>
            </div>
          ))}
          {docs.length === 0 && !uploading && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-slate-400 text-sm">No documents yet</p>
            </div>
          )}
          {uploading && <p className="text-violet-600 text-sm text-center py-4">Uploading & analysing...</p>}
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

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setTab('qa')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'qa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Ask Questions
                </button>
                <button onClick={() => setTab('report')}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'report' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Generate Report
                </button>
              </div>

              {tab === 'qa' && (
                <div className="space-y-3">
                  <textarea value={question} onChange={e => setQuestion(e.target.value)}
                    placeholder="e.g. What are the key recommendations? Summarise section 2."
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none" />
                  <button onClick={ask} disabled={asking || !question.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                    {asking ? 'Thinking...' : 'Ask AI'}
                  </button>
                  {answer && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-violet-700 mb-2">Answer</p>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'report' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Report Type</p>
                    <div className="flex flex-wrap gap-2">
                      {REPORT_TYPES.map(rt => (
                        <button key={rt} onClick={() => setReportType(rt)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${reportType === rt ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                          {rt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={generateReport} disabled={generating}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                    {generating ? 'Generating...' : `Generate ${reportType}`}
                  </button>
                  {report && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{reportType}</p>
                        <button onClick={() => navigator.clipboard.writeText(report)}
                          className="text-xs text-violet-600 hover:text-violet-700">Copy</button>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{report}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-slate-500 text-sm">Upload a document or select one to analyse it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
