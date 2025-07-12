
// Note: This is a mock implementation for demonstration purposes
// In a real app, you would integrate with OpenAI's Whisper API or similar service

export type {
  ContentEvaluation,
  AISuggestions,
  AnalysisResult
} from '@/types/speechAnalysis';

import type { AnalysisResult } from '@/types/speechAnalysis';
import { localLLMService } from '@/services/localLLMService';

export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  // Show loading state
  console.log('Starting speech analysis with local LLM...');
  
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
  
  // Ensure score is never NaN
  const validOverallScore = isNaN(overallScore) ? 75 : overallScore;
  
  console.log('Analysis Debug - Duration:', duration, 'Overall Score:', validOverallScore, 'Clarity:', clarityScore);
  
  const primaryTone = tones[Math.floor(Math.random() * tones.length)];
  const fillerWords = ['um', 'uh', 'like', 'you know'].slice(0, fillerCount);
  
  // Mock transcript for demo
  const mockTranscript = "I think that, um, the project is going really well and, uh, we should consider implementing these new features. Like, it would be good to get feedback from users about what they want to see next.";
  
  const mockResult: AnalysisResult = {
    overall_score: validOverallScore,
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
  
  // Get AI-powered suggestions using local LLM
  try {
    console.log('Analyzing with local LLM...');
    const aiSuggestions = await localLLMService.analyzeSpeech(
      mockTranscript,
      validOverallScore,
      clarityScore,
      fillerWords,
      primaryTone
    );
    
    mockResult.ai_suggestions = aiSuggestions;
    console.log('Local LLM analysis completed successfully');
  } catch (error) {
    console.warn('Local LLM analysis failed, using fallback:', error);
    // Fallback analysis with varied results
    mockResult.ai_suggestions = {
      contentEvaluation: {
        mainPoint: {
          identified: "Discussion about project development and implementation",
          clarity: Math.floor(Math.random() * 3) + 6, // 6-8 range
          feedback: "The main point could be more focused and specific"
        },
        argumentStructure: {
          hasStructure: Math.random() > 0.5,
          structure: "Conversational presentation style",
          effectiveness: Math.floor(Math.random() * 3) + 5, // 5-7 range
          suggestions: "Consider using a more structured approach"
        },
        evidenceAndExamples: {
          hasEvidence: Math.random() > 0.6,
          evidenceQuality: Math.floor(Math.random() * 3) + 4, // 4-6 range
          evidenceTypes: ["anecdotal"],
          suggestions: "Add specific examples and data to support your points"
        },
        persuasiveness: {
          pointProven: Math.random() > 0.4,
          persuasionScore: Math.floor(Math.random() * 3) + 5, // 5-7 range
          strengths: ["Clear delivery", "Confident tone"],
          weaknesses: ["Could use more structure", "Needs supporting evidence"],
          improvements: "Strengthen arguments with concrete examples"
        },
        starAnalysis: {
          situation: "Context was mentioned but could be more detailed",
          task: "Objective was implied but not explicitly stated",
          action: "Actions were discussed but need more specificity",
          result: "Results were not clearly quantified",
          overallStarScore: Math.floor(Math.random() * 4) + 4 // 4-7 range for varied scores
        }
      }
    };
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
