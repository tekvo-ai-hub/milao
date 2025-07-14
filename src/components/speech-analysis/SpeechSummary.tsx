import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import SpeechImprovement from './SpeechImprovement';

interface SpeechSummaryProps {
  summary: string;
  transcript?: string;
}

const SpeechSummary: React.FC<SpeechSummaryProps> = ({ summary, transcript }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Speech Summary
          </div>
          {transcript && (
            <SpeechImprovement 
              transcript={transcript} 
              summary={summary} 
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {summary}
        </p>
      </CardContent>
    </Card>
  );
};

export default SpeechSummary;