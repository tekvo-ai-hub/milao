import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
  const maxAttempts = 60;
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

    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Transcription timed out');
}

// Generate personalized analysis using Google Gemini
async function generatePersonalizedAnalysis(transcript: string, assemblyData: any, preferences: any): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Build prompt based on user preferences
  const buildAnalysisPrompt = (transcript: string, assemblyData: any, preferences: any): string => {
    let prompt = `You are an expert speech coach analyzing a speech transcript. Please provide personalized feedback based on the user's preferences and goals.

TRANSCRIPT TO ANALYZE:
"${transcript}"

TECHNICAL DATA FROM ASSEMBLYAI:
- Confidence: ${assemblyData.confidence || 'N/A'}
- Sentiment: ${assemblyData.sentiment?.sentiment || 'N/A'} (${assemblyData.sentiment?.confidence || 'N/A'} confidence)
- Duration: ${assemblyData.duration || 'N/A'} ms
- Disfluencies detected: ${assemblyData.words?.filter((w: any) => w.text.includes('[uh]') || w.text.includes('[um]')).length || 0}

USER PREFERENCES AND CONTEXT:
`;

    if (preferences.speaking_goal) {
      prompt += `- Speaking Goal: ${preferences.speaking_goal}\n`;
    }
    if (preferences.target_audience) {
      prompt += `- Target Audience: ${preferences.target_audience}\n`;
    }
    if (preferences.scenario) {
      prompt += `- Typical Scenario: ${preferences.scenario}\n`;
    }
    if (preferences.native_language) {
      prompt += `- Native Language: ${preferences.native_language}\n`;
    }
    if (preferences.fluency_level) {
      prompt += `- Current Fluency Level: ${preferences.fluency_level}\n`;
    }
    if (preferences.confidence_level) {
      prompt += `- Confidence Level: ${preferences.confidence_level}\n`;
    }
    if (preferences.accent_challenges && preferences.accent_challenges.length > 0) {
      prompt += `- Accent Challenges: ${preferences.accent_challenges.join(', ')}\n`;
    }
    if (preferences.tone_preference) {
      prompt += `- Preferred Tone: ${preferences.tone_preference}\n`;
    }
    if (preferences.feedback_style) {
      prompt += `- Feedback Style Preference: ${preferences.feedback_style}\n`;
    }
    if (preferences.learning_style) {
      prompt += `- Learning Style: ${preferences.learning_style}\n`;
    }
    if (preferences.role_models) {
      prompt += `- Speaking Role Models: ${preferences.role_models}\n`;
    }

    prompt += `
ANALYSIS REQUIREMENTS:
Please provide a comprehensive speech analysis with the following structure:

1. OVERALL ASSESSMENT (score 1-100 with explanation)
2. SPECIFIC AREAS:
   - Clarity and Pronunciation (score 1-100)
   - Speaking Pace and Rhythm (score 1-100) 
   - Filler Words and Disfluencies (count and score 1-100)
   - Tone and Delivery (assessment based on user's preferred tone)
   - Content Organization and Flow

3. PERSONALIZED RECOMMENDATIONS:
   - Focus on the user's stated goals and challenges
   - Provide actionable advice that matches their learning style
   - Consider their target audience and typical scenarios
   - Suggest specific exercises or techniques

4. STRENGTHS TO BUILD ON
5. PRIORITY IMPROVEMENT AREAS (max 3)

RESPONSE FORMAT: Provide a JSON object with this structure:
{
  "overallScore": number,
  "clarityScore": number,
  "paceScore": number,
  "fillerWordsCount": number,
  "fillerWordsScore": number,
  "toneAssessment": "string",
  "recommendations": ["array of specific recommendations"],
  "strengths": ["array of identified strengths"],
  "priorityAreas": ["array of max 3 priority areas"],
  "personalizedFeedback": "detailed feedback based on user preferences",
  "actionableSteps": ["array of specific next steps"]
}

Make sure your feedback is ${preferences.feedback_style || 'constructive'} in tone and appropriate for someone with ${preferences.fluency_level || 'intermediate'} fluency level.`;

    return prompt;
  };

  const prompt = buildAnalysisPrompt(transcript, assemblyData, preferences);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are an expert speech coach who provides personalized feedback based on individual preferences and goals. Always respond with valid JSON.\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${await response.text()}`);
  }

  const result = await response.json();
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  const content = result.candidates[0].content.parts[0].text;
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON:', content);
    throw new Error('Invalid response format from Gemini');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('AssemblyAI API key not configured');
    }

    const { audio, userId } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    if (!userId) {
      throw new Error('User ID required for personalized analysis');
    }

    console.log('Fetching user preferences...');
    
    // Fetch user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    console.log('Processing audio with AssemblyAI...');
    
    // Process audio with AssemblyAI
    const binaryAudio = processBase64Chunks(audio);
    const uploadUrl = await uploadAudio(binaryAudio);
    const transcriptId = await submitTranscription(uploadUrl);
    const assemblyResult = await pollTranscription(transcriptId);
    
    console.log('Generating personalized analysis with Google Gemini...');
    
    // Generate personalized analysis with Gemini
    const personalizedAnalysis = await generatePersonalizedAnalysis(
      assemblyResult.text,
      assemblyResult,
      preferences || {}
    );

    // Combine AssemblyAI and Gemini results
    const combinedAnalysis = {
      // AssemblyAI data
      transcript: assemblyResult.text,
      confidence: assemblyResult.confidence,
      summary: assemblyResult.summary,
      sentiment: assemblyResult.sentiment_analysis_results?.[0] || null,
      entities: assemblyResult.entities || [],
      categories: assemblyResult.iab_categories_result || {},
      highlights: assemblyResult.auto_highlights_result || [],
      speakers: assemblyResult.utterances?.map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
        confidence: u.confidence,
        start: u.start,
        end: u.end,
      })) || [],
      contentSafety: assemblyResult.content_safety_labels || {},
      duration: assemblyResult.audio_duration,
      words: assemblyResult.words || [],
      
      // Gemini personalized analysis
      personalizedAnalysis,
      userPreferences: preferences,
    };

    return new Response(
      JSON.stringify(combinedAnalysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});