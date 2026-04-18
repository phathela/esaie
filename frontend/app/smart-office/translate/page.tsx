'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const LANGS = [
  { code: 'English', name: 'English' }, { code: 'Afrikaans', name: 'Afrikaans' },
  { code: 'Zulu', name: 'Zulu' }, { code: 'Xhosa', name: 'Xhosa' },
  { code: 'Sotho', name: 'Sotho' }, { code: 'Tswana', name: 'Tswana' },
  { code: 'Spanish', name: 'Spanish' }, { code: 'French', name: 'French' },
  { code: 'Portuguese', name: 'Portuguese' }, { code: 'German', name: 'German' },
  { code: 'Chinese', name: 'Chinese' }, { code: 'Arabic', name: 'Arabic' },
];

export default function TranslatePage() {
  const { token } = useAuth();
  const [source, setSource] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState('Zulu');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const translate = async () => {
    if (!source.trim()) return;
    setLoading(true);
    try {
      const r = await axios.post(`${API}/api/smart-office/translate`,
        { text: source, target_language: targetLang },
        { headers: { Authorization: `Bearer ${token}` } });
      setTranslated(r.data.translated);
    } catch { alert('Translation failed'); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Translate</h1>
        <p className="text-slate-500 text-sm mt-1">AI-powered translation via Groq</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Translate to:</label>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Source Text</p>
          <textarea value={source} onChange={e => setSource(e.target.value)}
            placeholder="Enter text to translate..."
            rows={8}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 resize-none" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{targetLang}</p>
            {translated && (
              <button onClick={copy} className="text-xs text-violet-600 hover:text-violet-700">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <textarea value={translated} readOnly
            placeholder="Translation will appear here..."
            rows={8}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 resize-none" />
        </div>
      </div>

      <button onClick={translate} disabled={loading || !source.trim()}
        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
        {loading ? 'Translating...' : 'Translate'}
      </button>
    </div>
  );
}
