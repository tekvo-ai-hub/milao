import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Download, 
  Cloud, 
  Cpu, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { freeSpeechService, type SpeechAnalysisResult } from '@/services/freeSpeechService';
import { VoiceRecorder } from './VoiceRecorder';

interface FreeSpeechAnalysisProps {
  onAnalysisComplete?: (result: SpeechAnalysisResult) => void;
  showAdvanced?: boolean;
}

export const FreeSpeechAnalysis: React.FC<FreeSpeechAnalysisProps> = ({
  onAnalysisComplete,
  showAdvanced = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    local: boolean;
    cloud: boolean;
    availableApis: string[];
  } | null>(null);
  const [currentApi, setCurrentApi] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      const status = await freeSpeechService.getAPIStatus();
      setApiStatus(status);
      console.log('API Status:', status);
    } catch (error) {
      console.error('Failed to check API status:', error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentApi('');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      console.log('🎯 Starting free speech analysis...');
      
      const result = await freeSpeechService.analyzeSpeech(audioBlob);
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentApi(result.api);
      
      setAnalysisResult(result);
      onAnalysisComplete?.(result);

      toast({
        title: "Analysis Complete! 🎉",
        description: `Processed with ${result.api} - ${result.wordCount} words analyzed`,
      });

    } catch (error) {
      console.error('Free speech analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const getApiIcon = (api: string) => {
    switch (api) {
      case 'local-whisper':
        return <Cpu className="w-4 h-4" />;
      case 'whisper':
        return <Cloud className="w-4 h-4" />;
      case 'huggingface':
        return <Zap className="w-4 h-4" />;
      case 'coqui':
        return <Mic className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getApiColor = (api: string) => {
    switch (api) {
      case 'local-whisper':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'whisper':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'huggingface':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'coqui':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Status */}
      {apiStatus && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Free Speech APIs Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4" />
                <span className="text-sm">Local AI:</span>
                <Badge variant={apiStatus.local ? "default" : "secondary"}>
                  {apiStatus.local ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4" />
                <span className="text-sm">Cloud APIs:</span>
                <Badge variant={apiStatus.cloud ? "default" : "secondary"}>
                  {apiStatus.availableApis.length} Available
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Total APIs:</span>
                <Badge variant="outline">
                  {apiStatus.availableApis.length + (apiStatus.local ? 1 : 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Recorder */}
      <VoiceRecorder 
        onRecordingComplete={handleRecordingComplete}
      />

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Analyzing Speech</span>
              </div>
              {currentApi && (
                <Badge className={getApiColor(currentApi)}>
                  {getApiIcon(currentApi)}
                  <span className="ml-1">{currentApi}</span>
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing audio...</span>
                <span>{progress}%</span>
              </div>
              <div className="text-center py-4">
                <Cloud className="w-8 h-8 animate-pulse mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Using free speech-to-text APIs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Analysis Results</span>
              </div>
              <Badge className={getApiColor(analysisResult.api)}>
                {getApiIcon(analysisResult.api)}
                <span className="ml-1">{analysisResult.api}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transcript */}
            <div>
              <h4 className="font-semibold mb-2">Transcript</h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {analysisResult.transcript}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analysisResult.wordCount}
                </div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(analysisResult.duration)}s
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analysisResult.language.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">Language</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(analysisResult.sentiment.score * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
            </div>

            {/* Sentiment */}
            <div>
              <h4 className="font-semibold mb-2">Sentiment Analysis</h4>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  analysisResult.sentiment.label === 'POSITIVE' ? 'default' :
                  analysisResult.sentiment.label === 'NEGATIVE' ? 'destructive' : 'secondary'
                }>
                  {analysisResult.sentiment.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Confidence: {Math.round(analysisResult.sentiment.score * 100)}%
                </span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">
                {analysisResult.summary}
              </p>
            </div>

            {/* Keywords */}
            {showAdvanced && analysisResult.keywords.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Savings */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Free Analysis Complete!</h4>
                  <p className="text-sm text-green-600">
                    This analysis was performed using free APIs, saving you money compared to paid services.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 