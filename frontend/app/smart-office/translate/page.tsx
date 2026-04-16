
'use client';

import React, { useState } from 'react';
import { Globe, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TranslatePage = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' }
  ];

  const handleTranslate = async () => {
    if (!sourceText) { alert('Enter text'); return; }
    setLoading(true);
    setTimeout(() => {
      setTranslatedText(`[${targetLang.toUpperCase()}]\n${sourceText}`);
      setLoading(false);
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">🌐 Translate</h1>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Globe /> Source</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="w-full p-2 border rounded">
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Enter text..." className="w-full p-3 border rounded h-48" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Globe /> Translated</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full p-2 border rounded">
              {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <textarea value={translatedText} readOnly placeholder="Translation..." className="w-full p-3 border rounded h-48 bg-slate-50" />
            {translatedText && (
              <Button onClick={handleCopy} variant="outline" className="w-full">
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleTranslate} disabled={loading || !sourceText} className="w-full bg-emerald-600 py-3">
        {loading ? 'Translating...' : 'Translate'}
      </Button>
    </div>
  );
};

export default TranslatePage;
