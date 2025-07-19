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

    return NextResponse.json({
      text: transcription.text,
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

 