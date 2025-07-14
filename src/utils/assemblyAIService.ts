import { supabase } from '@/integrations/supabase/client'

export interface AssemblyAIAnalysis {
  transcript: string;
  confidence: number;
  summary: string;
  sentiment: {
    sentiment: string;
    confidence: number;
    text: string;
  } | null;
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

export const analyzeAudioWithAssemblyAI = async (audioBlob: Blob): Promise<AssemblyAIAnalysis> => {
  console.log('🎯 Starting AssemblyAI analysis...')
  
  try {
    // Convert blob to base64 in chunks to prevent stack overflow
    const arrayBuffer = await audioBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Process in chunks to avoid "Maximum call stack size exceeded"
    let binaryString = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode(...chunk)
    }
    
    const base64Audio = btoa(binaryString)

    const { data, error } = await supabase.functions.invoke('analyze-speech-assemblyai', {
      body: { audio: base64Audio }
    })

    if (error) {
      console.error('AssemblyAI API error:', error)
      throw new Error(`AssemblyAI analysis failed: ${error.message}`)
    }

    if (!data?.transcript) {
      throw new Error('No transcript received from AssemblyAI')
    }

    console.log('✅ AssemblyAI analysis completed')
    return data as AssemblyAIAnalysis
  } catch (error) {
    console.error('AssemblyAI analysis error:', error)
    throw error
  }
}