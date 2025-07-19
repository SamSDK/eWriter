import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function extractPharmacyEntities(text: string) {
  const lowerText = text.toLowerCase();
  
  // Common medication patterns
  const medications = [
    'aspirin', 'ibuprofen', 'acetaminophen', 'amoxicillin', 'metformin',
    'lisinopril', 'atorvastatin', 'omeprazole', 'albuterol', 'prednisone',
    'warfarin', 'insulin', 'morphine', 'oxycodone', 'hydrocodone'
  ].filter(med => lowerText.includes(med));

  // Dosage patterns
  const dosages = (text.match(/\d+\s*(mg|mcg|g|ml|tablet|capsule|dose|puff)/gi) || []);

  // Side effects
  const sideEffects = [
    'nausea', 'dizziness', 'headache', 'fatigue', 'diarrhea', 'constipation',
    'rash', 'itching', 'swelling', 'shortness of breath', 'chest pain',
    'irregular heartbeat', 'fever', 'chills', 'sore throat'
  ].filter(effect => lowerText.includes(effect));

  // Allergies
  const allergies = (text.match(/(allergic|allergy|reaction).*?(penicillin|sulfa|aspirin|latex|peanut|shellfish)/gi) || []);

  // Drug interactions
  const interactions = (text.match(/(interaction|interact|conflict).*?(medication|drug|medicine)/gi) || []);

  return [
    { name: 'Medications', items: medications },
    { name: 'Dosages', items: dosages },
    { name: 'Side Effects', items: sideEffects },
    { name: 'Allergies', items: allergies },
    { name: 'Drug Interactions', items: interactions }
  ].filter(category => category.items.length > 0);
}

export function validateAudioFile(file: File): boolean {
  const validTypes = [
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/webm',
    'audio/ogg',
    'audio/mpeg'
  ];
  
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
}

export function generateFileName(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}-${timestamp}.${extension}`;
} 