
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Volume2, Zap, Heart, AlertCircle, CheckCircle, TrendingUp, BookOpen, MessageSquare, Lightbulb, Target, Users, Award, Star } from 'lucide-react';

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

interface ContentEvaluation {
  mainPoint: {
    identified: string;
    clarity: number;
    feedback: string;
  };
  argumentStructure: {
    hasStructure: boolean;
    structure: string;
    effectiveness: number;
    suggestions: string;
  };
  evidenceAndExamples: {
    hasEvidence: boolean;
    evidenceQuality: number;
    evidenceTypes: string[];
    suggestions: string;
  };
  persuasiveness: {
    pointProven: boolean;
    persuasionScore: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string;
  };
  starAnalysis: {
    situation: string;
    task: string;
    action: string;
    result: string;
    overallStarScore: number;
  };
}

interface AISuggestions {
  wordImprovements: WordImprovement[];
  phraseAlternatives: PhraseAlternative[];
  vocabularyEnhancement: VocabularyEnhancement[];
  contentEvaluation?: ContentEvaluation;
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

          {/* Content Evaluation */}
          {analysis.ai_suggestions.contentEvaluation && (
            <div className="space-y-4">
              {/* Main Point Analysis */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Target className="w-5 h-5" />
                    <span>Main Point Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Key Message:</h4>
                      <p className="text-sm bg-blue-50 p-2 rounded">{analysis.ai_suggestions.contentEvaluation.mainPoint.identified}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Clarity Score:</span>
                      <div className={`text-lg font-semibold ${getScoreColor(analysis.ai_suggestions.contentEvaluation.mainPoint.clarity * 10)}`}>
                        {analysis.ai_suggestions.contentEvaluation.mainPoint.clarity}/10
                      </div>
                      <Progress value={analysis.ai_suggestions.contentEvaluation.mainPoint.clarity * 10} className="flex-1 h-2" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Feedback:</h4>
                      <p className="text-sm text-gray-600">{analysis.ai_suggestions.contentEvaluation.mainPoint.feedback}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Argument Structure */}
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-indigo-700">
                    <Users className="w-5 h-5" />
                    <span>Argument Structure</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={analysis.ai_suggestions.contentEvaluation.argumentStructure.hasStructure ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {analysis.ai_suggestions.contentEvaluation.argumentStructure.hasStructure ? "Structured" : "Needs Structure"}
                      </Badge>
                      <span className="text-sm text-gray-600">{analysis.ai_suggestions.contentEvaluation.argumentStructure.structure}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Effectiveness:</span>
                      <div className={`text-lg font-semibold ${getScoreColor(analysis.ai_suggestions.contentEvaluation.argumentStructure.effectiveness * 10)}`}>
                        {analysis.ai_suggestions.contentEvaluation.argumentStructure.effectiveness}/10
                      </div>
                      <Progress value={analysis.ai_suggestions.contentEvaluation.argumentStructure.effectiveness * 10} className="flex-1 h-2" />
                    </div>
                    <p className="text-sm text-gray-600">{analysis.ai_suggestions.contentEvaluation.argumentStructure.suggestions}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence and Examples */}
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-emerald-700">
                    <Award className="w-5 h-5" />
                    <span>Evidence & Examples</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.hasEvidence ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.hasEvidence ? "Evidence Present" : "Needs Evidence"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Quality Score:</span>
                      <div className={`text-lg font-semibold ${getScoreColor(analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.evidenceQuality * 10)}`}>
                        {analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.evidenceQuality}/10
                      </div>
                      <Progress value={analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.evidenceQuality * 10} className="flex-1 h-2" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Evidence Types Used:</h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.evidenceTypes.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-emerald-700 border-emerald-300">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{analysis.ai_suggestions.contentEvaluation.evidenceAndExamples.suggestions}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Persuasiveness */}
              <Card className="border-l-4 border-l-rose-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-rose-700">
                    <TrendingUp className="w-5 h-5" />
                    <span>Persuasiveness Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={analysis.ai_suggestions.contentEvaluation.persuasiveness.pointProven ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {analysis.ai_suggestions.contentEvaluation.persuasiveness.pointProven ? "Point Proven" : "Needs Stronger Proof"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">Persuasion Score:</span>
                      <div className={`text-lg font-semibold ${getScoreColor(analysis.ai_suggestions.contentEvaluation.persuasiveness.persuasionScore * 10)}`}>
                        {analysis.ai_suggestions.contentEvaluation.persuasiveness.persuasionScore}/10
                      </div>
                      <Progress value={analysis.ai_suggestions.contentEvaluation.persuasiveness.persuasionScore * 10} className="flex-1 h-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="font-medium text-sm text-green-700 mb-1">Strengths:</h4>
                        <ul className="space-y-1">
                          {analysis.ai_suggestions.contentEvaluation.persuasiveness.strengths.map((strength, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-red-700 mb-1">Areas to Improve:</h4>
                        <ul className="space-y-1">
                          {analysis.ai_suggestions.contentEvaluation.persuasiveness.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                              <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{analysis.ai_suggestions.contentEvaluation.persuasiveness.improvements}</p>
                  </div>
                </CardContent>
              </Card>

              {/* STAR Analysis */}
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-amber-700">
                    <Star className="w-5 h-5" />
                    <span>STAR Method Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-sm font-medium">STAR Score:</span>
                      <div className={`text-lg font-semibold ${getScoreColor(analysis.ai_suggestions.contentEvaluation.starAnalysis.overallStarScore * 10)}`}>
                        {analysis.ai_suggestions.contentEvaluation.starAnalysis.overallStarScore}/10
                      </div>
                      <Progress value={analysis.ai_suggestions.contentEvaluation.starAnalysis.overallStarScore * 10} className="flex-1 h-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="bg-amber-50 p-2 rounded">
                          <h4 className="font-medium text-sm text-amber-700 mb-1">Situation:</h4>
                          <p className="text-xs text-gray-600">{analysis.ai_suggestions.contentEvaluation.starAnalysis.situation}</p>
                        </div>
                        <div className="bg-amber-50 p-2 rounded">
                          <h4 className="font-medium text-sm text-amber-700 mb-1">Task:</h4>
                          <p className="text-xs text-gray-600">{analysis.ai_suggestions.contentEvaluation.starAnalysis.task}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-amber-50 p-2 rounded">
                          <h4 className="font-medium text-sm text-amber-700 mb-1">Action:</h4>
                          <p className="text-xs text-gray-600">{analysis.ai_suggestions.contentEvaluation.starAnalysis.action}</p>
                        </div>
                        <div className="bg-amber-50 p-2 rounded">
                          <h4 className="font-medium text-sm text-amber-700 mb-1">Result:</h4>
                          <p className="text-xs text-gray-600">{analysis.ai_suggestions.contentEvaluation.starAnalysis.result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
