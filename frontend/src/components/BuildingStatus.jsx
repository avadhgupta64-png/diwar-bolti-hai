import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  AlertTriangle, 
  Activity,
  Building2,
  Wifi,
  WifiOff
} from 'lucide-react';

const STATUS_CONFIG = {
  SAFE: {
    icon: ShieldCheck,
    text: 'SAFE',
    subtext: 'No significant anomalies detected',
    color: 'text-[#00ff00]',
    bg: 'bg-[#00ff00]/10',
    border: 'border-[#00ff00]/30',
    glow: 'shadow-[#00ff00]/20',
    pulse: 'animate-breath'
  },
  ANOMALY: {
    icon: ShieldAlert,
    text: 'ANOMALY / MONITOR',
    subtext: 'Unusual activity detected - monitoring closely',
    color: 'text-[#fcaf03]',
    bg: 'bg-[#fcaf03]/10',
    border: 'border-[#fcaf03]/30',
    glow: 'shadow-[#fcaf03]/20',
    pulse: 'animate-pulse'
  },
  WARNING: {
    icon: AlertTriangle,
    text: 'WARNING',
    subtext: 'Unusual acoustic/vibration activity detected',
    color: 'text-[#ff9500]',
    bg: 'bg-[#ff9500]/10',
    border: 'border-[#ff9500]/30',
    glow: 'shadow-[#ff9500]/20',
    pulse: 'animate-pulse'
  },
  DANGER: {
    icon: ShieldX,
    text: '!!! DANGER !!!',
    subtext: 'BAHAR NIKLO - POTENTIAL STRUCTURAL ANOMALY',
    color: 'text-[#ff0000]',
    bg: 'bg-[#ff0000]/10',
    border: 'border-[#ff0000]/30',
    glow: 'shadow-[#ff0000]/40',
    pulse: 'animate-danger-pulse'
  }
};

export function BuildingStatus({ buildingData, buildingId }) {
  const [currentStatus, setCurrentStatus] = useState('SAFE');
  const [riskScore, setRiskScore] = useState(0);
  const [message, setMessage] = useState('');
  const [evacuation, setEvacuation] = useState(false);
  const [confirmedPhones, setConfirmedPhones] = useState(0);

  useEffect(() => {
    if (buildingData) {
      setCurrentStatus(buildingData.status || 'SAFE');
      setRiskScore(buildingData.riskScore || 0);
      setMessage(buildingData.message || '');
      setEvacuation(buildingData.evacuation || false);
      setConfirmedPhones(buildingData.confirmedPhones || 0);
    }
  }, [buildingData]);

  const config = STATUS_CONFIG[currentStatus];

  const Icon = config.icon;

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'SAFE': return 'text-[#00ff00]';
      case 'ANOMALY': return 'text-[#fcaf03]';
      case 'WARNING': return 'text-[#ff9500]';
      case 'DANGER': return 'text-[#ff0000]';
      default: return 'text-white';
    }
  };

  const getStatusBorder = () => {
    switch (currentStatus) {
      case 'SAFE': return 'border-[#00ff00]/20';
      case 'ANOMALY': return 'border-[#fcaf03]/20';
      case 'WARNING': return 'border-[#ff9500]/20';
      case 'DANGER': return 'border-[#ff0000]/20';
      default: return 'border-white/20';
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Status Header */}
      <div className={`p-6 border-b ${getStatusBorder()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${config.bg} ${getStatusColor()}`}>
              <Icon size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono tracking-tight">
                {buildingId || 'BUILDING UNKNOWN'}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-lg font-mono ${getStatusColor()} ${config.pulse}`}>
                  {config.text}
                </span>
                {buildingData?.phones?.size > 0 && (
                  <span className="text-xs text-[#888888] flex items-center">
                    <Wifi size={12} className="mr-1" />
                    {buildingData?.phones?.size || 0} phones active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#888888] text-xs font-mono mb-1">RISK SCORE</div>
            <div className={`text-4xl font-bold font-mono ${getStatusColor()}`}>
              {riskScore}/100
            </div>
            <div className={`text-xs mt-1 ${getStatusColor()} ${config.pulse}`}>
              {STATUS_CONFIG[currentStatus].subtext}
            </div>
          </div>
        </div>
      </div>

      {/* Status Details */}
      {currentStatus === 'DANGER' && evacuation && (
        <div className="bg-[#ff0000]/10 border-t-[#ff0000]/30 border-t p-4 animate-bounce">
          <div className="flex items-center justify-center space-x-2">
            <ShieldX size={24} className="text-[#ff0000]" />
            <span className="text-[#ff0000] font-bold font-mono text-center">
              {message || 'POTENTIAL STRUCTURAL ANOMALY DETECTED. Move to a safe location.'}
            </span>
          </div>
        </div>
      )}

      {currentStatus === 'WARNING' && (
        <div className="bg-[#ff9500]/5 border-t-[#ff9500]/20 border-t p-4">
          <div className="flex items-center space-x-2">
            <Activity size={20} className="text-[#ff9500]" />
            <span className="text-[#ff9500] text-sm">
              Unusual acoustic/vibration activity detected
            </span>
          </div>
        </div>
      )}

      {/* Confirmed Phones (for DANGER) */}
      {currentStatus === 'DANGER' && confirmedPhones > 0 && (
        <div className="bg-[#ff0000]/5 border-t-[#ff0000]/20 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity size={20} className="text-[#ff0000]" />
              <span className="text-[#ff0000] text-sm font-mono">
                CONFIRMED BY {confirmedPhones} PHONES
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SAFE;
  const Icon = config.icon;
  const getStatusColor = () => {
    switch (status) {
      case 'SAFE': return 'text-[#00ff00]';
      case 'ANOMALY': return 'text-[#fcaf03]';
      case 'WARNING': return 'text-[#ff9500]';
      case 'DANGER': return 'text-[#ff0000]';
      default: return 'text-white';
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${config.border} ${config.bg}`}>
      <Icon size={16} className={getStatusColor()} />
      <span className={`text-xs font-bold font-mono ${getStatusColor()}`}>
        {config.text}
      </span>
    </div>
  );
}