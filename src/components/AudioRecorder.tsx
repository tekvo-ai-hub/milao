
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  isAnalyzing: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

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
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setDuration(recordingTime);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start audio level monitoring
      const updateAudioLevels = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevels(prev => [...prev.slice(-20), average]);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
        }
      };
      updateAudioLevels();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
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
      setAudioLevels([]);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setDuration(0);
    setRecordingTime(0);
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
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Recording Visualization */}
          <div className="w-full h-24 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-center space-x-1">
                {audioLevels.map((level, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm transition-all duration-100"
                    style={{
                      width: '3px',
                      height: `${Math.max(4, (level / 255) * 60)}px`,
                    }}
                  />
                ))}
              </div>
            ) : audioBlob ? (
              <div className="text-gray-400 text-sm">Recording ready for analysis</div>
            ) : (
              <div className="text-gray-400 text-sm">Tap record to start</div>
            )}
          </div>

          {/* Recording Time */}
          <div className="text-2xl font-mono text-gray-700">
            {formatTime(isRecording ? recordingTime : duration)}
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-4">
            {!audioBlob ? (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="lg"
                className={`w-16 h-16 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                }`}
                disabled={isAnalyzing}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            ) : (
              <>
                <Button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full"
                  disabled={isAnalyzing}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button
                  onClick={clearRecording}
                  size="lg"
                  variant="outline"
                  className="w-16 h-16 rounded-full text-red-500 hover:text-red-600"
                  disabled={isAnalyzing}
                >
                  <Trash className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>

          {/* Analyze Button */}
          {audioBlob && (
            <Button
              onClick={analyzeRecording}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing Speech...' : 'Analyze Speech'}
            </Button>
          )}

          {/* Hidden Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;
