import axios from 'axios';
import fs from 'fs';

export class LibreTranslateAPI {
  constructor() {
    // LibreTranslate is a free, open-source translation API
    // You can use their public instances or host your own
    this.baseUrl = process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.de';
    this.apiKey = process.env.LIBRE_TRANSLATE_API_KEY || null;
    
    // Note: LibreTranslate doesn't have direct speech-to-text, but we can use it
    // for translation and text processing after getting transcription from other sources
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/languages`);
      return {
        status: 'connected',
        url: this.baseUrl,
        languages: response.data.length,
        available: true
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
    // LibreTranslate doesn't support speech-to-text directly
    // This is a placeholder that would need to be combined with another service
    throw new Error('LibreTranslate does not support speech-to-text directly. Use for translation instead.');
  }

  async translate(text, sourceLang = 'auto', targetLang = 'en') {
    try {
      console.log('🌐 Translating with LibreTranslate...');
      
      const payload = {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      };

      if (this.apiKey) {
        payload.api_key = this.apiKey;
      }

      const response = await axios.post(`${this.baseUrl}/translate`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.translatedText) {
        console.log('✅ LibreTranslate translation successful');
        return {
          originalText: text,
          translatedText: response.data.translatedText,
          sourceLanguage: response.data.detectedLanguage?.confidence ? response.data.detectedLanguage.language : sourceLang,
          targetLanguage: targetLang,
          confidence: response.data.detectedLanguage?.confidence || null
        };
      } else {
        throw new Error('No translation result received');
      }
    } catch (error) {
      console.error('❌ LibreTranslate translation error:', error.message);
      throw new Error(`LibreTranslate translation failed: ${error.message}`);
    }
  }

  async getLanguages() {
    try {
      const response = await axios.get(`${this.baseUrl}/languages`);
      return response.data;
    } catch (error) {
      console.error('❌ LibreTranslate languages error:', error.message);
      throw new Error(`Failed to get languages: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    try {
      console.log('🔍 Detecting language with LibreTranslate...');
      
      const payload = {
        q: text
      };

      if (this.apiKey) {
        payload.api_key = this.apiKey;
      }

      const response = await axios.post(`${this.baseUrl}/detect`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.length > 0) {
        console.log('✅ LibreTranslate language detection successful');
        return response.data[0];
      } else {
        throw new Error('No language detection result received');
      }
    } catch (error) {
      console.error('❌ LibreTranslate language detection error:', error.message);
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }
} 