import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AudioWaveform, Copy, Check, Loader2, Cloud, Cpu, Settings } from 'lucide-react';
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VoiceToTextProps {
  onTranscriptGenerated?: (transcript: string) => void;
}

export const EnhancedVoiceToText: React.FC<VoiceToTextProps> = ({ onTranscriptGenerated }) => {
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
      onTranscriptGenerated?.(result.transcript);
      toast({
        title: 'Analysis Complete',
        description: 'Analysis done via Edge Function',
      });
    } catch (error) {
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
      {/* Analysis Mode Toggle */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Analysis Mode</p>
                <p className="text-xs text-muted-foreground">
                  Choose how to process your audio
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="flex items-center space-x-2"
            >
              {/* analysisMode === 'direct' ? (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Direct API</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Supabase</span>
                </>
              ) */}
              <Cloud className="w-4 h-4" />
              <span>Supabase</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recorder */}
      {/* <VoiceRecorder 
        onRecordingComplete={handleRecordingComplete}
        onTranscriptGenerated={onTranscriptGenerated}
      /> */}

      {/* Transcription Result */}
      {(transcript || isTranscribing) && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AudioWaveform className="w-5 h-5 text-primary" />
                <span>Transcription & Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                {isTranscribing && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Processing...
                  </Badge>
                )}
                <Badge variant="outline">
                  Supabase Edge Function
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTranscribing ? (
              <div className="text-center py-8">
                <Cloud className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Orato is eavesdropping on your brilliance...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Getting transcription, sentiment analysis, and speech insights
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Transcript will appear here..."
                  className="min-h-[120px] resize-none"
                  readOnly={isTranscribing}
                />
                
                {transcript && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {transcript.split(' ').length} words • {transcript.length} characters
                    </p>
                    
                    <Button
                      onClick={copyTranscript}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    
                    {analysis.summary && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Summary</h4>
                        <p className="text-sm bg-muted p-3 rounded-md">{analysis.summary}</p>
                      </div>
                    )}
                    
                    {analysis.sentiment && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Sentiment</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={analysis.sentiment.sentiment === 'POSITIVE' ? 'default' : 
                                   analysis.sentiment.sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'}
                          >
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
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Confidence: {(analysis.confidence * 100).toFixed(1)}%</p>
                      <p>Duration: {analysis.duration ? `${(analysis.duration / 60).toFixed(1)} minutes` : 'N/A'}</p>
                      <p>Words: {analysis.words ? analysis.words.length : 'N/A'}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardContent className="py-4">
          <div className="flex items-center space-x-3">
            <Cloud className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">
                Supabase Edge Function
              </p>
              <p className="text-xs text-muted-foreground">
                Secure processing through Supabase Edge Functions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 