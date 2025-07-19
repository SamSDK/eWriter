'use client';

import { useState } from 'react';
import { Download, FileText, FileDown, Printer, Copy, Check } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

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

interface TranscriptionData {
  text: string;
  speakers: Array<{
    speaker: string;
    text: string;
    timestamp: number;
  }>;
  duration: number;
}

interface SummaryViewProps {
  data: SummaryData;
  transcriptionData: TranscriptionData | null;
}

export default function SummaryView({ data, transcriptionData }: SummaryViewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const summaryText = generateSummaryText();
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummaryText = () => {
    return `PHARMACY CONSULTATION SUMMARY

KEY TOPICS:
${data.keyTopics.map(topic => `• ${topic}`).join('\n')}

MEDICATIONS MENTIONED:
${data.medications.map(med => 
  `• ${med.name}${med.dosage ? ` - ${med.dosage}` : ''}${med.frequency ? ` (${med.frequency})` : ''}${med.notes ? ` - ${med.notes}` : ''}`
).join('\n')}

ACTION ITEMS:
${data.actionItems.map(item => `• ${item}`).join('\n')}

PATIENT CONCERNS:
${data.patientConcerns.map(concern => `• ${concern}`).join('\n')}

PHARMACIST RECOMMENDATIONS:
${data.pharmacistRecommendations.map(rec => `• ${rec}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Duration: ${transcriptionData ? formatTime(transcriptionData.duration) : 'N/A'}`;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const summaryText = generateSummaryText();
    const lines = doc.splitTextToSize(summaryText, 180);
    
    doc.setFontSize(16);
    doc.text('Pharmacy Consultation Summary', 20, 20);
    
    doc.setFontSize(12);
    doc.text(lines, 20, 40);
    
    doc.save('pharmacy-summary.pdf');
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "PHARMACY CONSULTATION SUMMARY",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "KEY TOPICS:",
                bold: true,
                size: 16
              })
            ],
            spacing: { after: 200 }
          }),
          ...data.keyTopics.map(topic => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${topic}`,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: "MEDICATIONS MENTIONED:",
                bold: true,
                size: 16
              })
            ],
            spacing: { after: 200, before: 400 }
          }),
          ...data.medications.map(med => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${med.name}${med.dosage ? ` - ${med.dosage}` : ''}${med.frequency ? ` (${med.frequency})` : ''}${med.notes ? ` - ${med.notes}` : ''}`,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: "ACTION ITEMS:",
                bold: true,
                size: 16
              })
            ],
            spacing: { after: 200, before: 400 }
          }),
          ...data.actionItems.map(item => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: "PATIENT CONCERNS:",
                bold: true,
                size: 16
              })
            ],
            spacing: { after: 200, before: 400 }
          }),
          ...data.patientConcerns.map(concern => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${concern}`,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: "PHARMACIST RECOMMENDATIONS:",
                bold: true,
                size: 16
              })
            ],
            spacing: { after: 200, before: 400 }
          }),
          ...data.pharmacistRecommendations.map(rec => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${rec}`,
                  size: 12
                })
              ],
              spacing: { after: 100 }
            })
          )
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharmacy-summary.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToText = () => {
    const summaryText = generateSummaryText();
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharmacy-summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printSummary = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pharmacy Consultation Summary</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
              h2 { color: #374151; margin-top: 30px; }
              .section { margin-bottom: 20px; }
              .item { margin: 5px 0; }
              .medication { background: #f3f4f6; padding: 10px; margin: 5px 0; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Pharmacy Consultation Summary</h1>
            
            <div class="section">
              <h2>Key Topics</h2>
              ${data.keyTopics.map(topic => `<div class="item">• ${topic}</div>`).join('')}
            </div>
            
            <div class="section">
              <h2>Medications Mentioned</h2>
              ${data.medications.map(med => 
                `<div class="medication">• ${med.name}${med.dosage ? ` - ${med.dosage}` : ''}${med.frequency ? ` (${med.frequency})` : ''}${med.notes ? ` - ${med.notes}` : ''}</div>`
              ).join('')}
            </div>
            
            <div class="section">
              <h2>Action Items</h2>
              ${data.actionItems.map(item => `<div class="item">• ${item}</div>`).join('')}
            </div>
            
            <div class="section">
              <h2>Patient Concerns</h2>
              ${data.patientConcerns.map(concern => `<div class="item">• ${concern}</div>`).join('')}
            </div>
            
            <div class="section">
              <h2>Pharmacist Recommendations</h2>
              ${data.pharmacistRecommendations.map(rec => `<div class="item">• ${rec}</div>`).join('')}
            </div>
            
            <div style="margin-top: 40px; font-size: 12px; color: #6b7280;">
              Generated on: ${new Date().toLocaleDateString()}<br>
              Duration: ${transcriptionData ? formatTime(transcriptionData.duration) : 'N/A'}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            AI-Generated Summary
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={printSummary}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={exportToText}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Text</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <FileDown className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToWord}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Word</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Topics */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Key Topics
            </h3>
            <ul className="space-y-2">
              {data.keyTopics.map((topic, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-blue-800">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Medications */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Medications Mentioned
            </h3>
            <div className="space-y-3">
              {data.medications.map((medication, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="font-medium text-green-800">{medication.name}</div>
                  {medication.dosage && (
                    <div className="text-sm text-green-600">Dosage: {medication.dosage}</div>
                  )}
                  {medication.frequency && (
                    <div className="text-sm text-green-600">Frequency: {medication.frequency}</div>
                  )}
                  {medication.notes && (
                    <div className="text-sm text-green-600 mt-1">{medication.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Action Items
            </h3>
            <ul className="space-y-2">
              {data.actionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span className="text-purple-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Concerns */}
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
              Patient Concerns
            </h3>
            <ul className="space-y-2">
              {data.patientConcerns.map((concern, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span className="text-orange-800">{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pharmacist Recommendations */}
        <div className="mt-8 bg-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
            Pharmacist Recommendations
          </h3>
          <ul className="space-y-3">
            {data.pharmacistRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start bg-white rounded-lg p-3 border border-indigo-200">
                <span className="text-indigo-500 mr-3 mt-1">•</span>
                <span className="text-indigo-800">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Generated on: {new Date().toLocaleDateString()}
            </div>
            <div>
              Duration: {transcriptionData ? formatTime(transcriptionData.duration) : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 