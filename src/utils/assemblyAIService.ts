import { supabase } from '@/integrations/supabase/client'
import type { PersonalizedAnalysis } from '@/types/speechAnalysis'

export interface AssemblyAIAnalysis {
  transcript: string;
  confidence: number;
  summary: string;
  sentiment: {
    sentiment: string;
    confidence: number;
    text: string;
  } | null;
  personalizedAnalysis?: PersonalizedAnalysis;
  entities: Array<{
    entity_type: string;
    text: string;
    start: number;
    end: number;
  }>;
  categories: Record<string, any>;
  highlights: Array<{
    text: string;
    count: number;
    rank: number;
  }>;
  speakers: Array<{
    speaker: string;
    text: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  contentSafety: Record<string, any>;
  duration: number;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export const analyzeAudioWithAssemblyAI = async (audioBlob: Blob, userId?: string): Promise<AssemblyAIAnalysis> => {
  console.log('🎯 Starting AssemblyAI analysis...')
  
  try {
    // Use FileReader for efficient base64 conversion
    console.log('🔄 Converting audio to base64...')
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = result.split(',')[1]
        console.log('✅ Base64 conversion completed')
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to convert audio to base64'))
      reader.readAsDataURL(audioBlob)
    })

    console.log('🔄 Calling Supabase function...')
    
    // Add timeout protection for Supabase function call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase function timeout after 60 seconds')), 60000);
    });
    
    const functionPromise = supabase.functions.invoke('analyze-speech-with-preferences', {
      body: { 
        audio: base64Audio,
        userId: userId
      }
    });
    
    const { data, error } = await Promise.race([functionPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ AssemblyAI API error:', error)
      throw new Error(`AssemblyAI analysis failed: ${error.message}`)
    }

    if (!data?.transcript) {
      console.error('❌ No transcript received from AssemblyAI')
      throw new Error('No transcript received from AssemblyAI')
    }

    console.log('✅ AssemblyAI analysis completed successfully')
    return data as AssemblyAIAnalysis
  } catch (error) {
    console.error('❌ AssemblyAI analysis error:', error)
    throw error
  }
}