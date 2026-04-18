'use client';
import Link from 'next/link';

export default function CancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-amber-200 p-8 max-w-md w-full text-center shadow-lg">
        {/* Cancel Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✕</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-600 mb-6">
          Your payment was cancelled and no charges were made to your account.
        </p>

        {/* Next Steps */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="font-semibold text-slate-900 mb-3">What would you like to do?</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">→</span>
              <span>Try a different payment method</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">→</span>
              <span>Choose a different package</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">→</span>
              <span>Contact support if you need help</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/aipps" className="block px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors">
            Try Again
          </Link>
          <Link href="/" className="block px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 transition-colors">
            Back to Dashboard
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Need help? Contact our support team.
        </p>
      </div>
    </div>
  );
}
