import axios from 'axios';
import fs from 'fs';

export class HuggingFaceAPI {
  constructor() {
    // Free Hugging Face Inference API endpoints
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.models = {
      speechToText: 'facebook/wav2vec2-base-960h', // Free speech-to-text model
      textAnalysis: 'cardiffnlp/twitter-roberta-base-sentiment-latest', // Free sentiment analysis
      textGeneration: 'gpt2' // Free text generation
    };
    
    // Optional: Add your Hugging Face API token for higher rate limits
    this.apiToken = process.env.HUGGINGFACE_API_TOKEN || null;
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.models.speechToText}`, {
        headers: this.apiToken ? { 'Authorization': `Bearer ${this.apiToken}` } : {}
      });
      return {
        status: 'connected',
        model: this.models.speechToText,
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
    try {
      console.log('🎤 Using Hugging Face for transcription...');
      
      const audioBuffer = fs.readFileSync(audioFilePath);
      
      const response = await axios.post(
        `${this.baseUrl}/${this.models.speechToText}`,
        audioBuffer,
        {
          headers: {
            'Content-Type': 'audio/wav',
            ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
          },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data && response.data.text) {
        console.log('✅ Hugging Face transcription successful');
        return response.data.text;
      } else {
        throw new Error('No transcription result received');
      }
    } catch (error) {
      console.error('❌ Hugging Face transcription error:', error.message);
      throw new Error(`Hugging Face transcription failed: ${error.message}`);
    }
  }

  async analyzeText(text) {
    try {
      console.log('📝 Analyzing text with Hugging Face...');
      
      const response = await axios.post(
        `${this.baseUrl}/${this.models.textAnalysis}`,
        { inputs: text },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const analysis = response.data[0];
        console.log('✅ Hugging Face text analysis successful');
        
        return {
          sentiment: analysis.label,
          confidence: analysis.score,
          text: text,
          model: this.models.textAnalysis
        };
      } else {
        throw new Error('No analysis result received');
      }
    } catch (error) {
      console.error('❌ Hugging Face text analysis error:', error.message);
      throw new Error(`Hugging Face text analysis failed: ${error.message}`);
    }
  }

  async generateText(prompt, maxLength = 50) {
    try {
      console.log('🧠 Generating text with Hugging Face...');
      
      const response = await axios.post(
        `${this.baseUrl}/${this.models.textGeneration}`,
        {
          inputs: prompt,
          parameters: {
            max_length: maxLength,
            num_return_sequences: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiToken && { 'Authorization': `Bearer ${this.apiToken}` })
          }
        }
      );

      if (response.data && response.data.length > 0) {
        console.log('✅ Hugging Face text generation successful');
        return response.data[0].generated_text;
      } else {
        throw new Error('No generation result received');
      }
    } catch (error) {
      console.error('❌ Hugging Face text generation error:', error.message);
      throw new Error(`Hugging Face text generation failed: ${error.message}`);
    }
  }
} 