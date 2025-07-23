import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ChevronDown, User, Target, AlertTriangle, GraduationCap, Palette, Shield, Save, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UserPreferences {
  id?: string;
  user_id?: string;
  display_name?: string;
  age?: number;
  location?: string;
  native_language?: string;
  speaking_goal?: string;
  target_audience?: string;
  scenario?: string;
  accent_challenges?: string[];
  fluency_level?: string;
  vocabulary_level?: string;
  confidence_level?: string;
  learning_style?: string;
  preferred_format?: string;
  practice_frequency?: string;
  feedback_style?: string;
  tone_preference?: string;
  role_models?: string;
  recording_consent?: boolean;
  reminders_enabled?: boolean;
  gamification_enabled?: boolean;
}

const UserPreferences: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMandatory = searchParams.get('mandatory') === 'true';
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChallenge, setNewChallenge] = useState('');
  
  // Collapsible states
  const [personalOpen, setPersonalOpen] = useState(true);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          ...preferences,
          user_id: user.id,
        });

      if (error) throw error;

      // Log preferences update activity
      try {
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'preferences_updated',
          p_activity_data: { 
            mandatory: isMandatory,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log preferences activity:', logError);
      }

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });

      // If this was a mandatory setup, redirect to main page
      if (isMandatory) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const addChallenge = () => {
    if (newChallenge.trim()) {
      const challenges = preferences.accent_challenges || [];
      updatePreference('accent_challenges', [...challenges, newChallenge.trim()]);
      setNewChallenge('');
    }
  };

  const removeChallenge = (index: number) => {
    const challenges = preferences.accent_challenges || [];
    updatePreference('accent_challenges', challenges.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-[var(--glass-border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {!isMandatory && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/app')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {isMandatory ? 'Welcome! Set up your preferences' : 'Preferences'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isMandatory 
                  ? 'Please complete your profile to get started' 
                  : 'Customize your experience'
                }
              </p>
            </div>
            <Button onClick={savePreferences} disabled={saving} size="sm">
              {isMandatory ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {saving ? 'Saving...' : isMandatory ? 'Complete Setup' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        
        {/* Personal Information */}
        <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Personal Information</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${personalOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={preferences.display_name || ''}
                    onChange={(e) => updatePreference('display_name', e.target.value)}
                    placeholder="Your preferred name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={preferences.age || ''}
                      onChange={(e) => updatePreference('age', parseInt(e.target.value) || null)}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="native_language">Native Language</Label>
                    <Input
                      id="native_language"
                      value={preferences.native_language || ''}
                      onChange={(e) => updatePreference('native_language', e.target.value)}
                      placeholder="English"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={preferences.location || ''}
                    onChange={(e) => updatePreference('location', e.target.value)}
                    placeholder="Your location"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Goals & Context */}
        <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Goals & Context</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${goalsOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>What are you trying to achieve?</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="speaking_goal">Speaking Goal</Label>
                  <Textarea
                    id="speaking_goal"
                    value={preferences.speaking_goal || ''}
                    onChange={(e) => updatePreference('speaking_goal', e.target.value)}
                    placeholder="e.g., Improve presentation skills, reduce accent, etc."
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Input
                    id="target_audience"
                    value={preferences.target_audience || ''}
                    onChange={(e) => updatePreference('target_audience', e.target.value)}
                    placeholder="e.g., Business colleagues, students, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="scenario">Typical Scenario</Label>
                  <Textarea
                    id="scenario"
                    value={preferences.scenario || ''}
                    onChange={(e) => updatePreference('scenario', e.target.value)}
                    placeholder="e.g., Business meetings, public speaking, conversations"
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Speaking Challenges */}
        <Collapsible open={challengesOpen} onOpenChange={setChallengesOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    <span>Speaking Challenges</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${challengesOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>Areas you'd like to improve</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label>Accent Challenges</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newChallenge}
                      onChange={(e) => setNewChallenge(e.target.value)}
                      placeholder="Add a challenge"
                      onKeyPress={(e) => e.key === 'Enter' && addChallenge()}
                    />
                    <Button onClick={addChallenge} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(preferences.accent_challenges || []).map((challenge, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {challenge}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeChallenge(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fluency_level">Fluency Level</Label>
                    <Select value={preferences.fluency_level || ''} onValueChange={(value) => updatePreference('fluency_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="native">Native</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vocabulary_level">Vocabulary Level</Label>
                    <Select value={preferences.vocabulary_level || ''} onValueChange={(value) => updatePreference('vocabulary_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="confidence_level">Confidence Level</Label>
                    <Select value={preferences.confidence_level || ''} onValueChange={(value) => updatePreference('confidence_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Learning Preferences */}
        <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <span>Learning Preferences</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${learningOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>How do you prefer to learn?</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="learning_style">Learning Style</Label>
                  <Select value={preferences.learning_style || ''} onValueChange={(value) => updatePreference('learning_style', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual</SelectItem>
                      <SelectItem value="auditory">Auditory</SelectItem>
                      <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="preferred_format">Preferred Format</Label>
                  <Select value={preferences.preferred_format || ''} onValueChange={(value) => updatePreference('preferred_format', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="summary">Quick Summary</SelectItem>
                      <SelectItem value="actionable">Actionable Tips</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="practice_frequency">Practice Frequency</Label>
                  <Select value={preferences.practice_frequency || ''} onValueChange={(value) => updatePreference('practice_frequency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="as-needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="feedback_style">Feedback Style</Label>
                  <Select value={preferences.feedback_style || ''} onValueChange={(value) => updatePreference('feedback_style', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="constructive">Constructive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Accent & Style */}
        <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <span>Accent & Style</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${styleOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>Your speaking style preferences</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tone_preference">Tone Preference</Label>
                  <Select value={preferences.tone_preference || ''} onValueChange={(value) => updatePreference('tone_preference', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role_models">Role Models or Speaking Examples</Label>
                  <Textarea
                    id="role_models"
                    value={preferences.role_models || ''}
                    onChange={(e) => updatePreference('role_models', e.target.value)}
                    placeholder="e.g., TED speakers, news anchors, specific people you admire"
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Consent & Privacy */}
        <Collapsible open={consentOpen} onOpenChange={setConsentOpen}>
          <Card className="border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Privacy & Notifications</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${consentOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
                <CardDescription>Your privacy and notification preferences</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="recording_consent"
                    checked={preferences.recording_consent || false}
                    onCheckedChange={(checked) => updatePreference('recording_consent', checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="recording_consent" className="text-sm font-medium">
                      Recording Consent
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I consent to recording my voice for analysis purposes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="reminders_enabled"
                    checked={preferences.reminders_enabled || false}
                    onCheckedChange={(checked) => updatePreference('reminders_enabled', checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="reminders_enabled" className="text-sm font-medium">
                      Practice Reminders
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notifications to remind you to practice speaking
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="gamification_enabled"
                    checked={preferences.gamification_enabled || false}
                    onCheckedChange={(checked) => updatePreference('gamification_enabled', checked)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="gamification_enabled" className="text-sm font-medium">
                      Gamification Features
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable streaks, achievements, and progress tracking
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Bottom Save Button */}
        <div className="pt-4 pb-8">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full h-12 text-base"
          >
            {isMandatory ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saving 
              ? 'Saving Preferences...' 
              : isMandatory 
                ? 'Complete Setup & Get Started' 
                : 'Save All Preferences'
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;