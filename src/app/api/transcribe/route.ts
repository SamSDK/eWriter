import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a proper File object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      );
    }

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    // Process transcription for speaker identification
    const speakers = processSpeakerSegments(transcription.text, transcription.words || [] as Array<{word: string, start: number, end: number}>);

    return NextResponse.json({
      text: transcription.text,
      speakers,
      duration: transcription.duration || 0,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your configuration.' },
          { status: 401 }
        );
      } else if (error.message.includes('file')) {
        return NextResponse.json(
          { error: 'Invalid audio file format. Please try a different file.' },
          { status: 400 }
        );
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your billing and usage limits at https://platform.openai.com/account/usage' },
          { status: 429 }
        );
      } else if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please add payment method or upgrade your plan at https://platform.openai.com/account/billing' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}

function processSpeakerSegments(text: string, _words: Array<{word: string, start: number, end: number}>) {
  // Simple speaker identification based on sentence patterns
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const speakers = [];
  
  let currentSpeaker = 'Pharmacist';
  let currentText = '';
  let timestamp = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    
    // Simple heuristic: questions are usually from patients
    const isQuestion = sentence.includes('?') || 
                      sentence.toLowerCase().includes('what') ||
                      sentence.toLowerCase().includes('how') ||
                      sentence.toLowerCase().includes('when') ||
                      sentence.toLowerCase().includes('why') ||
                      sentence.toLowerCase().includes('can you') ||
                      sentence.toLowerCase().includes('could you');

    // Medical terminology suggests pharmacist
    const hasMedicalTerms = sentence.toLowerCase().includes('dosage') ||
                           sentence.toLowerCase().includes('side effect') ||
                           sentence.toLowerCase().includes('medication') ||
                           sentence.toLowerCase().includes('prescription') ||
                           sentence.toLowerCase().includes('pharmacy');

    if (isQuestion && !hasMedicalTerms) {
      currentSpeaker = 'Patient';
    } else if (hasMedicalTerms) {
      currentSpeaker = 'Pharmacist';
    }

    currentText += sentence + '. ';
    timestamp += 30; // Approximate 30 seconds per sentence

    // Add speaker segment every few sentences
    if (i % 2 === 1 || i === sentences.length - 1) {
      speakers.push({
        speaker: currentSpeaker,
        text: currentText.trim(),
        timestamp: timestamp - 30
      });
      currentText = '';
    }
  }

  return speakers;
} 