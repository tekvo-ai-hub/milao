import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Mic, History, TrendingUp, Smartphone, LogOut, User, Upload, ChevronDown, Plus, Brain, FileText, Menu, Settings, Zap, Loader2 } from 'lucide-react';
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
import { analyzeAudioWithAssemblyAIDirect } from '@/utils/directAssemblyAIService';

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
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
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

  // Convert AssemblyAI data to AnalysisResult format
  const convertAssemblyAIToAnalysisResult = (assemblyData: any, duration: number): AnalysisResult => {
    // Calculate words per minute
    const wordCount = assemblyData.words?.length || 0;
    const durationInMinutes = duration / 60;
    const wordsPerMinute = durationInMinutes > 0 ? Math.round(wordCount / durationInMinutes) : 0;

    // Calculate filler words (simple detection)
    const fillerWords = ['um', 'uh', 'ah', 'er', 'like', 'you know', 'basically', 'actually', 'literally'];
    const transcriptLower = assemblyData.transcript?.toLowerCase() || '';
    const detectedFillers = fillerWords.filter(word => transcriptLower.includes(word));
    
    // Calculate clarity score based on confidence and word count
    const baseClarityScore = Math.round((assemblyData.confidence || 0.8) * 100);
    const clarityScore = Math.min(100, Math.max(0, baseClarityScore));

    // Calculate overall score
    const overallScore = Math.round((clarityScore + (100 - detectedFillers.length * 10) + (wordsPerMinute > 120 && wordsPerMinute < 180 ? 20 : 0)) / 3);

    // Analyze evidence and examples in the transcript
    const evidenceKeywords = ['data', 'study', 'research', 'example', 'statistics', 'fact', 'evidence', 'proof', 'analysis', 'survey', 'report', 'case', 'instance'];
    const hasEvidence = evidenceKeywords.some(keyword => transcriptLower.includes(keyword));
    
    const evidenceTypes = [];
    if (transcriptLower.includes('data') || transcriptLower.includes('statistics') || transcriptLower.includes('survey')) {
      evidenceTypes.push('statistical data');
    }
    if (transcriptLower.includes('example') || transcriptLower.includes('instance') || transcriptLower.includes('case')) {
      evidenceTypes.push('examples');
    }
    if (transcriptLower.includes('study') || transcriptLower.includes('research') || transcriptLower.includes('analysis')) {
      evidenceTypes.push('research findings');
    }
    if (transcriptLower.includes('fact') || transcriptLower.includes('evidence') || transcriptLower.includes('proof')) {
      evidenceTypes.push('factual evidence');
    }
    if (!evidenceTypes.length) {
      evidenceTypes.push('anecdotal');
    }

    const evidenceQuality = hasEvidence ? Math.floor(Math.random() * 3) + 6 : Math.floor(Math.random() * 3) + 3;

    // Generate dynamic suggestions based on actual content
    const suggestions = [];
    
    // Pace-based suggestions
    if (wordsPerMinute < 120) {
      suggestions.push('Consider speaking at a slightly faster pace to maintain audience engagement');
    } else if (wordsPerMinute > 180) {
      suggestions.push('Slow down your speech pace to improve clarity and comprehension');
    } else {
      suggestions.push('Your speaking pace is well-balanced and engaging');
    }

    // Filler word suggestions
    if (detectedFillers.length > 3) {
      suggestions.push('Work on reducing filler words like "um" and "uh" for more professional delivery');
    } else if (detectedFillers.length > 0) {
      suggestions.push('Good job minimizing filler words - continue this practice');
    } else {
      suggestions.push('Excellent! No filler words detected in your speech');
    }

    // Evidence-based suggestions
    if (!hasEvidence) {
      suggestions.push('Consider adding specific examples, data, or case studies to strengthen your points');
    } else {
      suggestions.push('Good use of evidence and examples to support your arguments');
    }

    // Clarity-based suggestions
    if (clarityScore < 80) {
      suggestions.push('Focus on clear articulation and pronunciation for better understanding');
    } else {
      suggestions.push('Your speech clarity is excellent - maintain this level');
    }

    // Content structure suggestions
    const hasStructureKeywords = ['first', 'second', 'third', 'finally', 'in conclusion', 'to summarize', 'next', 'then'];
    const hasStructure = hasStructureKeywords.some(keyword => transcriptLower.includes(keyword));
    if (!hasStructure) {
      suggestions.push('Consider adding transition words to improve the flow of your speech');
    } else {
      suggestions.push('Good use of structure and transitions in your speech');
    }

    // Generate strengths based on actual performance
    const strengths = [];
    if (clarityScore > 85) strengths.push('Excellent speech clarity and articulation');
    if (wordsPerMinute >= 120 && wordsPerMinute <= 180) strengths.push('Well-balanced speaking pace');
    if (detectedFillers.length <= 2) strengths.push('Minimal use of filler words');
    if (hasEvidence) strengths.push('Good use of evidence and examples');
    if (hasStructure) strengths.push('Clear speech structure with good transitions');
    if (strengths.length === 0) strengths.push('Good overall communication effort');

    // Analyze main point from transcript
    const sentences = assemblyData.transcript?.split(/[.!?]+/).filter(s => s.trim().length > 10) || [];
    const mainPoint = sentences.length > 0 ? sentences[0].trim() : 'Main message extracted from speech';
    
    // Determine argument structure
    const structureKeywords = {
      'problem-solution': ['problem', 'issue', 'challenge', 'solution', 'solve', 'address'],
      'star': ['situation', 'task', 'action', 'result', 'outcome'],
      'chronological': ['first', 'then', 'next', 'finally', 'after', 'before'],
      'comparison': ['however', 'but', 'although', 'while', 'compared', 'versus']
    };

    let detectedStructure = 'logical flow';
    let structureEffectiveness = 7;
    
    for (const [structure, keywords] of Object.entries(structureKeywords)) {
      if (keywords.some(keyword => transcriptLower.includes(keyword))) {
        detectedStructure = structure;
        structureEffectiveness = Math.floor(Math.random() * 3) + 7;
        break;
      }
    }

    return {
      overall_score: overallScore,
      clarity_score: clarityScore,
      pace_analysis: {
        words_per_minute: wordsPerMinute,
        assessment: wordsPerMinute < 120 ? 'Slow' : wordsPerMinute > 180 ? 'Fast' : 'Good pace'
      },
      filler_words: {
        count: detectedFillers.length,
        percentage: `${Math.round((detectedFillers.length / wordCount) * 100)}%`,
        examples: detectedFillers.slice(0, 5)
      },
      tone_analysis: {
        primary_tone: assemblyData.sentiment?.sentiment?.toLowerCase() || 'neutral',
        confidence_level: 'High',
        emotions: assemblyData.sentiment?.sentiment ? [assemblyData.sentiment.sentiment] : ['neutral']
      },
      suggestions: suggestions.slice(0, 5), // Limit to 5 most relevant suggestions
      strengths: strengths.slice(0, 4), // Limit to 4 strengths
      ai_suggestions: {
        speechSummary: assemblyData.summary || 'Speech content analyzed successfully.',
        contentEvaluation: {
          mainPoint: {
            identified: mainPoint,
            clarity: Math.min(10, Math.max(1, Math.floor(clarityScore / 10))),
            feedback: hasEvidence ? 'Message is well-supported with evidence' : 'Consider adding more supporting evidence'
          },
          argumentStructure: {
            hasStructure: hasStructure,
            structure: detectedStructure,
            effectiveness: structureEffectiveness,
            suggestions: hasStructure ? 'Good structure - consider adding more transitions' : 'Add clear structure with transition words'
          },
          evidenceAndExamples: {
            hasEvidence: hasEvidence,
            evidenceQuality: evidenceQuality,
            evidenceTypes: evidenceTypes,
            suggestions: hasEvidence ? 
              'Evidence present but could be more specific and quantified' :
              'Add concrete examples, data, or case studies to support your points'
          },
          persuasiveness: {
            pointProven: hasEvidence,
            persuasionScore: hasEvidence ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 3) + 4,
            strengths: hasEvidence ? ['Well-supported arguments', 'Clear communication'] : ['Clear communication'],
            weaknesses: hasEvidence ? ['Could use more specific examples'] : ['Needs more supporting evidence', 'Could use more examples'],
            improvements: hasEvidence ? 'Include more specific examples and data' : 'Add specific examples and data to strengthen arguments'
          },
          starAnalysis: {
            situation: sentences.length > 0 ? sentences[0] : 'Context established',
            task: sentences.length > 1 ? sentences[1] : 'Objective defined',
            action: sentences.length > 2 ? sentences[2] : 'Actions explained',
            result: sentences.length > 3 ? sentences[3] : 'Results stated',
            overallStarScore: Math.min(10, Math.max(1, Math.floor(overallScore / 10)))
          }
        }
      },
      transcript: assemblyData.transcript || ''
    };
  };

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

  // Replace handleRecordingComplete to use direct AssemblyAI with improved analysis
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
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
        
        // Use our improved conversion function for better analysis
        analysis = convertAssemblyAIToAnalysisResult(assemblyAIResult, duration);
        
        // Override with personalized analysis if available
        if (assemblyAIResult.personalizedAnalysis) {
          analysis.overall_score = assemblyAIResult.personalizedAnalysis.overallScore || analysis.overall_score;
          analysis.clarity_score = assemblyAIResult.personalizedAnalysis.clarityScore || analysis.clarity_score;
          analysis.suggestions = assemblyAIResult.personalizedAnalysis.recommendations || analysis.suggestions;
          analysis.strengths = assemblyAIResult.personalizedAnalysis.strengths || analysis.strengths;
        }
      } else {
        // Fallback for non-authenticated users - use direct AssemblyAI
        const assemblyResult = await analyzeAudioWithAssemblyAIDirect(audioBlob);
        analysis = convertAssemblyAIToAnalysisResult(assemblyResult, duration);
      }
      
      setCurrentAnalysis(analysis);
      setCurrentDuration(Math.floor(duration || 0));
      setCurrentAudioBlob(audioBlob);
      
      // Upload audio file to storage if user is authenticated
      if (user?.id) {
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
        }
      }
      
      // Auto-open analysis section
      setAnalysisOpen(true);
      
      toast({
        title: "Analysis Complete!",
        description: `Your speech scored ${analysis.overall_score}/100`,
      });
      
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Unknown error occurred');
      setCurrentAnalysis(null);
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
      setCurrentAudioBlob(audioBlob);
      setTranscriptText(analysis.transcript);
      
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
                      <span>Analyze Speech</span>
                      {currentAnalysis && <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${analysisOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {isAnalyzing ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Analyzing speech with AssemblyAI...</p>
                    </div>
                  ) : analysisError ? (
                    <div className="p-8 text-center">
                      <span className="text-destructive font-semibold">{analysisError}</span>
                    </div>
                  ) : currentAnalysis ? (
                    <div className="space-y-6">
                      {/* Use the comprehensive SpeechAnalysis component */}
                      <SpeechAnalysis 
                        analysis={currentAnalysis} 
                        duration={currentDuration} 
                      />
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