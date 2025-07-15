# Voice Insight Guide - Test Server

A test server for free, open-source speech-to-text and text analysis APIs. This server provides multiple API endpoints to test different speech recognition and analysis services without requiring paid API keys.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd test-server
npm install
```

### 2. Start the Server

```bash
npm start
# or for development with auto-restart
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Test the APIs

```bash
npm test
```

## 📡 Available APIs

### Free Speech-to-Text Services

1. **Hugging Face** - Uses Facebook's Wav2Vec2 model
   - Endpoint: `POST /transcribe/huggingface`
   - Free tier available
   - Good accuracy for English speech

2. **Whisper (via Hugging Face)** - OpenAI's Whisper model
   - Endpoint: `POST /transcribe/whisper`
   - Multiple model sizes: base, small, medium, large
   - Excellent accuracy and multilingual support

3. **Coqui** - Open-source speech recognition
   - Endpoint: `POST /transcribe/coqui`
   - Uses Coqui-based models via Hugging Face
   - Good for custom deployments

4. **LibreTranslate** - Translation service
   - Endpoint: `POST /transcribe/libre-translate`
   - Note: This is for translation, not direct speech-to-text
   - Can be combined with other STT services

### Text Analysis Services

1. **Hugging Face Sentiment Analysis**
   - Endpoint: `POST /analyze/text`
   - Uses RoBERTa model for sentiment analysis
   - Provides sentiment labels and confidence scores

## 🔧 API Endpoints

### Health Check
```bash
GET /health
```
Returns server status and available APIs.

### Test All APIs
```bash
GET /test-apis
```
Tests connection to all available APIs.

### Speech-to-Text

#### Individual APIs
```bash
# Hugging Face
curl -X POST http://localhost:3001/transcribe/huggingface \
  -F "audio=@your-audio-file.wav"

# Whisper
curl -X POST http://localhost:3001/transcribe/whisper \
  -F "audio=@your-audio-file.wav"

# Coqui
curl -X POST http://localhost:3001/transcribe/coqui \
  -F "audio=@your-audio-file.wav"
```

#### Batch Transcription
```bash
curl -X POST http://localhost:3001/transcribe/batch \
  -F "audio=@your-audio-file.wav"
```
Tests all transcription APIs simultaneously.

### Text Analysis
```bash
curl -X POST http://localhost:3001/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am very happy with this application!"}'
```

## 🎯 Response Format

### Successful Transcription
```json
{
  "success": true,
  "text": "Hello, this is a test transcription.",
  "api": "whisper",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Successful Text Analysis
```json
{
  "success": true,
  "analysis": {
    "sentiment": "POSITIVE",
    "confidence": 0.9876,
    "text": "I am very happy with this application!",
    "model": "cardiffnlp/twitter-roberta-base-sentiment-latest"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "No audio file provided",
  "api": "whisper",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔑 Optional API Keys

For better rate limits and performance, you can add API keys:

```bash
# Create .env file
HUGGINGFACE_API_TOKEN=your_huggingface_token
LIBRE_TRANSLATE_API_KEY=your_libretranslate_key
LIBRE_TRANSLATE_URL=https://your-libretranslate-instance.com
```

### Getting API Keys

1. **Hugging Face**: 
   - Visit https://huggingface.co/settings/tokens
   - Create a new token
   - Free tier includes generous limits

2. **LibreTranslate**:
   - Use public instances (no key needed)
   - Or host your own instance
   - Or get a key from a hosted service

## 📊 Comparison of APIs

| API | Free Tier | Accuracy | Speed | Multilingual | Notes |
|-----|-----------|----------|-------|--------------|-------|
| Hugging Face | ✅ | Good | Fast | Limited | Good for English |
| Whisper | ✅ | Excellent | Medium | ✅ | Best overall |
| Coqui | ✅ | Good | Fast | Limited | Good for custom models |
| LibreTranslate | ✅ | N/A | N/A | ✅ | Translation only |

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Manual Testing with curl
```bash
# Test health
curl http://localhost:3001/health

# Test APIs
curl http://localhost:3001/test-apis

# Test transcription (replace with your audio file)
curl -X POST http://localhost:3001/transcribe/whisper \
  -F "audio=@test-audio.wav"

# Test text analysis
curl -X POST http://localhost:3001/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test message for sentiment analysis."}'
```

## 🔄 Integration with Your App

To integrate these APIs with your voice insight guide app:

1. **Replace OpenAI Whisper**: Use the Whisper endpoint instead of OpenAI's paid API
2. **Add Fallback Options**: Use multiple APIs for redundancy
3. **Text Analysis**: Use Hugging Face for sentiment analysis
4. **Translation**: Use LibreTranslate for multilingual support

### Example Integration
```javascript
// Test multiple APIs and use the best result
const testTranscription = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  try {
    const response = await fetch('http://localhost:3001/transcribe/batch', {
      method: 'POST',
      body: formData
    });
    
    const results = await response.json();
    
    // Use the first successful result
    for (const [api, result] of Object.entries(results.results)) {
      if (result.success && result.text) {
        return { text: result.text, api };
      }
    }
    
    throw new Error('All transcription APIs failed');
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }
};
```

## 🚨 Limitations

1. **Rate Limits**: Free APIs have rate limits
2. **Audio Format**: Most APIs expect WAV format
3. **File Size**: Large audio files may timeout
4. **Network Dependency**: Requires internet connection
5. **Model Loading**: First request may be slower

## 🔧 Troubleshooting

### Common Issues

1. **Server won't start**: Check if port 3001 is available
2. **API timeouts**: Increase timeout values in the code
3. **Audio format errors**: Convert audio to WAV format
4. **Rate limit errors**: Add API keys or wait between requests

### Debug Mode
```bash
DEBUG=* npm start
```

## 📝 License

MIT License - Feel free to use and modify for your projects.

## 🤝 Contributing

Feel free to add more free APIs or improve the existing ones! 