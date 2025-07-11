import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface GeneralSuggestionsProps {
  suggestions: string[];
}

const GeneralSuggestions: React.FC<GeneralSuggestionsProps> = ({ suggestions }) => {
  if (suggestions.length === 0) return null;

  return (
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
  );
};

export default GeneralSuggestions;