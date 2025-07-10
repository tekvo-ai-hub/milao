
// Note: This is a mock implementation for demonstration purposes
// In a real app, you would integrate with OpenAI's Whisper API or similar service

export interface AnalysisResult {
  overall_score: number;
  clarity_score: number;
  pace_analysis: {
    words_per_minute: number;
    assessment: string;
  };
  filler_words: {
    count: number;
    percentage: string;
    examples: string[];
  };
  tone_analysis: {
    primary_tone: string;
    confidence_level: string;
    emotions: string[];
  };
  suggestions: string[];
  strengths: string[];
}

export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Mock analysis based on duration and random factors for demo
  const estimatedWords = Math.floor(duration * 2.5); // Rough estimate
  const wpm = Math.floor(estimatedWords / (duration / 60));
  
  const fillerCount = Math.floor(Math.random() * 5) + 1;
  const fillerPercentage = ((fillerCount / estimatedWords) * 100).toFixed(1);
  
  const tones = ['Professional', 'Confident', 'Nervous', 'Enthusiastic', 'Calm', 'Energetic'];
  const emotions = ['Focused', 'Determined', 'Anxious', 'Excited', 'Relaxed', 'Passionate'];
  const assessments = ['Too slow', 'Perfect pace', 'Slightly fast', 'Too fast', 'Natural pace'];
  
  const clarityScore = Math.floor(Math.random() * 30) + 70;
  const overallScore = Math.floor((clarityScore + Math.min(100, Math.max(60, 150 - Math.abs(wpm - 150) * 2))) / 2);
  
  const mockResult: AnalysisResult = {
    overall_score: overallScore,
    clarity_score: clarityScore,
    pace_analysis: {
      words_per_minute: wpm,
      assessment: assessments[Math.floor(Math.random() * assessments.length)]
    },
    filler_words: {
      count: fillerCount,
      percentage: `${fillerPercentage}%`,
      examples: ['um', 'uh', 'like', 'you know'].slice(0, fillerCount)
    },
    tone_analysis: {
      primary_tone: tones[Math.floor(Math.random() * tones.length)],
      confidence_level: 'High',
      emotions: emotions.slice(0, 3)
    },
    suggestions: [
      'Try to reduce filler words by pausing instead of saying "um" or "uh"',
      'Practice maintaining consistent volume throughout your speech',
      'Consider adding more varied intonation to keep listeners engaged'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    strengths: [
      'Clear pronunciation and articulation',
      'Good overall speaking confidence',
      'Natural conversational tone'
    ].slice(0, Math.floor(Math.random() * 3) + 1)
  };
  
  return mockResult;
};

// For real implementation, you would use something like:
/*
export const analyzeSpeech = async (audioBlob: Blob, duration: number): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  formData.append('duration', duration.toString());
  
  const response = await fetch('/api/analyze-speech', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze speech');
  }
  
  return response.json();
};
*/
