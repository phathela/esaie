'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Message { message_id: string; from_id: string; content: string; created_at: string; read: boolean; }
interface Conversation { conversation_id: string; other_user: { user_id: string; name: string; username: string }; last_message: string; online: boolean; }
interface UserResult { user_id: string; name: string; username: string; }

export default function ChatPage() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user || !token) return;
    loadConversations();
    const wsUrl = API.replace('http', 'ws').replace('https', 'wss');
    const ws = new WebSocket(`${wsUrl}/api/comms/ws/${user.user_id}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
        loadConversations();
      }
    };
    return () => ws.close();
  }, [user, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    const r = await axios.get(`${API}/api/comms/chat/conversations`, { headers });
    setConversations(r.data.conversations);
  };

  const loadMessages = async (conv: Conversation) => {
    setSelected(conv);
    const r = await axios.get(`${API}/api/comms/chat/messages/${conv.other_user.user_id}`, { headers });
    setMessages(r.data.messages);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    const r = await axios.post(`${API}/api/comms/chat/send`, { to_user_id: selected.other_user.user_id, content: input }, { headers });
    setMessages(prev => [...prev, r.data.message]);
    setInput('');
    loadConversations();
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const r = await axios.get(`${API}/api/comms/chat/users/search?q=${q}`, { headers });
    setSearchResults(r.data.users);
  };

  const startChat = (u: UserResult) => {
    setSearch(''); setSearchResults([]);
    const fake: Conversation = { conversation_id: '', other_user: u, last_message: '', online: false };
    setSelected(fake);
    setMessages([]);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <input value={search} onChange={e => searchUsers(e.target.value)} placeholder="Search users..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400" />
          {searchResults.length > 0 && (
            <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {searchResults.map(u => (
                <button key={u.user_id} onClick={() => startChat(u)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 text-sm">
                  <p className="font-medium text-slate-800">{u.name}</p>
                  <p className="text-slate-500">@{u.username}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => (
            <button key={c.conversation_id} onClick={() => loadMessages(c)}
              className={`w-full px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.other_user.user_id === c.other_user.user_id ? 'bg-violet-50' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm">
                    {c.other_user.name.charAt(0)}
                  </div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.other_user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
                </div>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-center text-slate-400 text-sm p-8">Search for users to start chatting</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700">
              {selected.other_user.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{selected.other_user.name}</p>
              <p className="text-xs text-slate-500">@{selected.other_user.username}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
            {messages.map(m => (
              <div key={m.message_id} className={`flex ${m.from_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-4 py-2 rounded-2xl text-sm ${m.from_id === user?.user_id ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
            <button onClick={sendMessage} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">Send</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-slate-500">Select a conversation or search for a user</p>
          </div>
        </div>
      )}
    </div>
  );
}
