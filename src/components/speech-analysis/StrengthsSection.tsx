import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface StrengthsSectionProps {
  strengths: string[];
}

const StrengthsSection: React.FC<StrengthsSectionProps> = ({ strengths }) => {
  if (strengths.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="text-green-700">Strengths</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{strength}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default StrengthsSection;