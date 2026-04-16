
'use client';

import React, { useState, useRef } from 'react';
import { Mic, Upload, Square, Download, Loader, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TranscribePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileName(f.name); }
  };

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      setFile(blob as any);
      setFileName('recording.wav');
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!file) { alert('Upload or record audio'); return; }
    setLoading(true);
    setTimeout(() => {
      setTranscription(`[Transcription of ${fileName}]\n\nThis is a sample transcription with speaker diarization and timestamps...`);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">🎤 Transcribe</h1>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader><CardTitle>Upload</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center">
              <input type="file" onChange={handleFileChange} accept="audio/*,video/*" id="audio-input" className="hidden" />
              <label htmlFor="audio-input" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>{fileName || 'Upload audio/video'}</p>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Record</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-48">
            {recording ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-8 h-8 text-red-600" />
                </div>
                <Button onClick={handleStopRecording} className="bg-red-600 mt-4">
                  <Square className="w-4 h-4 mr-2" /> Stop
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-amber-600" />
                </div>
                <Button onClick={handleStartRecording} className="bg-amber-600 mt-4">
                  <Mic className="w-4 h-4 mr-2" /> Record
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleTranscribe} disabled={loading || !file} className="w-full bg-amber-600 py-3 mb-8">
        {loading ? 'Transcribing...' : 'Transcribe'}
      </Button>

      {transcription && (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="flex gap-2"><Check /> Transcription</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 bg-white border rounded mb-4 max-h-96 overflow-auto">{transcription}</div>
            <Button className="w-full bg-amber-600"><Download className="w-4 h-4 mr-2" />Download</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TranscribePage;
