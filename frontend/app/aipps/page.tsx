'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Package {
  id: string;
  name: string;
  aipps: number;
  bonus: number;
  price_zar: number;
  price_usd: number;
  description: string;
}

interface Service {
  name: string;
  price_per_unit: number;
  unit: string;
}

export default function AippsPage() {
  const { token } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [balance, setBalance] = useState<{ balance_aipps: number; balance_usd: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      const [pkgRes, svcRes, balRes] = await Promise.all([
        axios.get(`${API}/api/credits/packages`, { headers: h }),
        axios.get(`${API}/api/credits/pricing`, { headers: h }),
        axios.get(`${API}/api/credits/balance`, { headers: h })
      ]);
      setPackages(pkgRes.data.packages || []);
      setServices(svcRes.data.services || {});
      setBalance(balRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load data');
    }
  };

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await axios.post(
        `${API}/api/credits/create-checkout-session`,
        { package_id: packageId },
        { headers: h }
      );
      if (r.data.url) {
        window.location.href = r.data.url;
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-slate-900">Aipps Credits</span>
          </Link>
          {balance && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Your Balance</p>
              <p className="text-xl font-bold text-violet-600">{balance.balance_aipps} Aipps</p>
              <p className="text-xs text-slate-400">≈ ${balance.balance_usd.toFixed(2)} USD</p>
            </div>
          )}
        </div>
      </nav>

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Aipps Credits — Pay for What You Use
          </h1>
          <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto">
            No monthly commitments. No hidden fees. Transparent, flexible credit system for all your AI-powered features.
          </p>
          <div className="flex justify-center gap-4 text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Flexible pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Pay per use</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Bonus credits</span>
            </div>
          </div>
        </div>

        {/* Service Pricing Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Service Pricing</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Service</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Unit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(services).map(([key, svc]) => (
                  <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-800 font-medium">{svc.name}</td>
                    <td className="text-right py-3 px-4 text-slate-700">{svc.price_per_unit} Aipps</td>
                    <td className="text-right py-3 px-4 text-slate-500">per {svc.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Buy Aipps Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                  pkg.id === 'standard'
                    ? 'border-violet-600 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-400'
                }`}
              >
                {pkg.id === 'standard' && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900 mb-2">{pkg.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>

                <div className="bg-gradient-to-br from-violet-100 to-slate-100 rounded-xl p-4 mb-4">
                  <p className="text-3xl font-bold text-violet-600">{pkg.aipps}</p>
                  <p className="text-sm text-slate-600">Aipps</p>
                  {pkg.bonus > 0 && (
                    <p className="text-sm text-emerald-600 font-medium mt-1">+ {pkg.bonus} bonus</p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-2xl font-bold text-slate-900">R{pkg.price_zar}</p>
                  <p className="text-sm text-slate-500">≈ ${pkg.price_usd.toFixed(2)} USD</p>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading}
                  className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                    pkg.id === 'standard'
                      ? 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'
                  }`}
                >
                  {loading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="border-b border-slate-200 pb-4">
              <summary className="cursor-pointer font-semibold text-slate-900 hover:text-violet-600">
                Do credits expire?
              </summary>
              <p className="text-slate-600 mt-2">No, your Aipps credits never expire. Use them whenever you need.</p>
            </details>

            <details className="border-b border-slate-200 pb-4">
              <summary className="cursor-pointer font-semibold text-slate-900 hover:text-violet-600">
                Can I get a refund?
              </summary>
              <p className="text-slate-600 mt-2">
                Refunds are available within 7 days of purchase if credits have not been used.
              </p>
            </details>

            <details className="border-b border-slate-200 pb-4">
              <summary className="cursor-pointer font-semibold text-slate-900 hover:text-violet-600">
                What's the bonus credit system?
              </summary>
              <p className="text-slate-600 mt-2">
                Larger packages include bonus credits as a thank you. Bonus credits work the same as regular credits.
              </p>
            </details>

            <details className="pb-4">
              <summary className="cursor-pointer font-semibold text-slate-900 hover:text-violet-600">
                How are credits charged for meetings?
              </summary>
              <p className="text-slate-600 mt-2">
                MeetAI features (transcription, interpretation) charge credits per minute of usage. Other services charge per document or report generated.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-violet-600 to-violet-700 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-violet-100 mb-6">Choose a package above and unlock all AI-powered features.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-white text-violet-600 rounded-xl font-medium hover:bg-slate-50">
            Back to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
