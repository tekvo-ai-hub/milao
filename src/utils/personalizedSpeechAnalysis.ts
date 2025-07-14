import { supabase } from '@/integrations/supabase/client';

// Convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // Remove the data:audio/wav;base64, prefix
      const base64Audio = base64data.split(',')[1];
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export interface PersonalizedAnalysisResult {
  // AssemblyAI data
  transcript: string;
  confidence: number;
  summary: string;
  sentiment: any;
  entities: any[];
  categories: any;
  highlights: any[];
  speakers: any[];
  contentSafety: any;
  duration: number;
  words: any[];
  
  // OpenAI personalized analysis
  personalizedAnalysis: {
    overallScore: number;
    clarityScore: number;
    paceScore: number;
    fillerWordsCount: number;
    fillerWordsScore: number;
    toneAssessment: string;
    recommendations: string[];
    strengths: string[];
    priorityAreas: string[];
    personalizedFeedback: string;
    actionableSteps: string[];
  };
  
  userPreferences: any;
}

export const analyzeWithPersonalizedFeedback = async (
  audioBlob: Blob, 
  userId: string
): Promise<PersonalizedAnalysisResult> => {
  console.log('🎯 Starting personalized speech analysis...');
  
  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    console.log('📤 Sending audio for personalized analysis...');
    
    // Call the new edge function with user preferences
    const { data, error } = await supabase.functions.invoke('analyze-speech-with-preferences', {
      body: { 
        audio: base64Audio,
        userId: userId
      }
    });

    if (error) {
      console.error('Personalized analysis error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No analysis data received');
    }

    console.log('✅ Personalized analysis completed');
    return data as PersonalizedAnalysisResult;
    
  } catch (error) {
    console.error('Personalized analysis error:', error);
    throw error;
  }
};

// Legacy function that maps new analysis to old format for backward compatibility
export const convertToLegacyFormat = (personalizedResult: PersonalizedAnalysisResult): any => {
  const { personalizedAnalysis, transcript, duration, words } = personalizedResult;
  
  // Calculate words per minute from duration
  const wordCount = words?.length || transcript.split(' ').length;
  const durationInMinutes = (duration || 5000) / 60000; // Convert ms to minutes
  const wpm = Math.round(wordCount / durationInMinutes);
  
  // Extract filler words from transcript
  const fillerWords = words?.filter(w => 
    w.text.includes('[uh]') || 
    w.text.includes('[um]') || 
    w.text.toLowerCase().includes('um') || 
    w.text.toLowerCase().includes('uh')
  ) || [];
  
  return {
    overall_score: personalizedAnalysis.overallScore,
    clarity_score: personalizedAnalysis.clarityScore,
    transcript: transcript,
    pace_analysis: {
      words_per_minute: wpm,
      assessment: personalizedAnalysis.paceScore > 80 ? 'Perfect pace' : 
                 personalizedAnalysis.paceScore > 60 ? 'Natural pace' : 'Needs improvement'
    },
    filler_words: {
      count: personalizedAnalysis.fillerWordsCount,
      percentage: `${((personalizedAnalysis.fillerWordsCount / wordCount) * 100).toFixed(1)}%`,
      examples: fillerWords.slice(0, 5).map(w => w.text) || ['um', 'uh']
    },
    tone_analysis: {
      primary_tone: personalizedAnalysis.toneAssessment,
      confidence_level: personalizedAnalysis.overallScore > 80 ? 'High' : 
                       personalizedAnalysis.overallScore > 60 ? 'Medium' : 'Developing',
      emotions: ['Focused', 'Determined']
    },
    suggestions: personalizedAnalysis.recommendations,
    strengths: personalizedAnalysis.strengths,
    ai_suggestions: {
      contentEvaluation: {
        mainPoint: {
          identified: "Speech content analysis",
          clarity: personalizedAnalysis.clarityScore / 10,
          feedback: personalizedAnalysis.personalizedFeedback
        },
        argumentStructure: {
          hasStructure: personalizedAnalysis.overallScore > 70,
          structure: "Personal speaking style",
          effectiveness: personalizedAnalysis.overallScore / 10,
          suggestions: personalizedAnalysis.actionableSteps.join('. ')
        },
        evidenceAndExamples: {
          hasEvidence: true,
          evidenceQuality: personalizedAnalysis.clarityScore / 15,
          evidenceTypes: ["personal experience"],
          suggestions: personalizedAnalysis.recommendations.join('. ')
        },
        persuasiveness: {
          pointProven: personalizedAnalysis.overallScore > 75,
          persuasionScore: personalizedAnalysis.overallScore / 10,
          strengths: personalizedAnalysis.strengths,
          weaknesses: personalizedAnalysis.priorityAreas,
          improvements: personalizedAnalysis.actionableSteps.join('. ')
        },
        starAnalysis: {
          situation: "Context established",
          task: "Objective communicated", 
          action: "Actions described",
          result: "Outcomes discussed",
          overallStarScore: personalizedAnalysis.overallScore / 12
        }
      }
    },
    personalizedFeedback: personalizedAnalysis.personalizedFeedback,
    actionableSteps: personalizedAnalysis.actionableSteps,
    priorityAreas: personalizedAnalysis.priorityAreas
  };
};