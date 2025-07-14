import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AudioWaveform, Copy, Check, Loader2, Cloud, Cpu } from 'lucide-react';
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
import { VoiceRecorder } from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';

interface VoiceToTextProps {
  onTranscriptGenerated?: (transcript: string) => void;
}

export const VoiceToText: React.FC<VoiceToTextProps> = ({ onTranscriptGenerated }) => {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsTranscribing(true);
    try {
      const result = await analyzeAudioWithAssemblyAI(audioBlob);
      setTranscript(result.transcript);
      onTranscriptGenerated?.(result.transcript);
      toast({
        title: "Analysis Complete",
        description: "VoicePro analysis done",
      });
    } catch (error) {
      console.error('VoicePro analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
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
      {/* Voice Recorder */}
      <VoiceRecorder 
        onRecordingComplete={handleRecordingComplete}
        onTranscriptGenerated={onTranscriptGenerated}
      />

      {/* Transcription Result */}
      {(transcript || isTranscribing) && (
        <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AudioWaveform className="w-5 h-5 text-primary" />
                <span>Transcription</span>
              </div>
              {isTranscribing && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Processing...
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTranscribing ? (
              <div className="text-center py-8">
                <Cloud className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Analyzing speech with VoicePro...
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card - Always show to explain the cloud processing */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <Cloud className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Advanced Speech Analysis</p>
                <p className="text-xs text-muted-foreground">
                  Using VoicePro for transcription, sentiment analysis, and speech insights
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};