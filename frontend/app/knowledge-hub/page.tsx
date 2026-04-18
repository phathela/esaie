'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Document {
  doc_id: string;
  title: string;
  description: string;
  category: string;
  author_name: string;
  views: number;
  helpful_count: number;
}

interface Template {
  template_id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
}

export default function KnowledgeHub() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tab, setTab] = useState<'documents' | 'templates' | 'search'>('documents');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docCategory, setDocCategory] = useState('');
  const [docContent, setDocContent] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      if (tab === 'documents') loadDocuments();
      else if (tab === 'templates') loadTemplates();
    }
  }, [token, category, tab]);

  const loadDocuments = async () => {
    try {
      const r = await axios.get(`${API}/api/knowledge/documents?category=${category}`, { headers: h });
      setDocuments(r.data.documents);
    } catch (e) {
      console.error('Failed to load documents');
    }
  };

  const loadTemplates = async () => {
    try {
      const r = await axios.get(`${API}/api/knowledge/templates?category=${category}`, { headers: h });
      setTemplates(r.data.templates);
    } catch (e) {
      console.error('Failed to load templates');
    }
  };

  const publishDocument = async () => {
    try {
      await axios.post(`${API}/api/knowledge/documents`, { title: docTitle, description: docDesc, category: docCategory, content: docContent, is_public: true }, { headers: h });
      setDocTitle('');
      setDocDesc('');
      setDocCategory('');
      setDocContent('');
      setTab('documents');
      loadDocuments();
    } catch (e) {
      console.error('Failed to publish document');
    }
  };

  const searchDocuments = async () => {
    try {
      const r = await axios.post(`${API}/api/knowledge/search`, { query: searchQuery }, { headers: h });
      setDocuments(r.data.results);
    } catch (e) {
      console.error('Failed to search');
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Knowledge Hub</h1>
        <p className="text-slate-500 mt-1">Browse documents, templates, and resources</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button onClick={() => setTab('documents')} className={`px-4 py-3 font-medium border-b-2 ${tab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-600'}`}>
          Documents
        </button>
        <button onClick={() => setTab('templates')} className={`px-4 py-3 font-medium border-b-2 ${tab === 'templates' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-600'}`}>
          Templates
        </button>
        <button onClick={() => setTab('search')} className={`px-4 py-3 font-medium border-b-2 ${tab === 'search' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-600'}`}>
          Search
        </button>
      </div>

      {tab === 'documents' && (
        <>
          <div className="mb-6">
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Policy">Policy</option>
              <option value="Guide">Guide</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map(doc => (
              <Link key={doc.doc_id} href={`/knowledge-hub/${doc.doc_id}`} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md">
                <h3 className="font-semibold text-slate-900 mb-2">{doc.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                <div className="flex gap-2 items-center text-xs text-slate-500">
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>👁️ {doc.views}</span>
                  <span>👍 {doc.helpful_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === 'templates' && (
        <>
          <div className="mb-6">
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Categories</option>
              <option value="Report">Report</option>
              <option value="Proposal">Proposal</option>
              <option value="Plan">Plan</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(tmpl => (
              <div key={tmpl.template_id} className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{tmpl.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{tmpl.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{tmpl.category}</span>
                  <button className="px-3 py-1 bg-purple-600 text-white rounded text-xs">Use Template</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="mb-6 flex gap-3">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg" />
            <button onClick={searchDocuments} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Search
            </button>
          </div>

          <div className="space-y-3">
            {documents.map(doc => (
              <Link key={doc.doc_id} href={`/knowledge-hub/${doc.doc_id}`} className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md">
                <h4 className="font-semibold text-slate-900 mb-1">{doc.title}</h4>
                <p className="text-sm text-slate-600">{doc.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
