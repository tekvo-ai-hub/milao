import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  transcript?: string;
  overallScore?: number;
  clarityScore?: number;
  fillerWords?: string[];
  primaryTone?: string;
  prompt?: string;
  type?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, overallScore, clarityScore, fillerWords, primaryTone, prompt, type }: SuggestionRequest = await req.json();

    let requestPrompt = '';
    let systemMessage = '';

    if (type === 'improvement' && prompt) {
      // Handle speech improvement requests
      systemMessage = 'You are an expert speech coach and writer. Your task is to improve speech transcripts based on specific requirements while maintaining the original message and meaning. Provide only the improved script without explanations or additional commentary.';
      requestPrompt = prompt;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemMessage}\n\n${requestPrompt}`
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
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }
      
      const improvedScript = data.candidates[0].content.parts[0].text;

      return new Response(JSON.stringify({ 
        suggestions: improvedScript,
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default behavior for regular speech analysis
    if (!transcript) {
      throw new Error('No transcript provided for analysis');
    }

    requestPrompt = `Analyze this speech transcript and provide both vocabulary improvements and content evaluation:

Transcript: "${transcript}"
Current Score: ${overallScore}/100
Clarity Score: ${clarityScore}/100
Detected Filler Words: ${fillerWords?.join(', ') || 'None'}
Primary Tone: ${primaryTone}

Please provide a comprehensive analysis in JSON format:

{
  "wordImprovements": [
    {
      "original": "word from transcript",
      "suggestions": ["synonym1", "synonym2", "synonym3"],
      "context": "why this improvement helps"
    }
  ],
  "phraseAlternatives": [
    {
      "original": "phrase from transcript",
      "alternatives": ["better phrase 1", "better phrase 2"],
      "improvement": "explanation of why these are better"
    }
  ],
  "vocabularyEnhancement": [
    {
      "category": "category like 'precision' or 'formality'",
      "suggestions": ["advanced word 1", "advanced word 2"],
      "usage": "how and when to use these words"
    }
  ],
  "contentEvaluation": {
    "mainPoint": {
      "identified": "What is the speaker's main point or thesis?",
      "clarity": "How clear was the main point? (scale 1-10)",
      "feedback": "Suggestions for better articulating the main point"
    },
    "argumentStructure": {
      "hasStructure": true/false,
      "structure": "Description of the argument structure used (e.g., STAR, Problem-Solution, etc.)",
      "effectiveness": "How effective was the structure? (scale 1-10)",
      "suggestions": "How to improve the structure"
    },
    "evidenceAndExamples": {
      "hasEvidence": true/false,
      "evidenceQuality": "Quality of examples/evidence provided (scale 1-10)",
      "evidenceTypes": ["example", "statistic", "anecdote", "expert opinion"],
      "suggestions": "What types of evidence would strengthen the argument"
    },
    "persuasiveness": {
      "pointProven": true/false,
      "persuasionScore": "How convincing was the argument? (scale 1-10)",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "improvements": "How to make the argument more persuasive"
    },
    "starAnalysis": {
      "situation": "Was the context/situation clearly established?",
      "task": "Was the objective/task clearly defined?",
      "action": "Were the actions/steps clearly explained?",
      "result": "Were the outcomes/results clearly stated?",
      "overallStarScore": "How well does this follow STAR methodology? (scale 1-10)"
    }
  }
}

Keep suggestions practical and achievable for the speaker's current level.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a speech coach specializing in vocabulary improvement and clear communication. Provide practical, actionable suggestions.\n\n${requestPrompt}`
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    let aiSuggestions;
    try {
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      aiSuggestions = JSON.parse(content);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      aiSuggestions = {
        wordImprovements: [],
        phraseAlternatives: [],
        vocabularyEnhancement: []
      };
    }

    return new Response(JSON.stringify(aiSuggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-speech-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      wordImprovements: [],
      phraseAlternatives: [],
      vocabularyEnhancement: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});