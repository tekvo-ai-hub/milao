import React from 'react';
import OverallScoreCard from './speech-analysis/OverallScoreCard';
import DetailedMetrics from './speech-analysis/DetailedMetrics';
import StrengthsSection from './speech-analysis/StrengthsSection';

import ContentEvaluation from './speech-analysis/ContentEvaluation';
import GeneralSuggestions from './speech-analysis/GeneralSuggestions';
import SpeechSummary from './speech-analysis/SpeechSummary';
import type { AnalysisResult } from '@/types/speechAnalysis';

interface SpeechAnalysisProps {
  analysis: AnalysisResult;
  duration: number;
}

const SpeechAnalysis: React.FC<SpeechAnalysisProps> = ({ analysis, duration }) => {
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background/50 to-muted/30 rounded-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Speech Analysis Report
        </h2>
        <p className="text-muted-foreground mt-2">Comprehensive evaluation of your speech performance</p>
      </div>
      {/* Overall Score */}
      <OverallScoreCard score={analysis.overall_score} duration={duration} />

      {/* Speech Summary */}
      {analysis.ai_suggestions?.speechSummary && (
        <SpeechSummary summary={analysis.ai_suggestions.speechSummary} />
      )}

      {/* Detailed Metrics */}
      <DetailedMetrics analysis={analysis} />

      {/* Strengths */}
      <StrengthsSection strengths={analysis.strengths} />

      {/* Content Evaluation */}
      {analysis.ai_suggestions?.contentEvaluation && (
        <ContentEvaluation evaluation={analysis.ai_suggestions.contentEvaluation} />
      )}

      {/* General Suggestions */}
      <GeneralSuggestions suggestions={analysis.suggestions} />
    </div>
  );
};

export default SpeechAnalysis;