import { freeSpeechService, type SpeechAnalysisResult } from '@/services/freeSpeechService';

// Integration utility to replace your current paid APIs
export class FreeSpeechIntegration {
  
  // Replace your current transcribeAudioWithAPI function
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('🎤 Using free speech-to-text service...');
      const result = await freeSpeechService.transcribeAudio(audioBlob);
      console.log(`✅ Transcription completed with ${result.api}`);
      return result.text;
    } catch (error) {
      console.error('❌ Free transcription failed:', error);
      throw error;
    }
  }

  // Replace your current analyzeAudioWithAssemblyAI function
  static async analyzeAudio(audioBlob: Blob, userId?: string): Promise<SpeechAnalysisResult> {
    try {
      console.log('🎯 Using free speech analysis service...');
      const result = await freeSpeechService.analyzeSpeech(audioBlob);
      console.log(`✅ Analysis completed with ${result.api}`);
      return result;
    } catch (error) {
      console.error('❌ Free analysis failed:', error);
      throw error;
    }
  }

  // Test all available APIs
  static async testAPIs(): Promise<Record<string, any>> {
    try {
      const results = await freeSpeechService.testAPIs();
      console.log('✅ API test results:', results);
      return results;
    } catch (error) {
      console.error('❌ API test failed:', error);
      return {};
    }
  }

  // Get API status
  static async getAPIStatus() {
    try {
      const status = await freeSpeechService.getAPIStatus();
      console.log('✅ API status:', status);
      return status;
    } catch (error) {
      console.error('❌ Failed to get API status:', error);
      return {
        local: false,
        cloud: false,
        availableApis: []
      };
    }
  }

  // Batch transcription for comparison
  static async transcribeBatch(audioBlob: Blob): Promise<Record<string, any>> {
    try {
      console.log('🔄 Running batch transcription...');
      const results = await freeSpeechService.transcribeBatch(audioBlob);
      console.log('✅ Batch transcription results:', results);
      return results;
    } catch (error) {
      console.error('❌ Batch transcription failed:', error);
      throw error;
    }
  }
}

// Migration helper to replace your existing functions
export const migrateToFreeAPIs = {
  // Replace transcribeAudioWithAPI
  transcribeAudioWithAPI: FreeSpeechIntegration.transcribeAudio,
  
  // Replace analyzeAudioWithAssemblyAI
  analyzeAudioWithAssemblyAI: FreeSpeechIntegration.analyzeAudio,
  
  // Test APIs before migration
  testAPIs: FreeSpeechIntegration.testAPIs,
  
  // Get current API status
  getAPIStatus: FreeSpeechIntegration.getAPIStatus
};

// Example usage in your existing components:
/*
// Replace this:
import { transcribeAudioWithAPI } from '@/utils/speechTranscriptionAPI';
const text = await transcribeAudioWithAPI(audioBlob);

// With this:
import { migrateToFreeAPIs } from '@/utils/freeSpeechIntegration';
const text = await migrateToFreeAPIs.transcribeAudioWithAPI(audioBlob);

// Replace this:
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
const analysis = await analyzeAudioWithAssemblyAI(audioBlob, userId);

// With this:
import { migrateToFreeAPIs } from '@/utils/freeSpeechIntegration';
const analysis = await migrateToFreeAPIs.analyzeAudioWithAssemblyAI(audioBlob, userId);
*/ 