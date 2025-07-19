# Pharmacy AI Summarizer

A comprehensive web application for recording, transcribing, and summarizing pharmacy consultations using AI. Built with Next.js 14, TypeScript, and OpenAI's Whisper and GPT-4 APIs.

## Features

### 🎤 Audio Recording
- Live audio recording with real-time visualization
- Support for audio file uploads (MP3, WAV, M4A, WebM, OGG)
- High-quality audio capture optimized for speech recognition
- Recording timer and audio level indicators

### 📝 AI Transcription
- **Multiple Provider Support**: Choose between OpenAI Whisper and Google Speech-to-Text
- OpenAI Whisper integration for accurate speech-to-text
- Google Speech-to-Text with 60 minutes free per month
- Automatic speaker identification (Pharmacist vs Patient)
- Timestamp generation for each speech segment
- Interactive transcript editing and correction

### 🧠 AI-Powered Summarization
- GPT-4 powered intelligent summaries
- Pharmacy-specific entity detection:
  - Medication names and dosages
  - Side effects and allergies
  - Drug interactions
  - Patient concerns
  - Pharmacist recommendations
- Structured output with key topics and action items

### 📊 Professional Summary View
- Color-coded sections for different information types
- Medication details with dosage and frequency
- Action items and follow-up tasks
- Patient concerns and pharmacist recommendations
- Multiple export formats (PDF, Word, Text, Print)

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Services**: OpenAI Whisper, GPT-4
- **Icons**: Lucide React
- **File Handling**: React Dropzone
- **Export**: jsPDF, docx
- **Utilities**: clsx, tailwind-merge

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key (optional - can use Google Speech-to-Text instead)
- Google Cloud API key (optional - can use OpenAI Whisper instead)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pharmacy-ai-summarizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording a Consultation

1. **Start Recording**: Click the "Start Recording" button to begin capturing audio
2. **Monitor Audio Levels**: Watch the real-time audio visualization
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Upload Alternative**: Drag and drop an audio file instead of recording

### Transcribing Audio

1. **Process Audio**: Click "Transcribe Audio" to send to OpenAI Whisper
2. **Review Transcript**: View the generated transcript with speaker identification
3. **Edit if Needed**: Make corrections to the transcript text
4. **Generate Summary**: Click "Generate Summary" to create AI summary

### Viewing Summary

1. **Review Sections**: Check key topics, medications, and recommendations
2. **Export Options**: Download as PDF, Word document, or text file
3. **Print**: Use the print function for physical copies
4. **Copy**: Copy summary text to clipboard

## API Endpoints

### POST /api/transcribe
Transcribes audio files using OpenAI Whisper.

**Request**: FormData with audio file
**Response**: JSON with transcript text and speaker segments

### POST /api/summarize
Generates AI-powered summaries using GPT-4.

**Request**: JSON with transcript text
**Response**: Structured summary with pharmacy-specific sections

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page
│   └── api/
│       ├── transcribe/     # Transcription API
│       └── summarize/      # Summarization API
├── components/
│   ├── AudioRecorder.tsx   # Audio recording component
│   ├── TranscriptionView.tsx # Transcript display/editing
│   └── SummaryView.tsx     # Summary display/export
└── lib/
    └── utils.ts            # Utility functions
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4)
- `OPENAI_TEMPERATURE`: Model temperature (default: 0.3)
- `OPENAI_MAX_TOKENS`: Maximum tokens for responses (default: 2000)

### Audio Settings

- Sample Rate: 16kHz
- Channels: Mono
- Format: WebM with Opus codec
- Max File Size: 50MB

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Security Considerations

- Audio files are processed in memory and not stored permanently
- OpenAI API calls are made server-side
- No sensitive data is logged or stored
- Consider HIPAA compliance for production use in healthcare settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] Real-time transcription during recording
- [ ] Multi-language support
- [ ] Custom medication database integration
- [ ] HIPAA compliance features
- [ ] Mobile app version
- [ ] Integration with pharmacy management systems
