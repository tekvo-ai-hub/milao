
// Note: This is a mock implementation for demonstration purposes
// In a real app, you would integrate with OpenAI's Whisper API or similar service

export type {
  ContentEvaluation,
  AISuggestions,
  AnalysisResult
} from '@/types/speechAnalysis';

import type { AnalysisResult } from '@/types/speechAnalysis';
import { localLLMService } from '@/services/localLLMService';

// Helper functions for dynamic content generation
const generateDynamicSuggestions = (transcript: string, fillerCount: number, wpm: number, tone: string): string[] => {
  const suggestions: string[] = [];
  
  // Filler word suggestions
  if (fillerCount > 3) {
    suggestions.push('Practice pausing instead of using filler words like "um" and "uh"');
  } else if (fillerCount > 0) {
    suggestions.push('Try to minimize filler words for clearer communication');
  }
  
  // Pace suggestions
  if (wpm > 180) {
    suggestions.push('Slow down your speaking pace to improve clarity and comprehension');
  } else if (wpm < 120) {
    suggestions.push('Consider increasing your speaking pace to maintain engagement');
  }
  
  // Content-based suggestions
  if (transcript.includes('I think') || transcript.includes('maybe') || transcript.includes('probably')) {
    suggestions.push('Use more confident language to strengthen your message');
  }
  
  if (!transcript.includes('.') && !transcript.includes('!') && !transcript.includes('?')) {
    suggestions.push('Structure your speech with clear sentences and pauses');
  }
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
};

const generateDynamicStrengths = (transcript: string, tone: string, clarityScore: number): string[] => {
  const strengths: string[] = [];
  
  if (clarityScore > 80) {
    strengths.push('Excellent clarity and articulation');
  } else if (clarityScore > 70) {
    strengths.push('Good overall clarity in delivery');
  }
  
  if (tone === 'Confident' || tone === 'Professional') {
    strengths.push(`Strong ${tone.toLowerCase()} tone throughout`);
  }
  
  if (transcript.length > 50) {
    strengths.push('Comprehensive coverage of the topic');
  }
  
  strengths.push('Natural conversational flow');
  
  return strengths.slice(0, 3); // Limit to 3 strengths
};

export const generateDynamicMainPoint = (transcript: string): { identified: string; clarity: number; feedback: string } => {
  const words = transcript.toLowerCase();
  
  let mainPoint = "General discussion";
  let clarity = 5;
  let feedback = "Try to state your main point more clearly";
  
  if (words.includes('project')) {
    mainPoint = "Project development and feature implementation";
    clarity = 7;
    feedback = "Your main point about project development is clear, but could be more specific";
  } else if (words.includes('feedback') || words.includes('users')) {
    mainPoint = "User feedback and engagement strategy";
    clarity = 6;
    feedback = "Focus on specific actions for gathering user feedback";
  } else if (words.includes('features') || words.includes('implementing')) {
    mainPoint = "Feature implementation planning";
    clarity = 6;
    feedback = "Clearly outline which features to prioritize";
  }
  
  return { identified: mainPoint, clarity, feedback };
};

export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  // Show loading state
  console.log('Starting speech analysis with local LLM...');
  
  // Use actual duration or estimate from audio blob
  const actualDuration = duration > 0 ? duration : 5; // Fallback to 5 seconds if duration is 0
  const estimatedWords = Math.floor(actualDuration * 2.5); // 2.5 words per second average
  const wpm = Math.floor(estimatedWords / (actualDuration / 60));
  
  const fillerCount = Math.floor(Math.random() * 5) + 1;
  const fillerPercentage = ((fillerCount / estimatedWords) * 100).toFixed(1);
  
  const tones = ['Professional', 'Confident', 'Nervous', 'Enthusiastic', 'Calm', 'Energetic'];
  const emotions = ['Focused', 'Determined', 'Anxious', 'Excited', 'Relaxed', 'Passionate'];
  const assessments = ['Too slow', 'Perfect pace', 'Slightly fast', 'Too fast', 'Natural pace'];
  
  const clarityScore = Math.floor(Math.random() * 30) + 70;
  const paceScore = Math.min(100, Math.max(60, 150 - Math.abs(wpm - 150) * 2));
  const overallScore = Math.floor((clarityScore + paceScore) / 2);
  
  console.log('Analysis Debug:', { 
    originalDuration: duration,
    actualDuration, 
    estimatedWords, 
    wpm, 
    clarityScore, 
    paceScore, 
    overallScore 
  });
  
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
    suggestions: generateDynamicSuggestions(mockTranscript, fillerCount, wpm, primaryTone),
    strengths: generateDynamicStrengths(mockTranscript, primaryTone, clarityScore)
  };
  
  // Get AI-powered suggestions using local LLM
  try {
    console.log('Analyzing with local LLM...');
    const aiSuggestions = await localLLMService.analyzeSpeech(
      mockTranscript,
      overallScore,
      clarityScore,
      fillerWords,
      primaryTone
    );
    
    mockResult.ai_suggestions = aiSuggestions;
    console.log('Local LLM analysis completed successfully');
  } catch (error) {
    console.warn('Local LLM analysis failed, using fallback:', error);
    // Fallback analysis with varied results
    const dynamicMainPoint = generateDynamicMainPoint(mockTranscript);
    mockResult.ai_suggestions = {
      contentEvaluation: {
        mainPoint: dynamicMainPoint,
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
