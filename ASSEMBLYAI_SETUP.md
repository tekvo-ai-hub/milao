# 🎤 AssemblyAI Integration Setup Guide

## 📋 **Overview**
This guide will help you set up AssemblyAI integration with your voice insight guide application using the provided API key.

## 🔑 **API Key**
Your AssemblyAI API Key: 

## 🚀 **Setup Steps**

### **Step 1: Create Environment File**
Create a `.env` file in the root directory of your project:

```bash
# Create .env file
touch .env
```

### **Step 2: Add Environment Variables**
Add the following to your `.env` file:

```env
# AssemblyAI API Configuration
VITE_ASSEMBLYAI_API_KEY=78cb339aa95b49bd9821c013dfda64d8

# Supabase Configuration (if needed for frontend)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Step 3: Restart Development Server**
After creating the `.env` file, restart your development server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

## 🧪 **Testing the Integration**

### **Option 1: Use the Test Component**
Import and use the `AssemblyAITest` component in your app:

```tsx
import { AssemblyAITest } from '@/components/AssemblyAITest';

// In your component or page
<AssemblyAITest />
```

### **Option 2: Use Direct Service**
Import and use the direct AssemblyAI service:

```tsx
import { analyzeAudioWithAssemblyAIDirect } from '@/utils/directAssemblyAIService';

// Usage
const result = await analyzeAudioWithAssemblyAIDirect(audioBlob);
console.log(result.transcript);
console.log(result.sentiment);
console.log(result.summary);
```

## 🔧 **Available Features**

The AssemblyAI integration provides:

- ✅ **Speech-to-Text Transcription**
- ✅ **Sentiment Analysis**
- ✅ **Entity Detection**
- ✅ **Content Categories**
- ✅ **Auto Highlights**
- ✅ **Speaker Labels**
- ✅ **Content Safety**
- ✅ **Summarization**
- ✅ **Confidence Scores**

## 📊 **API Response Structure**

```typescript
interface AssemblyAIAnalysis {
  transcript: string;           // Full transcript text
  confidence: number;           // Overall confidence (0-1)
  summary: string;              // Auto-generated summary
  sentiment: {                  // Sentiment analysis
    sentiment: string;          // POSITIVE/NEGATIVE/NEUTRAL
    confidence: number;         // Confidence score
    text: string;               // Analyzed text
  } | null;
  entities: Array<{             // Named entities
    entity_type: string;        // PERSON, ORGANIZATION, etc.
    text: string;               // Entity text
    start: number;              // Start position
    end: number;                // End position
  }>;
  categories: Record<string, any>;  // Content categories
  highlights: Array<{           // Key highlights
    text: string;               // Highlight text
    count: number;              // Occurrence count
    rank: number;               // Importance rank
  }>;
  speakers: Array<{             // Speaker segmentation
    speaker: string;            // Speaker label
    text: string;               // Speaker's text
    confidence: number;         // Confidence score
    start: number;              // Start time
    end: number;                // End time
  }>;
  contentSafety: Record<string, any>;  // Safety labels
  duration: number;             // Audio duration in seconds
  words: Array<{                // Word-level data
    text: string;               // Word text
    start: number;              // Start time
    end: number;                // End time
    confidence: number;         // Word confidence
  }>;
}
```

## 🛠 **Troubleshooting**

### **Error: "AssemblyAI API key not configured"**
- Make sure your `.env` file exists in the root directory
- Verify the API key is correctly set as `VITE_ASSEMBLYAI_API_KEY`
- Restart your development server after creating the `.env` file

### **Error: "Upload failed"**
- Check your internet connection
- Verify the API key is valid
- Ensure the audio file is not corrupted

### **Error: "Transcription timed out"**
- The audio file might be too long
- Try with a shorter audio clip
- Check AssemblyAI service status

## 🔒 **Security Notes**

- ✅ The API key is only used in the frontend for direct API calls
- ✅ Environment variables with `VITE_` prefix are exposed to the browser
- ⚠️ Consider using the Supabase Edge Functions for production (more secure)
- ⚠️ Never commit your `.env` file to version control

## 📈 **Usage Limits**

- AssemblyAI offers 5 hours of free transcription per month
- Additional usage is charged at $0.25/hour
- Real-time transcription is available for paid plans

## 🎯 **Next Steps**

1. Test the integration with a short audio recording
2. Integrate the service into your existing components
3. Consider implementing error handling and retry logic
4. Add loading states and user feedback
5. Implement caching for better performance

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your API key is correct
3. Test with a simple audio file first
4. Check AssemblyAI's service status page 