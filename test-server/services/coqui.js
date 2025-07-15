import axios from 'axios';
import fs from 'fs';

export class CoquiAPI {
  constructor() {
    // Coqui TTS/STT is an open-source speech synthesis and recognition library
    // We'll use their hosted API or local models
    this.baseUrl = process.env.COQUI_API_URL || 'https://api.coqui.ai';
    this.apiKey = process.env.COQUI_API_KEY || null;
    
    // Alternative: Use Hugging Face models that are Coqui-based
    this.huggingFaceModel = 'facebook/wav2vec2-large-xlsr-53-english';
  }

  async testConnection() {
    try {
      // Test with Hugging Face Coqui-based model
      const response = await axios.get(`https://api-inference.huggingface.co/models/${this.huggingFaceModel}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });
      
      return {
        status: 'connected',
        model: this.huggingFaceModel,
        available: true,
        note: 'Using Hugging Face hosted Coqui-based model'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        available: false
      };
    }
  }

  async transcribe(audioFilePath) {
    try {
      console.log('🎤 Using Coqui (via Hugging Face) for transcription...');
      
      const audioBuffer = fs.readFileSync(audioFilePath);
      
      // Use Hugging Face's hosted Coqui-based model
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.huggingFaceModel}`,
        audioBuffer,
        {
          headers: {
            'Content-Type': 'audio/wav',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.text) {
        console.log('✅ Coqui transcription successful');
        return response.data.text;
      } else {
        throw new Error('No transcription result received');
      }
    } catch (error) {
      console.error('❌ Coqui transcription error:', error.message);
      throw new Error(`Coqui transcription failed: ${error.message}`);
    }
  }

  async synthesizeSpeech(text, voice = 'en_vctk') {
    try {
      console.log('🔊 Synthesizing speech with Coqui...');
      
      // Use Coqui TTS model via Hugging Face
      const ttsModel = 'facebook/fastspeech2-en-ljspeech';
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${ttsModel}`,
        { inputs: text },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          responseType: 'arraybuffer'
        }
      );

      if (response.data) {
        console.log('✅ Coqui speech synthesis successful');
        return response.data; // Returns audio buffer
      } else {
        throw new Error('No synthesis result received');
      }
    } catch (error) {
      console.error('❌ Coqui speech synthesis error:', error.message);
      throw new Error(`Coqui speech synthesis failed: ${error.message}`);
    }
  }

  async getAvailableVoices() {
    try {
      // Return common Coqui TTS voices
      return [
        { id: 'en_vctk', name: 'English VCTK', language: 'en' },
        { id: 'en_ljspeech', name: 'English LJSpeech', language: 'en' },
        { id: 'en_common_voice', name: 'English Common Voice', language: 'en' }
      ];
    } catch (error) {
      console.error('❌ Coqui voices error:', error.message);
      throw new Error(`Failed to get voices: ${error.message}`);
    }
  }
} 