
export interface ContentEvaluation {
  mainPoint: {
    identified: string;
    clarity: number;
    feedback: string;
  };
  argumentStructure: {
    hasStructure: boolean;
    structure: string;
    effectiveness: number;
    suggestions: string;
  };
  evidenceAndExamples: {
    hasEvidence: boolean;
    evidenceQuality: number;
    evidenceTypes: string[];
    suggestions: string;
  };
  persuasiveness: {
    pointProven: boolean;
    persuasionScore: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string;
  };
  starAnalysis: {
    situation: string;
    task: string;
    action: string;
    result: string;
    overallStarScore: number;
  };
}

export interface AISuggestions {
  contentEvaluation?: ContentEvaluation;
  speechSummary?: string;
}

export interface PersonalizedAnalysis {
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
}

export interface AnalysisResult {
  overall_score: number;
  clarity_score: number;
  pace_analysis: {
    words_per_minute: number;
    assessment: string;
  };
  filler_words: {
    count: number;
    percentage: string;
    examples: string[];
  };
  tone_analysis: {
    primary_tone: string;
    confidence_level: string;
    emotions: string[];
  };
  suggestions: string[];
  strengths: string[];
  ai_suggestions?: AISuggestions;
  personalizedAnalysis?: PersonalizedAnalysis;
  transcript?: string;
}