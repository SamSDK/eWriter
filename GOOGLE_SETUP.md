# Google Speech-to-Text Setup Guide

## 🚀 Quick Setup for Google Speech-to-Text

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need this later)

### Step 2: Enable Speech-to-Text API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Speech-to-Text API"
3. Click on it and press **Enable**

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key (starts with `AIza...`)

### Step 4: Configure Billing (Required)
1. Go to **Billing** in Google Cloud Console
2. Link a billing account to your project
3. **Important**: Google Speech-to-Text requires billing to be enabled, even for free tier

### Step 5: Set Environment Variables
Add your Google API key to `.env.local`:
```env
GOOGLE_API_KEY=AIza_your_actual_api_key_here
```

### Step 6: Configure in App
1. Open the app and click the **Settings** button (gear icon)
2. Select **Google Speech-to-Text** as your provider
3. Enter your Google Cloud API Key
4. Enter your Project ID
5. Select your preferred language
6. Click **Save Settings**

## 💰 Pricing & Free Tier

### Google Speech-to-Text Pricing:
- **Free Tier**: 60 minutes per month
- **Paid**: $0.006 per minute after free tier
- **No credit card required** for free tier (but billing must be enabled)

### Comparison with OpenAI:
| Feature | OpenAI Whisper | Google Speech-to-Text |
|---------|----------------|----------------------|
| Free Tier | $5 credit/month | 60 minutes/month |
| Paid Rate | $0.006/minute | $0.006/minute |
| Accuracy | High | High |
| Languages | 99+ | 120+ |
| Setup | API key only | Project + API key |

## 🔧 Troubleshooting

### Common Issues:

1. **"API key is invalid"**
   - Make sure you copied the full API key
   - Check that Speech-to-Text API is enabled

2. **"Billing not enabled"**
   - Enable billing in Google Cloud Console
   - Free tier still requires billing to be set up

3. **"Quota exceeded"**
   - Check your usage in Google Cloud Console
   - Free tier resets monthly

4. **"Invalid audio format"**
   - Supported formats: MP3, WAV, M4A, WebM, OGG
   - Try converting your audio to a supported format

### Getting Help:
- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Billing Setup Guide](https://cloud.google.com/billing/docs/how-to/modify-project)

## 🎯 Why Choose Google Speech-to-Text?

### Advantages:
- ✅ **Generous free tier** (60 minutes/month)
- ✅ **Excellent accuracy** for medical terminology
- ✅ **Multiple language support**
- ✅ **Word-level timestamps**
- ✅ **Automatic punctuation**

### Perfect for:
- Pharmacy consultations
- Medical transcriptions
- Multi-language support
- Cost-effective transcription

## 🔄 Switching Between Providers

You can easily switch between OpenAI and Google:
1. Open **Settings**
2. Choose your preferred provider
3. Configure the API keys
4. Save and start transcribing

Both providers will give you the same high-quality results with speaker identification and pharmacy-specific features! 