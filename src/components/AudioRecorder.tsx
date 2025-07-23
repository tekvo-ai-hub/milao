import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash, Headphones, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  isAnalyzing: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [totalAudioDuration, setTotalAudioDuration] = useState(0);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const MAX_RECORDING_TIME = 300; // 5 minutes in seconds
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const playProgressRef = useRef<NodeJS.Timeout>();
  const recordingChunksRef = useRef<Blob[]>([]);
  const currentRecordingTimeRef = useRef<number>(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      console.log('Mobile device detected:', isMobileDevice);
    };
    checkMobile();
  }, []);

  // Debug duration changes
  useEffect(() => {
    console.log('Duration state changed to:', duration, 'Type:', typeof duration);
  }, [duration]);

  // Safe setDuration function to prevent invalid values
  const setDurationSafely = (value: number) => {
    if (isFinite(value) && !isNaN(value) && value >= 0) {
      console.log('Setting duration safely to:', value);
      setDuration(value);
    } else {
      console.warn('Attempted to set invalid duration:', value);
      setDuration(0);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playProgressRef.current) {
        clearInterval(playProgressRef.current);
      }
    };
  }, []);

  // Check if MediaRecorder is supported
  const isMediaRecorderSupported = () => {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm') || MediaRecorder.isTypeSupported('audio/mp4') || MediaRecorder.isTypeSupported('audio/wav');
  };

  // Get supported MIME type for MediaRecorder
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }
    
    console.warn('No supported MIME type found, using default');
    return '';
  };

  const startRecording = async () => {
    try {
      setError('');
      console.log('Starting recording...');
      
      // Check HTTPS requirement for mobile
      if (isMobile && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('HTTPS is required for audio recording on mobile devices');
      }
      
      // Check MediaRecorder support
      if (!isMediaRecorderSupported()) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      // Request microphone permission with mobile-specific constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
          // Mobile-specific constraints
          ...(isMobile && {
            sampleRate: { ideal: 44100, min: 22050 },
            channelCount: { ideal: 1, min: 1, max: 2 }
          })
        }
      };

      console.log('Requesting microphone access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Microphone access granted');
      
      streamRef.current = stream;
      
      // Set up audio analysis (only if supported)
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
        console.log('Audio analysis set up successfully');
      } catch (analysisError) {
        console.warn('Audio analysis not supported:', analysisError);
        analyserRef.current = null;
      }
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
          console.log('Data available, chunk size:', event.data.size);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', recordingChunksRef.current.length);
        const blob = new Blob(recordingChunksRef.current, { type: mimeType || 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Use the current recording time for duration
        const finalTime = currentRecordingTimeRef.current;
        console.log('Recording stopped. Final recording time from ref:', finalTime);
        setDurationSafely(finalTime);
        
        // Get audio duration from the actual audio file
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          console.log('Audio metadata loaded. Duration:', audio.duration, 'Recording time from ref:', finalTime);
          
          // Validate the audio duration before using it
          if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
          setTotalAudioDuration(audio.duration);
            
            // Only update duration if the difference is significant and the audio duration is valid
            if (Math.abs(audio.duration - finalTime) > 1) {
              const newDuration = Math.floor(audio.duration);
              console.log('Updating duration to actual audio duration:', newDuration);
              setDurationSafely(newDuration);
            }
          } else {
            console.warn('Invalid audio duration received:', audio.duration);
            // Keep the recording time as duration
            setTotalAudioDuration(finalTime);
          }
        };
        
        // Handle errors in audio loading
        audio.onerror = () => {
          console.error('Error loading audio metadata');
          setTotalAudioDuration(finalTime);
        };
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        stopRecording();
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };
      
      // Start recording with appropriate timeslice for mobile
      const timeslice = isMobile ? 1000 : 100; // 1 second for mobile, 100ms for desktop
      mediaRecorder.start(timeslice);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      currentRecordingTimeRef.current = 0;
      console.log('Recording started, timer initialized');
      
      // Start recording timer
      intervalRef.current = setInterval(() => {
        currentRecordingTimeRef.current += 1;
        const newTime = currentRecordingTimeRef.current;
        console.log('Timer update - New time:', newTime, 'Is recording:', isRecording, 'Is paused:', isPaused);
        
        setRecordingTime(newTime);
        
          if (newTime >= MAX_RECORDING_TIME) {
          console.log('Max recording time reached, stopping recording');
            stopRecording();
          }
      }, 1000);
      
      // Start audio level monitoring (only if analyser is available)
      if (analyserRef.current) {
      const updateAudioLevels = () => {
        if (analyserRef.current && isRecording && !isPaused) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevels(prev => [...prev.slice(-30), average]);
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      };
      updateAudioLevels();
      }
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Failed to access microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio recording is not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      console.error('Recording error:', errorMessage);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      console.log('Recording paused at time:', currentRecordingTimeRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        currentRecordingTimeRef.current += 1;
        const newTime = currentRecordingTimeRef.current;
        console.log('Timer update (resumed) - New time:', newTime);
        
        setRecordingTime(newTime);
        
          if (newTime >= MAX_RECORDING_TIME) {
          console.log('Max recording time reached, stopping recording');
            stopRecording();
          }
      }, 1000);
      console.log('Recording resumed from time:', currentRecordingTimeRef.current);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      // Capture the current recording time before stopping
      const finalRecordingTime = currentRecordingTimeRef.current;
      console.log('Stop recording called. Current recording time from ref:', finalRecordingTime);
      
      // Clear the interval first to prevent further updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevels([]);
      
      // Ensure duration is set with the captured time
      console.log('Setting duration to:', finalRecordingTime);
      setDurationSafely(finalRecordingTime);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      
      // Start progress tracking
      playProgressRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentPlayTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playProgressRef.current) {
        clearInterval(playProgressRef.current);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentPlayTime(0);
      setIsPlaying(false);
      if (playProgressRef.current) {
        clearInterval(playProgressRef.current);
      }
    }
  };

  const clearRecording = () => {
    stopAudio();
    setAudioBlob(null);
    setAudioUrl('');
    setDurationSafely(0);
    setRecordingTime(0);
    currentRecordingTimeRef.current = 0;
    setCurrentPlayTime(0);
    setTotalAudioDuration(0);
    setIsPlaying(false);
    setAudioLevels([]);
    setError(''); // Clear any previous errors
  };

  const analyzeRecording = () => {
    console.log('🔍 Analyze button clicked!');
    console.log('🔍 Audio blob exists:', !!audioBlob);
    console.log('🔍 Duration:', duration);
    if (audioBlob) {
      console.log('🔍 Calling onRecordingComplete with blob size:', audioBlob.size);
      onRecordingComplete(audioBlob, duration);
    } else {
      console.error('❌ No audio blob available for analysis');
    }
  };

  const formatTime = (seconds: number) => {
    // Handle invalid values
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Record Your Speech</h2>
        <p className="text-neutral-600">Click the record button when you're ready to begin. Speak clearly and naturally.</p>
      </div>

      {/* Recording Interface */}
      <Card className="bg-white rounded-lg shadow-xl border border-neutral-200 p-0">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            {/* Mic Icon and Status */}
            <div className="mb-6">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                {isRecording && (
                  <span className="absolute w-full h-full rounded-full animate-mic-glow bg-gradient-to-br from-primary/30 via-primary/10 to-primary/0 blur-lg z-0" />
                )}
                <span className={`inline-flex items-center justify-center w-32 h-32 bg-neutral-100 rounded-full z-10 ${isRecording ? 'animate-mic-pulse' : ''}`}>
                  <Mic className={`text-4xl ${isRecording ? 'text-primary drop-shadow-lg' : 'text-neutral-600'}`} />
                </span>
              </div>
              <div className="text-sm text-neutral-500 mb-2">Recording Status</div>
              <div className="text-lg text-black">
                {error
                  ? <span className="text-red-500">{error}</span>
                  : isRecording
                    ? isPaused ? 'Paused' : 'Recording...'
                    : audioBlob ? 'Recording Ready' : 'Ready to Record'}
              </div>
            </div>

            {/* Timer */}
            <div className="mb-8">
              <div className="text-4xl text-black mb-2 font-mono">
                {audioBlob && isPlaying
                  ? formatTime(currentPlayTime)
                  : formatTime(isRecording || isPaused ? recordingTime : duration)}
              </div>
              <div className="text-sm text-neutral-500">Duration</div>
            </div>

            {/* Record/Playback Button */}
            <div className="mb-8">
              {!audioBlob ? (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="icon"
                  className={`bg-neutral-500 hover:bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto transition-colors ${isRecording ? 'bg-primary shadow-[0_0_0_8px_rgba(139,92,246,0.15),0_0_0_16px_rgba(139,92,246,0.08)] animate-mic-pulse' : ''}`}
                  disabled={isAnalyzing}
                >
                  {isRecording ? (
                    <Square className="text-2xl" />
                  ) : (
                    <Mic className="text-2xl" />
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    onClick={isPlaying ? pauseAudio : playAudio}
                    size="icon"
                    variant="outline"
                    className="w-16 h-16 rounded-full border-2 hover:bg-accent"
                    disabled={isAnalyzing}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button
                    onClick={stopAudio}
                    size="icon"
                    variant="outline"
                    className="w-16 h-16 rounded-full border-2 hover:bg-accent"
                    disabled={isAnalyzing}
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={clearRecording}
                    size="icon"
                    variant="outline"
                    className="w-16 h-16 rounded-full border-2 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    disabled={isAnalyzing}
                  >
                    <Trash className="w-6 h-6" />
                  </Button>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {audioBlob && (
              <Button
                onClick={analyzeRecording}
                className="w-full h-14 text-lg font-medium bg-gradient-to-r from-primary to-secondary text-white shadow-md border-0 rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-colors"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Analyzing Speech...</span>
                  </div>
                ) : (
                  'Analyze Speech'
                )}
              </Button>
            )}

            {/* Hidden Audio Element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentPlayTime(0);
                  if (playProgressRef.current) {
                    clearInterval(playProgressRef.current);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setTotalAudioDuration(audioRef.current.duration);
                  }
                }}
                style={{ display: 'none' }}
              />
            )}

            {/* Mic Level, Audio Quality, Monitor */}
            <div className="border-t border-neutral-200 pt-6 w-full mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-lg mx-auto mb-3">
                    <Mic className="text-neutral-600" />
                  </div>
                  <div className="text-sm text-black">Microphone Level</div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div className={`bg-primary h-2 rounded-full transition-all duration-200 ${isRecording ? 'animate-mic-level' : ''}`}
                      style={{ width: `${Math.min(100, (audioLevels[audioLevels.length - 1] || 0) / 2.55)}%` }}></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-lg mx-auto mb-3">
                    <Square className="text-neutral-600" />
                  </div>
                  <div className="text-sm text-black">Audio Quality</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    {isRecording
                      ? (audioLevels[audioLevels.length - 1] > 120 ? 'Excellent' : audioLevels[audioLevels.length - 1] > 60 ? 'Good' : 'Poor')
                      : '—'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-neutral-100 rounded-lg mx-auto mb-3">
                    <Headphones className="text-neutral-600" />
                  </div>
                  <div className="text-sm text-black">Monitor</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-xs text-neutral-400 cursor-not-allowed mt-1 border border-neutral-200 rounded px-2 py-1 bg-neutral-100" disabled>Enable</button>
                    </TooltipTrigger>
                    <TooltipContent>Live monitoring coming soon!</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <div className="mt-8 bg-neutral-50 rounded-lg p-6">
        <h3 className="text-lg text-black mb-4">Recording Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <Check className="text-xs text-neutral-600" />
            </div>
            <div>
              <div className="text-sm text-black">Speak Naturally</div>
              <div className="text-xs text-neutral-600">Use your normal speaking voice and pace</div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <Check className="text-xs text-neutral-600" />
            </div>
            <div>
              <div className="text-sm text-black">Minimize Background Noise</div>
              <div className="text-xs text-neutral-600">Find a quiet space for better analysis</div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <Check className="text-xs text-neutral-600" />
            </div>
            <div>
              <div className="text-sm text-black">Stay 6-12 Inches from Mic</div>
              <div className="text-xs text-neutral-600">Maintain consistent distance</div>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <Check className="text-xs text-neutral-600" />
            </div>
            <div>
              <div className="text-sm text-black">Speak for 1-5 Minutes</div>
              <div className="text-xs text-neutral-600">Optimal length for analysis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;

// Add custom keyframes for the mic glow and pulse
<style>{`
@keyframes mic-glow {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 0 0 rgba(139,92,246,0.15), 0 0 0 8px rgba(139,92,246,0.08); }
  50% { opacity: 1; box-shadow: 0 0 0 8px rgba(139,92,246,0.25), 0 0 0 16px rgba(139,92,246,0.12); }
}
@keyframes mic-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.animate-mic-glow { animation: mic-glow 1.5s infinite; }
.animate-mic-pulse { animation: mic-pulse 1.2s infinite; }
`}</style>