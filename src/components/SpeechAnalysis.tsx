import React from 'react';
import OverallScoreCard from './speech-analysis/OverallScoreCard';
import DetailedMetrics from './speech-analysis/DetailedMetrics';
import StrengthsSection from './speech-analysis/StrengthsSection';
import VocabularySuggestions from './speech-analysis/VocabularySuggestions';
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
    <div className="space-y-6">
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

      {/* AI-Powered Vocabulary Suggestions */}
      {analysis.ai_suggestions && (
        <div className="space-y-4">
          <VocabularySuggestions suggestions={analysis.ai_suggestions} />

          {/* Content Evaluation */}
          {analysis.ai_suggestions.contentEvaluation && (
            <ContentEvaluation evaluation={analysis.ai_suggestions.contentEvaluation} />
          )}
        </div>
      )}

      {/* General Suggestions */}
      <GeneralSuggestions suggestions={analysis.suggestions} />
    </div>
  );
};

export default SpeechAnalysis;