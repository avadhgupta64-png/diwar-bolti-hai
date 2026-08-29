import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, AlertTriangle, Phone, Volume2, WifiOff } from 'lucide-react';

export function EmergencyOverlay({ show, buildingData, onClose, onTestAlarm }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (show) {
      // Trigger vibration on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }

      // Play alarm sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Audio play failed (likely autoplay policy)
          console.log('Audio play blocked by browser policy');
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [show]);

  if (!show || !buildingData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#000000]"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, #ff0000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
        <div className="absolute top-0 left-0 w-full h-full bg-[#ff0000]/5 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="mb-6"
        >
          <ShieldX size={120} className="text-[#ff0000] animate-danger-pulse" />
        </motion.div>

        {/* Main Message */}
        <motion.h1
          className="text-4xl md:text-6xl font-bold font-mono text-[#ff0000] mb-4"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          !!! DANGER !!!
        </motion.h1>

        <motion.h2
          className="text-2xl md:text-3xl font-bold text-[#ff0000] mb-8"
          animate={{ opacity: [1, 0.8, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {buildingData.message || 'BAHAR NIKLO - POTENTIAL STRUCTURAL ANOMALY'}
        </motion.h2>

        {/* Building Info */}
        <motion.div 
          className="glass-card max-w-md w-full p-6 mb-8 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[#888888] text-xs font-mono mb-1">BUILDING ID</div>
              <div className="text-white font-mono">{buildingData.buildingId || 'UNKNOWN'}</div>
            </div>
            <div>
              <div className="text-[#888888] text-xs font-mono mb-1">RISK SCORE</div>
              <div className="text-[#ff0000] font-mono text-xl">{buildingData.riskScore}/100</div>
            </div>
            <div>
              <div className="text-[#888888] text-xs font-mono mb-1">CONFIRMED</div>
              <div className="text-[#ff0000] font-mono">{buildingData.confirmedPhones || 0} PHONES</div>
            </div>
            <div>
              <div className="text-[#888888] text-xs font-mono mb-1">STATUS</div>
              <div className="text-[#ff0000] font-mono">DANGER</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onTestAlarm}
            className="flex items-center justify-center space-x-2 bg-[#ff0000] hover:bg-[#ff0000]/90 text-[#000000] font-bold font-mono py-4 px-6 rounded-xl"
          >
            <Volume2 size={24} />
            <span>TEST ALARM</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('tel:112', '_self')}
            className="flex items-center justify-center space-x-2 bg-[#ffffff]/10 hover:bg-[#ffffff]/20 text-white font-bold font-mono py-4 px-6 rounded-xl border border-[#ff0000]/30"
          >
            <Phone size={24} />
            <span>CALL EMERGENCY</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex items-center justify-center space-x-2 bg-[#ffffff]/5 hover:bg-[#ffffff]/10 text-[#ffffff] font-mono py-3 px-6 rounded-xl"
          >
            <ShieldX size={20} />
            <span>I ACKNOWLEDGE, CONTINUE MONITORING</span>
          </motion.button>
        </div>

        {/* Warning Text */}
        <motion.div 
          className="mt-8 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center space-x-2 text-[#888888] text-xs">
            <AlertTriangle size={16} />
            <span>
              Move to a safe location and follow local emergency procedures
            </span>
          </div>
        </motion.div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} loop>
        <source src="/alarm.mp3" type="audio/mpeg" />
      </audio>
    </motion.div>
  );
}