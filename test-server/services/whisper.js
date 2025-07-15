import axios from 'axios';
import fs from 'fs';

export class WhisperAPI {
  constructor() {
    // Use OpenAI's Whisper model via Hugging Face (free)
    this.model = 'openai/whisper-base'; // Free model
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.apiKey = process.env.HUGGINGFACE_API_TOKEN || null;
    
    // Alternative models
    this.models = {
      base: 'openai/whisper-base',
      small: 'openai/whisper-small',
      medium: 'openai/whisper-medium',
      large: 'openai/whisper-large'
    };
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.model}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });
      
      return {
        status: 'connected',
        model: this.model,
        available: true,
        note: 'Using OpenAI Whisper via Hugging Face (free)'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        available: false
      };
    }
  }

  async transcribe(audioFilePath, modelSize = 'base') {
    try {
      console.log(`🎤 Using Whisper ${modelSize} for transcription...`);
      
      const audioBuffer = fs.readFileSync(audioFilePath);
      const selectedModel = this.models[modelSize] || this.models.base;
      
      const response = await axios.post(
        `${this.baseUrl}/${selectedModel}`,
        audioBuffer,
        {
          headers: {
            'Content-Type': 'audio/wav',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 60000 // 60 second timeout for larger models
        }
      );

      if (response.data && response.data.text) {
        console.log(`✅ Whisper ${modelSize} transcription successful`);
        return response.data.text;
      } else {
        throw new Error('No transcription result received');
      }
    } catch (error) {
      console.error(`❌ Whisper ${modelSize} transcription error:`, error.message);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  async transcribeWithOptions(audioFilePath, options = {}) {
    try {
      console.log('🎤 Using Whisper with custom options...');
      
      const audioBuffer = fs.readFileSync(audioFilePath);
      const modelSize = options.modelSize || 'base';
      const selectedModel = this.models[modelSize] || this.models.base;
      
      const requestOptions = {
        inputs: audioBuffer,
        parameters: {
          language: options.language || 'en',
          task: options.task || 'transcribe', // 'transcribe' or 'translate'
          return_timestamps: options.returnTimestamps || false,
          chunk_length_s: options.chunkLength || 30
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${selectedModel}`,
        requestOptions,
        {
          headers: {
            'Content-Type': 'audio/wav',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 60000
        }
      );

      if (response.data) {
        console.log('✅ Whisper transcription with options successful');
        return response.data;
      } else {
        throw new Error('No transcription result received');
      }
    } catch (error) {
      console.error('❌ Whisper transcription with options error:', error.message);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  async getAvailableModels() {
    return Object.entries(this.models).map(([size, model]) => ({
      size,
      model,
      description: `Whisper ${size} model`,
      free: true
    }));
  }

  async getModelInfo(modelSize = 'base') {
    try {
      const selectedModel = this.models[modelSize] || this.models.base;
      const response = await axios.get(`${this.baseUrl}/${selectedModel}`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });
      
      return {
        model: selectedModel,
        size: modelSize,
        info: response.data,
        free: true
      };
    } catch (error) {
      console.error('❌ Whisper model info error:', error.message);
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }
} 