import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface OverallScoreCardProps {
  score: number;
  duration: number;
}

const OverallScoreCard: React.FC<OverallScoreCardProps> = ({ score, duration }) => {
  // Ensure score is valid and fallback to 0 if not
  const validScore = typeof score === 'number' && !isNaN(score) ? Math.round(score) : 0;
  
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
    <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-3 text-2xl">
          <TrendingUp className="w-8 h-8 text-primary" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Overall Speech Score
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className={`text-6xl font-bold ${getScoreColor(validScore)} drop-shadow-sm`}>
              {validScore}
            </div>
            <div className="absolute -top-2 -right-4">
              {getScoreIcon(validScore)}
            </div>
          </div>
          <div className="w-full max-w-md">
            <Progress value={validScore} className="h-4 shadow-inner" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium">Recording Duration</p>
            <p className="text-2xl font-bold text-primary">{formatDuration(duration)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallScoreCard;