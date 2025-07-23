import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Download, Mic, Zap, Smile, Gauge, TrendingUp, AlertTriangle, ChevronRight, ChevronLeft, Info, FileText, BarChart2, Volume2, Repeat, ArrowLeft, ArrowRight, CheckCircle, Circle, Pause, Share2, LogOut, HelpCircle, History, Settings, User } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import classNames from 'classnames'; // If not installed, run: npm install classnames
import { useAuth } from '@/hooks/useAuth';
import RecordingHistory from '@/components/RecordingHistory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserPreferences from './UserPreferences';
import Auth from '@/components/Auth'; // Added import for Auth component

// Props interface for all analysis data (replace with real types as needed)
interface SpeechAnalysisResultsDashboardProps {
  // All analysis data props here (for now, use mock data below)
}

// Mock data for demonstration
const mockMeta = {
  date: 'March 15, 2024',
  time: '2:30 PM',
  duration: '3:24',
};
const overallScore = 85;
const keyMetrics = [
  { title: 'Clarity', score: 92, desc: 'Excellent pronunciation', icon: <Mic className="w-5 h-5 text-primary" /> },
  { title: 'Pace', score: 78, desc: '145 WPM – Good speed', icon: <Gauge className="w-5 h-5 text-primary" /> },
  { title: 'Confidence', score: 89, desc: 'Strong vocal presence', icon: <Smile className="w-5 h-5 text-primary" /> },
  { title: 'Filler Words', score: 12, desc: 'Room for improvement', icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
];
const fillerWords = [
  { time: '0:45', word: 'um' },
  { time: '1:23', word: 'uh' },
  { time: '2:10', word: 'like' },
];
const donutData = [
  { name: 'Confident', value: 65, color: '#22c55e' },
  { name: 'Neutral', value: 25, color: '#3b82f6' },
  { name: 'Other', value: 10, color: '#a1a1aa' },
];
const improvementTips = [
  {
    title: 'Reduce Filler Words',
    desc: "You used 12 filler words... Try pausing instead of saying 'um'",
    cta: 'Practice Exercise',
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
  },
  {
    title: 'Maintain Consistent Pace',
    desc: 'Your speaking pace varied between 120–170 WPM. Aim for 140–160 WPM',
    cta: 'Practice Exercise',
    icon: <Gauge className="w-6 h-6 text-primary" />,
  },
];
const progressData = [
  { week: 'Week 1', Clarity: 70, Pace: 65, Confidence: 60 },
  { week: 'Week 2', Clarity: 75, Pace: 70, Confidence: 68 },
  { week: 'Week 3', Clarity: 80, Pace: 72, Confidence: 75 },
  { week: 'Week 4', Clarity: 85, Pace: 75, Confidence: 80 },
  { week: 'Week 5', Clarity: 92, Pace: 78, Confidence: 89 },
];

const SpeechAnalysisResultsDashboard: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [recordings, setRecordings] = React.useState([]);
  const [isReEvaluating, setIsReEvaluating] = React.useState(null);
  const [loadingRecordings, setLoadingRecordings] = React.useState(false);

  // Get analysis from navigation state if available
  const location = useLocation();
  const [analysis, setAnalysis] = React.useState<any>(location.state?.analysis || null);
  const [duration, setDuration] = React.useState<number | null>(location.state?.duration || null);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(location.state?.audioBlob || null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);

  // Fetch latest analysis from DB if not present in state
  React.useEffect(() => {
    if (!analysis && user) {
      const fetchLatest = async () => {
        setLoadingAnalysis(true);
        try {
          const { data, error } = await supabase
            .from('speech_recordings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (error) {
            toast({
              title: 'Error loading latest analysis',
              description: 'Failed to load your latest analysis.',
              variant: 'destructive',
            });
          } else if (data) {
            setAnalysis(data.analysis_data);
            setDuration(data.duration);
            // If you want to support audio playback, set audioUrl if available
            if (data.audio_url) {
              setAnalysis((prev: any) => ({ ...prev, audioUrl: data.audio_url }));
            }
          }
        } finally {
          setLoadingAnalysis(false);
        }
      };
      fetchLatest();
    }
    // eslint-disable-next-line
  }, [user, analysis]);

  // Show loading state while checking auth or fetching analysis
  if (loading || loadingAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth component if user is not signed in
  if (!user) {
    return <Auth />;
  }

  // If no analysis is available, show a message and mock data
  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">No analysis data found</h2>
          <p className="text-muted-foreground mb-4">You are viewing <span className="font-semibold text-primary">demo/mock data</span>. To see your real analysis, please record and analyze your speech.</p>
          <Button size="lg" onClick={() => navigate('/app')}>Record Now</Button>
        </div>
        {/* Show the dashboard with mock data below the message */}
        <div className="w-full max-w-4xl">
          {/* Minimal Navbar (mock) */}
          <nav className="w-full flex items-center justify-between px-6 py-2 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/milao_logo.png" alt="Milao Logo" className="w-24 h-24 rounded-xl object-contain p-1" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/app')}>Record Again</Button>
              <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/history')}>History</Button>
              <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/analysis-result')}>Dashboard</Button>
            </div>
          </nav>
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-8">
              {/* Use the same dashboard layout but with mock data */}
              {/* You can reuse the mockMeta, overallScore, keyMetrics, etc. from the top of the file */}
              {/* Section 1: Overall Performance Banner */}
              <div className="md:col-span-12">
                <div className="w-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white rounded-xl shadow-md overflow-hidden mb-6">
                  <div className="flex flex-col md:flex-row items-center justify-between p-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Overall Performance</h2>
                      <p className="text-sm opacity-90">Great improvement from your last session!</p>
                    </div>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                      <div className="relative flex items-center justify-center">
                        <svg width="80" height="80" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="36" stroke="#a5b4fc" strokeWidth="8" fill="none" />
                          <circle
                            cx="40" cy="40" r="36"
                            stroke="#fff"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 36}
                            strokeDashoffset={2 * Math.PI * 36 * (1 - overallScore / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s' }}
                          />
                          <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="2rem" fontWeight="bold" fill="#fff">{overallScore}</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Section 2: Key Performance Metrics Grid */}
              <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {keyMetrics.map((metric, i) => (
                  <div key={metric.title} className="shadow-md p-4 rounded-xl hover:scale-[1.03] transition-transform duration-200 cursor-pointer bg-white">
                    <div className="flex flex-row items-center gap-3 pb-2">
                      {metric.icon}
                      <span className="text-lg font-bold">{metric.title}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">{metric.score}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{metric.desc}</div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(metric.score, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Section 3: Filler Words */}
              <div className="md:col-span-7 mt-6">
                <div className="rounded-xl shadow-md p-4 flex flex-col gap-4 bg-white">
                  <div className="flex flex-row items-center gap-2 pb-2">
                    <span className="text-lg font-bold">Filler Words</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    {fillerWords.length > 0 ? fillerWords.map((fw, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-orange-600">
                        <span className="font-semibold">{fw.time}</span>
                        <span>– “{fw.word}”</span>
                      </div>
                    )) : <span className="text-muted-foreground">No filler words detected 🎉</span>}
                  </div>
                </div>
              </div>
              {/* Section 4: Tone & Emotion Analysis */}
              <div className="md:col-span-5 mt-6">
                <div className="rounded-xl shadow-md p-4 flex flex-col gap-4 bg-white">
                  <span className="text-lg font-bold mb-2">Tone & Emotion Analysis</span>
                  <div className="flex justify-center gap-4 mt-2">
                    {donutData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span>{d.name}</span>
                        <span className="font-semibold">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Section 5: Personalized Improvement Tips */}
              <div className="md:col-span-12 mt-6">
                <div className="rounded-xl shadow-md p-4 bg-white">
                  <span className="text-lg font-bold mb-2">Personalized Improvement Tips</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {improvementTips.map((tip, i) => (
                      <div key={i} className="bg-muted/40 rounded-lg p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-center gap-2 mb-1">
                          {tip.icon}
                          <span className="font-semibold text-base">{tip.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{tip.desc}</div>
                        <Button size="default" variant="outline" className="w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                          {tip.cta}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Section 6: Progress Over Time */}
              <div className="md:col-span-12 mt-6">
                <div className="rounded-xl shadow-md p-4 bg-white">
                  <span className="text-lg font-bold mb-2">Progress Over Time</span>
                  <div className="flex flex-col gap-2">
                    {progressData.map((d, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="font-semibold w-20">{d.week}</span>
                        <span>Clarity: {d.Clarity}</span>
                        <span>Pace: {d.Pace}</span>
                        <span>Confidence: {d.Confidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    if (user) {
      fetchRecordings();
    } else {
      setRecordings([]);
    }
    // eslint-disable-next-line
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
        toast({
          title: 'Error loading recordings',
          description: 'Failed to load your recording history.',
          variant: 'destructive',
        });
        return;
      }
      if (data) {
        setRecordings(data.map(record => ({
          id: record.id,
          date: record.created_at,
          duration: record.duration,
          overallScore: record.overall_score || 0,
          clarityScore: record.clarity_score || 0,
          pace: record.pace || 0,
          fillerWords: record.filler_words_count || 0,
          primaryTone: record.primary_tone || 'neutral',
          analysis: record.analysis_data,
          audioUrl: record.audio_url || undefined
        })));
      }
    } catch (error) {
      toast({
        title: 'Error loading recordings',
        description: 'Failed to load your recording history.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecordings(false);
    }
  };

  // Handlers for play, delete, view analysis, re-evaluate (can be no-ops or toasts for now)
  const handlePlayRecording = () => toast({ title: 'Play', description: 'Playback not implemented in dashboard.' });
  const handleDeleteRecording = () => toast({ title: 'Delete', description: 'Delete not implemented in dashboard.' });
  const handleViewAnalysis = () => toast({ title: 'View Analysis', description: 'View analysis not implemented in dashboard.' });
  const handleReEvaluate = () => toast({ title: 'Re-Evaluate', description: 'Re-evaluate not implemented in dashboard.' });

  // Add state for audio playback
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  // Handler to play/pause audio
  const handlePlayAudio = () => {
    if (!analysis?.audioUrl) return;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } else {
      const newAudio = new Audio(analysis.audioUrl);
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
      newAudio.onended = () => setIsPlaying(false);
    }
  };

  React.useEffect(() => {
    // Pause audio when navigating away or analysis changes
    return () => {
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    };
  }, [analysis]);

  // Helper: Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use real data if available, else fallback to mock
  const meta = analysis
    ? {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: formatTime(analysis.duration || duration || 0),
      }
    : mockMeta;

  // Overall score: use overall_score if present, else confidence, else mock
  const realOverallScore = analysis?.overall_score ?? (analysis?.confidence ? Math.round(analysis.confidence * 100) : overallScore);

  // Key metrics
  const realKeyMetrics = analysis
    ? [
        {
          title: 'Clarity',
          score: Math.round((analysis.confidence || 0.8) * 100),
          desc: 'Transcription confidence',
          icon: <Mic className="w-5 h-5 text-primary" />,
        },
        {
          title: 'Pace',
          score: (() => {
            const words = analysis.words?.length || 0;
            const mins = (analysis.duration || duration || 0) / 60;
            return mins > 0 ? Math.round(words / mins) : 0;
          })(),
          desc: `${(() => {
            const words = analysis.words?.length || 0;
            const mins = (analysis.duration || duration || 0) / 60;
            return mins > 0 ? Math.round(words / mins) : 0;
          })()} WPM`,
          icon: <Gauge className="w-5 h-5 text-primary" />,
        },
        {
          title: 'Confidence',
          score: Math.round((analysis.confidence || 0.8) * 100),
          desc: analysis.sentiment?.sentiment ? `Sentiment: ${analysis.sentiment.sentiment}` : 'N/A',
          icon: <Smile className="w-5 h-5 text-primary" />,
        },
        {
          title: 'Filler Words',
          score: (() => {
            if (!analysis.words) return 0;
            return analysis.words.filter((w: any) => w.filler).length;
          })(),
          desc: 'Detected filler words',
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        },
      ]
    : keyMetrics;

  // Filler words with timestamps
  const realFillerWords = analysis?.words
    ? analysis.words
        .filter((w: any) => w.filler)
        .map((w: any) => ({ time: formatTime(w.start / 1000), word: w.text }))
    : fillerWords;

  // Transcript with speaker diarization
  const transcript = analysis?.transcript || '';
  const speakers = analysis?.speakers || [];

  // Summary/Chapters
  const summary = analysis?.summary || '';
  const chapters = analysis?.highlights || analysis?.auto_highlights_result || [];

  // Entities/Topics
  const entities = analysis?.entities || [];
  const topics = analysis?.categories ? Object.keys(analysis.categories) : [];

  // Content Safety
  const contentSafety = analysis?.contentSafety || {};

  // Sentiment/Emotion
  const sentiment = analysis?.sentiment?.sentiment || '';

  // Pie chart for sentiment (mocked for now)
  const realDonutData = sentiment
    ? [
        { name: sentiment, value: 80, color: '#22c55e' },
        { name: 'Other', value: 20, color: '#a1a1aa' },
      ]
    : donutData;

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Minimal Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-2 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/milao_logo.png" alt="Milao Logo" className="w-24 h-24 rounded-xl object-contain p-1" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/app')}>Record Again</Button>
          <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/history')}>History</Button>
          <Button variant="ghost" className="text-gray-700 font-medium" onClick={() => navigate('/analysis-result')}>Dashboard</Button>
          <div className="relative group">
            <Button variant="ghost" className="p-0 rounded-full w-10 h-10 flex items-center justify-center">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${user?.id || 'user'}`} alt="Profile" className="w-8 h-8 rounded-full" />
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
              <div className="p-4 border-b">
                <div className="font-semibold text-gray-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-gray-700" onClick={() => navigate('/preferences')}><Settings className="w-4 h-4 mr-2" />Settings</Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700" onClick={() => window.open('/USER_GUIDE.md', '_blank')}><HelpCircle className="w-4 h-4 mr-2" />Help</Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {historyOpen ? (
            <>
              <Button variant="ghost" className="mb-4" onClick={() => setHistoryOpen(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
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
            </>
          ) : (
            <>
              {/* History Modal/Section as overlay */}
              {/* Header & Metadata */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Speech Analysis Results</h1>
                  <div className="text-muted-foreground text-sm mt-1">
                    Recorded on {meta.date} at {meta.time} • Duration: {meta.duration}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </Button>
                  <Button size="sm" variant="secondary" className="flex items-center gap-2">
                    <Repeat className="w-4 h-4" /> Record Again
                  </Button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* Section 1: Overall Performance Banner */}
                <div className="md:col-span-12">
                  <Card className="w-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white rounded-xl shadow-md overflow-hidden">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
                      <div>
                        <h2 className="text-xl font-bold mb-1">Overall Performance</h2>
                        <p className="text-sm opacity-90">Great improvement from your last session!</p>
                      </div>
                      <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <div className="relative flex items-center justify-center">
                          <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" stroke="#a5b4fc" strokeWidth="8" fill="none" />
                            <circle
                              cx="40" cy="40" r="36"
                              stroke="#fff"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={2 * Math.PI * 36}
                              strokeDashoffset={2 * Math.PI * 36 * (1 - realOverallScore / 100)}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1s' }}
                            />
                            <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="2rem" fontWeight="bold" fill="#fff">{realOverallScore}</text>
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section 2: Key Performance Metrics Grid */}
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {realKeyMetrics.map((metric, i) => (
                    <Card key={metric.title} className="shadow-md p-4 rounded-xl hover:scale-[1.03] transition-transform duration-200 cursor-pointer">
                      <CardHeader className="flex flex-row items-center gap-3 pb-2">
                        {metric.icon}
                        <CardTitle className="text-lg font-bold">{metric.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold">{metric.score}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">{metric.desc}</div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className={classNames('h-2 rounded-full', {
                            'bg-primary': i === 0,
                            'bg-blue-500': i === 1,
                            'bg-green-500': i === 2,
                            'bg-orange-500': i === 3,
                          })} style={{ width: `${Math.min(metric.score, 100)}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Section 3 & 4: Audio Playback + Filler Words & Tone/Emotion Donut */}
                <div className="md:col-span-7 mt-6">
                  <Card className="rounded-xl shadow-md p-4 flex flex-col gap-4">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <Volume2 className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Audio Playback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        {/* Audio Bar */}
                        <div className="flex items-center gap-2">
                          {analysis?.audioUrl ? (
                            <Button variant="outline" size="icon" aria-label={isPlaying ? 'Pause' : 'Play'} onClick={handlePlayAudio}>
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </Button>
                          ) : (
                            <Button variant="outline" size="icon" aria-label="No audio" disabled>
                              <Volume2 className="w-5 h-5 text-gray-400" />
                            </Button>
                          )}
                          <div className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-2 bg-primary rounded-full" style={{ width: analysis?.duration ? `${Math.min((analysis.duration / (duration || 1)) * 100, 100)}%` : '40%' }} />
                          </div>
                          <span className="text-xs text-muted-foreground">0:00 / {meta.duration}</span>
                        </div>
                        {/* Filler Words */}
                        <div className="flex flex-col gap-1 mt-2">
                          {realFillerWords.length > 0 ? realFillerWords.map((fw, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="font-semibold">{fw.time}</span>
                              <span>– “{fw.word}”</span>
                            </div>
                          )) : <span className="text-muted-foreground">No filler words detected 🎉</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:col-span-5 mt-6">
                  <Card className="rounded-xl shadow-md p-4 flex flex-col gap-4">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <BarChart2 className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Tone & Emotion Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={realDonutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {realDonutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {realDonutData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ background: d.color }} />
                            <span>{d.name}</span>
                            <span className="font-semibold">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section: Transcript & Speakers */}
                <div className="md:col-span-12 mt-6">
                  <Card className="rounded-xl shadow-md p-4">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Transcript</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {speakers.length > 0 ? (
                        <div className="space-y-2">
                          {speakers.map((s: any, i: number) => (
                            <div key={i} className="flex gap-2 items-baseline">
                              <span className="font-bold text-purple-700">Speaker {s.speaker}:</span>
                              <span className="text-gray-800">{s.text}</span>
                              <span className="text-xs text-gray-400 ml-2">({formatTime((s.start || 0) / 1000)} - {formatTime((s.end || 0) / 1000)})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">{transcript}</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Section: Summary/Chapters */}
                {summary && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-bold">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">{summary}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {chapters.length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <ChevronRight className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-bold">Chapters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-6 space-y-1">
                          {chapters.map((c: any, i: number) => (
                            <li key={i} className="text-gray-800">
                              {c.text || c.highlight || c.title} {c.start ? `(${formatTime((c.start || 0) / 1000)})` : ''}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Section: Entities */}
                {entities.length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Info className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-bold">Entities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {entities.map((e: any, i: number) => (
                            <Badge key={i} variant="secondary">{e.text} <span className="text-xs text-gray-400 ml-1">({e.entity_type})</span></Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Section: Topics */}
                {topics.length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-bold">Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((t: string, i: number) => (
                            <Badge key={i} variant="outline">{t}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Section: Content Safety */}
                {contentSafety && Object.keys(contentSafety).length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <CardTitle className="text-lg font-bold">Content Safety Flags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-6 space-y-1">
                          {Object.entries(contentSafety).map(([k, v]: [string, any], i) => (
                            <li key={i} className="text-gray-800">
                              {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Section: Filler Word Analysis */}
                {analysis && (analysis.words || []).filter((w: any) => w.filler).length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <CardTitle className="text-lg font-bold">Filler Word Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Array.isArray(analysis.words) ? (
                          <>
                            <div className="mb-2 text-sm text-muted-foreground">
                              Filler Word Percentage: <span className="font-semibold text-orange-600">{(((analysis.words || []).filter((w: any) => w.filler).length / (analysis.words?.length || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500">
                                    <th className="pr-4">Time</th>
                                    <th className="pr-4">Word</th>
                                    <th>Context</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(analysis.words || []).filter((w: any) => w.filler).map((w: any, i: number) => (
                                    <tr key={i} className="border-b last:border-0">
                                      <td className="pr-4 font-mono">{formatTime(w.start / 1000)}</td>
                                      <td className="pr-4 text-orange-600 font-semibold">{w.text}</td>
                                      <td className="text-gray-700">{(analysis.words || []).slice(Math.max(0, i-2), i+3).map((cw: any) => cw.text).join(' ')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground">No word data available for this analysis.</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {/* Section: Speaker Breakdown */}
                {analysis && speakers.length > 0 && (
                  <div className="md:col-span-12 mt-6">
                    <Card className="rounded-xl shadow-md p-4">
                      <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <User className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg font-bold">Speaker Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Number of Speakers: <span className="font-semibold text-primary">{[...new Set(speakers.map((s: any) => s.speaker))].length}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="pr-4">Speaker</th>
                                <th className="pr-4">Total Duration</th>
                                <th className="pr-4">Word Count</th>
                                <th>Sample</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from(new Set(speakers.map((s: any) => s.speaker))).map((spk: any) => {
                                const utterances = speakers.filter((s: any) => s.speaker === spk);
                                const totalDuration = utterances.reduce((acc: number, u: any) => acc + ((u.end - u.start) / 1000), 0);
                                const wordCount = utterances.reduce((acc: number, u: any) => acc + (u.text.split(' ').length), 0);
                                return (
                                  <tr key={spk} className="border-b last:border-0">
                                    <td className="pr-4 font-semibold text-primary">Speaker {spk}</td>
                                    <td className="pr-4">{totalDuration.toFixed(1)}s</td>
                                    <td className="pr-4">{wordCount}</td>
                                    <td className="text-gray-700">{utterances[0]?.text.slice(0, 40)}...</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Section 5: Personalized Improvement Tips (keep mock for now) */}
                <div className="md:col-span-12 mt-6">
                  <Card className="rounded-xl shadow-md p-4">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <Info className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Personalized Improvement Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {improvementTips.map((tip, i) => (
                          <div key={i} className="bg-muted/40 rounded-lg p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex items-center gap-2 mb-1">
                              {tip.icon}
                              <span className="font-semibold text-base">{tip.title}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">{tip.desc}</div>
                            <Button size="default" variant="outline" className="w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                              {tip.cta}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section 6: Progress Over Time (keep mock for now) */}
                <div className="md:col-span-12 mt-6">
                  <Card className="rounded-xl shadow-md p-4">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Progress Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={progressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis domain={[50, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Clarity" stroke="#6366f1" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Pace" stroke="#3b82f6" />
                          <Line type="monotone" dataKey="Confidence" stroke="#22c55e" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
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

export default SpeechAnalysisResultsDashboard; 