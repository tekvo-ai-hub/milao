import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Award } from 'lucide-react';

interface RecordingData {
  id: string;
  date: string;
  duration: number;
  overallScore: number;
  clarityScore: number;
  pace: number;
  fillerWords: number;
  primaryTone: string;
}

interface ProgressReportProps {
  recordings: RecordingData[];
}

const ProgressReport: React.FC<ProgressReportProps> = ({ recordings }) => {
  if (!recordings || recordings.length === 0) {
    return (
      <Card className="w-full border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            No recordings yet. Start recording to see your progress!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalRecordings = recordings.length;
  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);
  const averageScore = recordings.reduce((sum, r) => sum + r.overallScore, 0) / totalRecordings;
  const averageClarity = recordings.reduce((sum, r) => sum + r.clarityScore, 0) / totalRecordings;
  const averagePace = recordings.reduce((sum, r) => sum + r.pace, 0) / totalRecordings;
  const averageFillerWords = recordings.reduce((sum, r) => sum + r.fillerWords, 0) / totalRecordings;

  // Calculate trends (compare last 3 recordings with previous 3)
  const getScoreTrend = () => {
    if (recordings.length < 3) return { trend: 'neutral', change: 0 };
    
    const recent = recordings.slice(0, 3);
    const previous = recordings.slice(3, 6);
    
    if (previous.length === 0) return { trend: 'neutral', change: 0 };
    
    const recentAvg = recent.reduce((sum, r) => sum + r.overallScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.overallScore, 0) / previous.length;
    
    const change = recentAvg - previousAvg;
    
    if (change > 2) return { trend: 'up', change };
    if (change < -2) return { trend: 'down', change };
    return { trend: 'neutral', change };
  };

  const getClarityTrend = () => {
    if (recordings.length < 3) return { trend: 'neutral', change: 0 };
    
    const recent = recordings.slice(0, 3);
    const previous = recordings.slice(3, 6);
    
    if (previous.length === 0) return { trend: 'neutral', change: 0 };
    
    const recentAvg = recent.reduce((sum, r) => sum + r.clarityScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.clarityScore, 0) / previous.length;
    
    const change = recentAvg - previousAvg;
    
    if (change > 2) return { trend: 'up', change };
    if (change < -2) return { trend: 'down', change };
    return { trend: 'neutral', change };
  };

  const scoreTrend = getScoreTrend();
  const clarityTrend = getClarityTrend();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-400';
    if (score >= 60) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{totalRecordings}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Recordings</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{formatDuration(totalDuration)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Practice Time</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{Math.round(averageScore)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Overall Score</span>
                {getTrendIcon(scoreTrend.trend)}
                <span className={`text-sm ${getTrendColor(scoreTrend.trend)}`}>
                  {scoreTrend.change > 0 ? '+' : ''}{Math.round(scoreTrend.change)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(averageScore)}/100</div>
                <div className="text-sm text-muted-foreground">{getPerformanceLevel(averageScore)}</div>
              </div>
            </div>
            <Progress value={averageScore} className="h-3" />
          </div>

          {/* Clarity Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Clarity</span>
                {getTrendIcon(clarityTrend.trend)}
                <span className={`text-sm ${getTrendColor(clarityTrend.trend)}`}>
                  {clarityTrend.change > 0 ? '+' : ''}{Math.round(clarityTrend.change)}
                </span>
              </div>
              <div className="text-xl font-bold">{Math.round(averageClarity)}/100</div>
            </div>
            <Progress value={averageClarity} className="h-2" />
          </div>

          {/* Speaking Pace */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Speaking Pace</span>
              <div className="text-xl font-bold">{Math.round(averagePace)} WPM</div>
            </div>
            <Progress value={Math.min((averagePace / 200) * 100, 100)} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Ideal range: 140-180 WPM
            </div>
          </div>

          {/* Filler Words */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Filler Words (avg per recording)</span>
              <div className="text-xl font-bold">{Math.round(averageFillerWords)}</div>
            </div>
            <Progress value={Math.max(0, 100 - (averageFillerWords * 10))} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Lower is better
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardHeader>
          <CardTitle>Recent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recordings.slice(0, 5).map((recording, index) => (
              <div key={recording.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {new Date(recording.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(recording.duration)} • {recording.primaryTone}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{recording.overallScore}/100</div>
                  <div className="text-sm text-muted-foreground">
                    Clarity: {recording.clarityScore}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressReport;