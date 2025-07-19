import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { text, summarizer = 'openai' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
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

    let responseText = '';

    if (summarizer === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a pharmacy AI assistant that creates structured summaries of pharmacy consultations. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      responseText = completion.choices[0]?.message?.content || '';
    } else if (summarizer === 'gemini') {
      if (!process.env.GOOGLE_API_KEY) {
        return NextResponse.json(
          { error: 'Google API key not configured' },
          { status: 500 }
        );
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    }

    if (!responseText) {
      throw new Error('No response from AI service');
    }

    // Parse JSON response
    let summaryData;
    try {
      summaryData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback to structured response
      summaryData = createFallbackSummary(text);
    }

    return NextResponse.json(summaryData);

  } catch (error) {
    console.error('Summary generation error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your billing at https://platform.openai.com/account/billing or try using Google Gemini instead.' },
          { status: 429 }
        );
      } else if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your configuration.' },
          { status: 401 }
        );
      } else if (error.message.includes('SERVICE_DISABLED') || error.message.includes('Generative Language API')) {
        return NextResponse.json(
          { 
            error: 'Google Gemini API not enabled. Please follow these steps:\n1. Go to https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview\n2. Click "Enable" for the Generative Language API\n3. Wait a few minutes for the change to take effect\n4. Try again. If you continue to have issues, try using OpenAI instead.' 
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Summary generation failed. Please try again.' },
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