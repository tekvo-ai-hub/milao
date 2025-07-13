import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 Received transcription request');
    
    // Check if OpenAI API key exists
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }
    console.log('✅ OpenAI API key found');

    const { audio } = await req.json();
    
    if (!audio) {
      console.error('❌ No audio data provided in request');
      throw new Error('No audio data provided');
    }
    
    console.log('📊 Audio data received, length:', audio.length);

    try {
      // Process audio in chunks
      console.log('🔄 Processing audio chunks...');
      const binaryAudio = processBase64Chunks(audio);
      console.log('✅ Audio processing complete, binary size:', binaryAudio.length);
      
      // Prepare form data
      const formData = new FormData();
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      console.log('🚀 Sending request to OpenAI...');

      // Send to OpenAI Whisper
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      console.log('📡 OpenAI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', errorText);
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Transcription completed successfully');

      return new Response(
        JSON.stringify({ 
          text: result.text,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('❌ Audio processing error:', processingError);
      throw new Error(`Audio processing failed: ${processingError.message}`);
    }

  } catch (error) {
    console.error('💥 Transcription error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});