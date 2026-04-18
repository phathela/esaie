'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Folder { id: string; name: string; parent_id: string | null; type: 'folder'; created_at: string; }
interface SFile { id: string; filename: string; file_type: string; size: number; learned: boolean; parent_id: string | null; type: 'file'; created_at: string; }
interface PathItem { id: string; name: string; }
interface ChatMsg { role: 'user' | 'ai'; text: string; }

export default function FilesPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'files' | 'chat'>('files');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<SFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) loadContents(folderId); }, [token, folderId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const loadContents = async (folder: string | null) => {
    setError('');
    try {
      const params = folder ? `?folder_id=${folder}` : '';
      const r = await axios.get(`${API}/api/smart-office/smart-files/contents${params}`, { headers: h });
      setFolders(r.data.folders || []);
      setFiles(r.data.files || []);
      setPath(r.data.path || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load files');
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await axios.post(`${API}/api/smart-office/smart-files/folders`,
        { name: newFolderName, parent_id: folderId }, { headers: h });
      setNewFolderName(''); setShowNewFolder(false);
      loadContents(folderId);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Create folder failed');
    }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (folderId) fd.append('folder_id', folderId);
      await axios.post(`${API}/api/smart-office/smart-files/upload`, fd, {
        headers: { ...h, 'Content-Type': 'multipart/form-data' }
      });
      loadContents(folderId);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const download = (file: SFile) => {
    window.open(`${API}/api/smart-office/smart-files/download/${file.id}`, '_blank');
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API}/api/smart-office/smart-files/${id}`, { headers: h });
      loadContents(folderId);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Delete failed');
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const r = await axios.post(`${API}/api/smart-office/smart-files/chat`,
        { message: msg }, { headers: h });
      setChatHistory(h => [...h, { role: 'ai', text: r.data.response }]);
    } catch (e: any) {
      setChatHistory(h => [...h, { role: 'ai', text: 'Error: ' + (e?.response?.data?.detail || e?.message) }]);
    } finally { setChatLoading(false); }
  };

  const fileIcon = (type: string) => {
    const icons: Record<string, string> = { pdf: '📑', docx: '📝', doc: '📝', txt: '📄', xlsx: '📊', xls: '📊', csv: '📊', png: '🖼', jpg: '🖼', jpeg: '🖼', mp3: '🎵', mp4: '🎬' };
    return icons[type] || '📎';
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Files</h1>
          <p className="text-slate-500 text-sm mt-1">Folder-based file storage with AI chat across all your documents</p>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 cursor-pointer">
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* Tab strip */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('files')}
          className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Files
        </button>
        <button onClick={() => setTab('chat')}
          className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          AI Chat
        </button>
      </div>

      {tab === 'files' && (
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 mb-4 text-sm">
            <button onClick={() => setFolderId(null)} className="text-violet-600 hover:text-violet-700 font-medium">Home</button>
            {path.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="text-slate-400">/</span>
                <button onClick={() => setFolderId(p.id)}
                  className={i === path.length - 1 ? 'text-slate-800 font-medium' : 'text-violet-600 hover:text-violet-700'}>
                  {p.name}
                </button>
              </span>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            {!showNewFolder ? (
              <button onClick={() => setShowNewFolder(true)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                <span>📁</span> New Folder
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createFolder()}
                  placeholder="Folder name"
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 w-40" autoFocus />
                <button onClick={createFolder} className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-sm">Create</button>
                <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
              </div>
            )}
          </div>

          {/* Grid */}
          {folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">🗂️</div>
              <p className="text-slate-500 text-sm">This folder is empty</p>
              <p className="text-slate-400 text-xs mt-1">Upload files or create a new folder</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Folders first */}
              {folders.map(folder => (
                <div key={folder.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow group">
                  <button onClick={() => setFolderId(folder.id)} className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">📁</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-800">{folder.name}</p>
                      <p className="text-xs text-slate-400">{new Date(folder.created_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                  <button onClick={() => deleteItem(folder.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-lg leading-none px-1">×</button>
                </div>
              ))}
              {/* Files */}
              {files.map(file => (
                <div key={file.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow group">
                  <span className="text-2xl">{fileIcon(file.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.filename}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB · {new Date(file.created_at).toLocaleDateString()}
                      {file.learned && <span className="ml-2 text-emerald-600">✓ Indexed</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => download(file)} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Download</button>
                    <button onClick={() => deleteItem(file.id)} className="text-slate-300 hover:text-red-500 text-lg leading-none px-1">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[520px]">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-800">AI Document Chat</p>
            <p className="text-xs text-slate-400 mt-0.5">Ask questions about all your uploaded files — they're indexed automatically</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-500 text-sm">Ask anything about your files</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Summarise all documents', 'What are the key action items?', 'Find anything about budget', 'Compare the documents'].map(s => (
                    <button key={s} onClick={() => setChatInput(s)}
                      className="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask about your files..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
