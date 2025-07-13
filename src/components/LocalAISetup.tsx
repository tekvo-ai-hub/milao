import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocalAI } from '@/hooks/useLocalAI';

export const LocalAISetup: React.FC = () => {
  const {
    models,
    isInitializing,
    loadAllModels,
    loadModel,
    getModelStatus,
  } = useLocalAI();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loaded': return <Check className="w-4 h-4" />;
      case 'loading': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <span className="w-4 h-4 text-center">○</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return 'bg-green-100 text-green-800 border-green-200';
      case 'loading': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loaded': return 'Ready';
      case 'loading': return 'Loading...';
      case 'error': return 'Failed';
      default: return 'Not Loaded';
    }
  };

  const allModelsLoaded = models.every(model => model.status === 'loaded');
  const hasModels = models.length > 0;

  return (
    <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <span>Local AI Setup</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasModels ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Local AI Features:</strong>
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Speech-to-Text:</strong> Convert audio recordings to text using Whisper AI</li>
                <li>• <strong>Text Generation:</strong> Generate text using GPT-2</li>
                <li>• <strong>100% Private:</strong> All processing happens in your browser</li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Click below to download and initialize the AI models. This may take a few minutes on first use.
            </p>
            
            <Button
              onClick={loadAllModels}
              disabled={isInitializing}
              className="flex items-center space-x-2"
              size="lg"
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>{isInitializing ? 'Initializing...' : 'Initialize AI Models'}</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Model Status List */}
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(model.status)}
                      <span className="font-medium">{model.name}</span>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {getStatusText(model.status)}
                    </Badge>
                  </div>
                  
                  {model.status === 'error' && (
                    <Button
                      onClick={() => loadModel(model.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Status */}
            <div className="border-t pt-4">
              {allModelsLoaded ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">All Models Ready</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Local AI features are now available for use.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Button
                    onClick={loadAllModels}
                    disabled={isInitializing}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    {isInitializing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    <span>
                      {isInitializing ? 'Loading Models...' : 'Load All Models'}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};