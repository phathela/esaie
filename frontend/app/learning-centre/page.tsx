'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Course {
  course_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_hours: number;
  enrolled: boolean;
}

export default function LearningCentre() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState<'browse' | 'my-courses'>('browse');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      loadCourses();
      loadMyCourses();
    }
  }, [token, category, difficulty]);

  const loadCourses = async () => {
    try {
      const r = await axios.get(`${API}/api/learning/courses?category=${category}&difficulty=${difficulty}`, { headers: h });
      setCourses(r.data.courses);
    } catch (e) {
      console.error('Failed to load courses');
    }
  };

  const loadMyCourses = async () => {
    try {
      const r = await axios.get(`${API}/api/learning/my-courses`, { headers: h });
      setMyCourses(r.data.courses);
    } catch (e) {
      console.error('Failed to load my courses');
    }
  };

  const enrollCourse = async (courseId: string) => {
    try {
      await axios.post(`${API}/api/learning/enroll?course_id=${courseId}`, {}, { headers: h });
      loadCourses();
      loadMyCourses();
    } catch (e) {
      console.error('Failed to enroll');
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Learning Centre</h1>
        <p className="text-slate-500 mt-1">Expand your knowledge with our courses</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button onClick={() => setTab('browse')} className={`px-4 py-3 font-medium transition-colors border-b-2 ${tab === 'browse' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}>
          Browse Courses
        </button>
        <button onClick={() => setTab('my-courses')} className={`px-4 py-3 font-medium transition-colors border-b-2 ${tab === 'my-courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600'}`}>
          My Courses ({myCourses.length})
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <div className="flex gap-4 mb-6">
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Business">Business</option>
            </select>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.course_id} className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{course.category}</span>
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">{course.difficulty}</span>
                </div>
                {course.enrolled ? (
                  <Link href={`/learning-centre/${course.course_id}`} className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm text-center">
                    Continue
                  </Link>
                ) : (
                  <button onClick={() => enrollCourse(course.course_id)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                    Enroll
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'my-courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myCourses.length === 0 ? (
            <p className="text-slate-500 py-8">No courses enrolled</p>
          ) : (
            myCourses.map(course => (
              <Link key={course.course_id} href={`/learning-centre/${course.course_id}`} className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${course.enrollment?.progress || 0}%` }}></div>
                </div>
                <p className="text-xs text-slate-600">{course.enrollment?.progress || 0}% complete</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
