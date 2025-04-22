"use client"
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { FaPlay, FaPause, FaSyncAlt } from 'react-icons/fa'; // Import icons

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
  const [volume, setVolume] = useState(0.5); // Add volume state (0 to 1)
  const [isMounted, setIsMounted] = useState(false); // Track client-side mount

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
        gainNodeRef.current.connect(audioContextRef.current.destination); // Keep gain node connected

        // Set initial gain based on state (though it will be quickly updated by useEffect)
        gainNodeRef.current.gain.setValueAtTime(isPlaying ? volume : 0, audioContextRef.current.currentTime);

        leftOscillatorRef.current.frequency.setValueAtTime(leftFrequency, audioContextRef.current.currentTime);
        rightOscillatorRef.current.frequency.setValueAtTime(rightFrequency, audioContextRef.current.currentTime);

        leftOscillatorRef.current.start();
        rightOscillatorRef.current.start();

        // Don't disconnect initially, control via gain value
        // gainNodeRef.current.disconnect();
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

  // Update Gain Node value based on isPlaying and volume state
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const targetGain = isPlaying ? volume : 0;
      // Use linearRampToValueAtTime for smoother transitions
      gainNodeRef.current.gain.linearRampToValueAtTime(targetGain, audioContextRef.current.currentTime + 0.1); // 100ms ramp
    }
  }, [isPlaying, volume]);

  // Update Oscillator Frequencies when they change or when playing starts
  useEffect(() => {
    if (!audioContextRef.current || !gainNodeRef.current || !isPlaying) return;

    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.setValueAtTime(leftFrequency, audioContextRef.current.currentTime);
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.setValueAtTime(rightFrequency, audioContextRef.current.currentTime);
    }
    // Resume context if suspended when play is initiated
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.error("Error resuming audio context:", e));
    }
    // No need to suspend context when pausing, just set gain to 0
  }, [isPlaying, leftFrequency, rightFrequency]); // Keep dependencies

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

  // Set isMounted to true only after component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ensure canvas logic runs only when mounted and playing
    if (!isMounted || !isPlaying) return;

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
    // Add isMounted to dependency array
  }, [isPlaying, leftFrequency, rightFrequency, isMounted]);

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

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
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

   // Render a placeholder until mounted on the client to avoid 404 on initial load
   if (!isMounted) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading Binaural Player...</p></div>;
  }

  return (
    // Adjusted padding and main container for responsiveness
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-400 text-center">Binaural Beat Player</h1>

       {/* Visualizer - Moved to top */}
       <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-3 md:p-4 border border-gray-700 mb-6">
        {/* Removed h2 heading */}
        {/* Canvas container to help with responsiveness */}
        <div className="relative w-full" style={{ paddingBottom: '33.33%' }}> {/* Aspect ratio 3:1 */}
          <canvas
            ref={canvasRef}
            // Removed fixed width/height, using CSS for sizing
            className="absolute top-0 left-0 w-full h-full border border-gray-600 rounded-md"
          ></canvas>
        </div>
         <div className="mt-3 text-xs md:text-sm text-gray-400 text-center">
            {/* Removed color key text */}
            <p>Current: L {leftFrequency.toFixed(1)} Hz | R {rightFrequency.toFixed(1)} Hz</p>
         </div>
      </div>

      {/* Play/Mode Controls Container - Centered */}
      <div className="flex justify-center items-center gap-6 mb-6 w-full">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          // Centered Play Button Styling
          className={`p-4 rounded-full text-2xl transition-colors duration-200
            ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
            ${isPlaying ? 'focus:ring-red-500' : 'focus:ring-green-500'}`}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button
          onClick={toggleMode}
          aria-label={`Switch to ${isPatternMode ? 'Manual Mode' : 'Pattern Mode'}`}
          title={`Switch to ${isPatternMode ? 'Manual Mode' : 'Pattern Mode'}`} // Tooltip
          className="px-4 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        >
          {isPatternMode ? 'Manual' : 'Pattern'}
        </button>
      </div>

      {/* Sliders Row - New Row for Left, Right, Volume */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 mb-6 w-full max-w-2xl">

        {/* Left Frequency Slider (Conditional) */}
        {!isPatternMode && (
          <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="leftFreq" className="block text-xs font-medium text-gray-300 mb-1 text-center sm:text-left">
              Left Freq
            </label>
            {/* Removed number input for simplicity */}
            <input
              id="leftFreqRange" // Changed id to avoid conflict if number input is added back
              type="range"
              min="20"
              max="1000"
              step="1"
              value={leftFrequency}
              onChange={handleLeftFrequencyChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              aria-labelledby="leftFreq"
            />
             <p className="text-xs text-gray-400 text-center mt-1">{leftFrequency.toFixed(1)} Hz</p>
          </div>
        )}

        {/* Volume Control - Moved to this row */}
        <div className="flex-1 w-full sm:w-auto">
           <label htmlFor="volume" className="block text-xs font-medium text-gray-300 mb-1 text-center sm:text-left">
            Volume
          </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" // Changed accent color
              aria-label={`Volume ${Math.round(volume * 100)}%`}
            />
             <p className="text-xs text-gray-400 text-center mt-1">{Math.round(volume * 100)}%</p>
        </div>

         {/* Right Frequency Slider (Conditional) */}
        {!isPatternMode && (
          <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="rightFreq" className="block text-xs font-medium text-gray-300 mb-1 text-center sm:text-left">
              Right Freq
            </label>
             {/* Removed number input for simplicity */}
             <input
              id="rightFreqRange" // Changed id
              type="range"
              min="20"
              max="1000"
              step="1"
              value={rightFrequency}
              onChange={handleRightFrequencyChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              aria-labelledby="rightFreq"
            />
             <p className="text-xs text-gray-400 text-center mt-1">{rightFrequency.toFixed(1)} Hz</p>
          </div>
        )}
      </div> {/* End Sliders Row */}


      {/* Pattern Input Area (Conditional) */}
      {isPatternMode && (
        <div className="w-full max-w-xl mb-6">
          <label htmlFor="patternInput" className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Pattern Sequence (JSON: [[L_Hz, R_Hz, duration_ms], ...])
          </label>
          <textarea
            id="patternInput"
            value={patternInput}
            onChange={handlePatternInputChange}
            rows={5} // Slightly reduced rows
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder='e.g., [[100, 90, 3000], [90, 100, 2500]]'
          />
           {patternError && (
            <p className="mt-2 text-sm text-red-400 text-center">{patternError}</p>
           )}
           {parsedPattern.length > 0 && !patternError && (
            <p className="mt-2 text-sm text-green-400 text-center">Pattern loaded: {parsedPattern.length} steps.</p>
           )}
           {isPatternMode && isPlaying && parsedPattern.length > 0 && !patternError && (
             <p className="mt-2 text-sm text-blue-400 text-center">Playing step {currentPatternIndex + 1}/{parsedPattern.length}...</p>
           )}
        </div>
      )}

    </div>
  );
};

export default BinauralPlayer;
