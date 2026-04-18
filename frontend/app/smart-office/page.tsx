'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface File {
  file_id: string;
  filename: string;
  type: string;
  created_at: string;
  size?: number;
  sheet_count?: number;
}

interface Stats {
  documents: number;
  excel_files: number;
  storage_used: number;
  recent_files: File[];
}

export default function SmartOfficePage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const [docs, files] = await Promise.all([
        axios.get(`${API}/api/smart-office/documents`, { headers: h }),
        axios.get(`${API}/api/smart-office/files/list`, { headers: h }),
      ]);

      const allDocs = docs.data.documents || [];
      const allFiles = files.data.files || [];

      setStats({
        documents: allDocs.length,
        excel_files: allFiles.filter((f: any) => f.type === 'excel').length,
        storage_used: Math.round(allDocs.reduce((sum: number, d: any) => sum + (d.size || 0), 0) / 1024 / 1024),
        recent_files: allFiles.slice(0, 5),
      });
    } catch (e) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const askAI = async () => {
    if (!aiMessage.trim()) return;
    setAiLoading(true);
    try {
      const r = await axios.post(`${API}/api/smart-office/smart-files/chat`,
        { message: aiMessage }, { headers: h });
      setAiResponse(r.data.response);
    } catch (e) {
      console.error('Failed to get AI response');
      setAiResponse('Failed to process your request. Make sure you have files indexed.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-8">
        <h1 className="text-4xl font-bold text-slate-900">Smart Office</h1>
        <p className="text-slate-600 mt-2">Documents, spreadsheets, translations, and AI insights</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600 mb-2">Documents</p>
              <p className="text-3xl font-bold text-slate-900">{stats.documents}</p>
              <p className="text-xs text-slate-500 mt-2">{stats.storage_used} MB used</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600 mb-2">Excel Files</p>
              <p className="text-3xl font-bold text-slate-900">{stats.excel_files}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600 mb-2">Translations</p>
              <p className="text-3xl font-bold text-slate-900">∞</p>
              <p className="text-xs text-slate-500 mt-2">Unlimited</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600 mb-2">Transcriptions</p>
              <p className="text-3xl font-bold text-slate-900">✓</p>
              <p className="text-xs text-slate-500 mt-2">Enabled</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/smart-office/documents"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group">
              <p className="text-3xl mb-2">📄</p>
              <p className="font-semibold text-slate-900 group-hover:text-violet-600">Documents</p>
              <p className="text-xs text-slate-600">Upload & analyze</p>
            </Link>
            <Link href="/smart-office/excel"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group">
              <p className="text-3xl mb-2">📊</p>
              <p className="font-semibold text-slate-900 group-hover:text-violet-600">Excel</p>
              <p className="text-xs text-slate-600">Data insights</p>
            </Link>
            <Link href="/smart-office/translate"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group">
              <p className="text-3xl mb-2">🌐</p>
              <p className="font-semibold text-slate-900 group-hover:text-violet-600">Translate</p>
              <p className="text-xs text-slate-600">Multi-language</p>
            </Link>
            <Link href="/smart-office/transcribe"
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow group">
              <p className="text-3xl mb-2">🎤</p>
              <p className="font-semibold text-slate-900 group-hover:text-violet-600">Transcribe</p>
              <p className="text-xs text-slate-600">Audio to text</p>
            </Link>
          </div>
        </div>

        {/* AI Chat Section */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">AI File Assistant</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm text-slate-600 mb-4">Ask questions about your files. The AI will search across all indexed documents.</p>
              <div className="space-y-3">
                <input
                  value={aiMessage}
                  onChange={e => setAiMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && askAI()}
                  placeholder="e.g., What are the Q2 revenue projections? Summarize the key risks..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
                />
                <button
                  onClick={askAI}
                  disabled={aiLoading}
                  className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
                >
                  {aiLoading ? '🤖 Thinking...' : '💬 Ask AI'}
                </button>
              </div>

              {aiResponse && (
                <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Recent Files</h2>
            <div className="space-y-3">
              {stats?.recent_files.map(file => (
                <div key={file.file_id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.type === 'document' ? '📄' : '📊'} {file.filename}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {!stats?.recent_files.length && (
                <p className="text-slate-500 text-sm">No files yet. Start by uploading a document or spreadsheet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Capabilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📋 Document Analysis</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• PDF & DOCX support</li>
                <li>• Q&A with AI</li>
                <li>• Auto-summaries</li>
                <li>• Report generation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📊 Excel Intelligence</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Natural language queries</li>
                <li>• Data insights</li>
                <li>• Error detection</li>
                <li>• Formula generation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🌐 Translation</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 50+ languages</li>
                <li>• Batch processing</li>
                <li>• File upload</li>
                <li>• Instant results</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🎤 Transcription</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• MP3, WAV, M4A</li>
                <li>• Multi-language</li>
                <li>• Timestamps</li>
                <li>• Speaker detection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🔍 Smart Search</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• AI-powered search</li>
                <li>• Cross-file queries</li>
                <li>• Semantic matching</li>
                <li>• Tag organization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📊 Advanced Reports</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 6 report types</li>
                <li>• Approval workflows</li>
                <li>• Export options</li>
                <li>• Version tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
