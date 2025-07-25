import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Download, Mic, Zap, Smile, Gauge, TrendingUp, AlertTriangle, ChevronRight, ChevronLeft, Info, FileText, BarChart2, Volume2, Repeat, ArrowLeft, ArrowRight, CheckCircle, Circle, Pause, Share2, LogOut, HelpCircle, History, Settings, User, MessageSquare, Target, Shield, Star, Users, Clock, Hash, Tag, Home, Activity, PieChart, Target as TargetIcon, Shield as ShieldIcon, FileText as FileTextIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from 'recharts';
import classNames from 'classnames';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Auth from '@/components/Auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  // Get analysis from navigation state
  const [analysis, setAnalysis] = React.useState<any>(location.state?.analysis || null);
  const [duration, setDuration] = React.useState<number | null>(location.state?.duration || null);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(location.state?.audioBlob || null);
  const [loadingAnalysis, setLoadingAnalysis] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedSection, setSelectedSection] = React.useState('overview');
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('=== SPEECH ANALYSIS DASHBOARD DEBUG ===');
    console.log('Location state:', location.state);
    console.log('User:', user);
    console.log('Loading:', loading);
    console.log('Analysis:', analysis);
    console.log('Loading Analysis:', loadingAnalysis);
    console.log('=====================================');
  }, [location.state, user, loading, analysis, loadingAnalysis]);

  // Set analysis data from navigation state
  React.useEffect(() => {
    if (location.state?.analysis) {
      console.log('Setting analysis from navigation state');
      setAnalysis(location.state.analysis);
      setDuration(location.state.duration);
      setAudioBlob(location.state.audioBlob);
    }
  }, [location.state]);

  // Fetch latest analysis from database if not present in state
  React.useEffect(() => {
    if (!analysis && user) {
      console.log('Fetching latest analysis from database');
        setLoadingAnalysis(true);
      const fetchLatestAnalysis = async () => {
        try {
          const { data, error } = await supabase
            .from('speech_recordings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (error) {
            console.log('No analysis data found in database:', error.message);
          } else if (data) {
            console.log('Found analysis data in database:', data);
            setAnalysis(data.analysis_data);
            setDuration(data.duration);
            if (data.audio_url) {
              setAnalysis((prev: any) => ({ ...prev, audioUrl: data.audio_url }));
            }
          }
        } catch (error) {
          console.log('Error fetching analysis from database:', error);
        } finally {
          setLoadingAnalysis(false);
        }
      };
      
      fetchLatestAnalysis();
    } else {
      setLoadingAnalysis(false);
    }
  }, [user, analysis]);

  // Show loading state
  if (loading || loadingAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p>{loadingAnalysis ? 'Loading your latest analysis...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Show auth if not logged in
  if (!user) {
    return <Auth />;
  }

  // Check if we have analysis data
  const hasAnalysisData = analysis || location.state?.analysis;
  
  // Helper function to format time
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

  // Define filler words list once
  const FILLER_WORDS = ['um', 'uh', 'ah', 'er', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of'];

  // Unified filler words array from analysis.words
  const fillerWordsList = analysis?.words && Array.isArray(analysis.words)
    ? analysis.words.filter((w: any) => FILLER_WORDS.includes(w.text.toLowerCase()))
    : [];

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
            let wordCount = 0;
            if (analysis.words && Array.isArray(analysis.words)) {
              wordCount = analysis.words.length;
            } else if (analysis.transcript) {
              wordCount = analysis.transcript.split(' ').length;
            }
            const mins = (analysis.duration || duration || 0) / 60;
            return mins > 0 ? Math.round(wordCount / mins) : 0;
          })(),
          desc: (() => {
            let wordCount = 0;
            if (analysis.words && Array.isArray(analysis.words)) {
              wordCount = analysis.words.length;
            } else if (analysis.transcript) {
              wordCount = analysis.transcript.split(' ').length;
            }
            const mins = (analysis.duration || duration || 0) / 60;
            const wpm = mins > 0 ? Math.round(wordCount / mins) : 0;
            return `${wpm} WPM`;
          })(),
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
          score: fillerWordsList.length,
          desc: 'Detected filler words',
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        },
      ]
    : keyMetrics;

  // Filler words with timestamps for overview
  const realFillerWords = fillerWordsList.map((w: any) => ({ time: formatTime(w.start / 1000), word: w.text }));

  // Transcript
  const transcript = analysis?.transcript || '';

  // Sentiment data
  const sentiment = analysis?.sentiment;

  // Entities
  const entities = analysis?.entities || [];
  
  // Categories/Topics
  const categories = analysis?.categories || {};
  
  // Highlights
  const highlights = analysis?.highlights || [];
  
  // Speakers
  const speakers = analysis?.speakers || [];

  // Content Safety
  const contentSafety = analysis?.contentSafety || {};

  // Words with confidence
  const words = analysis?.words || [];

  // Navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'transcript', label: 'Transcript', icon: <FileTextIcon className="w-4 h-4" /> },
    { id: 'sentiment', label: 'Sentiment', icon: <Smile className="w-4 h-4" /> },
    { id: 'entities', label: 'Entities', icon: <TargetIcon className="w-4 h-4" /> },
    { id: 'safety', label: 'Content Safety', icon: <ShieldIcon className="w-4 h-4" /> },
    { id: 'details', label: 'Details', icon: <Activity className="w-4 h-4" /> },
  ];

  // Section details mapping
  const sectionDetails: Record<string, React.ReactNode> = {
    overview: (
      <div className="flex flex-col items-center justify-center rounded-2xl p-8 text-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div className="text-lg font-bold mb-2">Overview</div>
        <div className="text-base font-semibold text-primary mb-1">Filler words detected: {realFillerWords.length}</div>
        <div className="text-sm text-gray-500 mt-1 bg-gray-100/60 rounded-lg px-3 py-2 inline-block shadow-sm">
          {realFillerWords.length > 0
            ? realFillerWords.slice(0, 5).map(fw => fw.word).join(', ')
            : <span className="italic text-gray-400">None detected</span>}
        </div>
      </div>
    ),
    transcript: (
      <div className="rounded-2xl p-8 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-lg font-bold mb-2">Transcript</div>
          <div className="text-sm text-muted-foreground mb-2">{analysis?.words?.length || (analysis?.transcript ? analysis.transcript.split(' ').length : 0)} words</div>
          <div className="whitespace-pre-line break-words text-base text-gray-900 bg-white rounded-lg p-4 border max-h-96 overflow-y-auto shadow-inner">
            {transcript}
          </div>
        </div>
      </div>
    ),
    sentiment: (
      <div className="rounded-2xl p-8 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-lg font-bold mb-2">Sentiment</div>
          <div className="text-sm text-muted-foreground">{sentiment?.sentiment || 'N/A'}</div>
        </div>
      </div>
    ),
    entities: (
      <div className="rounded-2xl p-8 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-lg font-bold mb-2">Entities</div>
          <div className="text-sm text-muted-foreground">{entities.length} entities</div>
        </div>
      </div>
    ),
    safety: (
      <div className="rounded-2xl p-8 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-lg font-bold mb-2">Content Safety</div>
          <div className="text-sm text-muted-foreground">{Object.keys(contentSafety).length > 0 ? `${Object.keys(contentSafety).length} flags` : 'Clean'}</div>
        </div>
      </div>
    ),
    details: (
      <div className="rounded-2xl p-8 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20" style={{ boxShadow: 'none' }}>
        <div>
          <div className="text-lg font-bold mb-2">Details</div>
          <div className="text-sm text-muted-foreground">{speakers.length > 0 ? speakers.length : 1} speaker(s)</div>
        </div>
      </div>
    ),
  };

  // Find the timestamp for the analysis (from location.state or analysis)
  const analysisTimestamp = location.state?.created_at || analysis?.created_at || analysis?.updated_at;
  let isOldAnalysis = false;
  if (analysisTimestamp) {
    const analysisDate = new Date(analysisTimestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - analysisDate.getTime()) / 60000;
    isOldAnalysis = diffMinutes > 5;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col pt-28">
      {isOldAnalysis && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center font-semibold border-b border-yellow-300">
          Warning: This analysis is more than 5 minutes old. Please record or upload a new speech for the latest results.
        </div>
      )}
      {/* Top Navigation Bar - match /app */}
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
                <div className="absolute top-14 right-4 w-48 bg-white rounded-xl shadow-lg border z-50 flex flex-col py-2 animate-fade-in">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 mb-2" onClick={() => {navigate('/app'); setMenuOpen(false);}}>Record Again</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 mb-2" onClick={() => {navigate('/history'); setMenuOpen(false);}}>History</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 px-2 mb-2" onClick={() => {navigate('/analysis-result'); setMenuOpen(false);}}>Dashboard</Button>
                  <div className="border-t my-2" />
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 mb-2" onClick={() => {navigate('/preferences'); setMenuOpen(false);}}><Settings className="w-4 h-4 mr-1" />Settings</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1 mb-2" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
                  <Button variant="ghost" className="w-full justify-start text-gray-700 flex items-center gap-1" onClick={() => {window.open('/USER_GUIDE.md', '_blank'); setMenuOpen(false);}}><HelpCircle className="w-4 h-4 mr-1" />Help</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-8 w-full max-w-5xl h-full mx-auto py-6 px-2 sm:px-4 md:py-10">
        {/* Row 1: Performance + 4 metrics in 2x2 grid */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Performance Card */}
          <div className="w-full md:w-1/3 flex flex-col justify-center mb-4 md:mb-0">
            <Card className="rounded-lg border border-primary/20 p-4 flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="8"
                    strokeDasharray={`${(realOverallScore / 100) * 339.292} 339.292`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-primary">{realOverallScore}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">Performance</h3>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </Card>
          </div>
          {/* 2x2 grid of 4 metrics */}
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 md:grid-rows-2 gap-4">
            {realKeyMetrics.map((metric, i) => (
              <Card key={metric.title} className="rounded-lg border border-primary/20 p-4 flex items-center gap-4">
                {metric.icon}
                <div className="flex-1">
                  <div className="text-lg font-bold text-gray-900 mb-1">{metric.title}</div>
                  <div className="text-2xl font-extrabold text-primary mb-0.5">{metric.score}</div>
                  <div className="text-xs text-muted-foreground font-medium">{metric.desc}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Row 2: Analysis Sections + Details */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Analysis Sections List */}
          <div className="w-full md:w-1/3 flex flex-col gap-6 mb-4 md:mb-0">
            <Card className="rounded-lg border border-primary/20 p-4">
              <div className="text-lg font-bold mb-4">Analysis Sections</div>
              <ul className="space-y-3">
                {navItems.map((item) => {
                  // Get corresponding value for each section
                  let sectionValue = '';
                  let sectionIcon = item.icon;
                  switch (item.id) {
                    case 'overview':
                      sectionValue = `${realFillerWords.length} filler words`;
                      sectionIcon = <AlertTriangle className="w-5 h-5 text-orange-500" />;
                      break;
                    case 'transcript':
                      const wordCount = analysis?.words?.length || (analysis?.transcript ? analysis.transcript.split(' ').length : 0);
                      sectionValue = `${wordCount} words`;
                      sectionIcon = <FileTextIcon className="w-5 h-5 text-blue-500" />;
                      break;
                    case 'sentiment':
                      if (sentiment?.sentiment) {
                        sectionValue = sentiment.sentiment;
                        sectionIcon = <Smile className="w-5 h-5 text-green-500" />;
                      } else {
                        sectionValue = 'N/A';
                        sectionIcon = <Smile className="w-5 h-5 text-gray-400" />;
                      }
                      break;
                    case 'entities':
                      const entityCount = entities.length;
                      sectionValue = `${entityCount} entities`;
                      sectionIcon = <TargetIcon className="w-5 h-5 text-purple-500" />;
                      break;
                    case 'safety':
                      sectionValue = Object.keys(contentSafety).length > 0 ? `${Object.keys(contentSafety).length} flags` : 'Clean';
                      sectionIcon = <ShieldIcon className="w-5 h-5 text-red-500" />;
                      break;
                    case 'details':
                      sectionValue = `${speakers.length > 0 ? speakers.length : 1} speaker(s)`;
                      sectionIcon = <Activity className="w-5 h-5 text-yellow-500" />;
                      break;
                  }
                  return (
                    <li key={item.id} className={`flex items-center justify-between cursor-pointer rounded hover:bg-gray-100 px-2 py-1 ${selectedSection === item.id ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedSection(item.id)}>
                      <div className="flex items-center gap-3">
                        {sectionIcon}
                        <span className="text-base font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{sectionValue}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
          {/* Details Card for selected section */}
          <div className="w-full md:w-2/3 flex flex-col gap-6">
            {sectionDetails[selectedSection]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechAnalysisResultsDashboard; 