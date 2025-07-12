import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface SpeechSummaryProps {
  summary: string;
}

const SpeechSummary: React.FC<SpeechSummaryProps> = ({ summary }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Speech Summary
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