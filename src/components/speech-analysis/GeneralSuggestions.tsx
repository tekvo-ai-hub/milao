import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';

interface GeneralSuggestionsProps {
  suggestions: string[];
  actionableSteps?: string[];
}

const GeneralSuggestions: React.FC<GeneralSuggestionsProps> = ({ suggestions, actionableSteps }) => {
  if (suggestions.length === 0 && (!actionableSteps || actionableSteps.length === 0)) return null;

  return (
    <div className="space-y-6">
      {suggestions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-700">General Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {actionableSteps && actionableSteps.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <Target className="w-5 h-5" />
              <span>Next Action Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionableSteps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GeneralSuggestions;