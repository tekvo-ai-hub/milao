// Example client integration for your voice insight guide app
// This shows how to use the test server APIs instead of paid services

class TestServerClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  // Test server health
  async checkHealth() {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      const data = await response.json();
      console.log('✅ Server health:', data);
      return data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  // Test all available APIs
  async testAPIs() {
    try {
      const response = await fetch(`${this.serverUrl}/test-apis`);
      const data = await response.json();
      console.log('✅ API test results:', data);
      return data.results;
    } catch (error) {
      console.error('❌ API test failed:', error);
      throw error;
    }
  }

  // Transcribe audio using a specific API
  async transcribeAudio(audioBlob, api = 'whisper') {
    try {
      console.log(`🎤 Transcribing with ${api}...`);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch(`${this.serverUrl}/transcribe/${api}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${api} transcription successful:`, data.text);
        return {
          text: data.text,
          api: data.api,
          timestamp: data.timestamp
        };
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(`❌ ${api} transcription failed:`, error);
      throw error;
    }
  }

  // Try multiple APIs and return the best result
  async transcribeWithFallback(audioBlob, preferredApis = ['whisper', 'huggingface', 'coqui']) {
    console.log('🔄 Trying multiple APIs for transcription...');
    
    for (const api of preferredApis) {
      try {
        const result = await this.transcribeAudio(audioBlob, api);
        console.log(`✅ Success with ${api}:`, result.text);
        return result;
      } catch (error) {
        console.warn(`⚠️ ${api} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('All transcription APIs failed');
  }

  // Batch transcription - try all APIs simultaneously
  async transcribeBatch(audioBlob) {
    try {
      console.log('🔄 Running batch transcription...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch(`${this.serverUrl}/transcribe/batch`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Batch transcription results:', data.results);
        return data.results;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Batch transcription failed:', error);
      throw error;
    }
  }

  // Analyze text sentiment
  async analyzeText(text) {
    try {
      console.log('📝 Analyzing text sentiment...');
      
      const response = await fetch(`${this.serverUrl}/analyze/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Text analysis successful:', data.analysis);
        return data.analysis;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Text analysis failed:', error);
      throw error;
    }
  }

  // Complete speech analysis pipeline
  async analyzeSpeech(audioBlob) {
    try {
      console.log('🎯 Starting complete speech analysis...');
      
      // Step 1: Transcribe audio
      const transcription = await this.transcribeWithFallback(audioBlob);
      
      // Step 2: Analyze the transcribed text
      const analysis = await this.analyzeText(transcription.text);
      
      // Step 3: Return comprehensive results
      return {
        transcription: transcription,
        analysis: analysis,
        summary: {
          text: transcription.text,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          api: transcription.api,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Speech analysis failed:', error);
      throw error;
    }
  }
}

// Example usage
async function exampleUsage() {
  const client = new TestServerClient();
  
  try {
    // Check server health
    await client.checkHealth();
    
    // Test all APIs
    const apiResults = await client.testAPIs();
    console.log('Available APIs:', apiResults);
    
    // Example: Create a test audio blob (in real usage, this would be from recording)
    const testText = "Hello, this is a test of the speech analysis system.";
    const testBlob = new Blob([testText], { type: 'text/plain' }); // Placeholder
    
    // Analyze speech (replace with real audio blob)
    // const analysis = await client.analyzeSpeech(testBlob);
    // console.log('Speech analysis result:', analysis);
    
    // Test text analysis
    const textAnalysis = await client.analyzeText("I am very happy with this application!");
    console.log('Text analysis:', textAnalysis);
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Export for use in your main app
export { TestServerClient };

// Run example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.TestServerClient = TestServerClient;
} else {
  // Node.js environment
  exampleUsage().catch(console.error);
} 