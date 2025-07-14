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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

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
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newChallenge, setNewChallenge] = useState('');

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
        .single();

      if (error && error.code !== 'PGRST116') {
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

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Preferences</h1>
        <p className="text-muted-foreground">Customize your speech analysis experience</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={preferences.display_name || ''}
                    onChange={(e) => updatePreference('display_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={preferences.age || ''}
                    onChange={(e) => updatePreference('age', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={preferences.location || ''}
                  onChange={(e) => updatePreference('location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="native_language">Native Language</Label>
                <Input
                  id="native_language"
                  value={preferences.native_language || ''}
                  onChange={(e) => updatePreference('native_language', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Context</CardTitle>
              <CardDescription>What are you trying to achieve?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="speaking_goal">Speaking Goal</Label>
                <Textarea
                  id="speaking_goal"
                  value={preferences.speaking_goal || ''}
                  onChange={(e) => updatePreference('speaking_goal', e.target.value)}
                  placeholder="e.g., Improve presentation skills, reduce accent, etc."
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
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Speaking Challenges</CardTitle>
              <CardDescription>Areas you'd like to improve</CardDescription>
            </CardHeader>
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
                  <Button onClick={addChallenge}>Add</Button>
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
              <div className="grid grid-cols-3 gap-4">
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
          </Card>
        </TabsContent>

        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>How do you prefer to learn?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle>Accent & Style</CardTitle>
              <CardDescription>Your speaking style preferences</CardDescription>
            </CardHeader>
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
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle>Consent & Tracking</CardTitle>
              <CardDescription>Your privacy and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recording_consent"
                  checked={preferences.recording_consent || false}
                  onCheckedChange={(checked) => updatePreference('recording_consent', checked)}
                />
                <Label htmlFor="recording_consent">
                  I consent to recording my voice for analysis
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminders_enabled"
                  checked={preferences.reminders_enabled || false}
                  onCheckedChange={(checked) => updatePreference('reminders_enabled', checked)}
                />
                <Label htmlFor="reminders_enabled">
                  Enable practice reminders
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gamification_enabled"
                  checked={preferences.gamification_enabled || false}
                  onCheckedChange={(checked) => updatePreference('gamification_enabled', checked)}
                />
                <Label htmlFor="gamification_enabled">
                  Enable gamification features (streaks, achievements, etc.)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 mt-6">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

export default UserPreferences;