import { supabase } from '@/integrations/supabase/client'

export const transcribeAudioWithAPI = async (audioBlob: Blob): Promise<string> => {
  console.log('🎯 Starting cloud transcription...')
  
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer()
  const base64Audio = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  )

  try {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audio: base64Audio }
    })

    if (error) {
      console.error('Transcription API error:', error)
      throw new Error(`Transcription failed: ${error.message}`)
    }

    if (!data?.text) {
      throw new Error('No transcription text received')
    }

    console.log('✅ Cloud transcription completed')
    return data.text
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}