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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Real recording type
interface Recording {
  id: string;
  title: string;
  created_at: string;
  duration: number;
  overall_score: number | null;
  clarity_score: number | null;
  pace: number | null;
  filler_words_count: number | null;
  primary_tone: string | null;
  analysis_data: any;
  audio_url?: string | null;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'interview', label: 'Interview' },
  { value: 'practice', label: 'Practice' },
];

const PAGE_SIZE = 10;

const History: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecordings([]);
      return;
    }
    setLoading(true);
    supabase
      .from('speech_recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setRecordings([]);
        } else {
          setRecordings(data || []);
        }
        setLoading(false);
      });
  }, [user]);

  // Filter by search and category
  const filtered = recordings.filter(r => {
    const matchesCategory = category === 'all' || (r.primary_tone?.toLowerCase() === category);
    const matchesSearch = search === '' || (r.title?.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Format helpers
  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards = [
    { label: 'Total Recordings', value: recordings.length, icon: <Mic className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' },
    { label: 'Average Score', value: `${recordings.reduce((sum, r) => sum + (r.overall_score || 0), 0) / recordings.length || 0}%`, icon: <Gauge className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Practice Time', value: `${recordings.reduce((sum, r) => sum + r.duration, 0)}s`, icon: <Clock className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
    { label: 'Improvement', value: `${recordings.reduce((sum, r) => sum + (r.overall_score || 0), 0) / recordings.length - 80 || 0}%`, icon: <TrendingUp className="w-6 h-6 text-pink-600" />, bg: 'bg-pink-50' },
  ];

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('speech_recordings').delete().eq('id', deleteId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setRecordings((prev) => prev.filter((r) => r.id !== deleteId));
      toast({ title: 'Recording deleted', description: 'The recording was removed from your history.' });
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const handleEdit = (rec: Recording) => {
    setEditId(rec.id);
    setEditTitle(rec.title || '');
  };

  const handleEditSave = async () => {
    if (!editId) return;
    setEditing(true);
    const { error } = await supabase.from('speech_recordings').update({ title: editTitle }).eq('id', editId).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Edit failed', description: error.message, variant: 'destructive' });
    } else {
      setRecordings((prev) => prev.map((r) => r.id === editId ? { ...r, title: editTitle } : r));
      toast({ title: 'Recording updated', description: 'The title was updated.' });
    }
    setEditing(false);
    setEditId(null);
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

      {/* Title & Stats */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Recording History</h1>
        <p className="text-gray-500 mb-6 text-sm sm:text-base">Review your past speeches and track your improvement journey.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className={`rounded-2xl border border-primary/20 ${stat.bg}`}>
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
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading recordings...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No recordings found.</div>
          ) : paginated.map((rec) => (
            <Card
              key={rec.id}
              className="rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-stretch gap-0 md:gap-6 w-full min-w-[320px] bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60 backdrop-blur-md border border-primary/20"
            >
              <CardContent className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4 w-full p-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      className="text-base sm:text-lg font-bold truncate bg-primary/10 hover:bg-primary/20 transition rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      onClick={() => navigate('/analysis-result', { state: { analysis: rec.analysis_data, duration: rec.duration, audioUrl: rec.audio_url, created_at: rec.created_at, title: rec.title } })}
                    >
                      {rec.title || 'Untitled'}
                    </button>
                    <Badge variant="secondary" className="ml-2 capitalize">{rec.primary_tone || 'N/A'}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-2 flex gap-3 flex-wrap">
                    <span>{formatDate(rec.created_at)}, {formatTime(rec.created_at)}</span>
                    <span>• {formatDuration(rec.duration)}</span>
                  </div>
                  <div className="flex gap-2 sm:gap-4 mb-2 flex-wrap">
                    {/* Clarity (confidence) */}
                    <div className="flex items-center gap-1 text-green-600">
                      <Mic className="w-4 h-4" />
                      {typeof rec.analysis_data?.confidence === 'number'
                        ? `${Math.round(rec.analysis_data.confidence * 100)}`
                        : <span className="text-gray-400">N/A</span>}
                    </div>
                    {/* Pace (WPM) */}
                    <div className="flex items-center gap-1 text-blue-600">
                      <Gauge className="w-4 h-4" />
                      {(() => {
                        let wordCount = 0;
                        if (rec.analysis_data?.words && Array.isArray(rec.analysis_data.words)) {
                          wordCount = rec.analysis_data.words.length;
                        } else if (rec.analysis_data?.transcript) {
                          wordCount = rec.analysis_data.transcript.split(' ').length;
                        }
                        const mins = (rec.duration || 0) / 60;
                        return mins > 0 ? `${Math.round(wordCount / mins)}` : <span className="text-gray-400">N/A</span>;
                      })()}
                    </div>
                    {/* Sentiment */}
                    <div className="flex items-center gap-1 text-purple-600">
                      <Smile className="w-4 h-4" />
                      {rec.analysis_data?.sentiment?.sentiment
                        ? rec.analysis_data.sentiment.sentiment
                        : <span className="text-gray-400">N/A</span>}
                    </div>
                    {/* Filler Words */}
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      {rec.analysis_data?.words && Array.isArray(rec.analysis_data.words)
                        ? rec.analysis_data.words.filter((w: any) => [
                            'um', 'uh', 'ah', 'er', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of'
                          ].includes(w.text.toLowerCase())).length
                        : <span className="text-gray-400">N/A</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold">{rec.overall_score ?? 'N/A'}% Overall</span>
                    <BarChart2 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 md:justify-center md:items-end">
                  <Button size="icon" variant="outline" className="rounded-full" onClick={() => handleEdit(rec)} disabled={deleting}><Edit className="w-5 h-5" /></Button>
                  <Button size="icon" variant="destructive" className="rounded-full" onClick={() => setDeleteId(rec.id)} disabled={deleting}><Trash2 className="w-5 h-5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-center gap-4 mt-4 w-full">
          <span className="text-gray-500 text-xs sm:text-sm sm:order-2 sm:ml-4">Showing {paginated.length} of {filtered.length} recordings (Page {page} of {totalPages})</span>
          <Pagination className="sm:order-3">
            <PaginationContent className="gap-x-2 flex-nowrap">
              <PaginationItem>
                <PaginationLink
                  onClick={page === 1 ? undefined : () => setPage(page - 1)}
                  isActive={false}
                  className={(page === 1 ? 'opacity-50 pointer-events-none ' : '') + 'mr-4'}
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </PaginationLink>
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationLink
                  onClick={page === totalPages ? undefined : () => setPage(page + 1)}
                  isActive={false}
                  className={(page === totalPages ? 'opacity-50 pointer-events-none ' : '') + 'ml-4'}
                >
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recording?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this recording? This action cannot be undone.</div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle"></span> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Title Dialog */}
      <Dialog open={!!editId} onOpenChange={open => !open && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recording Title</DialogTitle>
          </DialogHeader>
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mb-4" autoFocus />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditId(null)} disabled={editing}>Cancel</Button>
            <Button variant="default" onClick={handleEditSave} disabled={editing || !editTitle.trim()}>
              {editing ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle"></span> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History; 