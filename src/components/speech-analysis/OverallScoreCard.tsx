import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface OverallScoreCardProps {
  score: number;
  duration: number;
}

const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ score, duration }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Overall Speech Score</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="flex-1">
            <Progress value={score} className="h-3" />
          </div>
          {getScoreIcon(score)}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Recording duration: {formatDuration(duration)}
        </p>
      </CardContent>
    </Card>
  );
};

export default OverallScoreCard;