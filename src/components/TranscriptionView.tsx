'use client';

import { useState } from 'react';
import { Edit3, Save, Download, Sparkles, User, UserCheck } from 'lucide-react';
import { TranscriptionSettings } from '@/components/SettingsPanel';

interface TranscriptionData {
  text: string;
  speakers: Array<{
    speaker: string;
    text: string;
    timestamp: number;
  }>;
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
  const [editedSpeakers, setEditedSpeakers] = useState(data.speakers);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      // Choose API endpoint based on summarizer
      const endpoint = settings.summarizer === 'gemini' ? '/api/summarize/gemini' : '/api/summarize';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedText,
          speakers: editedSpeakers,
          duration: data.duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Summary generation failed');
      }

      const summaryData = await response.json();
      onSummaryComplete(summaryData);
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('Error generating summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setEditedSpeakers(editedText.split('\n').map((line, index) => ({
      speaker: line.startsWith('Pharmacist:') ? 'Pharmacist' : 'Patient',
      text: line.replace(/^(Pharmacist|Patient):\s*/, ''),
      timestamp: index * 30 // Approximate timestamp
    })));
    setIsEditing(false);
  };

  const handleDownload = () => {
    const content = editedSpeakers
      .map(speaker => `${speaker.speaker}: ${speaker.text}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
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
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Duration</div>
            <div className="text-2xl font-bold text-blue-900">{formatTime(data.duration)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Words</div>
            <div className="text-2xl font-bold text-green-900">
              {editedText.split(/\s+/).filter(word => word.length > 0).length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Speakers</div>
            <div className="text-2xl font-bold text-purple-900">
              {new Set(editedSpeakers.map(s => s.speaker)).size}
            </div>
          </div>
        </div>

        {/* Transcription Content */}
        <div className="bg-gray-50 rounded-lg p-6">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Edit the transcription here..."
            />
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {editedSpeakers.map((speaker, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {speaker.speaker === 'Pharmacist' ? (
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    ) : (
                      <User className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-medium text-sm px-2 py-1 rounded ${
                        speaker.speaker === 'Pharmacist' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {speaker.speaker}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(speaker.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {speaker.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pharmacy-Specific Highlights */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pharmacy-Specific Detections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {extractPharmacyEntities(editedText).map((category, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
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