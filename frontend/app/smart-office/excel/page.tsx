
'use client';

import React, { useState } from 'react';
import { Upload, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExcelPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  const handleQuery = async () => {
    if (!file || !query) { alert('Please upload file and enter query'); return; }
    setLoading(true);
    try {
      setResults({ data: `Analysis for: "${query}"`, confidence: 0.95 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">📊 Power Excel</h1>

      <Card className="mb-8">
        <CardHeader><CardTitle>Upload Spreadsheet</CardTitle></CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-violet-300 rounded-lg p-8 text-center">
            <input type="file" onChange={handleFileChange} accept=".xlsx,.csv" id="excel-input" className="hidden" />
            <label htmlFor="excel-input" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p>{fileName || 'Click to upload'}</p>
            </label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="detect">Detect</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader><CardTitle>Natural Language Query</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask about your data..." className="w-full p-3 border rounded h-24" />
              <Button onClick={handleQuery} disabled={loading || !file} className="w-full bg-violet-600">
                {loading ? 'Processing...' : 'Submit Query'}
              </Button>
              {results && <div className="p-4 bg-violet-50 border rounded">{results.data}</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze"><Card><CardContent className="pt-6">Statistical analysis features</CardContent></Card></TabsContent>
        <TabsContent value="detect"><Card><CardContent className="pt-6">Error detection features</CardContent></Card></TabsContent>
        <TabsContent value="charts"><Card><CardContent className="pt-6">Chart generation features</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default ExcelPage;
