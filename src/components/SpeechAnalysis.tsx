import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Copy, Check } from 'lucide-react';
import OverallScoreCard from './speech-analysis/OverallScoreCard';
import DetailedMetrics from './speech-analysis/DetailedMetrics';
import StrengthsSection from './speech-analysis/StrengthsSection';

import ContentEvaluation from './speech-analysis/ContentEvaluation';
import GeneralSuggestions from './speech-analysis/GeneralSuggestions';
import PriorityAreas from './speech-analysis/PriorityAreas';
import SpeechSummary from './speech-analysis/SpeechSummary';
import type { AnalysisResult } from '@/types/speechAnalysis';

interface SpeechAnalysisProps {
  analysis: AnalysisResult;
  duration: number;
}

const SpeechAnalysis: React.FC<SpeechAnalysisProps> = ({ analysis, duration }) => {
  const [copied, setCopied] = useState(false);



  const copyTranscript = async () => {
    if (analysis.transcript) {
      await navigator.clipboard.writeText(analysis.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      <OverallScoreCard 
        score={analysis.overall_score} 
        duration={duration}
        personalizedFeedback={analysis.personalizedAnalysis?.personalizedFeedback}
      />

      {/* Transcript Display - Always show if available */}
      {analysis.transcript && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Speech Transcript
              </div>
              <Button
                onClick={copyTranscript}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {analysis.transcript}
                </p>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{analysis.transcript.split(' ').length} words</span>
                <span>{analysis.transcript.length} characters</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speech Summary */}
      {analysis.ai_suggestions?.speechSummary && (
        <SpeechSummary 
          summary={analysis.ai_suggestions.speechSummary} 
          transcript={analysis.transcript}
        />
      )}

      {/* Detailed Metrics */}
      <DetailedMetrics 
        analysis={analysis} 
        toneAssessment={analysis.personalizedAnalysis?.toneAssessment}
      />

      {/* Strengths */}
      <StrengthsSection strengths={analysis.strengths} />

      {/* Content Evaluation */}
      {analysis.ai_suggestions?.contentEvaluation && (
        <ContentEvaluation evaluation={analysis.ai_suggestions.contentEvaluation} />
      )}

      {/* Priority Areas */}
      {analysis.personalizedAnalysis?.priorityAreas && (
        <PriorityAreas priorityAreas={analysis.personalizedAnalysis.priorityAreas} />
      )}

      {/* General Suggestions */}
      <GeneralSuggestions 
        suggestions={analysis.suggestions} 
        actionableSteps={analysis.personalizedAnalysis?.actionableSteps}
      />
    </div>
  );
};

export default SpeechAnalysis;