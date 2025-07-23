import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AudioWaveform, Copy, Check, Loader2, Cloud } from 'lucide-react';
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
import { useAuth } from '@/hooks/useAuth';
import { VoiceRecorder } from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';

export const AssemblyAITest: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsTranscribing(true);
    try {
      if (!user) {
        toast({ title: 'Sign in required', description: 'Please sign in to analyze audio.', variant: 'destructive' });
        return;
      }
      const result = await analyzeAudioWithAssemblyAI(audioBlob, user.id);
      setTranscript(result.transcript);
      setAnalysis(result);
      toast({
        title: 'AssemblyAI Analysis Complete',
        description: 'Analysis completed via Edge Function',
      });
    } catch (error) {
      console.error('AssemblyAI analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyTranscript = async () => {
    if (transcript) {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AudioWaveform className="h-5 w-5" />
            AssemblyAI Direct Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Direct API</Badge>
            <Badge variant="secondary">AssemblyAI</Badge>
            {isTranscribing && (
              <Badge variant="default" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>
          
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
          
          {transcript && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transcript</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyTranscript}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={transcript}
                readOnly
                className="min-h-[100px]"
                placeholder="Transcript will appear here..."
              />
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              
              {analysis.summary && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Summary</h4>
                  <p className="text-sm">{analysis.summary}</p>
                </div>
              )}
              
              {analysis.sentiment && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Sentiment</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={analysis.sentiment.sentiment === 'POSITIVE' ? 'default' : 'secondary'}>
                      {analysis.sentiment.sentiment}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Confidence: {(analysis.sentiment.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              
              {analysis.highlights && analysis.highlights.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Key Highlights</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.highlights.slice(0, 5).map((highlight: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {highlight.text}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <p>Confidence: {(analysis.confidence * 100).toFixed(1)}%</p>
                <p>Duration: {analysis.duration ? `${(analysis.duration / 60).toFixed(1)} minutes` : 'N/A'}</p>
                <p>Words: {analysis.words ? analysis.words.length : 'N/A'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 