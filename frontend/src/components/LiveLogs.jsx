import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Info } from 'lucide-react';

const LOG_COLORS = {
  INFO: '#888888',
  WARNING: '#ff9500',
  DANGER: '#ff0000',
  SYSTEM: '#00ff00'
};

export function LiveLogs({ logs }) {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getLogLevel = (message) => {
    if (message.includes('DANGER') || message.includes('DANGER')) return 'DANGER';
    if (message.includes('WARNING') || message.includes('WARNING')) return 'WARNING';
    if (message.includes('SAFE') || message.includes('ok') || message.includes('connected')) return 'SYSTEM';
    return 'INFO';
  };

  return (
    <motion.div 
      className="glass-card font-mono text-xs overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#888888]/20 bg-[#000000]/50">
        <div className="flex items-center space-x-2">
          <Terminal size={16} className="text-[#888888]" />
          <span className="font-bold text-[#888888]">LIVE SYSTEM LOGS</span>
        </div>
      </div>

      {/* Logs container */}
      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto p-3 space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-[#888888] text-center py-4">
            Waiting for system events...
          </div>
        ) : (
          logs.map((log, index) => {
            const level = getLogLevel(log.message);
            const color = LOG_COLORS[level];

            return (
              <motion.div
                key={`${log.timestamp}-${index}`}
                className="flex items-start space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-[#888888] whitespace-nowrap">
                  {formatTime(log.timestamp)}{' '}
                </span>
                <span className={`whitespace-nowrap ${color} font-bold`}>
                  [{level}]{' '}
                </span>
                <span className="text-[#ffffff]">
                  {log.message}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}