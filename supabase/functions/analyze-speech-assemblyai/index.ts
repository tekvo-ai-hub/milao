import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
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

// Upload audio to AssemblyAI
async function uploadAudio(audioData: Uint8Array): Promise<string> {
  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY!,
      'content-type': 'application/octet-stream',
    },
    body: audioData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${await response.text()}`);
  }

  const { upload_url } = await response.json();
  return upload_url;
}

// Submit transcription request
async function submitTranscription(uploadUrl: string): Promise<string> {
  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      speech_model: 'best',
      language_code: 'en_us',
      punctuate: true,
      format_text: true,
      disfluencies: true,
      // Enable speech analysis features
      speaker_labels: true,
      sentiment_analysis: true,
      entity_detection: true,
      iab_categories: true,
      content_safety: true,
      auto_highlights: true,
      summarization: true,
      summary_model: 'informative',
      summary_type: 'bullets',
    }),
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed: ${await response.text()}`);
  }

  const { id } = await response.json();
  return id;
}

// Poll for transcription completion
async function pollTranscription(transcriptId: string): Promise<any> {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Polling failed: ${await response.text()}`);
    }

    const result = await response.json();
    
    if (result.status === 'completed') {
      return result;
    } else if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Transcription timed out');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('AssemblyAI API key not configured');
    }

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio with AssemblyAI...');
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Upload audio to AssemblyAI
    const uploadUrl = await uploadAudio(binaryAudio);
    console.log('Audio uploaded successfully');
    
    // Submit transcription request
    const transcriptId = await submitTranscription(uploadUrl);
    console.log('Transcription submitted:', transcriptId);
    
    // Poll for completion
    const result = await pollTranscription(transcriptId);
    console.log('Transcription completed');

    // Extract key insights
    const analysis = {
      transcript: result.text,
      confidence: result.confidence,
      summary: result.summary,
      sentiment: result.sentiment_analysis_results?.[0] || null,
      entities: result.entities || [],
      categories: result.iab_categories_result || {},
      highlights: result.auto_highlights_result || [],
      speakers: result.utterances?.map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
        confidence: u.confidence,
        start: u.start,
        end: u.end,
      })) || [],
      contentSafety: result.content_safety_labels || {},
      duration: result.audio_duration,
      words: result.words || [],
    };

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('AssemblyAI error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});