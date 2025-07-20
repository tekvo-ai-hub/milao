import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  // Get supported MIME type for MediaRecorder (optimized for AssemblyAI)
  const getSupportedMimeType = () => {
    // AssemblyAI supports: mp3, mp4, m4a, wav, flac, aac, ogg, webm, wma
    // Prioritize formats that don't need conversion
    const types = [
      'audio/wav',                    // Direct support, no conversion needed
      'audio/mp3',                    // Direct support
      'audio/mp4',                    // Direct support
      'audio/m4a',                    // Direct support
      'audio/webm;codecs=opus',       // Needs conversion
      'audio/webm',                   // Needs conversion
      'audio/ogg;codecs=opus',        // Needs conversion
      'audio/ogg'                     // Needs conversion
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
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
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
    <Card className="w-full border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Error Display */}
          {error && (
            <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-destructive text-sm font-medium">{error}</div>
              <div className="text-destructive/70 text-xs mt-1">
                {error.includes('permission') && 'Please check your browser settings and allow microphone access.'}
                {error.includes('not supported') && 'Try using a different browser like Chrome or Safari.'}
                {error.includes('HTTPS') && 'Please access this app via HTTPS for mobile recording.'}
              </div>
              <Button
                onClick={() => setError('')}
                variant="outline"
                size="sm"
                className="mt-2 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Modern Recording Visualization */}
          <div className="w-full h-32 bg-gradient-to-r from-muted/50 to-accent/50 rounded-2xl border border-[var(--glass-border)] flex items-center justify-center relative overflow-hidden">
            {isRecording || isPaused ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
                <div className="flex items-center space-x-1 z-10">
                  {audioLevels.map((level, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-primary to-primary/70 rounded-full transition-all duration-150"
                      style={{
                        width: '4px',
                        height: `${Math.max(8, (level / 255) * 80)}px`,
                        opacity: isPaused ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>
                {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <span className="text-muted-foreground font-medium">Recording Paused</span>
                  </div>
                )}
              </>
            ) : audioBlob ? (
              <div className="text-center">
                <div className="text-foreground/70 font-medium mb-2">Recording Ready</div>
                <div className="text-sm text-muted-foreground">Duration: {formatTime(duration)}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-foreground/70 font-medium mb-2">Ready to Record</div>
                <div className="text-sm text-muted-foreground">
                  {isMobile ? 'Tap the microphone to start' : 'Click the microphone to start'}
                </div>
              </div>
            )}
          </div>

          {/* Time Display and Progress */}
          <div className="text-center space-y-4 w-full">
            <div className="text-4xl font-mono text-foreground font-light">
              {audioBlob && isPlaying 
                ? formatTime(currentPlayTime)
                : formatTime(isRecording || isPaused ? recordingTime : duration)
              }
            </div>
            
            {/* Recording Progress */}
            {(isRecording || isPaused) && (
              <div className="space-y-2">
                <Progress 
                  value={(recordingTime / MAX_RECORDING_TIME) * 100} 
                  className="w-full h-2"
                />
                <div className="text-sm text-muted-foreground">
                  {formatTime(MAX_RECORDING_TIME - recordingTime)} remaining
                </div>
              </div>
            )}
            
            {/* Playback Progress */}
            {audioBlob && totalAudioDuration > 0 && (
              <div className="space-y-2">
                <Progress 
                  value={(currentPlayTime / totalAudioDuration) * 100} 
                  className="w-full h-2"
                />
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentPlayTime)} / {formatTime(totalAudioDuration)}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Control Buttons */}
          <div className="flex items-center space-x-4">
            {!audioBlob ? (
              <>
                {/* Recording Controls */}
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    onTouchStart={(e) => {
                      // Prevent double-tap zoom on mobile
                      e.preventDefault();
                    }}
                    size="lg"
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[var(--shadow-glow)] border-0 touch-manipulation"
                    disabled={isAnalyzing}
                  >
                    <Mic className="w-8 h-8" />
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button
                        onClick={pauseRecording}
                        size="lg"
                        variant="outline"
                        className="w-16 h-16 rounded-full border-2 hover:bg-accent"
                        disabled={isAnalyzing}
                      >
                        <Pause className="w-6 h-6" />
                      </Button>
                    ) : (
                      <Button
                        onClick={resumeRecording}
                        size="lg"
                        className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        disabled={isAnalyzing}
                      >
                        <Mic className="w-6 h-6" />
                      </Button>
                    )}
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="outline"
                      className="w-20 h-20 rounded-full border-2 text-destructive hover:bg-destructive/10 hover:border-destructive"
                      disabled={isAnalyzing}
                    >
                      <Square className="w-8 h-8 fill-current" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Playback Controls */}
                <Button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full border-2 hover:bg-accent"
                  disabled={isAnalyzing}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button
                  onClick={stopAudio}
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full border-2 hover:bg-accent"
                  disabled={isAnalyzing}
                >
                  <Square className="w-6 h-6 fill-current" />
                </Button>
                <Button
                  onClick={clearRecording}
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full border-2 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  disabled={isAnalyzing}
                >
                  <Trash className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>

          {/* Enhanced Analyze Button */}
          {audioBlob && (
            <Button
              onClick={analyzeRecording}
              className="w-full h-14 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[var(--shadow-strong)] border-0 rounded-xl"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;