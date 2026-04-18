'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Course { course_id: string; title: string; description: string; category: string; level: string; duration_hours: number; enrolled_count: number; enrolled: boolean; modules: { title: string; description: string }[]; }

const LEVELS: Record<string, string> = { beginner: 'bg-emerald-100 text-emerald-700', intermediate: 'bg-amber-100 text-amber-700', advanced: 'bg-red-100 text-red-700' };

export default function LearningPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'beginner', duration_hours: 2 });
  const h = { Authorization: `Bearer ${token}` };

  const CATS = ['Leadership', 'Technical', 'Compliance', 'Soft Skills', 'Safety', 'AI & Data', 'Finance'];

  useEffect(() => { if (token) loadCourses(); }, [token]);

  const loadCourses = async (cat = catFilter) => {
    const params = cat ? `?category=${cat}` : '';
    const r = await axios.get(`${API}/api/learning/courses${params}`, { headers: h });
    setCourses(r.data.courses || []);
  };

  const enroll = async (course_id: string) => {
    setEnrolling(course_id);
    try {
      await axios.post(`${API}/api/learning/enroll`, { course_id }, { headers: h });
      await loadCourses();
    } finally { setEnrolling(null); }
  };

  const create = async () => {
    if (!form.title || !form.category) return;
    await axios.post(`${API}/api/learning/courses`, form, { headers: h });
    setForm({ title: '', description: '', category: '', level: 'beginner', duration_hours: 2 });
    setShowForm(false);
    await loadCourses();
  };

  const handleCat = (c: string) => { setCatFilter(c); loadCourses(c); };

  const myEnrolled = courses.filter(c => c.enrolled);
  const available = courses.filter(c => !c.enrolled);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Learning Centre</h1>
            <p className="text-slate-500 text-sm mt-1">Grow your skills with curated courses</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700">+ Create Course</button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Course title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-400" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="">Select Category</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.level} onChange={e => setForm({...form, level: e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input type="number" placeholder="Duration (hours)" value={form.duration_hours} onChange={e => setForm({...form, duration_hours: +e.target.value})}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={create} className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium">Create</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => handleCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!catFilter ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>All</button>
          {CATS.map(c => (
            <button key={c} onClick={() => handleCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${catFilter === c ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {c}
            </button>
          ))}
        </div>

        {myEnrolled.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">My Courses ({myEnrolled.length})</p>
            <div className="grid grid-cols-2 gap-4">
              {myEnrolled.map(c => (
                <div key={c.course_id} onClick={() => setSelected(selected?.course_id === c.course_id ? null : c)}
                  className="bg-white border border-sky-200 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-800">{c.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">Enrolled</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.category} · {c.duration_hours}h · <span className={`px-1.5 py-0.5 rounded text-xs ${LEVELS[c.level]}`}>{c.level}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Available Courses ({available.length})</p>
          <div className="grid grid-cols-2 gap-4">
            {available.map(c => (
              <div key={c.course_id} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-1">{c.title}</p>
                <p className="text-sm text-slate-500 mb-2">{c.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{c.category} · {c.duration_hours}h</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LEVELS[c.level]}`}>{c.level}</span>
                  </div>
                  <button onClick={() => enroll(c.course_id)} disabled={enrolling === c.course_id}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-50">
                    {enrolling === c.course_id ? '...' : 'Enroll'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {available.length === 0 && courses.length > 0 && (
            <p className="text-slate-400 text-sm text-center py-8">You are enrolled in all available courses!</p>
          )}
          {courses.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-slate-500">No courses yet. Create the first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
