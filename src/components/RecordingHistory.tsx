
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Calendar, Clock, TrendingUp, Trash2 } from 'lucide-react';

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

interface RecordingHistoryProps {
  recordings: RecordingData[];
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onViewAnalysis: (id: string) => void;
}

const RecordingHistory: React.FC<RecordingHistoryProps> = ({
  recordings,
  onPlay,
  onDelete,
  onViewAnalysis
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 text-lg mb-2">No recordings yet</div>
          <p className="text-gray-600 text-sm">
            Start by recording your first speech to see your analysis history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <Card key={recording.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(recording.date)}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{formatDuration(recording.duration)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlay(recording.id)}
                  className="h-8 w-8 p-0"
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(recording.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Overall</div>
                <Badge className={getScoreColor(recording.overallScore)}>
                  {recording.overallScore}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Clarity</div>
                <Badge variant="outline">
                  {recording.clarityScore}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Pace</div>
                <Badge variant="outline">
                  {recording.pace} WPM
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Tone</div>
                <Badge variant="secondary" className="text-xs">
                  {recording.primaryTone}
                </Badge>
              </div>
            </div>

            {recording.fillerWords > 0 && (
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-600">Filler words:</span>
                <Badge variant="outline" className="text-orange-600">
                  {recording.fillerWords}
                </Badge>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnalysis(recording.id)}
              className="w-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Analysis
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecordingHistory;
