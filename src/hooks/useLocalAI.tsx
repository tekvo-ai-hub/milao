import { useState, useEffect, useCallback } from 'react';
import { aiService, AIModel } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

export interface UseLocalAIReturn {
  models: AIModel[];
  isInitializing: boolean;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
  generateText: (prompt: string) => Promise<string>;
  loadModel: (modelId: string) => Promise<boolean>;
  loadAllModels: () => Promise<void>;
  isModelLoaded: (modelId: string) => boolean;
  getModelStatus: (modelId: string) => AIModel['status'];
}

export const useLocalAI = (): UseLocalAIReturn => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = aiService.subscribe(setModels);
    return unsubscribe;
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const result = await aiService.transcribeAudio(audioBlob);
      toast({
        title: "Transcription Complete",
        description: "Audio has been successfully transcribed using local AI.",
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const generateText = useCallback(async (prompt: string): Promise<string> => {
    try {
      const result = await aiService.generateText(prompt);
      toast({
        title: "Text Generation Complete",
        description: "Text has been generated using local AI.",
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Text Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const loadModel = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      return await aiService.loadModel(modelId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Model Loading Failed",
        description: `Failed to load model: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const loadAllModels = useCallback(async (): Promise<void> => {
    setIsInitializing(true);
    try {
      const results = await aiService.loadAllModels();
      const successCount = results.filter(Boolean).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        toast({
          title: "AI Models Ready",
          description: "All local AI models have been initialized successfully.",
        });
      } else if (successCount > 0) {
        toast({
          title: "Partial AI Setup",
          description: `${successCount}/${totalCount} models loaded successfully.`,
        });
      } else {
        toast({
          title: "AI Initialization Failed",
          description: "Could not initialize any AI models. Please check your browser compatibility.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "AI Initialization Failed",
        description: "Failed to initialize local AI models.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const isModelLoaded = useCallback((modelId: string): boolean => {
    return aiService.isModelLoaded(modelId);
  }, []);

  const getModelStatus = useCallback((modelId: string): AIModel['status'] => {
    return aiService.getModelStatus(modelId);
  }, []);

  return {
    models,
    isInitializing,
    transcribeAudio,
    generateText,
    loadModel,
    loadAllModels,
    isModelLoaded,
    getModelStatus,
  };
};