import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { localLLMService } from '@/services/localLLMService';

type LLMStatus = 'idle' | 'initializing' | 'ready' | 'error';

const LLMStatus: React.FC = () => {
  const [status, setStatus] = useState<LLMStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const initializeLLM = async () => {
    setStatus('initializing');
    setError(null);
    
    try {
      await localLLMService.initialize();
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to initialize LLM');
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return {
          icon: <Brain className="h-4 w-4" />,
          label: 'Not Initialized',
          variant: 'secondary' as const,
          description: 'Local AI analysis is available but not yet loaded'
        };
      case 'initializing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Loading Model...',
          variant: 'default' as const,
          description: 'Downloading and initializing the AI model (this may take a moment)'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'AI Ready',
          variant: 'default' as const,
          description: 'Local AI analysis is ready and will provide varied STAR method scores'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Error',
          variant: 'destructive' as const,
          description: error || 'Failed to initialize AI model'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {statusInfo.icon}
          Local AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
          </div>
          {status === 'idle' && (
            <Button 
              size="sm" 
              onClick={initializeLLM}
              className="text-xs"
            >
              Initialize AI
            </Button>
          )}
          {status === 'error' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={initializeLLM}
              className="text-xs"
            >
              Retry
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {statusInfo.description}
        </p>
        {status === 'ready' && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            ✓ Your speech analysis will now include personalized AI feedback with varied STAR method scores based on your actual content
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMStatus;