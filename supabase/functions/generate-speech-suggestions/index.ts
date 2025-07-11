import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  transcript: string;
  overallScore: number;
  clarityScore: number;
  fillerWords: string[];
  primaryTone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, overallScore, clarityScore, fillerWords, primaryTone }: SuggestionRequest = await req.json();

    const prompt = `Analyze this speech transcript and provide both vocabulary improvements and content evaluation:

Transcript: "${transcript}"
Current Score: ${overallScore}/100
Clarity Score: ${clarityScore}/100
Detected Filler Words: ${fillerWords.join(', ')}
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a speech coach specializing in vocabulary improvement and clear communication. Provide practical, actionable suggestions.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    let aiSuggestions;
    try {
      aiSuggestions = JSON.parse(data.choices[0].message.content);
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