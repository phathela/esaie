
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, BarChart3, Globe, Mic2, FolderOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SmartOfficeLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { id: 'documents', label: 'Documents', icon: FileText, path: '/smart-office/documents' },
    { id: 'excel', label: 'Power Excel', icon: BarChart3, path: '/smart-office/excel' },
    { id: 'translate', label: 'Translate', icon: Globe, path: '/smart-office/translate' },
    { id: 'transcribe', label: 'Transcribe', icon: Mic2, path: '/smart-office/transcribe' },
    { id: 'files', label: 'Smart Files', icon: FolderOpen, path: '/smart-office/files' }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900">Smart Office</h2>
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        <nav className="space-y-2 flex-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                  isActive ? 'bg-rose-100 text-rose-900 font-semibold' : 'hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default SmartOfficeLayout;
