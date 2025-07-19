import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en-US';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      );
    }

    // Convert File to base64
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Audio = buffer.toString('base64');

    // Debug: Log audio file details
    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      lastModified: audioFile.lastModified
    });

    // Google Speech-to-Text API request
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Use regular recognize API with better error handling
    console.log('Using Google Speech-to-Text recognize API');
    
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            languageCode: language,
            enableWordTimeOffsets: true,
            enableAutomaticPunctuation: true,
            model: 'latest_long',
          },
          audio: {
            content: base64Audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Speech-to-Text error:', errorData);
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Google API key is invalid or quota exceeded. Please check your Google Cloud Console.' },
          { status: 403 }
        );
      } else if (response.status === 400) {
        // Provide more specific error messages for audio format issues
        const errorMessage = errorData.error?.message || '';
        if (errorMessage.includes('sample_rate') || errorMessage.includes('encoding')) {
          return NextResponse.json(
            { error: 'Audio format issue. Please try recording again or upload a different audio file.' },
            { status: 400 }
          );
        } else if (errorMessage.includes('Sync input too long') || errorMessage.includes('duration limit')) {
          return NextResponse.json(
            { error: 'Audio file is too long for processing. Please try with a shorter recording (under 30 seconds).' },
            { status: 400 }
          );
        } else if (errorMessage.includes('Inline audio exceeds duration limit')) {
          return NextResponse.json(
            { error: 'Audio file is too long for processing. Please try with a shorter recording (under 30 seconds).' },
            { status: 400 }
          );
        } else if (errorMessage.includes('audio')) {
          return NextResponse.json(
            { error: 'Invalid audio file. Please ensure the file contains speech and is not corrupted.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Invalid audio format. Please try a different audio file.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Google Speech-to-Text failed. Please try again.' },
        { status: 500 }
      );
    }
    
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'No speech detected in the audio file.' },
        { status: 400 }
      );
    }

    // Process Google Speech-to-Text results
    const transcription = data.results
      .map((result: any) => result.alternatives[0].transcript)
      .join(' ');

    // Calculate duration from the last word's end time or estimate from audio length
    let duration = 0;
    if (data.results[0]?.alternatives[0]?.words?.length > 0) {
      const lastWord = data.results[0].alternatives[0].words[data.results[0].alternatives[0].words.length - 1];
      if (lastWord.endTime) {
        // Convert from Google's time format (seconds.nanos) to seconds
        duration = parseFloat(lastWord.endTime.seconds || '0') + 
                   parseFloat(lastWord.endTime.nanos || '0') / 1000000000;
      }
    }
    
    // If no duration from words, estimate from audio file size and format
    if (duration === 0) {
      // Rough estimation: assume 16kbps bitrate for speech
      const estimatedDuration = Math.round(audioFile.size / (16000 / 8));
      duration = Math.max(estimatedDuration, 1); // Minimum 1 second
    }

    return NextResponse.json({
      text: transcription,
      duration: Math.round(duration),
      provider: 'google'
    });

  } catch (error) {
    console.error('Google transcription error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid Google API key. Please check your configuration.' },
          { status: 401 }
        );
      } else if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Google API quota exceeded. Please check your billing.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Google transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}

 