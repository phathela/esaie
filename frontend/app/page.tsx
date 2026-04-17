'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const COUNTRIES = [
  { code: 'ZA', name: 'South Africa' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' }, { code: 'GH', name: 'Ghana' },
  { code: 'IN', name: 'India' }, { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }, { code: 'DE', name: 'Germany' },
];

const HEADLINES = [
  'Your AI-powered workspace.',
  'Collaborate smarter, not harder.',
  'Meetings, docs, alerts — unified.',
  'Intelligence at every touchpoint.',
];

export default function LandingPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [hlIdx, setHlIdx] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regCountry, setRegCountry] = useState('ZA');
  const [userStatus, setUserStatus] = useState('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) router.replace('/dashboard'); }, [user, loading, router]);

  useEffect(() => {
    const t = setInterval(() => setHlIdx(i => (i + 1) % HEADLINES.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (regUser.length < 3) { setUserStatus('idle'); return; }
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(`${API}/api/auth/check-username/${regUser}`);
        setUserStatus(r.data.available ? 'ok' : 'taken');
      } catch { setUserStatus('idle'); }
    }, 400);
    return () => clearTimeout(t);
  }, [regUser]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(loginEmail, loginPass); router.push('/dashboard'); }
    catch (err: any) { setError(err?.response?.data?.detail || 'Login failed'); }
    finally { setBusy(false); }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await register({ email: regEmail, password: regPass, name: regName, username: regUser, country: regCountry }); router.push('/dashboard'); }
    catch (err: any) { setError(err?.response?.data?.detail || 'Registration failed'); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const inp = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-500';
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600 rounded-full opacity-10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">E</div>
            <span className="text-white text-2xl font-bold tracking-tight">ESAIE</span>
          </div>
          <p className="text-slate-400 text-sm h-5 transition-all duration-500">{HEADLINES[hlIdx]}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 px-4 py-3 bg-red-950 border border-red-800 text-red-400 text-sm rounded-xl">{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={doLogin} className="space-y-4">
              <div><label className={lbl}>Email</label><input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inp} placeholder="you@example.com" /></div>
              <div><label className={lbl}>Password</label><input type="password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} className={inp} placeholder="••••••••" /></div>
              <button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 mt-2">
                {busy ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister} className="space-y-4">
              <div><label className={lbl}>Full Name</label><input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className={inp} placeholder="John Doe" /></div>
              <div>
                <label className={lbl}>Username</label>
                <div className="relative">
                  <input type="text" required value={regUser} onChange={e => setRegUser(e.target.value.toLowerCase())}
                    className={`${inp} ${userStatus === 'ok' ? 'border-emerald-500' : userStatus === 'taken' ? 'border-red-500' : ''}`}
                    placeholder="johndoe" />
                  {userStatus === 'ok' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">available</span>}
                  {userStatus === 'taken' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">taken</span>}
                </div>
              </div>
              <div><label className={lbl}>Email</label><input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className={inp} placeholder="you@example.com" /></div>
              <div><label className={lbl}>Password</label><input type="password" required value={regPass} onChange={e => setRegPass(e.target.value)} className={inp} placeholder="••••••••" /></div>
              <div>
                <label className={lbl}>Country</label>
                <select value={regCountry} onChange={e => setRegCountry(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors">
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={busy || userStatus === 'taken'} className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 mt-2">
                {busy ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
