import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash, Headphones, Check, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped' | 'analyzing' | 'complete'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [speechTopic, setSpeechTopic] = useState('');
  const [focusArea, setFocusArea] = useState('Overall Performance');
  
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

  // Update status based on recording state
  useEffect(() => {
    if (isAnalyzing) setStatus('analyzing');
    else if (isRecording) setStatus('recording');
    else if (isPaused) setStatus('paused');
    else if (audioBlob) setStatus('stopped');
    else setStatus('idle');
  }, [isAnalyzing, isRecording, isPaused, audioBlob]);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Record Your Speech</h2>
        <p className="text-neutral-600 text-sm">Click the record button when you're ready to begin. Speak clearly and naturally.</p>
      </div>

      {/* Recording Interface */}
      <Card className="bg-white rounded-lg shadow-xl border border-neutral-200 p-0">
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            {/* Mic Icon - large, centered above status/timer */}
            <div className="flex justify-center mt-6 mb-2 relative">
              {isRecording && (
                <span className="absolute w-20 h-20 rounded-full animate-mic-glow bg-gradient-to-br from-primary/40 via-primary/10 to-primary/0 blur-lg z-0" style={{ left: 0, top: 0 }} />
              )}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="icon"
                className={`bg-neutral-500 hover:bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto transition-colors text-4xl relative z-10 ${isRecording ? 'bg-primary animate-mic-pulse' : ''}`}
                disabled={isAnalyzing}
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? <Square className="text-4xl" /> : <Mic className="text-4xl" />}
              </Button>
            </div>
            {/* Status, Timer, Duration - center aligned */}
            <div className="mb-1 text-center">
              <div className="text-xs text-neutral-500 mb-1">Recording Status</div>
              <div className="text-base text-black mb-1" aria-live="polite">
                {error
                  ? <span className="text-red-500">{error}</span>
                  : isRecording
                    ? isPaused ? 'Paused' : 'Recording...'
                    : audioBlob ? 'Recording Ready' : 'Ready to Record'}
              </div>
              <div className="text-2xl text-black mb-1 font-mono">
                {audioBlob && isPlaying
                  ? formatTime(currentPlayTime)
                  : formatTime(isRecording || isPaused ? recordingTime : duration)}
              </div>
              <div className="text-xs text-neutral-500">Duration</div>
            </div>

            {/* Waveform Animation */}
            <div className="flex items-end justify-center gap-0.5 h-6 mb-4">
              {audioLevels.slice(-32).map((level, i) => (
                <div
                  key={i}
                  className="w-1 rounded bg-primary transition-all duration-100"
                  style={{ height: `${Math.max(4, (level / 2.55) || 4)}%`, minHeight: 4, maxHeight: 24 }}
                />
              ))}
            </div>

            {/* File Upload Option */}
            <div className="flex justify-center mb-2">
              <label htmlFor="audio-upload" className="inline-block cursor-pointer bg-accent text-accent-foreground px-4 py-2 rounded-lg font-medium text-sm shadow hover:bg-accent/80 transition-colors">
                Upload Audio File
                <Input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Get duration
                    const audio = document.createElement('audio');
                    audio.src = URL.createObjectURL(file);
                    audio.onloadedmetadata = () => {
                      setAudioBlob(file);
                      setDuration(Math.floor(audio.duration));
                    };
                  }
                }} />
              </label>
            </div>
            {/* Record/Playback/Stop/Clear Buttons - horizontal row at bottom with small mic */}
            <div className="flex items-center gap-3 mt-0 mb-4">
              <Button
                onClick={isPlaying ? pauseAudio : playAudio}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-2 hover:bg-accent"
                disabled={!audioBlob || isAnalyzing}
                aria-label={isPlaying ? 'Pause Playback' : 'Play Recording'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                onClick={stopAudio}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-2 hover:bg-accent"
                disabled={!audioBlob || isAnalyzing}
                aria-label="Stop Playback"
              >
                <Square className="w-5 h-5" />
              </Button>
              <Button
                onClick={clearRecording}
                size="icon"
                variant="outline"
                className="w-12 h-12 rounded-full border-2 text-destructive hover:bg-destructive/10 hover:border-destructive"
                disabled={isAnalyzing}
                aria-label="Clear Recording"
              >
                <Trash className="w-5 h-5" />
              </Button>
            </div>

            {/* Analyze Button */}
            {audioBlob && (
              <Button
                onClick={analyzeRecording}
                className="w-full h-11 text-base font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0 rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-colors mt-2"
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

            {/* Settings and Tips (new UI) */}
            <div className="mt-4 w-full">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-2 mb-2"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Show Recording Settings"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              {showSettings && (
                <Card className="bg-muted/50 mb-2">
                  <CardContent className="space-y-2 p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">Speech Topic</label>
                        <Input
                          placeholder="Enter your speech topic..."
                          value={speechTopic}
                          onChange={e => setSpeechTopic(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium flex items-center gap-2">
                          Focus Area
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}><Info className="w-4 h-4 text-muted-foreground" /></span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Choose which area you want the AI to focus on in your speech.
                            </TooltipContent>
                          </Tooltip>
                        </label>
                        <select
                          className="w-full border rounded px-2 py-1 text-xs"
                          value={focusArea}
                          onChange={e => setFocusArea(e.target.value)}
                        >
                          <option>Overall Performance</option>
                          <option>Clarity</option>
                          <option>Tone</option>
                          <option>Filler Words</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-xs">🧠 Recording Tips</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Speak Naturally</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Stay 6–12 inches from Mic</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Minimize Background Noise</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Speak for 1–5 Minutes</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4" /> Look at the camera or a fixed point</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioRecorder;// Add custom keyframes for the mic glow and pulse
<style>{`
@keyframes mic-glow {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 0 0 rgba(139,92,246,0.25), 0 0 0 12px rgba(139,92,246,0.10); }
  50% { opacity: 1; box-shadow: 0 0 0 12px rgba(139,92,246,0.35), 0 0 0 24px rgba(139,92,246,0.15); }
}
@keyframes mic-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.animate-mic-glow { animation: mic-glow 1.5s infinite; }
.animate-mic-pulse { animation: mic-pulse 1.2s infinite; }
`}</style>


