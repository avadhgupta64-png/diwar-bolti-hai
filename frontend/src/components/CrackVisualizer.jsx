import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart3 } from 'lucide-react';

const BAND_MIN = 3000;
const BAND_MAX = 5000;

export function CrackVisualizer({ frequencyData, currentScore, label = "ACOUSTIC BAND: 3-5 kHz" }) {
  const canvasRef = useRef(null);
  const [peakFreq, setPeakFreq] = useState(0);
  const [bandEnergy, setBandEnergy] = useState(0);

  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0) return;

    const totalEnergy = Array.from(frequencyData).reduce((sum, val) => sum + val, 0);
    if (totalEnergy === 0) return;

    // Calculate band energy
    const bandStart = Math.floor((BAND_MIN / 22050) * (frequencyData.length / 2));
    const bandEnd = Math.floor((BAND_MAX / 22050) * (frequencyData.length / 2));
    
    const bandData = frequencyData.slice(bandStart, bandEnd);
    const bandEnergyValue = bandData.reduce((sum, val) => sum + val, 0) / bandData.length;
    
    // Find peak frequency in band
    let maxVal = 0;
    let maxIdx = 0;
    bandData.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    
    const peakFreqValue = bandStart + maxIdx;
    const peakFreqHz = Math.round((peakFreqValue / (frequencyData.length / 2)) * 22050);

    setBandEnergy(bandEnergyValue);
    setPeakFreq(peakFreqHz);

  }, [frequencyData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!frequencyData || frequencyData.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO AUDIO DATA', width / 2, height / 2);
      return;
    }

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calculate scales
    const fftSize = frequencyData.length;
    const sampleRate = 44100;
    const freqBinSize = sampleRate / (fftSize * 2);
    const bandStartIdx = Math.floor(BAND_MIN / freqBinSize);
    const bandEndIdx = Math.floor(BAND_MAX / freqBinSize);
    const bandWidth = bandEndIdx - bandStartIdx;

    // Draw frequency spectrum
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < fftSize / 2; i++) {
      const value = frequencyData[i];
      const x = (i / (fftSize / 2)) * width;
      const y = height - (value * height * 0.8 + height * 0.1);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw danger zone (3-5 kHz)
    const bandStartX = (bandStartIdx / (fftSize / 2)) * width;
    const bandEndX = (bandEndIdx / (fftSize / 2)) * width;
    const bandHeight = height * 0.8;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(bandStartX, height * 0.1, bandEndX - bandStartX, bandHeight);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(bandStartX, height * 0.1);
    ctx.lineTo(bandStartX, height * 0.9);
    ctx.moveTo(bandEndX, height * 0.1);
    ctx.lineTo(bandEndX, height * 0.9);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw peak marker
    const peakX = (peakFreq / (sampleRate / 2)) * width;
    ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(peakX, height - (Math.random() * height * 0.8 + height * 0.1), 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Horizontal grid lines
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    // Vertical grid lines
    for (let i = 0; i < 6; i++) {
      const x = (width / 5) * i;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('20kHz', width - 40, 20);
    ctx.fillText('0Hz', 10, 20);
    ctx.fillText(`${BAND_MIN}Hz`, bandStartX + 10, 20);
    ctx.fillText(`${BAND_MAX}Hz`, bandEndX - 50, 20);

    // Draw current values
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`PEAK: ${peakFreqHz}Hz`, width - 10, height - 10);
    ctx.fillText(`BAND ENERGY: ${(bandEnergy * 100).toFixed(1)}%`, width - 10, height - 25);

  }, [frequencyData, peakFreq, bandEnergy]);

  return (
    <motion.div 
      className="glass-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#888888]/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity size={20} className="text-[#00ff00]" />
          <span className="font-mono text-sm font-bold text-[#00ff00]">
            {label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-[#ff0000] animate-pulse" />
            <span className="text-xs text-[#ff0000] font-mono">DANGER ZONE</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative h-48 bg-[#000000]/50">
        <canvas 
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-full"
        />
        
        {/* Overlay for current score */}
        <div className="absolute top-4 right-4 bg-[#000000]/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#ff0000]/30">
          <div className="text-[#888888] text-xs font-mono mb-1">ACOUSTIC ANOMALY SCORE</div>
          <div className={`text-2xl font-bold font-mono ${currentScore > 50 ? 'text-[#ff0000]' : 'text-[#00ff00]'}`}>
            {currentScore}/100
          </div>
        </div>

        {/* Warning overlay */}
        {currentScore > 70 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#ff0000]/10 animate-pulse">
            <div className="bg-[#ff0000]/90 text-[#000000] px-4 py-2 rounded-lg font-mono font-bold text-lg animate-bounce">
              HIGH ACoustic ENERGY DETECTED
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 grid grid-cols-3 gap-4 border-t border-[#888888]/20">
        <div className="text-center">
          <div className="text-[#888888] text-xs font-mono mb-1">FREQUENCY PEAK</div>
          <div className="font-mono text-lg">{peakFreq} Hz</div>
        </div>
        <div className="text-center">
          <div className="text-[#888888] text-xs font-mono mb-1">BAND ENERGY</div>
          <div className="font-mono text-lg">{((bandEnergy * 100) % 100).toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[#888888] text-xs font-mono mb-1">STATUS</div>
          <div className={`font-mono text-lg ${currentScore > 50 ? 'text-[#ff0000]' : 'text-[#00ff00]'}`}>
            {currentScore > 50 ? 'MONITOR' : 'NORMAL'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}