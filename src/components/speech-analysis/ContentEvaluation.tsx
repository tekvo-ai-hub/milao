import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Users, Award, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import type { ContentEvaluation as ContentEvaluationType } from '@/types/speechAnalysis';

interface ContentEvaluationProps {
  evaluation: ContentEvaluationType;
}

const ContentEvaluation: React.FC<ContentEvaluationProps> = ({ evaluation }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
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
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Key Message Identified:
              </h4>
              <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200 italic">
                "{evaluation.mainPoint.identified}"
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Clarity Score:</span>
              <div className={`text-lg font-semibold ${getScoreColor(evaluation.mainPoint.clarity * 10)}`}>
                {evaluation.mainPoint.clarity}/10
              </div>
              <Progress value={evaluation.mainPoint.clarity * 10} className="flex-1 h-2" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Feedback:</h4>
              <p className="text-sm text-gray-600">{evaluation.mainPoint.feedback}</p>
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
              <Badge className={evaluation.argumentStructure.hasStructure ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {evaluation.argumentStructure.hasStructure ? "Structured" : "Needs Structure"}
              </Badge>
              <span className="text-sm text-gray-600">{evaluation.argumentStructure.structure}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Effectiveness:</span>
              <div className={`text-lg font-semibold ${getScoreColor(evaluation.argumentStructure.effectiveness * 10)}`}>
                {evaluation.argumentStructure.effectiveness}/10
              </div>
              <Progress value={evaluation.argumentStructure.effectiveness * 10} className="flex-1 h-2" />
            </div>
            <p className="text-sm text-gray-600">{evaluation.argumentStructure.suggestions}</p>
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
              <Badge className={evaluation.evidenceAndExamples.hasEvidence ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {evaluation.evidenceAndExamples.hasEvidence ? "Evidence Present" : "Needs Evidence"}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Quality Score:</span>
              <div className={`text-lg font-semibold ${getScoreColor(evaluation.evidenceAndExamples.evidenceQuality * 10)}`}>
                {evaluation.evidenceAndExamples.evidenceQuality}/10
              </div>
              <Progress value={evaluation.evidenceAndExamples.evidenceQuality * 10} className="flex-1 h-2" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Evidence Types Used:</h4>
              <div className="flex flex-wrap gap-1">
                {evaluation.evidenceAndExamples.evidenceTypes.map((type, idx) => (
                  <Badge key={idx} variant="outline" className="text-emerald-700 border-emerald-300">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600">{evaluation.evidenceAndExamples.suggestions}</p>
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
              <Badge className={evaluation.persuasiveness.pointProven ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {evaluation.persuasiveness.pointProven ? "Point Proven" : "Needs Stronger Proof"}
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Persuasion Score:</span>
              <div className={`text-lg font-semibold ${getScoreColor(evaluation.persuasiveness.persuasionScore * 10)}`}>
                {evaluation.persuasiveness.persuasionScore}/10
              </div>
              <Progress value={evaluation.persuasiveness.persuasionScore * 10} className="flex-1 h-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-sm text-green-700 mb-1">Strengths:</h4>
                <ul className="space-y-1">
                  {evaluation.persuasiveness.strengths.map((strength, idx) => (
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
                  {evaluation.persuasiveness.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start space-x-1">
                      <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600">{evaluation.persuasiveness.improvements}</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ContentEvaluation;