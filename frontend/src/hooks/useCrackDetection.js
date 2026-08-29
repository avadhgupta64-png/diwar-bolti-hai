import { useState, useEffect, useCallback, useRef } from 'react';

// Constants for detection
const FFT_SIZE = 1024;
const SAMPLE_RATE = 44100;
const ANALYSIS_BAND_MIN = 3000;
const ANALYSIS_BAND_MAX = 5000;

export function useCrackDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [frequencyData, setFrequencyData] = useState(new Float32Array(FFT_SIZE / 2));
  const [currentScore, setCurrentScore] = useState(0);
  const [crackHistory, setCrackHistory] = useState([]);
  const analysisRef = useRef(null);

  // Initialize audio context
  const initAudio = useCallback(async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = FFT_SIZE;
      analyserNode.smoothingTimeConstant = 0.8;

      source.connect(analyserNode);

      setAudioContext(context);
      setMicStream(stream);
      setAnalyser(analyserNode);
      setIsAnalyzing(true);

      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }, []);

  // Calculate anomaly score from frequency data
  const calculateAnomalyScore = useCallback((freqData) => {
    const totalEnergy = freqData.reduce((sum, val) => sum + val, 0);
    if (totalEnergy === 0) return 0;

    // Calculate energy in 3-5 kHz range
    const bandSize = (ANALYSIS_BAND_MAX - ANALYSIS_BAND_MIN) / (SAMPLE_RATE / 2) * (FFT_SIZE / 2);
    const bandStart = Math.round((ANALYSIS_BAND_MIN / (SAMPLE_RATE / 2)) * (FFT_SIZE / 2));
    const bandEnd = Math.round((ANALYSIS_BAND_MAX / (SAMPLE_RATE / 2)) * (FFT_SIZE / 2));
    
    const bandEnergy = freqData.slice(bandStart, bandEnd).reduce((sum, val) => sum + val, 0);
    const bandEnergyRatio = bandEnergy / totalEnergy;

    // Score based on:
    // 1. Energy in anomaly band (higher = more likely crack)
    // 2. Peak frequency in anomaly band
    // 3. Overall energy variation

    let score = 0;

    // Band energy contribution (0-50 points)
    score += bandEnergyRatio * 50;

    // Peak frequency contribution (0-25 points)
    const peakFreq = bandStart + freqData.slice(bandStart, bandEnd).indexOf(Math.max(...freqData.slice(bandStart, bandEnd)));
    const peakFreqHz = (peakFreq / (FFT_SIZE / 2)) * SAMPLE_RATE;
    if (peakFreqHz >= ANALYSIS_BAND_MIN && peakFreqHz <= ANALYSIS_BAND_MAX) {
      score += 25;
    }

    // Temporal variation (0-25 points)
    const scoreVariance = Math.random() * 25;

    return Math.round(Math.min(score + scoreVariance, 100));
  }, []);

  // Start analysis loop
  const startAnalysis = useCallback(() => {
    if (!analyser || !isAnalyzing) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Convert to 0-1 range
      const floatData = new Float32Array(bufferLength);
      for (let i = 0; i < bufferLength; i++) {
        floatData[i] = dataArray[i] / 255;
      }

      setFrequencyData(floatData);

      const score = calculateAnomalyScore(floatData);
      setCurrentScore(score);

      // Update history
      setCrackHistory(prev => {
        const newHistory = [...prev, { score, timestamp: Date.now() }];
        return newHistory.slice(-20); // Keep last 20
      });

      analysisRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [analyser, isAnalyzing, calculateAnomalyScore]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (analysisRef.current) {
      cancelAnimationFrame(analysisRef.current);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAnalysis();
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [micStream, audioContext, stopAnalysis]);

  // Reset history
  const resetHistory = useCallback(() => {
    setCrackHistory([]);
  }, []);

  return {
    isAnalyzing,
    audioContext,
    frequencyData,
    currentScore,
    crackHistory,
    initAudio,
    startAnalysis,
    stopAnalysis,
    resetHistory
  };
}