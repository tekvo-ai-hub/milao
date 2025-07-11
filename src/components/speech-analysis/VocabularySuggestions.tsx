import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageSquare, Lightbulb } from 'lucide-react';
import type { AISuggestions } from '@/types/speechAnalysis';

interface VocabularySuggestionsProps {
  suggestions: AISuggestions;
}

const VocabularySuggestions: React.FC<VocabularySuggestionsProps> = ({ suggestions }) => {
  return (
    <div className="space-y-4">
      {/* Word Improvements */}
      {suggestions.wordImprovements.length > 0 && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700">
              <BookOpen className="w-5 h-5" />
              <span>Word Choice Improvements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.wordImprovements.map((improvement, index) => (
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
      {suggestions.phraseAlternatives.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <MessageSquare className="w-5 h-5" />
              <span>Better Ways to Say It</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.phraseAlternatives.map((phrase, index) => (
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
      {suggestions.vocabularyEnhancement.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <Lightbulb className="w-5 h-5" />
              <span>Vocabulary Enhancement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.vocabularyEnhancement.map((enhancement, index) => (
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
  );
};

export default VocabularySuggestions;