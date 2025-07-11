-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-recordings', 'audio-recordings', false);

-- Create storage policies for audio recordings
CREATE POLICY "Users can upload their own audio recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own audio recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio recordings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);