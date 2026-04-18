'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface BoardItem {
  item_id: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
}

interface Document {
  doc_id: string;
  file_name: string;
  file_url: string;
  uploaded_by_name: string;
  created_at: string;
}

interface Message {
  msg_id: string;
  from_name: string;
  content: string;
  created_at: string;
}

interface Minute {
  minute_id: string;
  content: string;
  submitted_by_name: string;
  created_at: string;
}

interface Meeting {
  meeting_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  organizer_name: string;
  join_link: string;
  board_items: BoardItem[];
  documents: Document[];
  minutes: Minute[];
  consolidated_minutes?: string;
}

export default function MeetingDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const meeting_id = params.meeting_id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [tab, setTab] = useState<'board' | 'chat' | 'docs' | 'minutes'>('board');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newBoardItem, setNewBoardItem] = useState({ title: '', description: '', status: 'todo' });
  const [showBoardForm, setShowBoardForm] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token && meeting_id) loadMeeting();
  }, [token, meeting_id]);

  const loadMeeting = async () => {
    try {
      const r = await axios.get(`${API}/api/comms/meetings/${meeting_id}`, { headers: h });
      setMeeting(r.data.meeting);
      const msgs = await axios.get(`${API}/api/comms/meetings/${meeting_id}/chat`, { headers: h });
      setMessages(msgs.data.messages);
    } catch (e) {
      console.error('Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await axios.post(`${API}/api/comms/meetings/${meeting_id}/chat?content=${encodeURIComponent(newMessage)}`, {}, { headers: h });
      setNewMessage('');
      await loadMeeting();
    } catch (e) {
      console.error('Failed to send message');
    }
  };

  const addBoardItem = async () => {
    if (!newBoardItem.title.trim()) return;
    try {
      await axios.post(`${API}/api/comms/meetings/${meeting_id}/board-items`, newBoardItem, { headers: h });
      setNewBoardItem({ title: '', description: '', status: 'todo' });
      setShowBoardForm(false);
      await loadMeeting();
    } catch (e) {
      console.error('Failed to add board item');
    }
  };

  const updateBoardItemStatus = async (item: BoardItem, newStatus: string) => {
    try {
      await axios.put(`${API}/api/comms/meetings/${meeting_id}/board-items/${item.item_id}`, { ...item, status: newStatus }, { headers: h });
      await loadMeeting();
    } catch (e) {
      console.error('Failed to update board item');
    }
  };

  const consolidateMinutes = async () => {
    try {
      const r = await axios.post(`${API}/api/comms/meetings/${meeting_id}/minutes/consolidate`, {}, { headers: h });
      if (meeting) {
        setMeeting({ ...meeting, consolidated_minutes: r.data.consolidated });
      }
    } catch (e) {
      console.error('Failed to consolidate minutes');
    }
  };

  if (loading || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todoItems = meeting.board_items.filter(i => i.status === 'todo');
  const inProgressItems = meeting.board_items.filter(i => i.status === 'in_progress');
  const reviewItems = meeting.board_items.filter(i => i.status === 'review');
  const doneItems = meeting.board_items.filter(i => i.status === 'done');

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{meeting.title}</h1>
        <p className="text-slate-600 mb-4">{meeting.description}</p>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>📅 {new Date(meeting.scheduled_at).toLocaleString()}</span>
          <span>👤 {meeting.organizer_name}</span>
          <a href={meeting.join_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
            Join Meeting
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {['board', 'chat', 'docs', 'minutes'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-violet-600 text-violet-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'board' && '📋 Board'}
            {t === 'chat' && '💬 Chat'}
            {t === 'docs' && '📄 Documents'}
            {t === 'minutes' && '📝 Minutes'}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {tab === 'board' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Meeting Board</h2>
            <button
              onClick={() => setShowBoardForm(!showBoardForm)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              + Add Item
            </button>
          </div>

          {showBoardForm && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
              <input
                value={newBoardItem.title}
                onChange={e => setNewBoardItem({ ...newBoardItem, title: e.target.value })}
                placeholder="Item title"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:border-violet-400"
              />
              <textarea
                value={newBoardItem.description}
                onChange={e => setNewBoardItem({ ...newBoardItem, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:border-violet-400"
                rows={2}
              />
              <div className="flex gap-3">
                <button onClick={addBoardItem} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                  Add
                </button>
                <button onClick={() => setShowBoardForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 4-Column Board */}
          <div className="grid grid-cols-4 gap-4">
            {['todo', 'in_progress', 'review', 'done'].map(status => (
              <div key={status} className="bg-slate-50 rounded-2xl p-4 min-h-96">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase">
                  {status === 'todo' && '📌 To Do'}
                  {status === 'in_progress' && '⚙️ In Progress'}
                  {status === 'review' && '👁️ Review'}
                  {status === 'done' && '✅ Done'}
                </h3>

                <div className="space-y-3">
                  {(status === 'todo' ? todoItems : status === 'in_progress' ? inProgressItems : status === 'review' ? reviewItems : doneItems).map(
                    item => (
                      <div key={item.item_id} className="bg-white rounded-lg p-3 border border-slate-200 cursor-pointer group hover:shadow-md transition-shadow">
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        {item.description && <p className="text-xs text-slate-600 mt-1">{item.description}</p>}
                        <div className="flex gap-2 mt-2">
                          {['todo', 'in_progress', 'review', 'done'].map(s => (
                            <button
                              key={s}
                              onClick={() => updateBoardItemStatus(item, s)}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                item.status === s ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {s[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div className="flex flex-col h-96 bg-white border border-slate-200 rounded-2xl">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.msg_id} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-900">{msg.from_name}</p>
                <p className="text-sm text-slate-700 mt-1">{msg.content}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-4 flex gap-3">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
            />
            <button onClick={sendMessage} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'docs' && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Documents</h2>
          <div className="grid grid-cols-3 gap-4">
            {meeting.documents.map(doc => (
              <a
                key={doc.doc_id}
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
              >
                <p className="text-sm font-medium text-slate-900 group-hover:text-violet-600">📎 {doc.file_name}</p>
                <p className="text-xs text-slate-500 mt-1">Uploaded by {doc.uploaded_by_name}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
              </a>
            ))}
          </div>
          {meeting.documents.length === 0 && <p className="text-slate-500 text-sm">No documents uploaded yet.</p>}
        </div>
      )}

      {/* Minutes Tab */}
      {tab === 'minutes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Meeting Minutes</h2>
            <button
              onClick={consolidateMinutes}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              🤖 Consolidate
            </button>
          </div>

          {meeting.consolidated_minutes && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-emerald-900 mb-3">AI Consolidated Summary</h3>
              <p className="text-sm text-emerald-800 whitespace-pre-wrap">{meeting.consolidated_minutes}</p>
            </div>
          )}

          <div className="space-y-3">
            {meeting.minutes.map(min => (
              <div key={min.minute_id} className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">{min.content}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {min.submitted_by_name} · {new Date(min.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          {meeting.minutes.length === 0 && <p className="text-slate-500 text-sm">No minutes submitted yet.</p>}
        </div>
      )}
    </div>
  );
}
