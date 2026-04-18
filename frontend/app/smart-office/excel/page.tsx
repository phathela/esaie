'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface XFile { file_id: string; filename: string; sheet_count: number; row_count?: number; columns?: string[]; created_at: string; }

type Tab = 'ask' | 'analyze' | 'errors' | 'formula';

export default function ExcelPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState<XFile[]>([]);
  const [selected, setSelected] = useState<XFile | null>(null);
  const [tab, setTab] = useState<Tab>('ask');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [errorReport, setErrorReport] = useState<{ detected_issues: any[]; ai_analysis: string } | null>(null);
  const [formulaDesc, setFormulaDesc] = useState('');
  const [formulaCtx, setFormulaCtx] = useState('');
  const [formulaResult, setFormulaResult] = useState('');
  const [error, setError] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadFiles(); }, [token]);

  const loadFiles = async () => {
    const r = await axios.get(`${API}/api/smart-office/excel/files`, { headers: h });
    setFiles(r.data.files || []);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await axios.post(`${API}/api/smart-office/excel/upload`, fd, {
        headers: { ...h, 'Content-Type': 'multipart/form-data' }
      });
      await loadFiles();
      const fresh = await axios.get(`${API}/api/smart-office/excel/files`, { headers: h });
      const f = (fresh.data.files || []).find((x: XFile) => x.file_id === r.data.file_id);
      if (f) { setSelected(f); setAnswer(''); setInsights(''); setErrorReport(null); }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Upload failed');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const ask = async () => {
    if (!selected || !question.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}/api/smart-office/excel/query`,
        { file_id: selected.file_id, question }, { headers: h });
      setAnswer(r.data.answer);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Query failed');
    } finally { setLoading(false); }
  };

  const analyze = async () => {
    if (!selected) return;
    setLoading(true); setError(''); setInsights('');
    try {
      const r = await axios.post(`${API}/api/smart-office/excel/analyze`,
        { file_id: selected.file_id, question: '' }, { headers: h });
      setInsights(r.data.insights);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Analysis failed');
    } finally { setLoading(false); }
  };

  const detectErrors = async () => {
    if (!selected) return;
    setLoading(true); setError(''); setErrorReport(null);
    try {
      const r = await axios.post(`${API}/api/smart-office/excel/errors`,
        { file_id: selected.file_id, question: '' }, { headers: h });
      setErrorReport(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Error detection failed');
    } finally { setLoading(false); }
  };

  const getFormula = async () => {
    if (!formulaDesc.trim()) return;
    setLoading(true); setError(''); setFormulaResult('');
    try {
      const r = await axios.post(`${API}/api/smart-office/excel/formula`,
        { description: formulaDesc, context: formulaCtx }, { headers: h });
      setFormulaResult(r.data.formula_response);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Formula generation failed');
    } finally { setLoading(false); }
  };

  const suggestions = [
    'What is the total revenue?', 'Show the top 5 entries by value',
    'What are the column headers?', 'Find any anomalies or errors',
    'Calculate the average', 'Which row has the highest value?',
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'ask', label: 'Ask AI' },
    { id: 'analyze', label: 'Analyze Data' },
    { id: 'errors', label: 'Check Errors' },
    { id: 'formula', label: 'Formula Helper' },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Excel / Spreadsheet AI</h1>
          <p className="text-slate-500 text-sm mt-1">Upload a spreadsheet and ask questions, analyze data, detect errors or generate formulas</p>
        </div>
        <label className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer">
          {uploading ? 'Uploading...' : '+ Upload'}
          <input type="file" className="hidden" accept=".xlsx,.csv,.xls" onChange={upload} disabled={uploading} />
        </label>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Files ({files.length})</p>
          {files.map(f => (
            <div key={f.file_id} onClick={() => { setSelected(f); setAnswer(''); setInsights(''); setErrorReport(null); setFormulaResult(''); setError(''); }}
              className={`p-3 rounded-xl border cursor-pointer mb-2 transition-all ${selected?.file_id === f.file_id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              <p className="text-sm font-medium text-slate-800 truncate">{f.filename}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {f.row_count ? `${f.row_count} rows · ` : ''}{f.sheet_count} sheet(s) · {new Date(f.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {files.length === 0 && !uploading && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-slate-400 text-sm">No spreadsheets yet</p>
            </div>
          )}
          {uploading && <p className="text-violet-600 text-sm text-center py-4">Parsing spreadsheet...</p>}
        </div>

        <div className="col-span-2">
          {selected ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="font-semibold text-slate-800 mb-0.5">{selected.filename}</p>
              <p className="text-xs text-slate-400 mb-4">
                {selected.row_count ? `${selected.row_count} rows · ` : ''}{selected.sheet_count} sheet(s)
                {selected.columns?.length ? ` · Columns: ${selected.columns.slice(0, 4).join(', ')}${selected.columns.length > 4 ? '...' : ''}` : ''}
              </p>

              {/* Tab strip */}
              <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Ask AI */}
              {tab === 'ask' && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Questions</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => setQuestion(s)}
                        className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-violet-50 hover:text-violet-700 transition-colors">{s}</button>
                    ))}
                  </div>
                  <textarea value={question} onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask anything about your data in plain English..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none mb-3" />
                  <button onClick={ask} disabled={loading || !question.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                    {loading ? 'Analysing...' : 'Ask AI'}
                  </button>
                  {answer && (
                    <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-violet-700 mb-2">Answer</p>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analyze Data */}
              {tab === 'analyze' && (
                <div>
                  <p className="text-sm text-slate-600 mb-3">Run a full statistical analysis with AI-powered insights on your data.</p>
                  <button onClick={analyze} disabled={loading}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 mb-4">
                    {loading ? 'Analysing...' : 'Analyse Now'}
                  </button>
                  {insights && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-80 overflow-y-auto">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Data Insights</p>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{insights}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Check Errors */}
              {tab === 'errors' && (
                <div>
                  <p className="text-sm text-slate-600 mb-3">Detect null values, outliers, and data quality issues in your spreadsheet.</p>
                  <button onClick={detectErrors} disabled={loading}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 mb-4">
                    {loading ? 'Scanning...' : 'Scan for Issues'}
                  </button>
                  {errorReport && (
                    <div className="space-y-3">
                      {errorReport.detected_issues.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-amber-700 mb-2">{errorReport.detected_issues.length} Issue(s) Detected</p>
                          {errorReport.detected_issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5">
                              <span className="text-amber-500 mt-0.5">⚠</span>
                              <p className="text-xs text-amber-800">
                                <strong>{issue.column}</strong>: {issue.issue.replace(/_/g, ' ')} ({issue.count})
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {errorReport.detected_issues.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                          No obvious data quality issues detected.
                        </div>
                      )}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Analysis</p>
                        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{errorReport.ai_analysis}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formula Helper */}
              {tab === 'formula' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Describe what you need</label>
                    <textarea value={formulaDesc} onChange={e => setFormulaDesc(e.target.value)}
                      placeholder="e.g. Sum all values in column B where column A contains 'Sales'"
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Context (optional)</label>
                    <input value={formulaCtx} onChange={e => setFormulaCtx(e.target.value)}
                      placeholder="e.g. Column headers: Name, Sales, Region"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
                  </div>
                  <button onClick={getFormula} disabled={loading || !formulaDesc.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                    {loading ? 'Generating...' : 'Generate Formula'}
                  </button>
                  {formulaResult && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Formula</p>
                        <button onClick={() => navigator.clipboard.writeText(formulaResult)} className="text-xs text-violet-600 hover:text-violet-700">Copy</button>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-mono">{formulaResult}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-slate-500 text-sm">Upload a .xlsx or .csv file to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
