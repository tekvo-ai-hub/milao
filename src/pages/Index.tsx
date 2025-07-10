
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, History, TrendingUp, Smartphone } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import SpeechAnalysis from '@/components/SpeechAnalysis';
import RecordingHistory from '@/components/RecordingHistory';
import { analyzeSpeech, AnalysisResult } from '@/utils/speechAnalysisAPI';
import { useToast } from '@/hooks/use-toast';

interface RecordingData {
  id: string;
  date: string;
  duration: number;
  overallScore: number;
  clarityScore: number;
  pace: number;
  fillerWords: number;
  primaryTone: string;
  analysis: AnalysisResult;
  audioBlob: Blob;
}

const Index = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [activeTab, setActiveTab] = useState('record');
  const { toast } = useToast();

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSpeech(audioBlob, duration);
      setCurrentAnalysis(analysis);
      setCurrentDuration(duration);
      
      // Save to history
      const newRecording: RecordingData = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration,
        overallScore: analysis.overall_score,
        clarityScore: analysis.clarity_score,
        pace: analysis.pace_analysis.words_per_minute,
        fillerWords: analysis.filler_words.count,
        primaryTone: analysis.tone_analysis.primary_tone,
        analysis,
        audioBlob
      };
      
      setRecordings(prev => [newRecording, ...prev]);
      setActiveTab('analysis');
      
      toast({
        title: "Analysis Complete!",
        description: `Your speech scored ${analysis.overall_score}/100`,
      });
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try recording again.",
        variant: "destructive",
      });
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlayRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      const audio = new Audio(URL.createObjectURL(recording.audioBlob));
      audio.play();
    }
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Recording Deleted",
      description: "The recording has been removed from your history.",
    });
  };

  const handleViewAnalysis = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      setCurrentAnalysis(recording.analysis);
      setCurrentDuration(recording.duration);
      setActiveTab('analysis');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Speech AI Coach
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Record your speech and get instant AI-powered feedback to improve your communication skills
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="record" className="flex items-center space-x-2">
              <Mic className="w-4 h-4" />
              <span>Record</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2" disabled={!currentAnalysis}>
              <TrendingUp className="w-4 h-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Record Tab */}
          <TabsContent value="record" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ready to Practice?</h2>
              <p className="text-gray-600">
                Record yourself speaking about any topic for at least 30 seconds to get detailed AI feedback
              </p>
            </div>
            <AudioRecorder onRecordingComplete={handleRecordingComplete} isAnalyzing={isAnalyzing} />
            
            {/* Quick Tips */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
              <CardHeader>
                <CardTitle className="text-lg">💡 Quick Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Speak in a quiet environment for better analysis</li>
                  <li>• Record for at least 30 seconds to get comprehensive feedback</li>
                  <li>• Speak naturally - pretend you're talking to a friend</li>
                  <li>• Try different topics: presentations, casual conversations, or storytelling</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {currentAnalysis ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your Speech Analysis</h2>
                  <p className="text-gray-600">
                    Here's what our AI discovered about your speaking style
                  </p>
                </div>
                <SpeechAnalysis analysis={currentAnalysis} duration={currentDuration} />
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">
                    Record a speech first to see your detailed analysis here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Recording History</h2>
              <p className="text-gray-600">
                Track your progress over time and review past analyses
              </p>
            </div>
            <RecordingHistory
              recordings={recordings}
              onPlay={handlePlayRecording}
              onDelete={handleDeleteRecording}
              onViewAnalysis={handleViewAnalysis}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
