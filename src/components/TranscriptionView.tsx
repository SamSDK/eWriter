'use client';

import { useState } from 'react';
import { Edit3, Save, Download, Sparkles } from 'lucide-react';
import { TranscriptionSettings } from '@/components/SettingsPanel';

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

interface TranscriptionViewProps {
  data: TranscriptionData;
  onSummaryComplete: (data: SummaryData) => void;
  setIsLoading: (loading: boolean) => void;
  settings: TranscriptionSettings;
}

export default function TranscriptionView({
  data,
  onSummaryComplete,
  setIsLoading,
  settings
}: TranscriptionViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(data.text);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      // Try with the selected summarizer first
      let response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedText,
          summarizer: settings.summarizer
        }),
      });

      // If the selected summarizer fails and it's Google Gemini, try OpenAI as fallback
      if (!response.ok && settings.summarizer === 'gemini') {
        const errorData = await response.json();
        if (errorData.error && (errorData.error.includes('SERVICE_DISABLED') || errorData.error.includes('Generative Language API'))) {
          console.log('Google Gemini failed, trying OpenAI as fallback...');
          response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: editedText,
              summarizer: 'openai'
            }),
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Summary generation failed');
      }

      const summaryData = await response.json();
      onSummaryComplete(summaryData);
    } catch (error) {
      console.error('Summary generation error:', error);
      
      // Show more specific error messages
      let errorMessage = 'Error generating summary. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          errorMessage = 'API quota exceeded. Please check your billing or try a different provider.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API key not configured. Please check your settings.';
        } else if (error.message.includes('SERVICE_DISABLED') || error.message.includes('Generative Language API')) {
          errorMessage = 'Google Gemini API not enabled. Please enable it in Google Cloud Console or try using OpenAI instead.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleDownload = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transcription
          </h2>
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleGenerateSummary}
              className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Summary</span>
            </button>
          </div>
        </div>

        {/* Transcription Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Duration</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatTime(data.duration)}</div>
            {data.duration === 0 && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Duration not available
              </div>
            )}
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Words</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {editedText.split(/\s+/).filter(word => word.length > 0).length}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Characters</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {editedText.length}
            </div>
          </div>
        </div>

        {/* Transcription Content */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Edit the transcription here..."
            />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {editedText}
              </p>
            </div>
          )}
        </div>

        {/* Pharmacy-Specific Highlights */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pharmacy-Specific Detections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {extractPharmacyEntities(editedText).map((category, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category.name}</h4>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-600 px-2 py-1 rounded">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function extractPharmacyEntities(text: string) {
  const lowerText = text.toLowerCase();
  
  // Common medication patterns
  const medications = [
    'aspirin', 'ibuprofen', 'acetaminophen', 'amoxicillin', 'metformin',
    'lisinopril', 'atorvastatin', 'omeprazole', 'albuterol', 'prednisone'
  ].filter(med => lowerText.includes(med));

  // Dosage patterns
  const dosages = (text.match(/\d+\s*(mg|mcg|g|ml|tablet|capsule|dose)/gi) || []);

  // Side effects
  const sideEffects = [
    'nausea', 'dizziness', 'headache', 'fatigue', 'diarrhea', 'constipation',
    'rash', 'itching', 'swelling', 'shortness of breath'
  ].filter(effect => lowerText.includes(effect));

  // Allergies
  const allergies = (text.match(/(allergic|allergy|reaction).*?(penicillin|sulfa|aspirin|latex)/gi) || []);

  return [
    { name: 'Medications', items: medications },
    { name: 'Dosages', items: dosages },
    { name: 'Side Effects', items: sideEffects },
    { name: 'Allergies', items: allergies }
  ].filter(category => category.items.length > 0);
} 