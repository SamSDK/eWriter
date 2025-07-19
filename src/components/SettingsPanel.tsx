'use client';

import { useState } from 'react';
import { X, Save, Key, Globe, Mic } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: TranscriptionSettings) => void;
  currentSettings: TranscriptionSettings;
}

export interface TranscriptionSettings {
  provider: 'openai' | 'google';
  summarizer: 'openai' | 'gemini';
  openaiApiKey: string;
  googleApiKey: string;
  googleProjectId: string;
  language: string;
  model: string;
}

const defaultSettings: TranscriptionSettings = {
  provider: 'openai',
  summarizer: 'openai',
  openaiApiKey: '',
  googleApiKey: '',
  googleProjectId: '',
  language: 'en-US',
  model: 'whisper-1'
};

export default function SettingsPanel({
  isOpen,
  onClose,
  onSettingsChange,
  currentSettings
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<TranscriptionSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Save to localStorage
    localStorage.setItem('transcriptionSettings', JSON.stringify(settings));
    onSettingsChange(settings);
    setIsSaving(false);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transcription Provider</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  settings.provider === 'openai'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSettings({ ...settings, provider: 'openai' })}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">OpenAI Whisper</h4>
                    <p className="text-sm text-gray-600">High accuracy, $0.006/minute</p>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  settings.provider === 'google'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSettings({ ...settings, provider: 'google' })}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Google Speech-to-Text</h4>
                    <p className="text-sm text-gray-600">Free tier available, $0.006/minute</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summarizer Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Summarizer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  settings.summarizer === 'openai'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSettings({ ...settings, summarizer: 'openai' })}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">OpenAI GPT-4</h4>
                    <p className="text-sm text-gray-600">Advanced AI summarization</p>
                  </div>
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  settings.summarizer === 'gemini'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSettings({ ...settings, summarizer: 'gemini' })}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Google Gemini</h4>
                    <p className="text-sm text-gray-600">Fast and cost-effective</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OpenAI Settings */}
          {settings.provider === 'openai' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">OpenAI Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Key className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select OpenAI model"
                >
                  <option value="whisper-1">Whisper-1 (Recommended)</option>
                </select>
              </div>
            </div>
          )}

          {/* Google Settings */}
          {settings.provider === 'google' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Google Cloud Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Cloud API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.googleApiKey}
                    onChange={(e) => setSettings({ ...settings, googleApiKey: e.target.value })}
                    placeholder="AIza..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Key className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project ID
                </label>
                <input
                  type="text"
                  value={settings.googleProjectId}
                  onChange={(e) => setSettings({ ...settings, googleProjectId: e.target.value })}
                  placeholder="your-project-id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Google Cloud Project ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  title="Select language for transcription"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="fr-FR">French</option>
                  <option value="es-ES">Spanish</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="ko-KR">Korean</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>
            </div>
          )}

          {/* Pricing Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pricing Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>OpenAI Whisper:</span>
                <span>$0.006 per minute</span>
              </div>
              <div className="flex justify-between">
                <span>Google Speech-to-Text:</span>
                <span>$0.006 per minute (60 minutes free/month)</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                * Google offers 60 minutes of free transcription per month
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-800"
          >
            Reset to Defaults
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 