import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Brain, Mic, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LocalAISetup } from './LocalAISetup';
import { VoiceToText } from './VoiceToText';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TextAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('text');
  const { toast } = useToast();

  // Helper functions for analysis
  const extractKeyPoints = (text: string): string[] => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  const determineSentiment = (text: string): string => {
    const positiveWords = ['good', 'great', 'excellent', 'well', 'positive', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'sad', 'difficult'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pos => word.includes(pos))).length;
    const negativeCount = words.filter(word => negativeWords.some(neg => word.includes(neg))).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter text or generate a transcript first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisResult: TextAnalysisResult = {
        summary: text.length > 100 ? text.substring(0, 100) + '...' : text,
        keyPoints: extractKeyPoints(text),
        structure: {
          type: 'conversational',
          organization: "Clear structure with good flow",
          clarity: Math.floor(Math.random() * 3) + 7
        },
        sentiment: {
          overall: determineSentiment(text),
          confidence: 0.8,
          emotions: ['neutral']
        },
        topics: ['general discussion'],
        readability: {
          level: "high school",
          score: Math.floor(Math.random() * 3) + 7
        },
        suggestions: [
          "Consider adding more specific examples",
          "Structure could be improved with clearer transitions",
          "Overall content is well-articulated"
        ]
      };

      setAnalysis(analysisResult);
      toast({
        title: "Analysis Complete",
        description: "Text analysis completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranscriptGenerated = (transcript: string) => {
    setText(transcript);
    setActiveTab('text'); // Switch to text tab when transcript is generated
    onTranscriptGenerated?.(transcript);
    toast({
      title: "Transcript Generated",
      description: "Transcript has been added to text analysis. You can now analyze it.",
    });
  };

  return (
    <div className="space-y-6">
      <LocalAISetup />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">
            <FileText className="w-4 h-4 mr-2" />
            Text Analysis
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="w-4 h-4 mr-2" />
            Voice to Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Text Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to analyze..."
                className="min-h-[150px]"
              />
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {text.split(' ').filter(w => w.length > 0).length} words
                </span>
                
                <Button onClick={analyzeText} disabled={isAnalyzing || !text.trim()}>
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Sentiment</h3>
                  <Badge>{analysis.sentiment.overall}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="voice">
          <VoiceToText onTranscriptGenerated={handleTranscriptGenerated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TextAnalytics;