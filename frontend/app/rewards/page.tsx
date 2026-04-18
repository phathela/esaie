'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Offer { offer_id: string; title: string; description: string; aipps_cost: number; category: string; icon: string; }
interface TxRecord { tx_id: string; type: string; amount: number; description: string; created_at: string; }

export default function RewardsPage() {
  const { token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [tab, setTab] = useState<'offers' | 'buy' | 'history'>('offers');
  const [buyAmount, setBuyAmount] = useState(50);
  const [buying, setBoying] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token]);

  const loadAll = async () => {
    const [b, o, hist] = await Promise.all([
      axios.get(`${API}/api/rewards/balance`, { headers: h }),
      axios.get(`${API}/api/rewards/offers`, { headers: h }),
      axios.get(`${API}/api/rewards/history`, { headers: h }),
    ]);
    setBalance(b.data.balance);
    setOffers(o.data.offers || []);
    setHistory(hist.data.history || []);
  };

  const redeem = async (offer: Offer) => {
    if (balance < offer.aipps_cost) { alert('Insufficient Aipps balance'); return; }
    setRedeeming(offer.offer_id);
    try {
      await axios.post(`${API}/api/rewards/redeem`, { offer_id: offer.offer_id, aipps_cost: offer.aipps_cost }, { headers: h });
      await loadAll();
      alert(`Successfully redeemed: ${offer.title}!`);
    } catch (e: any) { alert(e?.response?.data?.detail || 'Redemption failed'); }
    finally { setRedeeming(null); }
  };

  const buyCredits = async () => {
    setBoying(true);
    try {
      const r = await axios.post(`${API}/api/rewards/buy`, { amount_zar: buyAmount }, { headers: h });
      alert(`Payment intent created. In production, you'd complete payment here.\nYou will receive ${buyAmount * 10} Aipps.`);
    } catch { alert('Purchase failed'); }
    finally { setBoying(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rewards Centre</h1>
            <p className="text-slate-500 text-sm mt-1">Earn and spend Aipps credits</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-right">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">My Balance</p>
            <p className="text-3xl font-bold text-violet-600">{balance.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Aipps</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['offers', 'buy', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t === 'offers' ? 'Offers' : t === 'buy' ? 'Buy Aipps' : 'History'}
            </button>
          ))}
        </div>

        {tab === 'offers' && (
          <div className="grid grid-cols-2 gap-4">
            {offers.map(offer => (
              <div key={offer.offer_id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{offer.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{offer.title}</p>
                    <p className="text-sm text-slate-500">{offer.description}</p>
                    <span className="text-xs text-slate-400">{offer.category}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-600">{offer.aipps_cost} Aipps</span>
                  <button onClick={() => redeem(offer)} disabled={redeeming === offer.offer_id || balance < offer.aipps_cost}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${balance >= offer.aipps_cost ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    {redeeming === offer.offer_id ? 'Redeeming...' : 'Redeem'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'buy' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md">
            <h2 className="font-semibold text-slate-800 mb-4">Buy Aipps Credits</h2>
            <p className="text-sm text-slate-500 mb-4">R10 = 100 Aipps (minimum R10)</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[50, 100, 200, 500].map(amt => (
                <button key={amt} onClick={() => setBuyAmount(amt)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${buyAmount === amt ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 text-slate-700 hover:border-violet-300'}`}>
                  R{amt}
                </button>
              ))}
            </div>
            <input type="number" value={buyAmount} onChange={e => setBuyAmount(+e.target.value)} min={10}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-3 focus:outline-none focus:border-violet-400" />
            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
              <span className="text-slate-600">You will receive</span>
              <span className="font-bold text-violet-600">{buyAmount * 10} Aipps</span>
            </div>
            <button onClick={buyCredits} disabled={buying || buyAmount < 10}
              className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {buying ? 'Processing...' : `Pay R${buyAmount} via Stripe`}
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {history.map(tx => (
              <div key={tx.tx_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                  <p className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} Aipps
                </span>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                <p className="text-slate-400">No transaction history yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
