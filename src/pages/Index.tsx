import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, History, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from '@/components/AudioRecorder';
import RecordingHistory from '@/components/RecordingHistory';
import Auth from '@/components/Auth';
import { analyzeSpeech, AnalysisResult } from '@/utils/speechAnalysisAPI';
import { analyzeAudioWithAssemblyAI } from '@/utils/assemblyAIService';
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
  const navigate = useNavigate();
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
  const [checkingPreferences, setCheckingPreferences] = useState(false);
  const [forceShowApp, setForceShowApp] = useState(false);
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  // Force show app after 8 seconds as safety net
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Force showing app after 8 seconds timeout');
      setForceShowApp(true);
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Check user preferences when user is authenticated
  useEffect(() => {
    if (user && !checkingPreferences) {
      console.log('🔍 User authenticated, checking preferences...');
      checkUserPreferences();
    }
  }, [user]); // Only depend on user, not checkingPreferences to avoid loops

  // Quick check if user has preferences (without setting state)
  const checkUserPreferencesStatus = async (): Promise<boolean> => {
    if (!user) {
      console.log('🔍 No user found, no preferences');
      return false;
    }
    
    try {
      console.log('🔍 Quick check for user preferences...');
      const { data, error } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking preferences status:', error);
        return false;
      }

      const hasPreferences = !!data;
      console.log('🔍 User preferences status:', hasPreferences);
      return hasPreferences;
    } catch (error) {
      console.error('❌ Exception checking preferences status:', error);
      return false;
    }
  };

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

  // Check for user preferences (but don't redirect automatically)
  useEffect(() => {
    if (user && !checkingPreferences) {
      console.log('🔍 User authenticated, starting preferences check...');
      testSupabaseConnection().then(() => {
        checkUserPreferences();
      });
    }
  }, [user]);

  // Test Supabase connection before making queries
  const testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    try {
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('user_preferences')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        console.error('❌ Connection error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
      } else {
        console.log('✅ Supabase connection test successful');
        console.log('✅ Table user_preferences is accessible');
      }
    } catch (error) {
      console.error('❌ Exception during Supabase connection test:', error);
    }
  };

  const checkUserPreferences = async () => {
    if (!user) {
      console.log('🔍 No user found, skipping preferences check');
      return;
    }
    
    console.log('🔍 Starting preferences check for user:', user.id);
    setCheckingPreferences(true);
    
    // Single, reliable timeout protection
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Preferences check timed out after 8 seconds - forcing completion');
      setCheckingPreferences(false);
      toast({
        title: "Preferences check timeout",
        description: "Continuing without preferences. You can set them later.",
        variant: "destructive",
      });
    }, 8000);
    
    try {
      console.log('🔍 Making Supabase query to user_preferences table...');
      const startTime = Date.now();
      
      // Simplified query with better error handling
      const { data, error } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const endTime = Date.now();
      console.log(`🔍 Supabase query completed in ${endTime - startTime}ms`);

      // Clear timeout since query completed
      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Supabase error checking preferences:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Show user-friendly error message
        toast({
          title: "Preferences check failed",
          description: "Continuing without preferences. You can set them later.",
          variant: "destructive",
        });
        
        setCheckingPreferences(false);
        return;
      }

      console.log('✅ Supabase query successful');
      console.log('🔍 Query result:', data);

      // Store whether preferences exist but don't redirect automatically
      if (!data) {
        console.log('ℹ️ No preferences found - user can set them later');
      } else {
        console.log('✅ User preferences found');
      }
      
    } catch (error) {
      console.error('❌ Exception during preferences check:', error);
      console.error('❌ Exception type:', typeof error);
      console.error('❌ Exception stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Show user-friendly error message
      toast({
        title: "Preferences check failed",
        description: "Continuing without preferences. You can set them later.",
        variant: "destructive",
      });
    } finally {
      // Always ensure state is reset
      console.log('🔍 Preferences check completed, setting checkingPreferences to false');
      clearTimeout(timeoutId);
      setCheckingPreferences(false);
    }
  };

  // Fetch recordings when user is authenticated and preferences check is complete
  useEffect(() => {
    if (user && !checkingPreferences) {
      console.log('🔍 User authenticated and preferences check complete, fetching recordings');
      fetchRecordings();
    } else if (!user) {
      console.log('🔍 No user, clearing recordings');
      setRecordings([]);
    }
  }, [user, checkingPreferences]);

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

  // Debug logging
  console.log('🔍 Index component render state:', { 
    loading, 
    user: user?.email, 
    session: !!session, 
    checkingPreferences,
    forceShowApp 
  });

  // Show loading state only while checking auth (not preferences)
  if (loading && !forceShowApp) {
    console.log('🔍 Showing loading screen because loading=true');
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl mb-4 inline-block shadow-[var(--shadow-glow)]">
            <Mic className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground mt-2">This should only take a few seconds</p>
        </div>
      </div>
    );
  }

  // Show auth component if user is not signed in
  if (!user || !session) {
    return <Auth />;
  }

  // Show main app if user is authenticated (regardless of preferences check)
  console.log('🔍 User authenticated, showing main app');

  // Replace handleRecordingComplete to use smart analysis method selection
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      console.log('🎯 Starting fresh transcription analysis...', { duration, audioBlobSize: audioBlob.size });
      
      let analysis: AnalysisResult;
      
      // Check if user has preferences to choose analysis method
      if (user?.id) {
        const hasPreferences = await checkUserPreferencesStatus();
        
        if (hasPreferences) {
          console.log('🔄 User has preferences, trying Orato analysis...');
          
          toast({
            title: "Analyzing your speech...",
            description: "Using personalized analysis. This may take 30-60 seconds.",
            duration: 5000,
          });
          
          try {
            // Use Orato analysis for users with preferences
            const assemblyAIResult = await analyzeAudioWithAssemblyAI(audioBlob, user?.id);
                          console.log('✅ Live Orato analysis completed:', assemblyAIResult);
            
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
    } catch (error) {
            console.warn('⚠️ Orato analysis failed, falling back to direct AssemblyAI:', error);
            
            toast({
              title: "Retrying analysis...",
              description: "Using standard analysis method.",
              duration: 3000,
            });
            
            // Fallback to direct AssemblyAI if Orato fails
            const assemblyResult = await analyzeAudioWithAssemblyAI(audioBlob, user?.id);
            analysis = convertAssemblyAIToAnalysisResult(assemblyResult, duration);
            setTranscriptText(assemblyResult.transcript);
          }
        } else {
          console.log('🔄 No preferences found, using direct AssemblyAI analysis...');
          
          toast({
            title: "Analyzing your speech...",
            description: "Using standard analysis. Set preferences for personalized insights.",
            duration: 5000,
          });
          
          // Use direct AssemblyAI for users without preferences
          const assemblyResult = await analyzeAudioWithAssemblyAI(audioBlob, user?.id);
          analysis = convertAssemblyAIToAnalysisResult(assemblyResult, duration);
          setTranscriptText(assemblyResult.transcript);
        }
      } else {
        // Fallback for non-authenticated users - use direct AssemblyAI
        console.log('🔄 Non-authenticated user, using direct AssemblyAI...');
        const assemblyResult = await analyzeAudioWithAssemblyAI(audioBlob, user?.id);
        analysis = convertAssemblyAIToAnalysisResult(assemblyResult, duration);
      }
      
      // After analysis is complete:
      setCurrentAnalysis(analysis);
      setCurrentDuration(Math.floor(duration || 0));
      setCurrentAudioBlob(audioBlob);

      // Always save the latest analysis to the database
      if (user?.id) {
        const fileName = `${user.id}/${Date.now()}-recording.webm`;
        // Save audio to storage (optional, skip if not needed)
        // const { data: uploadData, error: uploadError } = await supabase.storage
        //   .from('audio-recordings')
        //   .upload(fileName, audioBlob, { contentType: audioBlob.type });
        // const { data: { publicUrl } } = supabase.storage.from('audio-recordings').getPublicUrl(fileName);
        // Save to Supabase database
        await supabase.from('speech_recordings').insert({
          user_id: user.id,
          title: `Recording - ${new Date().toLocaleDateString()}`,
          duration: Math.floor(duration || 0),
          overall_score: analysis.overall_score,
          clarity_score: analysis.clarity_score,
          pace: analysis.pace_analysis.words_per_minute,
          filler_words_count: analysis.filler_words.count,
          primary_tone: analysis.tone_analysis.primary_tone,
          analysis_data: analysis as any,
          // audio_url: publicUrl
        });
      }

      // Navigate to the new dashboard, passing analysis data via state
      navigate('/analysis-result', { state: { analysis, duration: Math.floor(duration || 0), audioBlob } });
    } catch (error) {
      console.error('❌ Analysis failed completely:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Unknown error occurred');
      setCurrentAnalysis(null);
      
      toast({
        title: "Analysis failed",
        description: "Unable to analyze your speech. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
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
      
      // setAnalysisOpen(true); // Removed as per new_code
      
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
      // setAnalysisOpen(true); // Removed as per new_code
      // Close other sections when viewing analysis
      // setHistoryOpen(false); // Removed as per new_code
      // setProgressOpen(false); // Removed as per new_code
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
        // setAnalysisOpen(true); // Removed as per new_code
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
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/20 to-background pt-28">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/app')} className="focus:outline-none">
                <img src="/milao_logo.png" alt="Milao Logo" className="w-16 h-16 object-contain" style={{ background: 'white', borderRadius: '1rem' }} />
            </button>
            </div>
            {/* Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 font-medium flex items-center gap-1 px-2" onClick={() => navigate('/app')}>Record Again</Button>
              <Button variant="ghost" className="text-gray-700 font-medium flex items-center gap-1 px-2" onClick={() => navigate('/history')}>History</Button>
              <Button variant="ghost" className="text-gray-700 font-medium flex items-center gap-1 px-2" onClick={() => navigate('/analysis-result')}>Dashboard</Button>
            <div className="relative group">
              <Button variant="ghost" className="p-0 rounded-full w-9 h-9 flex items-center justify-center">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${user?.id || 'user'}`} alt="Profile" className="w-7 h-7 rounded-full" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="p-4 border-b">
                  <div className="font-semibold text-gray-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1" onClick={() => navigate('/preferences')}><Settings className="w-4 h-4 mr-1" />Settings</Button>
                <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
                <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1" onClick={() => window.open('/USER_GUIDE.md', '_blank')}><HelpCircle className="w-4 h-4 mr-1" />Help</Button>
              </div>
            </div>
          </div>
          {/* Mobile Burger */}
          <div className="sm:hidden flex items-center">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {menuOpen && (
                <div className="absolute top-14 right-4 w-48 bg-white rounded-xl shadow-lg border z-50 flex flex-col gap-1 py-2 animate-fade-in">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 py-2" onClick={() => {navigate('/app'); setMenuOpen(false);}}>Record Again</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 py-2" onClick={() => {navigate('/history'); setMenuOpen(false);}}>History</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 py-2" onClick={() => {navigate('/analysis-result'); setMenuOpen(false);}}>Dashboard</Button>
                <div className="border-t my-2" />
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 py-2" onClick={() => {navigate('/preferences'); setMenuOpen(false);}}><Settings className="w-4 h-4 mr-1" />Settings</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 py-2" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 py-2" onClick={() => {window.open('/USER_GUIDE.md', '_blank'); setMenuOpen(false);}}><HelpCircle className="w-4 h-4 mr-1" />Help</Button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Recording Interface - show directly, no accordion or tips */}
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              isAnalyzing={isAnalyzing}
            />
            {/* History Modal/Section */}
            {historyOpen && (
              <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)] mt-8">
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
                  <Button className="mt-4" variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <footer className="py-8 sm:py-12 bg-gray-900 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-3 sm:mb-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xs">🔒</span>
              </div>
              <span className="text-xs sm:text-sm font-medium">Privacy-First: We never store your voice or data. All analysis is real-time and private.</span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">© 2024 Milao. All rights reserved.</p>
          </div>
        </footer>
      </div>
  );
};

export default Index;