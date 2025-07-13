import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AudioWaveform, Copy, Check, Loader2 } from 'lucide-react';
import { useLocalAI } from '@/hooks/useLocalAI';
import { VoiceRecorder } from './VoiceRecorder';

interface VoiceToTextProps {
  onTranscriptGenerated?: (transcript: string) => void;
}

export const VoiceToText: React.FC<VoiceToTextProps> = ({ onTranscriptGenerated }) => {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { transcribeAudio, isModelLoaded } = useLocalAI();

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!isModelLoaded('whisper-tiny')) {
      return;
    }

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioBlob);
      setTranscript(result);
      onTranscriptGenerated?.(result);
    } catch (error) {
      console.error('Transcription failed:', error);
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

  const isWhisperReady = isModelLoaded('whisper-tiny');

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
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Converting speech to text using local AI...
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

      {/* Status Message */}
      {!isWhisperReady && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <AudioWaveform className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="font-medium text-gray-900">Voice-to-Text Not Available</h3>
              <p className="text-sm text-gray-500">
                Please initialize the Whisper AI model first to use voice transcription.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};