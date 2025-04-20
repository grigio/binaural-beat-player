"use client"
import { useState, useEffect, useRef } from 'react';

interface AudioContextState {
  context: AudioContext | null;
  oscillatorLeft: OscillatorNode | null;
  oscillatorRight: OscillatorNode | null;
  analyserLeft: AnalyserNode | null;
  analyserRight: AnalyserNode | null;
}

interface Pattern {
  pattern: [number, number, number][];
}

export default function ASMRPlayer() {
  const [leftFreq, setLeftFreq] = useState(40);
  const [rightFreq, setRightFreq] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [patternText, setPatternText] = useState(`{
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
  const [error, setError] = useState('');
  
  const audioContextRef = useRef<AudioContextState>({
    context: null,
    oscillatorLeft: null,
    oscillatorRight: null,
    analyserLeft: null,
    analyserRight: null,
  });
  
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const patternIntervalRef = useRef<NodeJS.Timeout>();

  const initializeAudioContext = () => {
    const context = new AudioContext();
    const merger = context.createChannelMerger(2);
    
    // Left channel setup
    const oscillatorLeft = context.createOscillator();
    const analyserLeft = context.createAnalyser();
    const gainLeft = context.createGain();
    oscillatorLeft.connect(gainLeft);
    gainLeft.connect(analyserLeft);
    analyserLeft.connect(merger, 0, 0);
    
    // Right channel setup
    const oscillatorRight = context.createOscillator();
    const analyserRight = context.createAnalyser();
    const gainRight = context.createGain();
    oscillatorRight.connect(gainRight);
    gainRight.connect(analyserRight);
    analyserRight.connect(merger, 0, 1);
    
    merger.connect(context.destination);
    
    oscillatorLeft.frequency.value = leftFreq;
    oscillatorRight.frequency.value = rightFreq;
    
    audioContextRef.current = {
      context,
      oscillatorLeft,
      oscillatorRight,
      analyserLeft,
      analyserRight,
    };
  };

  const drawVisualizer = () => {
    if (!audioContextRef.current.analyserLeft || !audioContextRef.current.analyserRight) return;
    
    const drawChannel = (analyser: AnalyserNode, canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(200, 200, 200)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 0, 0)';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    drawChannel(audioContextRef.current.analyserLeft, canvasLeftRef.current);
    drawChannel(audioContextRef.current.analyserRight, canvasRightRef.current);
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const startAudio = () => {
    if (!audioContextRef.current.context) {
      initializeAudioContext();
    }

    if (audioContextRef.current.oscillatorLeft && audioContextRef.current.oscillatorRight) {
      audioContextRef.current.oscillatorLeft.start();
      audioContextRef.current.oscillatorRight.start();
      drawVisualizer();
    }
  };

  const stopAudio = () => {
    if (audioContextRef.current.oscillatorLeft && audioContextRef.current.oscillatorRight) {
      audioContextRef.current.oscillatorLeft.stop();
      audioContextRef.current.oscillatorRight.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    audioContextRef.current = {
      context: null,
      oscillatorLeft: null,
      oscillatorRight: null,
      analyserLeft: null,
      analyserRight: null,
    };
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      if (patternIntervalRef.current) {
        clearInterval(patternIntervalRef.current);
      }
    } else {
      startAudio();
      tryPlayPattern();
    }
    setIsPlaying(!isPlaying);
  };

  const updateFrequency = (left: number, right: number) => {
    setLeftFreq(left);
    setRightFreq(right);
    if (audioContextRef.current.oscillatorLeft && audioContextRef.current.oscillatorRight) {
      audioContextRef.current.oscillatorLeft.frequency.value = left;
      audioContextRef.current.oscillatorRight.frequency.value = right;
    }
  };

  const tryPlayPattern = () => {
    try {
      const patternObj: Pattern = JSON.parse(patternText);
      let currentIndex = 0;

      const playNextInPattern = () => {
        const [left, right, duration] = patternObj.pattern[currentIndex];
        updateFrequency(left, right);
        currentIndex = (currentIndex + 1) % patternObj.pattern.length;
      };

      if (patternIntervalRef.current) {
        clearInterval(patternIntervalRef.current);
      }

      playNextInPattern();
      patternIntervalRef.current = setInterval(() => {
        playNextInPattern();
      }, patternObj.pattern[currentIndex][2]);

      setError('');
    } catch (err) {
      setError('Invalid pattern format');
    }
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAudio();
      }
      if (patternIntervalRef.current) {
        clearInterval(patternIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">ASMR Frequency Player</h1>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl mb-2">Left Channel</h2>
            <input
              type="range"
              min="20"
              max="200"
              value={leftFreq}
              onChange={(e) => updateFrequency(Number(e.target.value), rightFreq)}
              className="w-full mb-2"
            />
            <div className="text-center">{leftFreq} Hz</div>
            <canvas
              ref={canvasLeftRef}
              width="300"
              height="100"
              className="w-full bg-gray-200 rounded"
            />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl mb-2">Right Channel</h2>
            <input
              type="range"
              min="20"
              max="200"
              value={rightFreq}
              onChange={(e) => updateFrequency(leftFreq, Number(e.target.value))}
              className="w-full mb-2"
            />
            <div className="text-center">{rightFreq} Hz</div>
            <canvas
              ref={canvasRightRef}
              width="300"
              height="100"
              className="w-full bg-gray-200 rounded"
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl mb-2">Pattern Configuration</h2>
          <textarea
            value={patternText}
            onChange={(e) => setPatternText(e.target.value)}
            className="w-full h-32 p-2 border rounded font-mono text-sm"
          />
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>

        <button
          onClick={togglePlay}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
      </div>
    </div>
  );
}