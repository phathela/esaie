'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Report {
  report_id: string;
  title: string;
  report_type: string;
  filename: string;
  created_by_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_feedback?: string;
}

const REPORT_TYPES = [
  { id: 'executive_summary', label: 'Executive Summary', icon: '📊' },
  { id: 'detailed_analysis', label: 'Detailed Analysis', icon: '🔍' },
  { id: 'action_items', label: 'Action Items', icon: '✅' },
  { id: 'risk_assessment', label: 'Risk Assessment', icon: '⚠️' },
  { id: 'financial_summary', label: 'Financial Summary', icon: '💰' },
  { id: 'recommendations', label: 'Recommendations', icon: '💡' },
];

export default function AdvancedReportsPage() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'my-reports' | 'pending-approvals' | 'create'>('my-reports');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDetail, setReportDetail] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) loadReports();
  }, [token]);

  const loadReports = async () => {
    try {
      const [myReports, pending] = await Promise.all([
        axios.get(`${API}/api/smart-office/advanced-reports`, { headers: h }),
        axios.get(`${API}/api/smart-office/advanced-reports/pending/approvals`, { headers: h }),
      ]);
      setReports(myReports.data.reports);
      setPendingReports(pending.data.pending_reports);
    } catch (e) {
      console.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetail = async (reportId: string) => {
    try {
      const r = await axios.get(`${API}/api/smart-office/advanced-reports/${reportId}`, { headers: h });
      setReportDetail(r.data.report);
    } catch (e) {
      console.error('Failed to load report detail');
    }
  };

  const approveReport = async (reportId: string, approved: boolean) => {
    try {
      await axios.post(
        `${API}/api/smart-office/advanced-reports/${reportId}/approve`,
        { approved, feedback },
        { headers: h }
      );
      setFeedback('');
      setSelectedReport(null);
      setReportDetail(null);
      await loadReports();
    } catch (e) {
      console.error('Failed to approve report');
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const r = await axios.get(`${API}/api/smart-office/advanced-reports/export/${reportId}`, { headers: h });
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(r.data.report, null, 2)], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${r.data.report.title}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-slate-900">Advanced Reports</h1>
        <p className="text-slate-600 mt-1">Create, manage, and approve professional reports</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 flex gap-8">
          {(['my-reports', 'pending-approvals', 'create'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'my-reports' && '📋 My Reports'}
              {t === 'pending-approvals' && `⏳ Pending Approvals (${pendingReports.length})`}
              {t === 'create' && '➕ Create Report'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* My Reports */}
        {tab === 'my-reports' && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Your Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <div
                  key={report.report_id}
                  onClick={() => {
                    setSelectedReport(report);
                    loadReportDetail(report.report_id);
                  }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow group"
                >
                  <div className="mb-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'approved' ? 'bg-green-100 text-green-700' :
                      report.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status === 'approved' && '✓ Approved'}
                      {report.status === 'rejected' && '✗ Rejected'}
                      {report.status === 'pending' && '⏳ Pending'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 mb-2">{report.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{REPORT_TYPES.find(t => t.id === report.report_type)?.label}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>📄 {report.filename}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            {reports.length === 0 && <p className="text-slate-500 text-center py-12">No reports yet. Create one to get started.</p>}
          </div>
        )}

        {/* Pending Approvals */}
        {tab === 'pending-approvals' && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Reports Pending Your Approval</h2>
            <div className="space-y-4">
              {pendingReports.map(report => (
                <div
                  key={report.report_id}
                  onClick={() => {
                    setSelectedReport(report);
                    loadReportDetail(report.report_id);
                  }}
                  className="bg-white border-2 border-orange-300 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{report.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">By {report.created_by_name}</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">⏳ Pending</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{REPORT_TYPES.find(t => t.id === report.report_type)?.label}</p>
                  <p className="text-xs text-slate-500">Requested {new Date(report.created_at).toLocaleString()}</p>
                </div>
              ))}
              {pendingReports.length === 0 && <p className="text-slate-500 text-center py-12">No pending approvals.</p>}
            </div>
          </div>
        )}

        {/* Create Report */}
        {tab === 'create' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Create New Report</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-900 mb-2">Select Report Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {REPORT_TYPES.map(type => (
                    <div
                      key={type.id}
                      className="p-4 border-2 border-slate-200 rounded-lg text-center cursor-pointer hover:border-violet-400 transition-colors"
                    >
                      <p className="text-2xl mb-2">{type.icon}</p>
                      <p className="text-sm font-medium text-slate-900">{type.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-900 mb-2">Document</label>
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
                  <p className="text-sm text-slate-600">Select a document from your Smart Office files</p>
                  <p className="text-xs text-slate-500 mt-1">Upload documents first in Documents section</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-900 mb-2">Report Title</label>
                <input
                  placeholder="e.g., Q2 Financial Analysis"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-900 mb-2">Request Approval From (Optional)</label>
                <input
                  placeholder="User ID or email"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                />
              </div>

              <button className="w-full px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && reportDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{reportDetail.title}</h2>
              <button onClick={() => { setSelectedReport(null); setReportDetail(null); }} className="text-slate-400 hover:text-slate-600 text-2xl">
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{reportDetail.content}</p>
              </div>

              {selectedReport.status === 'pending' && !reportDetail.created_by && (
                <div className="space-y-4">
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Add feedback (optional)"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveReport(selectedReport.report_id, true)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => approveReport(selectedReport.report_id, false)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedReport.status !== 'pending' && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-900">Approval Status: <span className={selectedReport.status === 'approved' ? 'text-green-600' : 'text-red-600'}>{selectedReport.status}</span></p>
                  {reportDetail.approval_feedback && <p className="text-sm text-slate-600 mt-2">{reportDetail.approval_feedback}</p>}
                </div>
              )}

              <button
                onClick={() => downloadReport(selectedReport.report_id)}
                className="w-full px-4 py-2 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200"
              >
                📥 Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
