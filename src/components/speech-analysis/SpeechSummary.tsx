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
            Speech Content
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Raw Transcript */}
          {transcript && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Raw Transcript</h3>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Summary</h3>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-muted-foreground leading-relaxed">
                {summary}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechSummary;