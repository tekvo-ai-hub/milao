
// Note: This is a mock implementation for demonstration purposes
// In a real app, you would integrate with OpenAI's Whisper API or similar service

export type {
  WordImprovement,
  PhraseAlternative,
  VocabularyEnhancement,
  ContentEvaluation,
  AISuggestions,
  AnalysisResult
} from '@/types/speechAnalysis';

import type { AnalysisResult } from '@/types/speechAnalysis';

export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Mock analysis based on duration and random factors for demo
  const estimatedWords = Math.floor(duration * 2.5); // Rough estimate
  const wpm = Math.floor(estimatedWords / (duration / 60));
  
  const fillerCount = Math.floor(Math.random() * 5) + 1;
  const fillerPercentage = ((fillerCount / estimatedWords) * 100).toFixed(1);
  
  const tones = ['Professional', 'Confident', 'Nervous', 'Enthusiastic', 'Calm', 'Energetic'];
  const emotions = ['Focused', 'Determined', 'Anxious', 'Excited', 'Relaxed', 'Passionate'];
  const assessments = ['Too slow', 'Perfect pace', 'Slightly fast', 'Too fast', 'Natural pace'];
  
  const clarityScore = Math.floor(Math.random() * 30) + 70;
  const overallScore = Math.floor((clarityScore + Math.min(100, Math.max(60, 150 - Math.abs(wpm - 150) * 2))) / 2);
  const primaryTone = tones[Math.floor(Math.random() * tones.length)];
  const fillerWords = ['um', 'uh', 'like', 'you know'].slice(0, fillerCount);
  
  // Mock transcript for demo
  const mockTranscript = "I think that, um, the project is going really well and, uh, we should consider implementing these new features. Like, it would be good to get feedback from users about what they want to see next.";
  
  const mockResult: AnalysisResult = {
    overall_score: overallScore,
    clarity_score: clarityScore,
    transcript: mockTranscript,
    pace_analysis: {
      words_per_minute: wpm,
      assessment: assessments[Math.floor(Math.random() * assessments.length)]
    },
    filler_words: {
      count: fillerCount,
      percentage: `${fillerPercentage}%`,
      examples: fillerWords
    },
    tone_analysis: {
      primary_tone: primaryTone,
      confidence_level: 'High',
      emotions: emotions.slice(0, 3)
    },
    suggestions: [
      'Try to reduce filler words by pausing instead of saying "um" or "uh"',
      'Practice maintaining consistent volume throughout your speech',
      'Consider adding more varied intonation to keep listeners engaged'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    strengths: [
      'Clear pronunciation and articulation',
      'Good overall speaking confidence',
      'Natural conversational tone'
    ].slice(0, Math.floor(Math.random() * 3) + 1)
  };
  
  // Get AI-powered suggestions
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('generate-speech-suggestions', {
      body: {
        transcript: mockTranscript,
        overallScore,
        clarityScore,
        fillerWords,
        primaryTone
      }
    });
    
    console.log('AI suggestions response:', { data, error });
    
    if (!error && data) {
      mockResult.ai_suggestions = data;
    } else {
      console.warn('AI suggestions error or no data:', error);
      // Fallback with mock content evaluation for testing
      mockResult.ai_suggestions = {
        wordImprovements: [],
        phraseAlternatives: [],
        vocabularyEnhancement: [],
        contentEvaluation: {
          mainPoint: {
            identified: "The speaker discussed project progress and new feature implementation",
            clarity: 7,
            feedback: "The main point was somewhat clear but could be more focused and specific"
          },
          argumentStructure: {
            hasStructure: false,
            structure: "Informal conversational style without clear structure",
            effectiveness: 5,
            suggestions: "Consider using a more structured approach like problem-solution or chronological order"
          },
          evidenceAndExamples: {
            hasEvidence: false,
            evidenceQuality: 4,
            evidenceTypes: ["anecdote"],
            suggestions: "Add specific examples, data, or case studies to support your points"
          },
          persuasiveness: {
            pointProven: false,
            persuasionScore: 5,
            strengths: ["Confident delivery", "Clear intention"],
            weaknesses: ["Lack of supporting evidence", "Informal structure"],
            improvements: "Strengthen arguments with concrete examples and data"
          },
          starAnalysis: {
            situation: "Context was briefly mentioned but not clearly established",
            task: "Objective was implied but not explicitly stated",
            action: "Some actions were mentioned but not detailed",
            result: "Results were not clearly stated or measured",
            overallStarScore: 4
          }
        }
      };
    }
  } catch (error) {
    console.warn('Failed to get AI suggestions:', error);
    // Continue without AI suggestions
  }
  
  return mockResult;
};

// For real implementation, you would use something like:
/*
export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  formData.append('duration', duration.toString());
  
  const response = await fetch('/api/analyze-speech', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze speech');
  }
  
  return response.json();
};
*/
