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

// Generate personalized analysis using local server
async function generatePersonalizedAnalysis(transcript: string, assemblyData: any, preferences: any): Promise<any> {
  try {
    console.log('Connecting to local server for analysis...');
    
    // First, analyze the text using the local server's text analysis
    const textAnalysisResponse = await fetch('http://localhost:3001/analyze/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: transcript
      })
    });

    let textAnalysisData = null;
    if (textAnalysisResponse.ok) {
      textAnalysisData = await textAnalysisResponse.json();
      console.log('Local server text analysis result:', textAnalysisData);
    } else {
      console.warn('Local server text analysis failed, using fallback');
    }

    // Generate a structured analysis based on local server results and AssemblyAI data
    const analysis = generateStructuredAnalysis(transcript, assemblyData, preferences, textAnalysisData);
    
    return analysis;
  } catch (error) {
    console.error('Error connecting to local server:', error);
    // Fallback to a basic analysis if local server fails
    return generateFallbackAnalysis(transcript, assemblyData, preferences);
  }
}

function generateStructuredAnalysis(transcript: string, assemblyData: any, preferences: any, textAnalysis: any): any {
  // Calculate scores based on AssemblyAI data and text analysis
  const words = transcript.split(' ').filter(w => w.trim());
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  
  // Extract filler words and calculate scores
  const fillerWords = assemblyData.words?.filter((word: any) => 
    ['um', 'uh', 'ah', 'like', 'you know', 'so', 'well', 'actually', 'basically'].includes(word.text.toLowerCase())
  ) || [];
  
  const fillerWordsCount = fillerWords.length;
  const fillerWordsScore = Math.max(0, 100 - (fillerWordsCount / words.length) * 500);
  
  // Calculate clarity and pace scores
  const clarityScore = assemblyData.confidence ? Math.round(assemblyData.confidence * 100) : 75;
  const paceScore = avgWordsPerSentence > 20 ? 60 : avgWordsPerSentence < 5 ? 65 : 85;
  const overallScore = Math.round((clarityScore + paceScore + fillerWordsScore) / 3);
  
  // Generate personalized recommendations based on preferences
  const recommendations = generatePersonalizedRecommendations(preferences, overallScore, clarityScore, paceScore, fillerWordsCount);
  
  // Determine tone based on text analysis sentiment
  let tone = 'neutral and conversational';
  let confidence = 0.5;
  
  if (textAnalysis?.analysis) {
    confidence = textAnalysis.analysis.confidence || 0.5;
    switch (textAnalysis.analysis.sentiment) {
      case 'POSITIVE':
        tone = 'confident and positive';
        break;
      case 'NEGATIVE':
        tone = 'concerned or hesitant';
        break;
      default:
        tone = 'neutral and conversational';
    }
  }
  
  return {
    overallScore,
    clarityScore,
    paceScore,
    fillerWordsCount,
    fillerWordsScore: Math.round(fillerWordsScore),
    toneAssessment: `The tone is ${tone}, with a confidence level of ${Math.round(confidence * 100)}%. ${generateToneGuidance(preferences, tone)}`,
    recommendations,
    strengths: generateStrengths(overallScore, clarityScore, paceScore, preferences),
    priorityAreas: generatePriorityAreas(overallScore, clarityScore, paceScore, fillerWordsCount),
    personalizedFeedback: generatePersonalizedFeedback(transcript, overallScore, preferences, tone),
    actionableSteps: generateActionableSteps(preferences, overallScore, clarityScore, fillerWordsCount)
  };
}

function generatePersonalizedRecommendations(preferences: any, overallScore: number, clarityScore: number, paceScore: number, fillerWordsCount: number): string[] {
  const recommendations = [];
  
  if (fillerWordsCount > 3) {
    recommendations.push("Practice recording yourself and identifying filler words. Try pausing instead of using 'um' or 'uh'.");
  }
  
  if (paceScore < 70) {
    recommendations.push("Work on your pacing. Practice speaking slowly and deliberately, using strategic pauses for emphasis.");
  }
  
  if (clarityScore < 80) {
    recommendations.push("Focus on clear articulation. Practice tongue twisters and speak more slowly to improve clarity.");
  }
  
  if (preferences?.speaking_goal?.includes('presentation')) {
    recommendations.push("Practice your presentation structure. Use clear transitions between sections.");
  }
  
  if (preferences?.target_audience?.includes('business')) {
    recommendations.push("Use professional language and maintain confident delivery for business audiences.");
  }
  
  if (preferences?.confidence_level === 'low') {
    recommendations.push("Build confidence through regular practice. Start with shorter speeches and gradually increase length.");
  }
  
  return recommendations.slice(0, 6); // Limit to 6 recommendations
}

function generateToneGuidance(preferences: any, currentTone: string): string {
  const preferredTone = preferences?.tone_preference || 'professional';
  
  if (preferredTone === 'conversational' && currentTone.includes('confident')) {
    return "Your current tone aligns well with your conversational preference.";
  } else if (preferredTone === 'professional' && currentTone.includes('neutral')) {
    return "Consider adding more authority and confidence to match your professional tone preference.";
  } else if (preferredTone === 'enthusiastic' && !currentTone.includes('positive')) {
    return "Try to inject more energy and enthusiasm into your delivery.";
  }
  
  return "Continue developing your natural speaking style.";
}

function generateStrengths(overallScore: number, clarityScore: number, paceScore: number, preferences: any): string[] {
  const strengths = [];
  
  if (clarityScore >= 80) {
    strengths.push("Clear articulation and pronunciation");
  }
  
  if (paceScore >= 80) {
    strengths.push("Good speaking pace and rhythm");
  }
  
  if (overallScore >= 75) {
    strengths.push("Strong overall communication skills");
  }
  
  if (preferences?.native_language && preferences.native_language !== 'English') {
    strengths.push("Good command of English as a second language");
  }
  
  if (strengths.length === 0) {
    strengths.push("Willingness to practice and improve");
  }
  
  return strengths;
}

function generatePriorityAreas(overallScore: number, clarityScore: number, paceScore: number, fillerWordsCount: number): string[] {
  const areas = [];
  
  if (fillerWordsCount > 5) {
    areas.push("Reduce filler words significantly");
  }
  
  if (clarityScore < 70) {
    areas.push("Improve speech clarity and pronunciation");
  }
  
  if (paceScore < 70) {
    areas.push("Develop better pacing and rhythm");
  }
  
  if (areas.length === 0 && overallScore < 80) {
    areas.push("Build overall confidence and fluency");
  }
  
  return areas.slice(0, 3); // Max 3 priority areas
}

function generatePersonalizedFeedback(transcript: string, overallScore: number, preferences: any, tone: string): string {
  let feedback = `Your speech demonstrates `;
  
  if (overallScore >= 80) {
    feedback += "strong communication skills. ";
  } else if (overallScore >= 60) {
    feedback += "good potential with room for improvement. ";
  } else {
    feedback += "areas that need focused attention. ";
  }
  
  if (preferences?.speaking_goal) {
    feedback += `For your goal of ${preferences.speaking_goal}, `;
    if (overallScore >= 75) {
      feedback += "you're on the right track. ";
    } else {
      feedback += "focus on building confidence through regular practice. ";
    }
  }
  
  if (preferences?.native_language && preferences.native_language !== 'English') {
    feedback += `Your progress in English is commendable. `;
  }
  
  return feedback + "Continue practicing to achieve your speaking goals.";
}

function generateActionableSteps(preferences: any, overallScore: number, clarityScore: number, fillerWordsCount: number): string[] {
  const steps = [];
  
  steps.push("Record yourself speaking for 2-3 minutes daily and review for improvement areas");
  
  if (fillerWordsCount > 3) {
    steps.push("Practice the 'pause technique' - take a breath instead of using filler words");
  }
  
  if (clarityScore < 80) {
    steps.push("Read aloud for 10 minutes daily, focusing on clear pronunciation");
  }
  
  if (preferences?.speaking_goal?.includes('presentation')) {
    steps.push("Practice your next presentation in front of a mirror or small audience");
  } else {
    steps.push("Practice speaking on topics you're passionate about to build fluency");
  }
  
  return steps;
}

function generateFallbackAnalysis(transcript: string, assemblyData: any, preferences: any): any {
  // Provide a basic analysis when local server is unavailable
  const words = transcript.split(' ').filter(w => w.trim());
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    overallScore: 70,
    clarityScore: 75,
    paceScore: 70,
    fillerWordsCount: Math.floor(words.length * 0.02), // Estimate 2% filler words
    fillerWordsScore: 80,
    toneAssessment: "Analysis service unavailable - local server connection failed. Your speech appears conversational.",
    recommendations: [
      "Practice speaking more slowly and clearly",
      "Record yourself to identify areas for improvement",
      "Focus on reducing filler words",
      "Work on maintaining consistent pacing"
    ],
    strengths: ["Clear articulation", "Good content structure"],
    priorityAreas: ["Reduce filler words", "Improve pacing consistency"],
    personalizedFeedback: `Your speech shows good potential. The local analysis server is currently unavailable, but continue practicing to improve clarity and confidence.`,
    actionableSteps: [
      "Practice your speech multiple times",
      "Record and review your delivery",
      "Focus on eliminating unnecessary words",
      "Work on maintaining steady pacing"
    ]
  };
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
    
    console.log('Generating personalized analysis with local server...');
    
    // Generate personalized analysis with local server
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
      
      // Local server personalized analysis
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