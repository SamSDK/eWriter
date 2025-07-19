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

    // Extract word-level timestamps
    const words = data.results
      .flatMap((result: any) => 
        result.alternatives[0].words?.map((word: any) => ({
          word: word.word,
          start: word.startTime?.seconds || 0,
          end: word.endTime?.seconds || 0,
        })) || []
      );

    // Process speaker segments
    const speakers = processSpeakerSegments(transcription, words);

    return NextResponse.json({
      text: transcription,
      speakers,
      duration: words.length > 0 ? words[words.length - 1].end : 0,
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

function processSpeakerSegments(text: string, words: Array<{word: string, start: number, end: number}>) {
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