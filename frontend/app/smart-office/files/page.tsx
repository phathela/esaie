'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface SmartFile { file_id: string; filename: string; type: 'document' | 'excel'; size?: number; sheet_count?: number; created_at: string; }

export default function FilesPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState<SmartFile[]>([]);
  const [filter, setFilter] = useState<'all' | 'document' | 'excel'>('all');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadFiles(); }, [token]);

  const loadFiles = async () => {
    const r = await axios.get(`${API}/api/smart-office/files/list`, { headers: h });
    setFiles(r.data.files || []);
  };

  const filtered = filter === 'all' ? files : files.filter(f => f.type === filter);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Files</h1>
          <p className="text-slate-500 text-sm mt-1">All your uploaded documents and spreadsheets</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(['all', 'document', 'excel'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f === 'all' ? `All (${files.length})` : f === 'document' ? `Documents (${files.filter(x => x.type === 'document').length})` : `Spreadsheets (${files.filter(x => x.type === 'excel').length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="text-4xl mb-3">🗂️</div>
          <p className="text-slate-500">No files found. Upload documents or spreadsheets.</p>
          <div className="flex gap-3 justify-center mt-4">
            <a href="/smart-office/documents" className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700">Upload Document</a>
            <a href="/smart-office/excel" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200">Upload Spreadsheet</a>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.file_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="text-3xl">{f.type === 'document' ? '📄' : '📊'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{f.filename}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {f.type === 'document' ? `${((f.size || 0) / 1024).toFixed(1)} KB` : `${f.sheet_count} sheet(s)`}
                  {' · '}{new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${f.type === 'document' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {f.type === 'document' ? 'Document' : 'Spreadsheet'}
              </span>
              <a href={f.type === 'document' ? '/smart-office/documents' : '/smart-office/excel'}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium">Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
