import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Activity, AlertTriangle, Shield, Smartphone } from 'lucide-react';

export function DemoControls({ demoMode, onToggleDemo, onSimulate, buildingId }) {
  const [simulating, setSimulating] = React.useState(false);

  const handleSimulate = (type) => {
    setSimulating(true);
    onSimulate(type);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSimulating(false);
    }, 3000);
  };

  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#888888]/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity size={20} className="text-[#ff9500]" />
          <span className="font-mono text-sm font-bold text-[#ff9500]">
            DEMO MODE CONTROLS
          </span>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${demoMode ? 'bg-[#ff9500]/20 border border-[#ff9500]/30' : 'bg-[#00ff00]/20 border border-[#00ff00]/30'}`}>
          <span className={`text-xs font-bold ${demoMode ? 'text-[#ff9500]' : 'text-[#00ff00]'}`}>
            {demoMode ? 'SIMULATING' : 'REAL DATA'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSimulate('normal')}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#00ff00]/30 bg-[#00ff00]/5 hover:bg-[#00ff00]/10 transition-colors"
        >
          <Activity size={32} className="text-[#00ff00] mb-2" />
          <span className="font-mono text-sm text-[#00ff00]">Simulate Normal</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSimulate('anomaly')}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#ff9500]/30 bg-[#ff9500]/5 hover:bg-[#ff9500]/10 transition-colors"
        >
          <AlertTriangle size={32} className="text-[#ff9500] mb-2" />
          <span className="font-mono text-sm text-[#ff9500]">Simulate Anomaly</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSimulate('warning')}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#ff9500]/30 bg-[#ff9500]/5 hover:bg-[#ff9500]/10 transition-colors"
        >
          <Shield size={32} className="text-[#ff9500] mb-2" />
          <span className="font-mono text-sm text-[#ff9500]">Multi-Phone Warning</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSimulate('danger')}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#ff0000]/30 bg-[#ff0000]/5 hover:bg-[#ff0000]/10 transition-colors"
        >
          <Activity size={32} className="text-[#ff0000] animate-pulse mb-2" />
          <span className="font-mono text-sm text-[#ff0000]">Simulate DANGER</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSimulate('reset')}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#888888]/30 bg-[#888888]/5 hover:bg-[#888888]/10 transition-colors"
        >
          <RotateCcw size={32} className="text-[#888888] mb-2" />
          <span className="font-mono text-sm text-[#888888]">Reset</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleDemo}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${demoMode ? 'border-[#ff9500]/30 bg-[#ff9500]/20' : 'border-[#00ff00]/30 bg-[#00ff00]/5'}`}
        >
          {demoMode ? <Pause size={32} className="text-[#ff9500] mb-2" /> : <Play size={32} className="text-[#00ff00] mb-2" />}
          <span className={`font-mono text-sm ${demoMode ? 'text-[#ff9500]' : 'text-[#00ff00]'}`}>
            {demoMode ? 'Stop Simulation' : 'Start Demo Mode'}
          </span>
        </motion.button>
      </div>

      {/* Status */}
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-2 text-[#888888] text-xs">
          <Smartphone size={14} />
          <span>Simulated phone data flows through Socket.io</span>
        </div>
      </div>
    </motion.div>
  );
}