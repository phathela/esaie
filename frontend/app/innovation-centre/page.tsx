'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Idea {
  idea_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  votes: number;
  submitter_name: string;
  voted_by_user?: boolean;
}

export default function InnovationCentre() {
  const { user, token } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tab, setTab] = useState<'browse' | 'pipeline' | 'submit'>('browse');
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [impact, setImpact] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token && tab === 'browse') loadIdeas();
  }, [token, status, tab]);

  const loadIdeas = async () => {
    try {
      const r = await axios.get(`${API}/api/innovation/ideas?status=${status}`, { headers: h });
      setIdeas(r.data.ideas);
    } catch (e) {
      console.error('Failed to load ideas');
    }
  };

  const submitIdea = async () => {
    try {
      await axios.post(`${API}/api/innovation/ideas`, { title, description, category, expected_impact: impact }, { headers: h });
      setTitle('');
      setDescription('');
      setCategory('');
      setImpact('');
      setTab('browse');
      loadIdeas();
    } catch (e) {
      console.error('Failed to submit idea');
    }
  };

  const voteIdea = async (ideaId: string) => {
    try {
      await axios.post(`${API}/api/innovation/ideas/${ideaId}/vote`, {}, { headers: h });
      loadIdeas();
    } catch (e) {
      console.error('Failed to vote');
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Innovation Centre</h1>
        <p className="text-slate-500 mt-1">Share and vote on innovative ideas</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button onClick={() => setTab('browse')} className={`px-4 py-3 font-medium border-b-2 ${tab === 'browse' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-600'}`}>
          Browse Ideas
        </button>
        <button onClick={() => setTab('submit')} className={`px-4 py-3 font-medium border-b-2 ${tab === 'submit' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-600'}`}>
          Submit Idea
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <div className="mb-6">
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="space-y-4">
            {ideas.map(idea => (
              <Link key={idea.idea_id} href={`/innovation-centre/${idea.idea_id}`} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{idea.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{idea.description}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{idea.category}</span>
                      <span className="text-xs text-slate-500">By {idea.submitter_name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${idea.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {idea.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.preventDefault(); voteIdea(idea.idea_id); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${idea.voted_by_user ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    👍 {idea.votes}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === 'submit' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Submit Your Idea</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your idea title" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your idea" rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select Category</option>
                <option value="Product">Product</option>
                <option value="Process">Process</option>
                <option value="Strategy">Strategy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Impact</label>
              <input value={impact} onChange={e => setImpact(e.target.value)} placeholder="What impact will this have?" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <button onClick={submitIdea} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              Submit Idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
