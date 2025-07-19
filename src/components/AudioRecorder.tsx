'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Upload, Play, Pause } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
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

interface AudioRecorderProps {
  onTranscriptionComplete: (data: TranscriptionData) => void;
  onSummaryComplete: (data: SummaryData) => void;
  setIsLoading: (loading: boolean) => void;
  settings: TranscriptionSettings;
}

export default function AudioRecorder({
  onTranscriptionComplete,
  setIsLoading,
  settings
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.webm', '.ogg']
    },
    multiple: false
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Let browser choose optimal sample rate (usually 48kHz)
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Start visualization
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Set up MediaRecorder with better format detection
      let mimeType = 'audio/webm;codecs=opus';
      
      // Check if the browser supports our preferred format
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback to other formats
        const fallbackTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus'
        ];
        
        for (const type of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTranscribe = async () => {
    const fileToTranscribe = uploadedFile || audioBlob;
    if (!fileToTranscribe) return;

    // Check file size for Google API
    if (settings.provider === 'google') {
      const fileSizeInMB = fileToTranscribe.size / (1024 * 1024);
      if (fileSizeInMB > 10) { // 10MB limit for Google API
        alert('File is too large for Google Speech-to-Text. Please use a smaller file (under 10MB).');
        return;
      }
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', fileToTranscribe);

      // Choose API endpoint based on provider
      const endpoint = settings.provider === 'google' ? '/api/transcribe/google' : '/api/transcribe';
      
      // Add language for Google API
      if (settings.provider === 'google') {
        formData.append('language', settings.language);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      onTranscriptionComplete(data);
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Show more specific error messages
      let errorMessage = 'Error transcribing audio. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'OpenAI API key not configured. Please add your API key to .env.local';
        } else if (error.message.includes('file')) {
          errorMessage = 'Invalid audio file format. Please try a different file.';
        } else if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Record Pharmacy Consultation
        </h2>

        {/* Audio Level Visualization */}
        <div className="mb-8">
          <div className="flex justify-center items-end space-x-1 h-20">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="w-2 bg-gray-200 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.max(4, (audioLevel / 255) * 60 * (i / 20))}px`,
                  backgroundColor: isRecording ? '#3B82F6' : '#E5E7EB'
                }}
              />
            ))}
          </div>
          {isRecording && (
            <div className="text-center text-sm text-gray-600">
              Recording time: {formatTime(recordingTime)}
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Mic className="h-5 w-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Square className="h-5 w-5" />
              <span>Stop Recording</span>
            </button>
          )}
        </div>
        
        {/* Recording Tip */}
        <div className="text-center mb-6">
          <p className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg inline-block">
            ⚠️ Important: Google Speech-to-Text has a 30-second limit for browser recordings. 
            For longer audio, please upload a file instead.
          </p>
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="mb-8">
            <div className="flex justify-center space-x-4 mb-4">
              {!isPlaying ? (
                <button
                  onClick={playAudio}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Play className="h-4 w-4" />
                  <span>Play</span>
                </button>
              ) : (
                <button
                  onClick={pauseAudio}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              )}
            </div>
            <audio
              ref={audioElementRef}
              src={audioUrl}
              controls
              className="w-full"
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* File Upload */}
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop the audio file here...'
                : 'Drag & drop an audio file here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports MP3, WAV, M4A, WebM, OGG
            </p>
          </div>
        </div>

        {/* Transcribe Button */}
        {(audioBlob || uploadedFile) && (
          <div className="text-center">
            <button
              onClick={handleTranscribe}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Transcribe Audio
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 