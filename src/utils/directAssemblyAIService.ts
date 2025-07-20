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

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
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
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured. Please set VITE_ASSEMBLYAI_API_KEY in your .env file.');
  }

  console.log('🔍 Uploading audio to AssemblyAI...');
  console.log('🔍 Audio data size:', audioData.length, 'bytes');

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/octet-stream',
    },
    body: audioData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ AssemblyAI upload failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(`Upload failed: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Upload successful, upload_url:', result.upload_url);
  return result.upload_url;
}

// Submit transcription request
async function submitTranscription(uploadUrl: string): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured');
  }

  const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
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

// Poll for transcription completion with better timing
async function pollTranscription(transcriptId: string): Promise<any> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured');
  }

  const maxAttempts = 30; // Reduced from 60
  let attempts = 0;
  let delay = 2000; // Start with 2 seconds

  console.log(`🔄 Starting to poll transcription ${transcriptId}...`);

  while (attempts < maxAttempts) {
    console.log(`🔄 Polling attempt ${attempts + 1}/${maxAttempts} (${delay}ms delay)...`);
    
    const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Polling failed: ${await response.text()}`);
    }

    const result = await response.json();
    
    if (result.status === 'completed') {
      console.log(`✅ Transcription completed in ${attempts + 1} attempts`);
      return result;
    } else if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    } else if (result.status === 'processing') {
      console.log(`⏳ Still processing... (${result.audio_duration || 'unknown'} seconds)`);
    }

    // Adaptive delay: increase delay gradually but cap at 10 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.2, 10000); // Increase by 20% but max 10s
    attempts++;
  }

  throw new Error(`Transcription timed out after ${maxAttempts} attempts`);
}

export const analyzeAudioWithAssemblyAIDirect = async (audioBlob: Blob): Promise<AssemblyAIAnalysis> => {
  console.log('🎯 Starting direct AssemblyAI analysis...')
  
  try {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('AssemblyAI API key not configured. Please set VITE_ASSEMBLYAI_API_KEY in your .env file.');
    }

    console.log('🔄 Processing audio for AssemblyAI...');
    console.log('Audio info:', { size: audioBlob.size, type: audioBlob.type });
    
    // Check if audio blob is empty or too small
    if (audioBlob.size < 1000) {
      console.error('❌ Audio blob is too small:', audioBlob.size, 'bytes');
      throw new Error('Audio recording is too small or empty. Please try recording again.');
    }

    // Try to use original format first, especially for WebM
    let processedBlob = audioBlob;
    
    // AssemblyAI supports: mp3, mp4, m4a, wav, flac, aac, ogg, webm, wma
    const supportedTypes = ['audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/wma'];
    
    // Check if original format is supported
    if (supportedTypes.includes(audioBlob.type)) {
      console.log('✅ Using original format:', audioBlob.type);
      
      // Test original audio data quality
      const testArrayBuffer = await audioBlob.arrayBuffer();
      const testUint8Array = new Uint8Array(testArrayBuffer);
      const nonZeroBytes = testUint8Array.filter(byte => byte !== 0).length;
      
      if (nonZeroBytes > 1000) {
        processedBlob = audioBlob;
      } else {
        console.warn('⚠️ Audio data insufficient, attempting conversion...');
      }
    } else {
      console.log('⚠️ Format not in supported list, trying anyway');
    }
    
    // If we need to convert, try WAV conversion
    if (processedBlob === audioBlob && audioBlob.size < 1000) {
      console.log('⚠️ Audio too small, attempting WAV conversion...');
      
      try {
        // Convert to WAV using Web Audio API
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert to WAV format
        const wavBlob = await convertToWav(audioBuffer);
        processedBlob = wavBlob;
        console.log('✅ Audio converted to WAV format');
      } catch (conversionError) {
        console.error('❌ WAV conversion failed:', conversionError);
        console.log('⚠️ Falling back to original format');
        processedBlob = audioBlob;
      }
    }

    // Use FileReader for more reliable conversion
    const arrayBuffer = await processedBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('✅ Audio ready for upload, size:', uint8Array.length);
    
    // Check if we have actual audio data (not just zeros)
    const nonZeroBytes = uint8Array.filter(byte => byte !== 0).length;
    
    if (nonZeroBytes < 100) {
      console.error('❌ Audio appears to be mostly silence or corrupted');
      throw new Error('Audio recording appears to be empty or corrupted. Please try recording again.');
    }
    
    // Upload audio directly as binary (no base64 conversion needed)
    const uploadUrl = await uploadAudio(uint8Array);
    console.log('✅ Audio uploaded successfully');
    
    // Submit transcription request
    const transcriptId = await submitTranscription(uploadUrl);
    console.log('✅ Transcription submitted:', transcriptId);
    
    // Poll for completion with better timing
    const result = await pollTranscription(transcriptId);
    console.log('✅ Transcription completed');
    console.log('🔍 AssemblyAI result:', result);
    console.log('🔍 Result text:', result.text);
    console.log('🔍 Result status:', result.status);
    console.log('🔍 Result error:', result.error);

    // Extract key insights
    const analysis: AssemblyAIAnalysis = {
      transcript: result.text || '',
      confidence: result.confidence || 0,
      summary: result.summary || '',
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

    console.log('✅ Direct AssemblyAI analysis completed')
    return analysis
  } catch (error) {
    console.error('Direct AssemblyAI analysis error:', error)
    throw error
  }
}

// Helper function to convert AudioBuffer to WAV format
async function convertToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  console.log('🔍 Converting AudioBuffer to WAV...');
  console.log('🔍 AudioBuffer info:', {
    length: audioBuffer.length,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration
  });
  
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert audio data with better handling
  let offset = 44;
  let nonZeroSamples = 0;
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      if (Math.abs(sample) > 0.001) nonZeroSamples++;
      
      // Clamp and convert to 16-bit
      const clampedSample = Math.max(-1, Math.min(1, sample));
      const int16Sample = clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7FFF;
      view.setInt16(offset, int16Sample, true);
      offset += 2;
    }
  }
  
  console.log('🔍 WAV conversion complete. Non-zero samples:', nonZeroSamples, 'out of', length * numberOfChannels);
  
  const wavBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
  console.log('🔍 WAV blob size:', wavBlob.size);
  
  return wavBlob;
} 