-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  display_name TEXT,
  age INTEGER,
  location TEXT,
  native_language TEXT,
  
  -- Goal & Context
  speaking_goal TEXT,
  target_audience TEXT,
  scenario TEXT,
  
  -- Challenges
  accent_challenges TEXT[],
  fluency_level TEXT,
  vocabulary_level TEXT,
  confidence_level TEXT,
  
  -- Learning Preferences
  learning_style TEXT,
  preferred_format TEXT,
  practice_frequency TEXT,
  feedback_style TEXT,
  
  -- Accent & Style
  tone_preference TEXT,
  role_models TEXT,
  
  -- Consent & Tracking
  recording_consent BOOLEAN DEFAULT false,
  reminders_enabled BOOLEAN DEFAULT false,
  gamification_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();