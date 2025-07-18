import { LocalAIService } from './aiService';

export interface FreeSpeechResult {
  text: string;
  confidence: number;
  api: string;
  processingTime: number;
  fallbackUsed: boolean;
}

export interface SpeechAnalysisResult {
  transcript: string;
  sentiment: {
    label: string;
    score: number;
  };
  summary: string;
  keywords: string[];
  language: string;
  duration: number;
  wordCount: number;
  api: string;
}

class FreeSpeechService {
  private localAI: LocalAIService;
  private testServerUrl: string;
  private isLocalAvailable: boolean = false;

  constructor(testServerUrl: string = 'http://localhost:3001') {
    this.localAI = LocalAIService.getInstance();
    this.testServerUrl = testServerUrl;
    this.initializeLocalAI();
  }

  private async initializeLocalAI() {
    try {
      await this.localAI.loadModel('whisper-tiny');
      this.isLocalAvailable = true;
      console.log('✅ Local Whisper model loaded');
    } catch (error) {
      console.warn('⚠️ Local Whisper not available, will use cloud APIs');
      this.isLocalAvailable = false;
    }
  }

  // Main transcription method with intelligent fallback
  async transcribeAudio(audioBlob: Blob): Promise<FreeSpeechResult> {
    const startTime = Date.now();
    
    // Try local first (fastest and free)
    if (this.isLocalAvailable) {
      try {
        console.log('🎤 Attempting local transcription...');
        const text = await this.localAI.transcribeAudio(audioBlob);
        return {
          text,
          confidence: 0.85, // Local models don't provide confidence
          api: 'local-whisper',
          processingTime: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        console.warn('⚠️ Local transcription failed, trying cloud APIs:', error);
      }
    }

    // Try free cloud APIs in order of preference
    const apis = ['whisper', 'huggingface', 'coqui'];
    
    for (const api of apis) {
      try {
        console.log(`🎤 Trying ${api} transcription...`);
        const result = await this.transcribeWithAPI(audioBlob, api);
        return {
          ...result,
          processingTime: Date.now() - startTime,
          fallbackUsed: true
        };
      } catch (error) {
        console.warn(`⚠️ ${api} failed, trying next...`, error);
        continue;
      }
    }

    throw new Error('All transcription APIs failed');
  }

  // Transcribe with specific API
  private async transcribeWithAPI(audioBlob: Blob, api: string): Promise<Omit<FreeSpeechResult, 'processingTime' | 'fallbackUsed'>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${this.testServerUrl}/transcribe/${api}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`${api} API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }

    return {
      text: data.text,
      confidence: 0.8, // Default confidence for cloud APIs
      api: data.api
    };
  }

  // Batch transcription - try all APIs simultaneously
  async transcribeBatch(audioBlob: Blob): Promise<Record<string, any>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${this.testServerUrl}/transcribe/batch`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Batch transcription failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.results;
  }

  // Complete speech analysis pipeline
  async analyzeSpeech(audioBlob: Blob): Promise<SpeechAnalysisResult> {
    console.log('🎯 Starting free speech analysis...');
    
    // Step 1: Transcribe
    const transcription = await this.transcribeAudio(audioBlob);
    
    // Step 2: Analyze text
    const analysis = await this.analyzeText(transcription.text);
    
    // Step 3: Generate summary
    const summary = await this.generateSummary(transcription.text);
    
    // Step 4: Extract keywords
    const keywords = this.extractKeywords(transcription.text);
    
    // Step 5: Detect language
    const language = await this.detectLanguage(transcription.text);
    
    // Step 6: Calculate metrics
    const wordCount = transcription.text.split(' ').length;
    const duration = await this.getAudioDuration(audioBlob);

    return {
      transcript: transcription.text,
      sentiment: analysis.sentiment,
      summary,
      keywords,
      language,
      duration,
      wordCount,
      api: transcription.api
    };
  }

  // Text analysis using free APIs
  private async analyzeText(text: string): Promise<{ sentiment: { label: string; score: number } }> {
    try {
      const response = await fetch(`${this.testServerUrl}/analyze/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Text analysis failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      return {
        sentiment: {
          label: data.analysis.sentiment,
          score: data.analysis.confidence
        }
      };
    } catch (error) {
      console.warn('Text analysis failed, using fallback:', error);
      return {
        sentiment: {
          label: 'NEUTRAL',
          score: 0.5
        }
      };
    }
  }

  // Generate summary using local AI
  private async generateSummary(text: string): Promise<string> {
    try {
      if (this.localAI.isModelLoaded('distilgpt2')) {
        const summary = await this.localAI.generateText(
          `Summarize this text in one sentence: ${text}`
        );
        return summary;
      }
    } catch (error) {
      console.warn('Local summary generation failed:', error);
    }

    // Fallback: simple summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim() || text.substring(0, 100) + '...';
  }

  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  // Detect language using free API
  private async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.testServerUrl}/detect-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const data = await response.json();
        return data.language || 'en';
      }
    } catch (error) {
      console.warn('Language detection failed:', error);
    }

    return 'en'; // Default to English
  }

  // Get audio duration
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  // Test all available APIs
  async testAPIs(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.testServerUrl}/test-apis`);
      const data = await response.json();
      return data.results || {};
    } catch (error) {
      console.error('API test failed:', error);
      return {};
    }
  }

  // Get API status
  async getAPIStatus(): Promise<{
    local: boolean;
    cloud: boolean;
    availableApis: string[];
  }> {
    const cloudAPIs = await this.testAPIs();
    const availableApis = Object.keys(cloudAPIs).filter(api => 
      cloudAPIs[api]?.available
    );

    return {
      local: this.isLocalAvailable,
      cloud: availableApis.length > 0,
      availableApis
    };
  }
}

// Export singleton instance
export const freeSpeechService = new FreeSpeechService(); 