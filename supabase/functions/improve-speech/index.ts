import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const grokApiKey = Deno.env.get('GROK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('No prompt provided for speech improvement');
    }

    let improvedScript = '';
    let success = false;

    // Try OpenAI first
    try {
      console.log('Improving speech with OpenAI GPT-4o-mini...');

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'You are an expert speech coach and writer. Your task is to improve speech transcripts based on specific requirements while maintaining the original message and meaning. Provide only the improved script without explanations or additional commentary.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (openAIResponse.ok) {
        const openAIData = await openAIResponse.json();
        improvedScript = openAIData.choices[0].message.content;
        success = true;
        console.log('Speech improvement completed successfully with OpenAI');
      } else {
        const errorText = await openAIResponse.text();
        console.log('OpenAI failed, trying Grok fallback...', errorText);
        throw new Error(`OpenAI failed: ${openAIResponse.status}`);
      }
    } catch (openAIError) {
      console.log('OpenAI failed, attempting Grok fallback...', openAIError.message);
      
      // Fallback to Grok AI
      if (grokApiKey) {
        try {
          console.log('Improving speech with Grok AI...');

          const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${grokApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'grok-beta',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert speech coach and writer. Your task is to improve speech transcripts based on specific requirements while maintaining the original message and meaning. Provide only the improved script without explanations or additional commentary.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (!grokResponse.ok) {
            const grokErrorText = await grokResponse.text();
            console.error('Grok API error:', grokErrorText);
            throw new Error(`Grok API error: ${grokResponse.status} - ${grokErrorText}`);
          }

          const grokData = await grokResponse.json();
          improvedScript = grokData.choices[0].message.content;
          success = true;
          console.log('Speech improvement completed successfully with Grok AI');
        } catch (grokError) {
          console.error('Grok AI also failed:', grokError.message);
          throw new Error(`Both OpenAI and Grok failed. OpenAI: ${openAIError.message}, Grok: ${grokError.message}`);
        }
      } else {
        throw new Error(`OpenAI failed and no Grok API key available. Error: ${openAIError.message}`);
      }
    }

    console.log('Speech improvement completed successfully');

    return new Response(JSON.stringify({ 
      suggestions: improvedScript,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in improve-speech function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});