import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, speakers, duration } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a pharmacy AI assistant. Analyze the following pharmacy consultation transcript and create a structured summary. Focus on pharmacy-specific information and organize it into the following sections:

TRANSCRIPT:
${text}

Please provide a JSON response with the following structure:
{
  "keyTopics": ["topic1", "topic2", "topic3"],
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage if mentioned",
      "frequency": "frequency if mentioned", 
      "notes": "any additional notes"
    }
  ],
  "actionItems": ["action1", "action2", "action3"],
  "patientConcerns": ["concern1", "concern2", "concern3"],
  "pharmacistRecommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Guidelines:
- Extract medication names, dosages, and frequencies
- Identify patient concerns and questions
- Capture pharmacist recommendations and advice
- Note any side effects, allergies, or drug interactions mentioned
- Include refill requests or follow-up actions
- Focus on clinically relevant information
- Keep each item concise but informative

Return only valid JSON without any additional text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Google API key is invalid or quota exceeded. Please check your Google Cloud Console.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Gemini API failed. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response from Gemini API.' },
        { status: 500 }
      );
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    // Parse JSON response
    let summaryData;
    try {
      summaryData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback to structured response
      summaryData = createFallbackSummary(text);
    }

    return NextResponse.json({
      ...summaryData,
      provider: 'gemini'
    });

  } catch (error) {
    console.error('Gemini summary generation error:', error);
    
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
      { error: 'Gemini summary generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

function createFallbackSummary(text: string) {
  const lowerText = text.toLowerCase();
  
  // Extract medications
  const medications = [
    'aspirin', 'ibuprofen', 'acetaminophen', 'amoxicillin', 'metformin',
    'lisinopril', 'atorvastatin', 'omeprazole', 'albuterol', 'prednisone'
  ].filter(med => lowerText.includes(med)).map(med => ({
    name: med.charAt(0).toUpperCase() + med.slice(1),
    dosage: '',
    frequency: '',
    notes: ''
  }));

  // Extract key topics
  const topics = [];
  if (lowerText.includes('medication')) topics.push('Medication discussion');
  if (lowerText.includes('side effect')) topics.push('Side effects');
  if (lowerText.includes('allergy')) topics.push('Allergies');
  if (lowerText.includes('dosage')) topics.push('Dosage instructions');
  if (lowerText.includes('refill')) topics.push('Refill request');

  // Extract action items
  const actions = [];
  if (lowerText.includes('follow up')) actions.push('Schedule follow-up appointment');
  if (lowerText.includes('refill')) actions.push('Process medication refill');
  if (lowerText.includes('call')) actions.push('Call patient with updates');

  // Extract patient concerns
  const concerns = [];
  if (lowerText.includes('pain')) concerns.push('Pain management');
  if (lowerText.includes('side effect')) concerns.push('Medication side effects');
  if (lowerText.includes('allergy')) concerns.push('Allergic reactions');

  // Extract recommendations
  const recommendations = [];
  if (lowerText.includes('take with food')) recommendations.push('Take medication with food');
  if (lowerText.includes('avoid alcohol')) recommendations.push('Avoid alcohol while taking medication');
  if (lowerText.includes('monitor')) recommendations.push('Monitor for side effects');

  return {
    keyTopics: topics.length > 0 ? topics : ['General consultation'],
    medications: medications.length > 0 ? medications : [{ name: 'No specific medications mentioned', dosage: '', frequency: '', notes: '' }],
    actionItems: actions.length > 0 ? actions : ['Review consultation notes'],
    patientConcerns: concerns.length > 0 ? concerns : ['General health discussion'],
    pharmacistRecommendations: recommendations.length > 0 ? recommendations : ['Follow prescribed regimen']
  };
} 