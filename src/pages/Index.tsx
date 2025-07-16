import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Mic, History, TrendingUp, Smartphone, LogOut, User, Upload, ChevronDown, Plus, Brain, FileText, Menu, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import AudioRecorder from '@/components/AudioRecorder';
import AudioUpload from '@/components/AudioUpload';
import SpeechAnalysis from '@/components/SpeechAnalysis';
import RecordingHistory from '@/components/RecordingHistory';
import ProgressReport from '@/components/ProgressReport';
import Auth from '@/components/Auth';
import LLMStatus from '@/components/LLMStatus';
import TextAnalytics from '@/components/TextAnalytics';
import { AppSidebar } from '@/components/AppSidebar';
import { analyzeSpeech, AnalysisResult, generateDynamicMainPoint } from '@/utils/speechAnalysisAPI';
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
import { analyzeWithPersonalizedFeedback, convertToLegacyFormat } from '@/utils/personalizedSpeechAnalysis';
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
  const [isReEvaluating, setIsReEvaluating] = useState<string | null>(null);
  const [recordingMethod, setRecordingMethod] = useState<'record' | 'upload'>('record');
  const [showHeader, setShowHeader] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [transcriptText, setTranscriptText] = useState<string>('');
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl mb-4 inline-block shadow-[var(--shadow-glow)]">
            <Mic className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth component if user is not signed in
  if (!user || !session) {
    return <Auth />;
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setCurrentAudioBlob(audioBlob);
    setIsAnalyzing(true);
    try {
      console.log('🎯 Starting fresh transcription analysis...', { duration, audioBlobSize: audioBlob.size });
      
      let analysis: AnalysisResult;
      
      // Always use live transcription - no cached results
      if (user?.id) {
        console.log('🔄 Using VoicePro for real-time analysis...');
        
        // Use VoicePro analysis for actual transcription
        const assemblyAIResult = await analyzeAudioWithAssemblyAI(audioBlob, user?.id);
        console.log('✅ Live VoicePro analysis completed:', assemblyAIResult);
        
        // Set transcript for TextAnalytics
        setTranscriptText(assemblyAIResult.transcript);
        
        // Convert VoicePro result to our expected format
        analysis = {
          overall_score: assemblyAIResult.confidence ? Math.round(assemblyAIResult.confidence * 100) : 85,
          clarity_score: assemblyAIResult.confidence ? Math.round(assemblyAIResult.confidence * 100) : 85,
          transcript: assemblyAIResult.transcript,
          pace_analysis: {
            words_per_minute: assemblyAIResult.words.length > 0 ? Math.round((assemblyAIResult.words.length / assemblyAIResult.duration) * 60) : 120,
            assessment: 'Normal pace'
          },
          filler_words: {
            count: assemblyAIResult.transcript.split(/\b(um|uh|like|you know|so|well|actually)\b/gi).length - 1,
            percentage: "5%",
            examples: ['um', 'uh', 'like']
          },
          tone_analysis: {
            primary_tone: assemblyAIResult.sentiment?.sentiment || 'Neutral',
            confidence_level: 'Medium',
            emotions: ['Neutral']
          },
          suggestions: [
            "VoicePro analysis complete",
            "Review the transcript for accuracy",
            "Consider the sentiment analysis insights"
          ],
          strengths: [
            "Clear audio quality",
            "Good speech recognition",
            "Comprehensive analysis"
          ],
          ai_suggestions: {
            contentEvaluation: {
              mainPoint: generateDynamicMainPoint(assemblyAIResult.transcript),
              argumentStructure: {
                hasStructure: true,
                structure: "Conversational",
                effectiveness: 7,
                suggestions: "Continue with natural flow"
              },
              evidenceAndExamples: {
                hasEvidence: false,
                evidenceQuality: 5,
                evidenceTypes: [],
                suggestions: "Add specific examples"
              },
              persuasiveness: {
                pointProven: false,
                persuasionScore: 6,
                strengths: ["Clear delivery"],
                weaknesses: ["Could be more persuasive"],
                improvements: "Add supporting evidence"
              },
              starAnalysis: {
                situation: "Not applicable",
                task: "General communication",
                action: "Spoke clearly",
                result: "Message conveyed",
                overallStarScore: 7
              }
            },
            speechSummary: assemblyAIResult.summary || "Speech analyzed successfully"
          }
        };
      } else {
        // Fallback for non-authenticated users
        analysis = await analyzeSpeech(audioBlob, duration);
      }
      
      
      setCurrentAnalysis(analysis);
      setCurrentDuration(Math.floor(duration || 0));
      
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
          duration: Math.floor(duration || 0),
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
          description: `VoicePro analysis done`,
        });
      }
      
      setAnalysisOpen(true);
      
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

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Convert file to blob for analysis
      const audioBlob = new Blob([await file.arrayBuffer()], { type: file.type });
      setCurrentAudioBlob(audioBlob);
      
      // Get audio duration
      const audio = new Audio();
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
        audio.src = URL.createObjectURL(audioBlob);
      });
      
      const analysis = await analyzeSpeech(audioBlob, Math.floor(duration));
      setCurrentAnalysis(analysis);
      setCurrentDuration(Math.floor(duration));
      
      // Upload audio file to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, {
          contentType: file.type
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
          title: `${file.name} - ${new Date().toLocaleDateString()}`,
          duration: Math.floor(duration || 0),
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
      
      setAnalysisOpen(true);
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try uploading again.",
        variant: "destructive",
      });
      console.error('Upload analysis error:', error);
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

        // Find or create audio element for this recording
        let audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
        if (!audio) {
          audio = new Audio(data.signedUrl);
          audio.id = `audio-${id}`;
          audio.style.display = 'none';
          document.body.appendChild(audio);
        } else {
          audio.src = data.signedUrl;
        }

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
      console.log('View Analysis Debug:', {
        id,
        duration: recording.duration,
        overall_score: recording.analysis?.overall_score,
        recordingData: recording
      });
      
      setCurrentAnalysis(recording.analysis);
      setCurrentDuration(recording.duration);
      setAnalysisOpen(true);
      // Close other sections when viewing analysis
      setHistoryOpen(false);
      setProgressOpen(false);
    }
  };

  const handleReEvaluate = async (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (!recording || !recording.audioUrl) {
      toast({
        title: "Re-evaluation Failed",
        description: "Audio file not found for this recording.",
        variant: "destructive",
      });
      return;
    }

    setIsReEvaluating(id);
    try {
      // Extract file path from URL
      const urlParts = recording.audioUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'audio-recordings');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      // Get the audio file from storage
      const { data: audioData, error: downloadError } = await supabase.storage
        .from('audio-recordings')
        .download(filePath);

      if (downloadError) {
        console.error('Error downloading audio:', downloadError);
        toast({
          title: "Re-evaluation Failed",
          description: "Could not download audio file.",
          variant: "destructive",
        });
        return;
      }

      // Re-analyze the audio
      const analysis = await analyzeSpeech(audioData, recording.duration);
      
      // Update the database with new analysis
      const { error: updateError } = await supabase
        .from('speech_recordings')
        .update({
          overall_score: analysis.overall_score,
          clarity_score: analysis.clarity_score,
          pace: analysis.pace_analysis.words_per_minute,
          filler_words_count: analysis.filler_words.count,
          primary_tone: analysis.tone_analysis.primary_tone,
          analysis_data: analysis as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating recording:', updateError);
        toast({
          title: "Update Failed",
          description: "Analysis completed but couldn't save new results.",
          variant: "destructive",
        });
      } else {
        // Refresh recordings and show new analysis
        fetchRecordings();
        setCurrentAnalysis(analysis);
        setCurrentDuration(recording.duration);
        setCurrentAudioBlob(audioData); // Add this line to provide audio for Text Analytics
        setAnalysisOpen(true);
        toast({
          title: "Re-evaluation Complete!",
          description: `Updated analysis - scored ${analysis.overall_score}/100`,
        });
      }

    } catch (error) {
      console.error('Error re-evaluating recording:', error);
      toast({
        title: "Re-evaluation Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReEvaluating(null);
    }

  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <main className="flex-1 bg-gradient-to-br from-background via-accent/20 to-background">
          {/* Header with Sidebar Toggle */}
          <header className="sticky top-0 z-10 bg-card/50 backdrop-blur-md border-b border-[var(--glass-border)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-[var(--shadow-glow)]">
                  <Smartphone className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    VoicePro AI
                  </h1>
                  <p className="text-muted-foreground text-xs">AI Speech Coach</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-muted-foreground bg-card/50 backdrop-blur-sm px-3 py-2 rounded-full border border-[var(--glass-border)]">
                  <User className="w-4 h-4" />
                  <span className="text-sm">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <SidebarTrigger className="p-2 hover:bg-accent/50 rounded-lg transition-colors">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Simple info message */}
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm">
                Enable Local AI for enhanced analysis and better privacy
              </p>
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-4">

          {/* Record Section */}
          <Collapsible open={recordOpen} onOpenChange={setRecordOpen}>
            <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors rounded-t-xl">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-5 h-5 text-primary" />
                      <span>Record</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${recordOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Recording Method Toggle */}
                  <div className="flex space-x-3 mb-6">
                    <Button
                      variant={recordingMethod === 'record' ? 'default' : 'outline'}
                      onClick={() => setRecordingMethod('record')}
                      className={`flex items-center space-x-2 h-12 px-6 rounded-xl transition-all ${
                        recordingMethod === 'record' 
                          ? 'bg-gradient-to-r from-primary to-primary/80 shadow-[var(--shadow-glow)]' 
                          : 'border-[var(--glass-border)] bg-card/30 hover:bg-card/50'
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                      <span className="font-medium">Live Recording</span>
                    </Button>
                    <Button
                      variant={recordingMethod === 'upload' ? 'default' : 'outline'}
                      onClick={() => setRecordingMethod('upload')}
                      className={`flex items-center space-x-2 h-12 px-6 rounded-xl transition-all ${
                        recordingMethod === 'upload' 
                          ? 'bg-gradient-to-r from-primary to-primary/80 shadow-[var(--shadow-glow)]' 
                          : 'border-[var(--glass-border)] bg-card/30 hover:bg-card/50'
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">Upload File</span>
                    </Button>
                  </div>
                  
                  {/* Collapsible Tips */}
                  <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Plus className={`w-4 h-4 transition-transform ${tipsOpen ? 'rotate-45' : ''}`} />
                          <span className="text-sm">Tips for better recording</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                        <ul className="text-sm text-muted-foreground space-y-2">
                          {recordingMethod === 'record' ? (
                            <>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Speak clearly and maintain natural pace</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Choose a quiet environment</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Maximum duration: 5 minutes</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Use pause/resume for better control</span>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Formats: MP3, WAV, WebM, M4A, OGG</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Maximum size: 50MB</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>Optimal duration: 1-5 minutes</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>High quality audio improves accuracy</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Recording Interface */}
                  {recordingMethod === 'record' ? (
                    <AudioRecorder
                      onRecordingComplete={handleRecordingComplete}
                      isAnalyzing={isAnalyzing}
                    />
                  ) : (
                    <AudioUpload
                      onFileSelect={handleFileUpload}
                      isProcessing={isAnalyzing}
                    />
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Content based on sidebar selection */}
          {aiOpen && (
            <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>AI Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TextAnalytics onTranscriptGenerated={setTranscriptText} initialTranscript={transcriptText} />
              </CardContent>
            </Card>
          )}

          {historyOpen && (
            <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>Recording History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <RecordingHistory
                  recordings={recordings}
                  onPlay={handlePlayRecording}
                  onDelete={handleDeleteRecording}
                  onViewAnalysis={handleViewAnalysis}
                  onReEvaluate={handleReEvaluate}
                  isReEvaluating={isReEvaluating}
                  isLoading={loadingRecordings}
                />
              </CardContent>
            </Card>
          )}

          {progressOpen && (
            <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Progress Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressReport recordings={recordings} />
              </CardContent>
            </Card>
          )}

          {/* Analysis Section */}
          <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
            <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors rounded-t-xl">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span>Analysis</span>
                      {currentAnalysis && <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${analysisOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {currentAnalysis ? (
                    <div className="space-y-6">
                      {/* Speech Analysis */}
                      <SpeechAnalysis analysis={currentAnalysis} duration={currentDuration} />
                      
                      {/* Text Analytics section is hidden for now */}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Analysis Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Record or upload an audio file to see detailed speech analysis
                      </p>
                      <Button 
                        onClick={() => {
                          setRecordOpen(true);
                          setAnalysisOpen(false);
                        }}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        Start Recording
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </div>
        </div>
      </main>
        
      <AppSidebar
        onHistoryClick={() => {
          setHistoryOpen(!historyOpen);
          setProgressOpen(false);
          setAnalysisOpen(false);
          setAiOpen(false);
        }}
        onProgressClick={() => {
          setProgressOpen(!progressOpen);
          setHistoryOpen(false);
          setAnalysisOpen(false);
          setAiOpen(false);
        }}
        onAiClick={() => {
          setAiOpen(!aiOpen);
          setHistoryOpen(false);
          setProgressOpen(false);
          setAnalysisOpen(false);
        }}
        historyOpen={historyOpen}
        progressOpen={progressOpen}
        aiOpen={aiOpen}
      />
    </div>
  </SidebarProvider>
  );
};

export default Index;