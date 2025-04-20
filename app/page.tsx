"use client"
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const ASMRPlayer = () => {
  // Audio context and oscillators
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const leftPannerRef = useRef<StereoPannerNode | null>(null);
  const rightPannerRef = useRef<StereoPannerNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const patternTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for UI controls
  const [leftFrequency, setLeftFrequency] = useState<number>(100);
  const [rightFrequency, setRightFrequency] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [patternText, setPatternText] = useState<string>(`{
  "pattern": [
    [100, 90, 3000],
    [90, 100, 2500],
    [110, 95, 3500],
    [95, 110, 3000],
    [105, 92, 2500],
    [92, 105, 2000],
    [115, 98, 4000],
    [98, 115, 3500],
    [108, 94, 3000],
    [94, 108, 2500],
    [120, 100, 3500],
    [100, 120, 3000]
  ]
}`);
  const [isPatternPlaying, setIsPatternPlaying] = useState<boolean>(false);
  const [currentPatternIndex, setCurrentPatternIndex] = useState<number>(0);
  const [patternData, setPatternData] = useState<[number, number, number][]>([]);
  const [error, setError] = useState<string>("");

  // Initialize audio context
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (patternTimeoutRef.current) {
        clearTimeout(patternTimeoutRef.current);
      }
    };
  }, []);

  // Setup audio nodes
  const setupAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Create stereo panners for channel separation
      leftPannerRef.current = audioContextRef.current.createStereoPanner();
      leftPannerRef.current.pan.value = -1; // Full left
      leftPannerRef.current.connect(gainNodeRef.current);

      rightPannerRef.current = audioContextRef.current.createStereoPanner();
      rightPannerRef.current.pan.value = 1; // Full right
      rightPannerRef.current.connect(gainNodeRef.current);

      // Create oscillators
      leftOscillatorRef.current = audioContextRef.current.createOscillator();
      leftOscillatorRef.current.type = 'sine';
      leftOscillatorRef.current.frequency.value = leftFrequency;
      leftOscillatorRef.current.connect(leftPannerRef.current);

      rightOscillatorRef.current = audioContextRef.current.createOscillator();
      rightOscillatorRef.current.type = 'sine';
      rightOscillatorRef.current.frequency.value = rightFrequency;
      rightOscillatorRef.current.connect(rightPannerRef.current);

      // Start oscillators
      leftOscillatorRef.current.start();
      rightOscillatorRef.current.start();

      // Create analyser for visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      // Connect gain node to analyser
      gainNodeRef.current.disconnect();
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      // Start visualization
      drawVisualization();
    }
  };

  // Update oscillator frequencies
  useEffect(() => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.value = leftFrequency;
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.value = rightFrequency;
    }
  }, [leftFrequency, rightFrequency]);

  // Update volume and mute
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
      setIsPlaying(false);
      setIsPatternPlaying(false);
      if (patternTimeoutRef.current) {
        clearTimeout(patternTimeoutRef.current);
        patternTimeoutRef.current = null;
      }
    } else {
      // Play
      if (!audioContextRef.current) {
        setupAudio();
      } else {
        audioContextRef.current.resume();
      }
      setIsPlaying(true);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Draw visualization
  const drawVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#94e2d5';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  };

  // Parse and validate pattern
  const parsePattern = () => {
    try {
      const parsed = JSON.parse(patternText);
      if (!parsed.pattern || !Array.isArray(parsed.pattern)) {
        throw new Error("Invalid pattern format. Expected a 'pattern' array.");
      }
      
      const pattern = parsed.pattern;
      for (const item of pattern) {
        if (!Array.isArray(item) || item.length !== 3 ||
            typeof item[0] !== 'number' || 
            typeof item[1] !== 'number' || 
            typeof item[2] !== 'number') {
          throw new Error("Each pattern item must be an array of [leftFreq, rightFreq, duration].");
        }
      }
      
      setPatternData(pattern as [number, number, number][]);
      setError("");
      return pattern as [number, number, number][];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
      return null;
    }
  };

  // Play pattern
  const playPattern = () => {
    if (isPatternPlaying) {
      // Stop pattern
      if (patternTimeoutRef.current) {
        clearTimeout(patternTimeoutRef.current);
        patternTimeoutRef.current = null;
      }
      setIsPatternPlaying(false);
      return;
    }

    const pattern = parsePattern();
    if (!pattern) return;

    // Start audio if not already playing
    if (!isPlaying) {
      togglePlay();
    }

    setIsPatternPlaying(true);
    setCurrentPatternIndex(0);
    playNextInPattern(pattern, 0);
  };

  // Play next item in pattern
  const playNextInPattern = (pattern: [number, number, number][], index: number) => {
    if (!isPatternPlaying || !pattern || index >= pattern.length) {
      setIsPatternPlaying(false);
      return;
    }

    const [left, right, duration] = pattern[index];
    setLeftFrequency(left);
    setRightFrequency(right);
    setCurrentPatternIndex(index);

    patternTimeoutRef.current = setTimeout(() => {
      playNextInPattern(pattern, (index + 1) % pattern.length);
    }, duration);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">ASMR Frequency Player</h1>
        
        {/* Main player controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Left channel */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 text-blue-400">Left Channel</h2>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="20" 
                  max="500" 
                  value={leftFrequency} 
                  onChange={(e) => setLeftFrequency(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-lg font-mono w-16">{leftFrequency} Hz</span>
              </div>
            </div>
            
            {/* Right channel */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 text-red-400">Right Channel</h2>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="20" 
                  max="500" 
                  value={rightFrequency} 
                  onChange={(e) => setRightFrequency(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-lg font-mono w-16">{rightFrequency} Hz</span>
              </div>
            </div>
          </div>
          
          {/* Playback controls */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={togglePlay}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2"
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleMute}
                className="text-gray-300 hover:text-white"
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          {/* Visualizer */}
          <div className="bg-gray-900 rounded-lg p-2 mb-4">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={200} 
              className="w-full h-48 rounded-lg"
            />
          </div>
        </div>
        
        {/* Pattern player */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Pattern Sequencer</h2>
          
          <textarea 
            value={patternText} 
            onChange={(e) => setPatternText(e.target.value)}
            className="w-full h-48 p-3 bg-gray-900 text-gray-100 rounded-lg font-mono resize-none border border-gray-700 focus:outline-none focus:border-green-400"
          />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          
          <button 
            onClick={playPattern}
            className={`mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full flex items-center justify-center gap-2 w-full ${isPatternPlaying ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {isPatternPlaying ? 'Stop Pattern' : 'Play Pattern'}
          </button>
          {isPatternPlaying && <p className="mt-2 text-green-300 text-center">Playing pattern step {currentPatternIndex + 1} of {patternData.length}</p>}
        </div>
      </div>
    </div>
  );
};

export default ASMRPlayer;
