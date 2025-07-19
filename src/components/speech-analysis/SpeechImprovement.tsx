import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpeechImprovementProps {
  transcript: string;
  summary: string;
}

const improvementOptions = [
  { id: 'vocabulary', label: 'Vocabulary', description: 'Enhance word choice and variety' },
  { id: 'flow', label: 'Flow', description: 'Improve transitions and structure' },
  { id: 'tone', label: 'Tone', description: 'Adjust emotional delivery' },
  { id: 'clarity', label: 'Clarity', description: 'Make message clearer' },
  { id: 'persuasion', label: 'Persuasion', description: 'Increase convincing power' },
  { id: 'engagement', label: 'Engagement', description: 'Make more captivating' }
];

const SpeechImprovement: React.FC<SpeechImprovementProps> = ({ transcript, summary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [improvedScript, setImprovedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const generateImprovedScript = async () => {
    if (selectedOptions.length === 0 && !customRequest.trim()) {
      toast({
        title: "Selection Required",
        description: "Please select improvement areas or add a custom request.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedLabels = selectedOptions.map(id => 
        improvementOptions.find(opt => opt.id === id)?.label
      ).filter(Boolean);

      const improvements = [...selectedLabels];
      if (customRequest.trim()) {
        improvements.push(customRequest.trim());
      }

      const prompt = `
Please improve the following speech transcript focusing on: ${improvements.join(', ')}.

Original Speech Summary: ${summary}

Original Raw Transcript: ${transcript}

Instructions:
- Maintain the core message and meaning
- Keep the same general structure and length
- Focus specifically on the requested improvements: ${improvements.join(', ')}
- Make it sound natural and conversational
- Provide only the improved script without explanations

Improved Script:
      `.trim();

      const { data, error } = await supabase.functions.invoke('improve-speech', {
        body: { 
          prompt: prompt
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      if (!data || !data.suggestions) {
        throw new Error('No response data received');
      }

      setImprovedScript(data.suggestions);
      
      toast({
        title: "Script Improved!",
        description: "Your speech has been enhanced based on your preferences."
      });

    } catch (error) {
      console.error('Error generating improved script:', error);
      toast({
        title: "Improvement Failed",
        description: "Unable to generate improved script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(improvedScript);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Improved script copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Improvise the speech
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Improvise Your Speech
          </DialogTitle>
          <DialogDescription>
            Select improvement areas and customize your speech with AI assistance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Improvement Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">What would you like to improve?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {improvementOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    selectedOptions.includes(option.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => toggleOption(option.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{option.label}</span>
                      {selectedOptions.includes(option.id) && (
                        <Badge variant="default" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Request */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Custom Improvement Request</h3>
            <Textarea
              placeholder="Describe any specific improvements you'd like (e.g., 'Make it more formal', 'Add more examples', 'Reduce filler words')..."
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateImprovedScript}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Improved Script...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Improved Script
              </>
            )}
          </Button>

          {/* Improved Script */}
          {improvedScript && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Improved Script</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {improvedScript}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpeechImprovement;