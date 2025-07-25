import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Volume2, Zap, Heart } from 'lucide-react';
import type { AnalysisResult } from '@/types/speechAnalysis';

interface DetailedMetricsProps {
  analysis: AnalysisResult;
  toneAssessment?: string;
}

const DetailedMetrics: React.FC<DetailedMetricsProps> = ({ analysis, toneAssessment }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Clarity Score */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Volume2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Clarity
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`text-4xl font-bold ${getScoreColor(analysis.clarity_score)}`}>
                {analysis.clarity_score}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Out of 100</div>
              </div>
            </div>
            <Progress value={analysis.clarity_score} className="h-3 shadow-inner" />
          </div>
        </CardContent>
      </Card>

      {/* Speaking Pace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="w-5 h-5" />
            <span>Speaking Pace</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-semibold text-blue-600">
              {analysis.pace_analysis.words_per_minute} WPM
            </div>
            <Badge variant="outline" className="text-xs">
              {analysis.pace_analysis.assessment}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Filler Words */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Zap className="w-5 h-5" />
            <span>Filler Words</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-semibold text-orange-600">
                {analysis.filler_words.count}
              </span>
              <Badge variant="secondary">
                {analysis.filler_words.percentage}
              </Badge>
            </div>
            {analysis.filler_words.examples.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.filler_words.examples.slice(0, 3).map((word, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {word}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tone Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Heart className="w-5 h-5" />
            <span>Tone & Emotion</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge className="bg-purple-100 text-purple-800">
              {analysis.tone_analysis.primary_tone}
            </Badge>
            <div className="text-sm text-gray-600">
              Confidence: {analysis.tone_analysis.confidence_level}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.tone_analysis.emotions.slice(0, 3).map((emotion, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {emotion}
                </Badge>
              ))}
            </div>
            {toneAssessment && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-md border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">AI Assessment</p>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">{toneAssessment}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedMetrics;