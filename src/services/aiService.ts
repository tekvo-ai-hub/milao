import { pipeline } from '@huggingface/transformers';

export interface AIModel {
  id: string;
  name: string;
  type: 'speech-to-text' | 'text-generation' | 'text-analysis';
  status: 'not-loaded' | 'loading' | 'loaded' | 'error';
  model?: any;
}

export class LocalAIService {
  private static instance: LocalAIService;
  private models: Map<string, AIModel> = new Map();
  private listeners: Set<(models: AIModel[]) => void> = new Set();

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): LocalAIService {
    if (!LocalAIService.instance) {
      LocalAIService.instance = new LocalAIService();
    }
    return LocalAIService.instance;
  }

  private initializeModels() {
    const defaultModels: AIModel[] = [
      {
        id: 'whisper-tiny',
        name: 'Whisper Tiny (Speech-to-Text)',
        type: 'speech-to-text',
        status: 'not-loaded'
      },
      {
        id: 'distilgpt2',
        name: 'DistilGPT-2 (Text Generation)',
        type: 'text-generation',
        status: 'not-loaded'
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  subscribe(callback: (models: AIModel[]) => void): () => void {
    this.listeners.add(callback);
    callback(Array.from(this.models.values()));
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const modelArray = Array.from(this.models.values());
    this.listeners.forEach(callback => callback(modelArray));
  }

  private updateModelStatus(id: string, status: AIModel['status'], model?: any) {
    const existing = this.models.get(id);
    if (existing) {
      this.models.set(id, { ...existing, status, model });
      this.notifyListeners();
    }
  }

  async loadModel(modelId: string): Promise<boolean> {
    const modelConfig = this.models.get(modelId);
    if (!modelConfig) {
      console.error(`Model ${modelId} not found`);
      return false;
    }

    if (modelConfig.status === 'loaded') {
      console.log(`Model ${modelId} already loaded`);
      return true;
    }

    this.updateModelStatus(modelId, 'loading');
    console.log(`🔄 Loading ${modelConfig.name}...`);

    try {
      let loadedModel;
      
      switch (modelId) {
        case 'whisper-tiny':
          loadedModel = await this.loadWhisperModel();
          break;
        case 'distilgpt2':
          loadedModel = await this.loadGPT2Model();
          break;
        default:
          throw new Error(`Unknown model: ${modelId}`);
      }

      if (typeof loadedModel === 'function') {
        this.updateModelStatus(modelId, 'loaded', loadedModel);
        console.log(`✅ ${modelConfig.name} loaded successfully`);
        return true;
      } else {
        throw new Error(`Model ${modelId} is not callable`);
      }
    } catch (error) {
      console.error(`❌ Failed to load ${modelConfig.name}:`, error);
      this.updateModelStatus(modelId, 'error');
      return false;
    }
  }

  private async loadWhisperModel() {
    try {
      // Try WebGPU first
      console.log('🎤 Attempting WebGPU for Whisper...');
      const model = await pipeline(
        'automatic-speech-recognition',
        'onnx-community/whisper-tiny.en',
        { device: 'webgpu' }
      );
      console.log('✅ Whisper loaded with WebGPU');
      return model;
    } catch (webgpuError) {
      console.warn('⚠️ WebGPU failed, falling back to CPU:', webgpuError);
      try {
        const model = await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-tiny.en'
        );
        console.log('✅ Whisper loaded with CPU');
        return model;
      } catch (cpuError) {
        console.error('❌ CPU fallback failed:', cpuError);
        throw cpuError;
      }
    }
  }

  private async loadGPT2Model() {
    try {
      // Try WebGPU first
      console.log('🧠 Attempting WebGPU for GPT-2...');
      const model = await pipeline(
        'text-generation',
        'Xenova/distilgpt2',
        { device: 'webgpu' }
      );
      console.log('✅ GPT-2 loaded with WebGPU');
      return model;
    } catch (webgpuError) {
      console.warn('⚠️ WebGPU failed, falling back to CPU:', webgpuError);
      try {
        const model = await pipeline(
          'text-generation',
          'Xenova/distilgpt2'
        );
        console.log('✅ GPT-2 loaded with CPU');
        return model;
      } catch (cpuError) {
        console.error('❌ CPU fallback failed:', cpuError);
        throw cpuError;
      }
    }
  }

  async loadAllModels(): Promise<boolean[]> {
    const modelIds = Array.from(this.models.keys());
    const results = await Promise.all(
      modelIds.map(id => this.loadModel(id))
    );
    return results;
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const whisperModel = this.models.get('whisper-tiny');
    
    if (!whisperModel?.model) {
      throw new Error('Whisper model not loaded. Please initialize AI models first.');
    }

    if (typeof whisperModel.model !== 'function') {
      throw new Error('Whisper model is not callable. Please reload the model.');
    }

    console.log('🎯 Starting transcription...');
    
    // Convert blob to the format expected by Whisper
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Create audio context to decode the audio properly
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to Float32Array at the required sample rate (16kHz for Whisper)
    const targetSampleRate = 16000;
    const audioData = audioBuffer.getChannelData(0); // Get mono channel
    
    // Resample if needed
    let resampledAudio: Float32Array;
    if (audioBuffer.sampleRate !== targetSampleRate) {
      const resampleRatio = targetSampleRate / audioBuffer.sampleRate;
      const resampledLength = Math.floor(audioData.length * resampleRatio);
      resampledAudio = new Float32Array(resampledLength);
      
      for (let i = 0; i < resampledLength; i++) {
        const originalIndex = i / resampleRatio;
        const index = Math.floor(originalIndex);
        const fraction = originalIndex - index;
        
        if (index + 1 < audioData.length) {
          resampledAudio[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
        } else {
          resampledAudio[i] = audioData[index];
        }
      }
    } else {
      resampledAudio = audioData;
    }
    
    const result = await whisperModel.model(resampledAudio);
    
    if (!result?.text) {
      throw new Error('No transcription result received');
    }

    return result.text;
  }

  async generateText(prompt: string): Promise<string> {
    const gpt2Model = this.models.get('distilgpt2');
    
    if (!gpt2Model?.model) {
      throw new Error('GPT-2 model not loaded. Please initialize AI models first.');
    }

    if (typeof gpt2Model.model !== 'function') {
      throw new Error('GPT-2 model is not callable. Please reload the model.');
    }

    console.log('🧠 Generating text...');
    const result = await gpt2Model.model(prompt, {
      max_length: 100,
      num_return_sequences: 1,
    });
    
    return result[0]?.generated_text || '';
  }

  getModelStatus(modelId: string): AIModel['status'] {
    return this.models.get(modelId)?.status || 'not-loaded';
  }

  isModelLoaded(modelId: string): boolean {
    return this.getModelStatus(modelId) === 'loaded';
  }

  getLoadedModels(): AIModel[] {
    return Array.from(this.models.values()).filter(m => m.status === 'loaded');
  }
}

export const aiService = LocalAIService.getInstance();