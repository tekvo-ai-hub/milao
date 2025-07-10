
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Volume2, Zap, Heart, AlertCircle, CheckCircle, TrendingUp, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';

interface WordImprovement {
  original: string;
  suggestions: string[];
  context: string;
}

interface PhraseAlternative {
  original: string;
  alternatives: string[];
  improvement: string;
}

interface VocabularyEnhancement {
  category: string;
  suggestions: string[];
  usage: string;
}

interface AISuggestions {
  wordImprovements: WordImprovement[];
  phraseAlternatives: PhraseAlternative[];
  vocabularyEnhancement: VocabularyEnhancement[];
}

interface AnalysisResult {
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
  ai_suggestions?: AISuggestions;
  transcript?: string;
}

interface SpeechAnalysisProps {
  analysis: AnalysisResult;
  duration: number;
}

const SpeechAnalysis: React.FC<SpeechAnalysisProps> = ({ analysis, duration }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Overall Speech Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
              {analysis.overall_score}
            </div>
            <div className="flex-1">
              <Progress value={analysis.overall_score} className="h-3" />
            </div>
            {getScoreIcon(analysis.overall_score)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Recording duration: {formatDuration(duration)}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clarity Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Volume2 className="w-5 h-5" />
              <span>Clarity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className={`text-2xl font-semibold ${getScoreColor(analysis.clarity_score)}`}>
                {analysis.clarity_score}
              </div>
              <Progress value={analysis.clarity_score} className="flex-1 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Speaking Pace */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="w-5 h-5" />
              <span>Speaking Pace</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-semibold text-blue-600">
                {analysis.pace_analysis.words_per_minute} WPM
              </div>
              <Badge variant="outline" className="text-xs">
                {analysis.pace_analysis.assessment}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Filler Words */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Zap className="w-5 h-5" />
              <span>Filler Words</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-semibold text-orange-600">
                  {analysis.filler_words.count}
                </span>
                <Badge variant="secondary">
                  {analysis.filler_words.percentage}
                </Badge>
              </div>
              {analysis.filler_words.examples.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {analysis.filler_words.examples.slice(0, 3).map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tone Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Heart className="w-5 h-5" />
              <span>Tone & Emotion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800">
                {analysis.tone_analysis.primary_tone}
              </Badge>
              <div className="text-sm text-gray-600">
                Confidence: {analysis.tone_analysis.confidence_level}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.tone_analysis.emotions.slice(0, 3).map((emotion, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-green-700">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Vocabulary Suggestions */}
      {analysis.ai_suggestions && (
        <div className="space-y-4">
          {/* Word Improvements */}
          {analysis.ai_suggestions.wordImprovements.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-700">
                  <BookOpen className="w-5 h-5" />
                  <span>Word Choice Improvements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.ai_suggestions.wordImprovements.map((improvement, index) => (
                    <div key={index} className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-purple-700 border-purple-300">
                          "{improvement.original}"
                        </Badge>
                        <span className="text-sm text-gray-600">→</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {improvement.suggestions.map((suggestion, idx) => (
                          <Badge key={idx} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{improvement.context}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phrase Alternatives */}
          {analysis.ai_suggestions.phraseAlternatives.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <MessageSquare className="w-5 h-5" />
                  <span>Better Ways to Say It</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.ai_suggestions.phraseAlternatives.map((phrase, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg">
                      <div className="mb-2">
                        <p className="text-sm text-gray-700 italic">"{phrase.original}"</p>
                      </div>
                      <div className="space-y-1 mb-2">
                        {phrase.alternatives.map((alternative, idx) => (
                          <div key={idx} className="bg-green-100 p-2 rounded text-sm text-green-800">
                            "{alternative}"
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{phrase.improvement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vocabulary Enhancement */}
          {analysis.ai_suggestions.vocabularyEnhancement.length > 0 && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <Lightbulb className="w-5 h-5" />
                  <span>Vocabulary Enhancement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.ai_suggestions.vocabularyEnhancement.map((enhancement, index) => (
                    <div key={index} className="bg-orange-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          {enhancement.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {enhancement.suggestions.map((suggestion, idx) => (
                          <Badge key={idx} variant="outline" className="text-orange-700 border-orange-300">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{enhancement.usage}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* General Suggestions */}
      {analysis.suggestions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-700">General Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpeechAnalysis;
