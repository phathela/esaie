'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
interface Task { task_id: string; title: string; description: string; priority: string; status: string; due_date: string; }
const PC: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (token) axios.get(`${API}/api/comms/tasks`, { headers: h }).then(r => setTasks(r.data.tasks)); }, [token]);

  const create = async () => {
    if (!form.title) return;
    await axios.post(`${API}/api/comms/tasks`, form, { headers: h });
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowForm(false);
    const r = await axios.get(`${API}/api/comms/tasks`, { headers: h });
    setTasks(r.data.tasks);
  };

  const updateStatus = async (task_id: string, status: string) => {
    await axios.put(`${API}/api/comms/tasks/${task_id}`, { status }, { headers: h });
    setTasks(p => p.map(t => t.task_id === task_id ? { ...t, status } : t));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">+ New Task</button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 max-w-lg">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task title"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:border-violet-400" />
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description"
            className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none" />
          <div className="flex gap-3 mb-4">
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={create} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {['todo', 'in-progress', 'done'].map(col => (
          <div key={col} className="bg-slate-50 rounded-2xl p-4">
            <h2 className="font-semibold text-slate-700 mb-3 capitalize">{col.replace('-', ' ')} ({tasks.filter(t => t.status === col).length})</h2>
            <div className="space-y-3">
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.task_id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PC[task.priority]}`}>{task.priority}</span>
                  </div>
                  {task.due_date && <p className="text-xs text-slate-400 mb-3">Due: {task.due_date}</p>}
                  <select value={task.status} onChange={e => updateStatus(task.task_id, e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              ))}
              {tasks.filter(t => t.status === col).length === 0 && <p className="text-xs text-slate-400 text-center py-4">Empty</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
