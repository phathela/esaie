'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  files_used?: number;
}

export default function AIChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileIndexStatus, setFileIndexStatus] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API}/api/smart-office/smart-files/chat`,
        { message: input },
        { headers: h }
      );

      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        files_used: response.data.files_used,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to get response');
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Make sure you have indexed files first by uploading documents to the Documents or Excel sections.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-slate-900">AI File Assistant</h1>
        <p className="text-slate-600 mt-1">Ask questions about your documents, spreadsheets, and more</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🤖</p>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Welcome to AI File Assistant</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Upload documents to Documents, spreadsheets to Excel, or audio files to Transcribe. Then ask me questions and I'll search through all your files to find answers.
              </p>
              <div className="space-y-3 max-w-md mx-auto">
                <button
                  onClick={() => setInput("What are the key points in my recent documents?")}
                  className="w-full p-4 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors text-left"
                >
                  <p className="font-medium text-slate-900">📋 Summarize my documents</p>
                  <p className="text-sm text-slate-600">Get key points from all uploads</p>
                </button>
                <button
                  onClick={() => setInput("What data trends do you see in my spreadsheets?")}
                  className="w-full p-4 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors text-left"
                >
                  <p className="font-medium text-slate-900">📊 Analyze spreadsheet data</p>
                  <p className="text-sm text-slate-600">Get insights from your Excel files</p>
                </button>
                <button
                  onClick={() => setInput("What were the main discussion points from my transcriptions?")}
                  className="w-full p-4 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors text-left"
                >
                  <p className="font-medium text-slate-900">🎤 Transcription insights</p>
                  <p className="text-sm text-slate-600">Search across audio transcripts</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl px-6 py-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-violet-200' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                      {msg.files_used && ` • Searched ${msg.files_used} file(s)`}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl rounded-bl-none px-6 py-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Ask me anything about your files..."
              disabled={loading}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 disabled:bg-slate-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-8 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '🤖' : '📤'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            💡 Tip: For better results, ask specific questions. You can ask about documents, spreadsheet data, transcriptions, or general insights.
          </p>
        </div>
      </div>
    </div>
  );
}
