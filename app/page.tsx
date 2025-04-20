"use client"
import { useState, useEffect, useRef, ChangeEvent } from 'react';

type PatternStep = [number, number, number];

interface PatternData {
  pattern: PatternStep[];
}

const BinauralPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFrequency, setLeftFrequency] = useState(440);
  const [rightFrequency, setRightFrequency] = useState(430);
  const [patternInput, setPatternInput] = useState<string>(JSON.stringify({
    pattern: [
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
  }, null, 2));
  const [parsedPattern, setParsedPattern] = useState<PatternStep[]>([]);
  const [isPatternMode, setIsPatternMode] = useState(false);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [patternError, setPatternError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const leftPannerRef = useRef<StereoPannerNode | null>(null);
  const rightPannerRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const animationPhaseRef = useRef<number>(0);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        leftOscillatorRef.current = audioContextRef.current.createOscillator();
        rightOscillatorRef.current = audioContextRef.current.createOscillator();
        leftPannerRef.current = audioContextRef.current.createStereoPanner();
        rightPannerRef.current = audioContextRef.current.createStereoPanner();
        gainNodeRef.current = audioContextRef.current.createGain();

        leftPannerRef.current.pan.value = -1;
        rightPannerRef.current.pan.value = 1;

        leftOscillatorRef.current.connect(leftPannerRef.current);
        rightOscillatorRef.current.connect(rightPannerRef.current);
        leftPannerRef.current.connect(gainNodeRef.current);
        rightPannerRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);

        leftOscillatorRef.current.frequency.setValueAtTime(leftFrequency, audioContextRef.current.currentTime);
        rightOscillatorRef.current.frequency.setValueAtTime(rightFrequency, audioContextRef.current.currentTime);

        leftOscillatorRef.current.start();
        rightOscillatorRef.current.start();

        gainNodeRef.current.disconnect();
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        if (leftOscillatorRef.current) {
          try { leftOscillatorRef.current.stop(); } catch (e) { console.error("Error stopping left oscillator:", e); }
        }
        if (rightOscillatorRef.current) {
          try { rightOscillatorRef.current.stop(); } catch (e) { console.error("Error stopping right oscillator:", e); }
        }
        audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
        audioContextRef.current = null;
        leftOscillatorRef.current = null;
        rightOscillatorRef.current = null;
        leftPannerRef.current = null;
        rightPannerRef.current = null;
        gainNodeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    if (isPlaying) {
      gainNodeRef.current.connect(audioContextRef.current.destination);
      if (leftOscillatorRef.current) {
        leftOscillatorRef.current.frequency.setValueAtTime(leftFrequency, audioContextRef.current.currentTime);
      }
      if (rightOscillatorRef.current) {
        rightOscillatorRef.current.frequency.setValueAtTime(rightFrequency, audioContextRef.current.currentTime);
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Error resuming audio context:", e));
      }
    } else {
      gainNodeRef.current.disconnect();
      if (audioContextRef.current.state === 'running') {
         audioContextRef.current.suspend().catch(e => console.error("Error suspending audio context:", e));
      }
    }
  }, [isPlaying, leftFrequency, rightFrequency]);

  useEffect(() => {
    if (!isPatternMode && audioContextRef.current && leftOscillatorRef.current && rightOscillatorRef.current) {
      const now = audioContextRef.current.currentTime;
      leftOscillatorRef.current.frequency.setValueAtTime(leftFrequency, now);
      rightOscillatorRef.current.frequency.setValueAtTime(rightFrequency, now);
    }
  }, [leftFrequency, rightFrequency, isPatternMode]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const playPatternStep = (index: number) => {
      if (!parsedPattern || parsedPattern.length === 0) {
        setIsPlaying(false);
        return;
      }

      const [leftHz, rightHz, durationMs] = parsedPattern[index];

      setLeftFrequency(leftHz);
      setRightFrequency(rightHz);

      timeoutId = setTimeout(() => {
        const nextIndex = (index + 1) % parsedPattern.length;
        setCurrentPatternIndex(nextIndex);
      }, durationMs);
    };

    if (isPlaying && isPatternMode && parsedPattern.length > 0) {
      playPatternStep(currentPatternIndex);
    } else if (!isPlaying && isPatternMode) {
        setCurrentPatternIndex(0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPlaying, isPatternMode, parsedPattern, currentPatternIndex]);

  const parsePattern = () => {
    try {
      const data: PatternData = JSON.parse(patternInput);
      if (Array.isArray(data.pattern) && data.pattern.every(step =>
        Array.isArray(step) && step.length === 3 &&
        typeof step[0] === 'number' && step[0] > 0 &&
        typeof step[1] === 'number' && step[1] > 0 &&
        typeof step[2] === 'number' && step[2] > 0
      )) {
        setParsedPattern(data.pattern);
        setPatternError(null);
        setCurrentPatternIndex(0);
      } else {
        setParsedPattern([]);
        setPatternError("Invalid pattern format. Expected array of [number, number, number].");
      }
    } catch (error) {
      setParsedPattern([]);
      setPatternError("Invalid JSON format.");
      console.error("Parsing error:", error);
    }
  };

  useEffect(() => {
    parsePattern();
  }, [patternInput]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const amplitude = height / 4;
    const centerY = height / 2;

    let lastTimestamp = 0;

    const draw = (timestamp: number) => {
      if (!isPlaying) {
        ctx.clearRect(0, 0, width, height);
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        return;
      }

      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000; // seconds
      lastTimestamp = timestamp;

      animationPhaseRef.current += delta * 2 * Math.PI * 2; // 2 cycles per second animation speed

      ctx.clearRect(0, 0, width, height);

      // Draw Left Wave (Blue)
      ctx.beginPath();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x++) {
        // Map x to time in seconds for the wave
        const time = x / width; // normalized 0 to 1
        // Calculate angle for sine wave: 2pi * frequency * time + phase
        const angle = 2 * Math.PI * leftFrequency * time + animationPhaseRef.current;
        const y = centerY + amplitude * Math.sin(angle);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Right Wave (Green)
      ctx.beginPath();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x++) {
        const time = x / width;
        const angle = 2 * Math.PI * rightFrequency * time + animationPhaseRef.current;
        const y = centerY + amplitude * Math.sin(angle);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    animationFrameIdRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, leftFrequency, rightFrequency]);

  const handleLeftFrequencyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const freq = parseFloat(e.target.value);
    if (!isNaN(freq) && freq > 0) {
      setLeftFrequency(freq);
    } else if (e.target.value === '') {
        setLeftFrequency(0);
    }
  };

  const handleRightFrequencyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const freq = parseFloat(e.target.value);
    if (!isNaN(freq) && freq > 0) {
      setRightFrequency(freq);
    } else if (e.target.value === '') {
        setRightFrequency(0);
    }
  };

  const handlePatternInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPatternInput(e.target.value);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMode = () => {
    setIsPatternMode(!isPatternMode);
    setIsPlaying(false);
    setCurrentPatternIndex(0);
    setPatternError(null);
    if (isPatternMode) {
    } else {
        parsePattern();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Binaural Beat Player</h1>

      <button
        onClick={togglePlay}
        className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 mb-8
          ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          ${isPlaying ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="mb-8">
        <button
          onClick={toggleMode}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        >
          Switch to {isPatternMode ? 'Manual Mode' : 'Pattern Mode'}
        </button>
      </div>

      {!isPatternMode && (
        <div className="flex flex-col md:flex-row gap-8 mb-8 w-full max-w-md">
          <div className="flex-1">
            <label htmlFor="leftFreq" className="block text-sm font-medium text-gray-300 mb-2">
              Left Frequency (Hz)
            </label>
            <input
              id="leftFreq"
              type="number"
              value={leftFrequency}
              onChange={handleLeftFrequencyChange}
              min="1"
              step="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="rightFreq" className="block text-sm font-medium text-gray-300 mb-2">
              Right Frequency (Hz)
            </label>
            <input
              id="rightFreq"
              type="number"
              value={rightFrequency}
              onChange={handleRightFrequencyChange}
              min="1"
              step="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {isPatternMode && (
        <div className="w-full max-w-xl mb-8">
          <label htmlFor="patternInput" className="block text-sm font-medium text-gray-300 mb-2">
            Pattern (JSON: [[leftHz, rightHz, durationMs], ...])
          </label>
          <textarea
            id="patternInput"
            value={patternInput}
            onChange={handlePatternInputChange}
            rows={10}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder='e.g., [[100, 90, 3000], [90, 100, 2500]]'
          />
           {patternError && (
            <p className="mt-2 text-sm text-red-400">{patternError}</p>
          )}
           {parsedPattern.length > 0 && (
            <p className="mt-2 text-sm text-green-400">Pattern parsed successfully. {parsedPattern.length} steps.</p>
           )}
           {isPatternMode && isPlaying && parsedPattern.length > 0 && (
             <p className="mt-2 text-sm text-blue-400">Playing step {currentPatternIndex + 1} of {parsedPattern.length}...</p>
           )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Wave Visualizer</h2>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-auto border border-gray-600 rounded-md"
        ></canvas>
         <div className="mt-4 text-sm text-gray-400">
            <p>Left Wave: <span className="text-blue-400">Blue</span></p>
            <p>Right Wave: <span className="text-green-400">Green</span></p>
            <p>Current Frequencies: Left {leftFrequency.toFixed(2)} Hz, Right {rightFrequency.toFixed(2)} Hz</p>
         </div>
      </div>

    </div>
  );
};

export default BinauralPlayer;
