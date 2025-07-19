'use client';

import { useState, useEffect } from 'react';
import { Mic, FileText, BarChart3, Settings } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import TranscriptionView from '@/components/TranscriptionView';
import SummaryView from '@/components/SummaryView';
import SettingsPanel, { TranscriptionSettings } from '@/components/SettingsPanel';

type View = 'recording' | 'transcription' | 'summary';

interface TranscriptionData {
  text: string;
  duration: number;
}

interface SummaryData {
  keyTopics: string[];
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    notes?: string;
  }>;
  actionItems: string[];
  patientConcerns: string[];
  pharmacistRecommendations: string[];
}

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('recording');
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<TranscriptionSettings>({
    provider: 'google',
    summarizer: 'gemini',
    openaiApiKey: '',
    googleApiKey: '',
    googleProjectId: '',
    language: 'en-US',
    model: 'whisper-1'
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('transcriptionSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const navigationItems = [
    {
      id: 'recording' as View,
      label: 'Recording',
      icon: Mic,
      description: 'Record pharmacy consultation'
    },
    {
      id: 'transcription' as View,
      label: 'Transcription',
      icon: FileText,
      description: 'View and edit transcript',
      disabled: !transcriptionData
    },
    {
      id: 'summary' as View,
      label: 'Summary',
      icon: BarChart3,
      description: 'AI-generated summary',
      disabled: !summaryData
    }
  ];

  const handleTranscriptionComplete = (data: TranscriptionData) => {
    setTranscriptionData(data);
    setCurrentView('transcription');
  };

  const handleSummaryComplete = (data: SummaryData) => {
    setSummaryData(data);
    setCurrentView('summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pharmacy AI Summarizer
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setIsSettingsOpen(true)}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  disabled={item.disabled}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === item.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : item.disabled
                      ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 dark:text-gray-200">Processing...</span>
            </div>
          </div>
        )}

        {currentView === 'recording' && (
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onSummaryComplete={handleSummaryComplete}
            setIsLoading={setIsLoading}
            settings={settings}
          />
        )}

        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChange={setSettings}
          currentSettings={settings}
        />

        {currentView === 'transcription' && transcriptionData && (
          <TranscriptionView
            data={transcriptionData}
            onSummaryComplete={handleSummaryComplete}
            setIsLoading={setIsLoading}
            settings={settings}
          />
        )}

        {currentView === 'summary' && summaryData && (
          <SummaryView
            data={summaryData}
            transcriptionData={transcriptionData}
          />
        )}
      </main>
    </div>
  );
}
