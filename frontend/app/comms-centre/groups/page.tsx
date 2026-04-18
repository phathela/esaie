'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Group { group_id: string; name: string; description: string; members: string[]; }
interface GMessage { message_id: string; from_id: string; from_name: string; content: string; created_at: string; }

export default function GroupsPage() {
  const { user, token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GMessage[]>([]);
  const [input, setInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const bottomRef = useRef<HTMLDivElement>(null);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) axios.get(`${API}/api/comms/groups`, { headers: h }).then(r => setGroups(r.data.groups || []));
  }, [token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (g: Group) => {
    setSelected(g);
    const r = await axios.get(`${API}/api/comms/groups/${g.group_id}/messages`, { headers: h });
    setMessages(r.data.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    await axios.post(`${API}/api/comms/groups/message`, { group_id: selected.group_id, content: input }, { headers: h });
    setInput('');
    const r = await axios.get(`${API}/api/comms/groups/${selected.group_id}/messages`, { headers: h });
    setMessages(r.data.messages || []);
  };

  const createGroup = async () => {
    if (!form.name) return;
    await axios.post(`${API}/api/comms/groups`, form, { headers: h });
    setForm({ name: '', description: '' });
    setShowCreate(false);
    const r = await axios.get(`${API}/api/comms/groups`, { headers: h });
    setGroups(r.data.groups || []);
  };

  return (
    <div className="flex h-screen">
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-semibold text-slate-800">Group Chats</p>
          <button onClick={() => setShowCreate(!showCreate)}
            className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700">+ New</button>
        </div>
        {showCreate && (
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Group name"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-2 focus:outline-none focus:border-violet-400" />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-2 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={createGroup} className="flex-1 py-1.5 bg-violet-600 text-white text-xs rounded-lg">Create</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg">Cancel</button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {groups.map(g => (
            <button key={g.group_id} onClick={() => loadMessages(g)}
              className={`w-full px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.group_id === g.group_id ? 'bg-violet-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{g.name}</p>
                  <p className="text-xs text-slate-500">{g.members?.length || 0} members</p>
                </div>
              </div>
            </button>
          ))}
          {groups.length === 0 && <p className="text-center text-slate-400 text-sm p-8">No groups yet. Create one!</p>}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 bg-white border-b border-slate-200">
            <p className="font-semibold text-slate-800">{selected.name}</p>
            <p className="text-xs text-slate-500">{selected.description || 'Group chat'}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
            {messages.map(m => (
              <div key={m.message_id} className={`flex ${m.from_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm ${m.from_id !== user?.user_id ? 'flex items-end gap-2' : ''}`}>
                  {m.from_id !== user?.user_id && (
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 mb-1">{m.from_name?.charAt(0)}</div>
                  )}
                  <div>
                    {m.from_id !== user?.user_id && <p className="text-xs text-slate-500 mb-1 ml-1">{m.from_name}</p>}
                    <div className={`px-4 py-2 rounded-2xl text-sm ${m.from_id === user?.user_id ? 'bg-violet-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      {m.content}
                    </div>
                  </div>
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
            <div className="text-5xl mb-3">👥</div>
            <p className="text-slate-500">Select a group or create a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
