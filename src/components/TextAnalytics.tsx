import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Brain, Mic, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TextAnalysisResult {
  summary: string;
  keyPoints: string[];
  structure: {
    type: string;
    organization: string;
    clarity: number;
  };
  sentiment: {
    overall: string;
    confidence: number;
    emotions: string[];
  };
  topics: string[];
  readability: {
    level: string;
    score: number;
  };
  suggestions: string[];
}

interface TextAnalyticsProps {
  audioBlob?: Blob;
  onTranscriptGenerated?: (transcript: string) => void;
}

const TextAnalytics: React.FC<TextAnalyticsProps> = ({ audioBlob, onTranscriptGenerated }) => {
  const [text, setText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TextAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast({
        title: "No Audio",
        description: "Please record audio first to generate a transcript.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data.success) {
          setTranscript(data.text);
          setText(data.text);
          onTranscriptGenerated?.(data.text);
          toast({
            title: "Transcription Complete",
            description: "Audio has been successfully transcribed to text.",
          });
        } else {
          throw new Error(data.error);
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter text or transcribe audio first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: { text: text.trim() }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis Complete",
          description: "Text analysis has been completed successfully.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyTranscript = async () => {
    if (transcript) {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Transcript copied to clipboard.",
      });
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Speech-to-Text Section */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="w-5 h-5 text-primary" />
            <span>Speech-to-Text Transcription</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={transcribeAudio}
              disabled={!audioBlob || isTranscribing}
              className="flex items-center space-x-2"
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}</span>
            </Button>
            {transcript && (
              <Button
                variant="outline"
                onClick={copyTranscript}
                className="flex items-center space-x-2"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            )}
          </div>

          {transcript && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Generated Transcript:</h4>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Or Enter Text Manually:</h4>
            <Textarea
              placeholder="Enter text to analyze or use the transcription above..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Analysis Section */}
      <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <span>AI Text Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={analyzeText}
            disabled={!text.trim() || isAnalyzing}
            className="flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Text'}</span>
          </Button>

          {analysis && (
            <div className="space-y-6">
              <Separator />
              
              {/* Summary */}
              <div className="space-y-2">
                <h4 className="font-semibold">Summary</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {analysis.summary}
                </p>
              </div>

              {/* Key Points */}
              <div className="space-y-2">
                <h4 className="font-semibold">Key Points</h4>
                <ul className="space-y-1">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Structure Analysis */}
              <div className="space-y-2">
                <h4 className="font-semibold">Structure Analysis</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Type:</span>
                    <Badge variant="secondary">{analysis.structure.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clarity Score:</span>
                    <span className={`font-medium ${getScoreColor(analysis.structure.clarity)}`}>
                      {analysis.structure.clarity}/10
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.structure.organization}</p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="space-y-2">
                <h4 className="font-semibold">Sentiment Analysis</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Sentiment:</span>
                    <Badge className={getSentimentColor(analysis.sentiment.overall)}>
                      {analysis.sentiment.overall}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidence:</span>
                    <span className="font-medium">{(analysis.sentiment.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.sentiment.emotions.map((emotion, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-2">
                <h4 className="font-semibold">Topics Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Readability */}
              <div className="space-y-2">
                <h4 className="font-semibold">Readability</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reading Level:</span>
                    <Badge variant="outline">{analysis.readability.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Readability Score:</span>
                    <span className={`font-medium ${getScoreColor(analysis.readability.score)}`}>
                      {analysis.readability.score}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <h4 className="font-semibold">Improvement Suggestions</h4>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start space-x-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TextAnalytics;