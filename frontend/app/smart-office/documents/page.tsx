
'use client';

import React, { useState } from 'react';
import { Upload, Download, Loader, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DocumentsPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState('executive-summary');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [fileName, setFileName] = useState('');

  const reportTypes = [
    'executive-summary', 'business-case', 'project-plan',
    'technical-spec', 'market-analysis', 'risk-assessment'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  const handleGenerateReport = async () => {
    if (!file) { alert('Please select a file'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('report_type', reportType);
      const response = await fetch('/api/smart-office/documents/analyze', {
        method: 'POST', body: formData
      });
      const data = await response.json();
      setReport(data.report || 'Report generated');
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([report]));
    el.download = `report-${reportType}.txt`;
    el.click();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">📄 Documents Processor</h1>
      <Card className="mb-8">
        <CardHeader><CardTitle>Upload Document</CardTitle></CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-rose-300 rounded-lg p-8 text-center">
            <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.txt" id="file-input" className="hidden" />
            <label htmlFor="file-input" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p>{fileName || 'Click to upload'}</p>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader><CardTitle>Report Type</CardTitle></CardHeader>
        <CardContent>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full p-3 border rounded">
            {reportTypes.map(t => <option key={t} value={t}>{t.replace('-', ' ').toUpperCase()}</option>)}
          </select>
        </CardContent>
      </Card>

      <Button onClick={handleGenerateReport} disabled={loading || !file} className="w-full bg-rose-600 py-3 mb-8">
        {loading ? 'Generating...' : 'Generate Report'}
      </Button>

      {report && (
        <Card className="border-green-200">
          <CardHeader><CardTitle className="flex gap-2"><Check className="w-5 h-5" /> Report</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 bg-white border rounded mb-4 max-h-96 overflow-auto">{report}</div>
            <Button onClick={handleDownload} className="w-full bg-green-600"><Download className="w-4 h-4 mr-2" />Download</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentsPage;
