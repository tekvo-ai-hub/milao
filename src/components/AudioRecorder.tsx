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
  const MAX_RECORDING_TIME = 300; // 5 minutes in seconds
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const playProgressRef = useRef<NodeJS.Timeout>();
  const recordingChunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(recordingTime);
        
        // Get audio duration
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setTotalAudioDuration(audio.duration);
        };
      };
      
      mediaRecorder.start(100); // Collect data every 100ms for pause functionality
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start recording timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
      // Start audio level monitoring
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
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevels([]);
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
    setDuration(0);
    setRecordingTime(0);
    setCurrentPlayTime(0);
    setTotalAudioDuration(0);
    setIsPlaying(false);
    setAudioLevels([]);
  };

  const analyzeRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full border-0 shadow-[var(--shadow-soft)] backdrop-blur-md bg-[var(--glass-bg)]">
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-8">
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
                <div className="text-sm text-muted-foreground">Click the microphone to start</div>
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
                    size="lg"
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-[var(--shadow-glow)] border-0"
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