'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function SuccessPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<{ balance_aipps: number; balance_usd: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const h = { Authorization: `Bearer ${token}` };

  const sessionId = searchParams.get('session_id');
  const packageId = searchParams.get('package');

  useEffect(() => {
    if (token) {
      loadBalance();
    }
  }, [token]);

  const loadBalance = async () => {
    try {
      const r = await axios.get(`${API}/api/credits/balance`, { headers: h });
      setBalance(r.data);
    } catch (e) {
      console.error('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-emerald-200 p-8 max-w-md w-full text-center shadow-lg">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-600 mb-6">Your Aipps credits have been added to your account.</p>

        {/* Balance Display */}
        {balance && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-2">Your New Balance</p>
            <p className="text-3xl font-bold text-emerald-600">{balance.balance_aipps}</p>
            <p className="text-sm text-slate-500">≈ ${balance.balance_usd.toFixed(2)} USD</p>
          </div>
        )}

        {loading && (
          <div className="text-slate-500 text-sm mb-6">Loading balance...</div>
        )}

        {/* Next Steps */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-slate-900 mb-3">What's next?</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">→</span>
              <span>Use credits for AI services (meetings, reports, analysis)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">→</span>
              <span>Credits are deducted automatically when you use services</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 mt-1">→</span>
              <span>Buy more credits anytime from the Aipps page</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/" className="block px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
            Back to Dashboard
          </Link>
          <Link href="/comms-centre/meetings" className="block px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 transition-colors">
            Start Using Credits
          </Link>
        </div>

        {/* Info Text */}
        <p className="text-xs text-slate-500 mt-6">
          Session ID: {sessionId?.slice(0, 20)}...
        </p>
      </div>
    </div>
  );
}
