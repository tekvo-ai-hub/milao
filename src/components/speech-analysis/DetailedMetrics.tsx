import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Volume2, Zap, Heart } from 'lucide-react';
import type { AnalysisResult } from '@/types/speechAnalysis';

interface DetailedMetricsProps {
  analysis: AnalysisResult;
}

const DetailedMetrics: React.FC<DetailedMetricsProps> = ({ analysis }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Clarity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Volume2 className="w-5 h-5" />
            <span>Clarity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className={`text-2xl font-semibold ${getScoreColor(analysis.clarity_score)}`}>
              {analysis.clarity_score}
            </div>
            <Progress value={analysis.clarity_score} className="flex-1 h-2" />
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
          <div className="space-y-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedMetrics;