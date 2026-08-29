import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

export function CrackTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <motion.div 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 border-b border-[#888888]/20">
          <Activity size={20} className="text-[#888888]" />
          <span className="ml-2 font-mono text-sm font-bold text-[#888888]">
            ANOMALY HISTORY
          </span>
        </div>
        <div className="p-6 text-center text-[#888888]">
          No anomalies detected in the last 10 minutes
        </div>
      </motion.div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (duration) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s ago`;
    }
    return `${seconds}s ago`;
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
            RECENT ANOMALIES
          </span>
        </div>
        <div className="text-xs text-[#888888]">
          {history.length} events / 10 min
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#888888]/20" />

        {history.slice(-20).map((event, index) => {
          const isDanger = event.anomalyScore > 65;
          const isWarning = event.anomalyScore > 40;
          
          return (
            <motion.div
              key={`${event.timestamp}-${index}`}
              className="relative pl-10 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Timeline dot */}
              <div 
                className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${isDanger ? 'bg-[#ff0000] border-[#ff0000]' : isWarning ? 'bg-[#ff9500] border-[#ff9500]' : 'bg-[#00ff00] border-[#00ff00]'}`}
              />

              {/* Event card */}
              <div className={`p-3 rounded-lg border ${isDanger ? 'bg-[#ff0000]/5 border-[#ff0000]/30' : isWarning ? 'bg-[#ff9500]/5 border-[#ff9500]/30' : 'bg-[#00ff00]/5 border-[#00ff00]/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock size={14} className="text-[#888888]" />
                    <span className="font-mono text-sm text-[#888888]">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div className={`font-mono text-sm ${isDanger ? 'text-[#ff0000]' : isWarning ? 'text-[#ff9500]' : 'text-[#00ff00]'}`}>
                    {isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'ANOMALY'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[#888888]">PHONE</div>
                    <div className="font-mono">{event.phoneId}</div>
                  </div>
                  <div>
                    <div className="text-[#888888]">SCORE</div>
                    <div className={`font-mono ${isDanger ? 'text-[#ff0000]' : 'text-[#ffffff]'}`}>
                      {event.anomalyScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#888888]">ACOUSTIC</div>
                    <div className="font-mono">{event.acousticScore || event.crackScore}</div>
                  </div>
                  <div>
                    <div className="text-[#888888]">VIBRATION</div>
                    <div className="font-mono">{event.vibrationScore || (event.accelDelta * 30)}</div>
                  </div>
                </div>

                {event.confirmed && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-[#00ff00]">
                    <ShieldAlert size={12} />
                    <span>CONFIRMED BY MULTIPLE PHONES</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}