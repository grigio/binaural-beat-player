"use client" // because of useEffect
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type FrequencyData = {
  time: number;
  left: number;
  right: number;
};

const ASMRPlayer = () => {
  const [leftFrequency, setLeftFrequency] = useState(440);
  const [rightFrequency, setRightFrequency] = useState(660);
  const [loopPatternText, setLoopPatternText] = useState('{\n  "pattern": [\n    [50, 48],\n    [48, 50]\n  ]\n}');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequencyData, setFrequencyData] = useState<FrequencyData[]>([]);
  const leftOscillatorRef = useRef<Tone.Oscillator | null>(null);
  const rightOscillatorRef = useRef<Tone.Oscillator | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Tone.start();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startOscillators();
    } else {
      stopOscillators();
    }
    return () => {
      stopOscillators();
    };
  }, [isPlaying]);

  useEffect(() => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.value = leftFrequency;
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.value = rightFrequency;
    }
  }, [leftFrequency, rightFrequency]);

  const startOscillators = async () => {
    if (!leftOscillatorRef.current) {
      leftOscillatorRef.current = new Tone.Oscillator(leftFrequency, "sine").toDestination();
    }
    if (!rightOscillatorRef.current) {
      rightOscillatorRef.current = new Tone.Oscillator(rightFrequency, "sine").toDestination();
    }

    leftOscillatorRef.current.start();
    rightOscillatorRef.current.start();

    startLoop();
  };

  const stopOscillators = () => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.stop();
      leftOscillatorRef.current.dispose();
      leftOscillatorRef.current = null;
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.stop();
      rightOscillatorRef.current.dispose();
      rightOscillatorRef.current = null;
    }
    stopLoop();
  };

  const parseLoopPattern = () => {
    try {
      const parsedPattern = JSON.parse(loopPatternText);
      if (parsedPattern && parsedPattern.pattern && Array.isArray(parsedPattern.pattern)) {
        return parsedPattern.pattern as number[][];
      } else {
        console.error('Invalid loop pattern format');
        return null;
      }
    } catch (error) {
      console.error('Error parsing loop pattern:', error);
      return null;
    }
  };

  const startLoop = () => {
    stopLoop(); // Clear any existing loop
    const loopPattern = parseLoopPattern();
    if (loopPattern) {
      let index = 0;
      intervalRef.current = setInterval(() => {
        const [left, right] = loopPattern[index % loopPattern.length];
        setLeftFrequency(left);
        setRightFrequency(right);
        setFrequencyData((prevData) => [
          ...prevData,
          {
            time: Date.now(),
            left: left,
            right: right,
          },
        ]);
        index++;
      }, 500);
    }
  };

  const stopLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleLoopPatternChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLoopPatternText(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">ASMR Player</h1>

      <div className="mb-4 w-full max-w-md">
        <label htmlFor="leftFrequency" className="block text-gray-700 text-sm font-bold mb-2">Left Frequency (Hz):</label>
        <input
          type="range"
          id="leftFrequency"
          min="50"
          max="1000"
          value={leftFrequency}
          onChange={(e) => setLeftFrequency(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <span className="text-gray-600 text-xs">{leftFrequency} Hz</span>
      </div>

      <div className="mb-4 w-full max-w-md">
        <label htmlFor="rightFrequency" className="block text-gray-700 text-sm font-bold mb-2">Right Frequency (Hz):</label>
        <input
          type="range"
          id="rightFrequency"
          min="50"
          max="1000"
          value={rightFrequency}
          onChange={(e) => setRightFrequency(Number(e.target.value))}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <span className="text-gray-600 text-xs">{rightFrequency} Hz</span>
      </div>

      <div className="mb-4 w-full max-w-md">
        <label htmlFor="loopPattern" className="block text-gray-700 text-sm font-bold mb-2">Loop Pattern (JSON):</label>
        <textarea
          id="loopPattern"
          value={loopPatternText}
          onChange={handleLoopPatternChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
        />
        <p className="text-gray-500 text-xs italic">Example: {'{\n  "pattern": [\n    [50, 48],\n    [48, 50]\n  ]\n}'}</p>
      </div>

      <button
        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isPlaying ? 'bg-red-500 hover:bg-red-700' : ''}`}
        type="button"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>

      <div className="mt-8 w-full max-w-4xl">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Frequency Visualizer</h2>
        <LineChart width={600} height={300} data={frequencyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
          <YAxis />
          <Tooltip labelFormatter={(time) => new Date(time as number).toLocaleTimeString()} />
          <Legend />
          <Line type="monotone" dataKey="left" stroke="#8884d8" name="Left Frequency" />
          <Line type="monotone" dataKey="right" stroke="#82ca9d" name="Right Frequency" />
        </LineChart>
      </div>
    </div>
  );
};

export default ASMRPlayer;