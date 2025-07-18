import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface PriorityAreasProps {
  priorityAreas: string[];
}

const PriorityAreas: React.FC<PriorityAreasProps> = ({ priorityAreas }) => {
  if (!priorityAreas || priorityAreas.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Priority Areas for Improvement</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {priorityAreas.map((area, index) => (
            <li key={index} className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                {index + 1}
              </div>
              <span className="text-sm">{area}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PriorityAreas;