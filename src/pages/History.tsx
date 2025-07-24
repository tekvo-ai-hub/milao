import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Mic, Gauge, Smile, AlertTriangle, Edit, Trash2, BarChart2, TrendingUp, Clock, ChevronLeft, ChevronRight, BookOpen, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, HelpCircle, Settings } from 'lucide-react';

// Dummy data and types (replace with Supabase integration)
type Recording = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  tag: string;
  metrics: { clarity: number; pace: number; confidence: number; fillerWords: number; };
  overall: number;
};

const dummyRecordings: Recording[] = [
  {
    id: '1',
    title: 'Product Launch Presentation',
    date: 'Today',
    time: '2:30 PM',
    duration: '3:45',
    tag: 'Presentation',
    metrics: { clarity: 85, pace: 92, confidence: 81, fillerWords: 7 },
    overall: 87,
  },
  {
    id: '2',
    title: 'Interview Practice Session',
    date: 'Yesterday',
    time: '11:00 AM',
    duration: '4:10',
    tag: 'Interview',
    metrics: { clarity: 72, pace: 65, confidence: 78, fillerWords: 15 },
    overall: 74,
  },
  {
    id: '3',
    title: 'Storytelling Practice',
    date: '2 days ago',
    time: '5:20 PM',
    duration: '2:55',
    tag: 'Practice',
    metrics: { clarity: 91, pace: 88, confidence: 93, fillerWords: 3 },
    overall: 91,
  },
];

const statCards = [
  { label: 'Total Recordings', value: 47, icon: <Mic className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' },
  { label: 'Average Score', value: '82%', icon: <Gauge className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
  { label: 'Practice Time', value: '24h', icon: <Clock className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
  { label: 'Improvement', value: '+15%', icon: <TrendingUp className="w-6 h-6 text-pink-600" />, bg: 'bg-pink-50' },
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'interview', label: 'Interview' },
  { value: 'practice', label: 'Practice' },
];

const History: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  // TODO: Replace with real Supabase data fetching
  const filtered = dummyRecordings.filter(r =>
    (category === 'all' || r.tag.toLowerCase() === category) &&
    (search === '' || r.title.toLowerCase().includes(search.toLowerCase()))
  );

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

      {/* Title & Stats */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Recording History</h1>
        <p className="text-gray-500 mb-6 text-sm sm:text-base">Review your past speeches and track your improvement journey.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className={`rounded-2xl shadow-md ${stat.bg}`}>
              <CardContent className="flex items-center gap-4 py-6 px-4">
                <div className="p-3 rounded-xl bg-white/80 shadow-inner">{stat.icon}</div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <div className="text-gray-500 text-xs sm:text-sm font-medium">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between w-full">
          <Input
            className="max-w-xs w-full sm:w-auto rounded-2xl"
            placeholder="Search recordings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48 rounded-2xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recording List */}
        <div className="space-y-6 mb-8 w-full overflow-x-auto">
          {filtered.map((rec) => (
            <Card key={rec.id} className="rounded-2xl shadow-lg p-0 flex flex-col md:flex-row items-center md:items-stretch gap-0 md:gap-6 w-full min-w-[320px]">
              <CardContent className="flex-1 flex flex-col md:flex-row items-center md:items-center gap-4 py-6 px-4 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">{rec.title}</h2>
                    <Badge variant="secondary" className="ml-2 capitalize">{rec.tag}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-2 flex gap-3 flex-wrap">
                    <span>{rec.date}, {rec.time}</span>
                    <span>• {rec.duration}</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-1 text-green-600"><Mic className="w-4 h-4" />{rec.metrics.clarity}%</div>
                    <div className="flex items-center gap-1 text-blue-600"><Gauge className="w-4 h-4" />{rec.metrics.pace}%</div>
                    <div className="flex items-center gap-1 text-purple-600"><Smile className="w-4 h-4" />{rec.metrics.confidence}%</div>
                    <div className="flex items-center gap-1 text-red-600"><AlertTriangle className="w-4 h-4" />{rec.metrics.fillerWords}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold">{rec.overall}% Overall</span>
                    <BarChart2 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 md:justify-center md:items-end">
                  <Button size="icon" variant="outline" className="rounded-full"><Edit className="w-5 h-5" /></Button>
                  <Button size="icon" variant="destructive" className="rounded-full"><Trash2 className="w-5 h-5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-4 mt-4 w-full">
          <span className="text-gray-500 text-xs sm:text-sm sm:order-2 sm:ml-4">Showing {filtered.length} of 47 recordings</span>
          <Pagination className="sm:order-3">
            <PaginationContent>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(p => Math.max(1, p - 1))} isActive={page === 1}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </PaginationLink>
              </PaginationItem>
              {[1, 2, 3].map(num => (
                <PaginationItem key={num}>
                  <PaginationLink isActive={page === num} onClick={() => setPage(num)}>{num}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(p => Math.min(3, p + 1))} isActive={page === 3}>
                  Next <ChevronRight className="w-4 h-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {/* Footer */}
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

export default History; 