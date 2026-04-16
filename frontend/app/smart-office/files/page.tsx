
'use client';

import React, { useState } from 'react';
import { Upload, MessageSquare, FileText, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SmartFilesPage = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const reportTypes = [
    { id: 'profile', name: '👤 Profile' },
    { id: 'inaccuracies', name: '��️ Inaccuracies' },
    { id: 'link-analysis', name: '🔗 Link Analysis' },
    { id: 'product', name: '📦 Product' },
    { id: 'submission', name: '📋 Submission' },
    { id: 'business-case', name: '📊 Business Case' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded) {
      const newFiles = Array.from(uploaded).map(f => ({
        id: Date.now() + Math.random(),
        name: f.name,
        size: (f.size / 1024).toFixed(2),
        uploadedAt: new Date().toLocaleDateString()
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleChat = () => {
    if (chatMessage.trim()) {
      setChatHistory([
        ...chatHistory,
        { role: 'user', content: chatMessage },
        { role: 'assistant', content: 'Mock AI response based on documents.' }
      ]);
      setChatMessage('');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">🗂️ Smart Files</h1>

      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          <Card>
            <CardHeader><CardTitle>Upload Documents</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                <input type="file" onChange={handleFileUpload} multiple className="hidden" id="files-input" accept=".pdf,.docx,.txt" />
                <label htmlFor="files-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p>Click to upload</p>
                </label>
              </div>
              {files.map(f => (
                <div key={f.id} className="flex justify-between p-3 bg-slate-50 rounded border">
                  <div><p className="font-medium">{f.name}</p><p className="text-sm text-slate-500">{f.uploadedAt}</p></div>
                  <Button variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="flex flex-col h-96">
            <CardHeader><CardTitle>Chat with DocsAI</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-3 mb-4">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded text-sm ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-100'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="flex gap-2 p-4 border-t">
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChat()} placeholder="Ask..." className="flex-1 p-2 border rounded" />
              <Button onClick={handleChat} className="bg-purple-600"><Send className="w-4 h-4" /></Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-3 gap-4">
            {reportTypes.map(r => (
              <Card key={r.id} className="hover:shadow-lg">
                <CardHeader><CardTitle className="text-lg">{r.name}</CardTitle></CardHeader>
                <CardContent><Button className="w-full bg-purple-600">Generate</Button></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartFilesPage;
