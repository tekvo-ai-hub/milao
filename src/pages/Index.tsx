
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, History, TrendingUp, Smartphone, LogOut, User } from 'lucide-react';
import AudioRecorder from '@/components/AudioRecorder';
import SpeechAnalysis from '@/components/SpeechAnalysis';
import RecordingHistory from '@/components/RecordingHistory';
import Auth from '@/components/Auth';
import { analyzeSpeech, AnalysisResult } from '@/utils/speechAnalysisAPI';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
  audioUrl?: string;
}

const Index = () => {
  const { user, session, loading, signOut } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [activeTab, setActiveTab] = useState('record');
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const { toast } = useToast();

  // Fetch recordings when user is authenticated
  useEffect(() => {
    if (user) {
      fetchRecordings();
    } else {
      setRecordings([]);
    }
  }, [user]);

  const fetchRecordings = async () => {
    if (!user) return;
    
    setLoadingRecordings(true);
    try {
      const { data, error } = await supabase
        .from('speech_recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        toast({
          title: "Error loading recordings",
          description: "Failed to load your recording history.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        const formattedRecordings: RecordingData[] = data.map(record => ({
          id: record.id,
          date: record.created_at,
          duration: record.duration,
          overallScore: record.overall_score || 0,
          clarityScore: record.clarity_score || 0,
          pace: record.pace || 0,
          fillerWords: record.filler_words_count || 0,
          primaryTone: record.primary_tone || 'neutral',
          analysis: (record.analysis_data as unknown) as AnalysisResult,
          audioUrl: record.audio_url || undefined
        }));
        setRecordings(formattedRecordings);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast({
        title: "Error loading recordings",
        description: "Failed to load your recording history.",
        variant: "destructive",
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 inline-block">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth component if user is not signed in
  if (!user || !session) {
    return <Auth />;
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSpeech(audioBlob, duration);
      setCurrentAnalysis(analysis);
      setCurrentDuration(duration);
      
      // Upload audio file to storage
      const fileName = `${user.id}/${Date.now()}-recording.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm'
        });

      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        toast({
          title: "Upload Failed",
          description: "Could not save audio file.",
          variant: "destructive",
        });
        return;
      }

      // Get the public URL for the audio file
      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName);
      
      // Save to Supabase database with audio URL
      const { error } = await supabase
        .from('speech_recordings')
        .insert({
          user_id: user.id,
          title: `Recording ${new Date().toLocaleDateString()}`,
          duration,
          overall_score: analysis.overall_score,
          clarity_score: analysis.clarity_score,
          pace: analysis.pace_analysis.words_per_minute,
          filler_words_count: analysis.filler_words.count,
          primary_tone: analysis.tone_analysis.primary_tone,
          analysis_data: analysis as any,
          audio_url: publicUrl
        });

      if (error) {
        console.error('Error saving recording:', error);
        toast({
          title: "Save Failed",
          description: "Recording analyzed but couldn't save to database.",
          variant: "destructive",
        });
      } else {
        // Refresh recordings from database to stay in sync
        fetchRecordings();
        toast({
          title: "Analysis Complete!",
          description: `Your speech scored ${analysis.overall_score}/100`,
        });
      }
      
      setActiveTab('analysis');
      
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

  const handlePlayRecording = async (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording && recording.audioUrl) {
      try {
        // Extract file path from URL
        const urlParts = recording.audioUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'audio-recordings');
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Get signed URL for private audio file
        const { data, error } = await supabase.storage
          .from('audio-recordings')
          .createSignedUrl(filePath, 60); // 1 minute expiry

        if (error) {
          console.error('Error getting signed URL:', error);
          toast({
            title: "Playback Failed", 
            description: "Could not load audio file.",
            variant: "destructive",
          });
          return;
        }

        const audio = new Audio(data.signedUrl);
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          toast({
            title: "Playback Failed",
            description: "Could not play audio file.",
            variant: "destructive",
          });
        });
      } catch (error) {
        console.error('Error playing recording:', error);
        toast({
          title: "Playback Failed",
          description: "Could not play audio file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      const recording = recordings.find(r => r.id === id);
      
      // Delete from database
      const { error } = await supabase
        .from('speech_recordings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete recording from database.",
          variant: "destructive",
        });
        return;
      }

      // Delete audio file from storage if it exists
      if (recording?.audioUrl) {
        const urlParts = recording.audioUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'audio-recordings');
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        const { error: storageError } = await supabase.storage
          .from('audio-recordings')
          .remove([filePath]);

        if (storageError) {
          console.error('Error deleting audio file:', storageError);
        }
      }

      setRecordings(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Recording Deleted",
        description: "The recording has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete recording.",
        variant: "destructive",
      });
    }
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
        {/* Header with user info */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Speech AI Coach
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
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
