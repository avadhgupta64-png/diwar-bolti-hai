import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, MapPin, Phone } from 'lucide-react';

const STATUS_COLORS = {
  SAFE: '#00ff00',
  ANOMALY: '#fcaf03',
  WARNING: '#ff9500',
  DANGER: '#ff0000',
  CONNECTED: '#ffffff'
};

export function PhoneNetwork({ phones, buildingId }) {
  const canvasRef = useRef(null);
  const [hoveredPhone, setHoveredPhone] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !phones) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Convert phones to array
    const phoneArray = Object.entries(phones).map(([id, phone]) => ({
      id,
      ...phone,
      x: (Math.random() * 0.8 + 0.1) * width,
      y: (Math.random() * 0.7 + 0.2) * height
    }));

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < phoneArray.length; i++) {
      for (let j = i + 1; j < phoneArray.length; j++) {
        const p1 = phoneArray[i];
        const p2 = phoneArray[j];
        const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

        if (distance < 200) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
    }
    ctx.stroke();

    // Draw phones
    phoneArray.forEach(phone => {
      const status = phone.status || 'SAFE';
      const color = STATUS_COLORS[status] || STATUS_COLORS.SAFE;
      const radius = 12;

      // Draw connection circle
      ctx.beginPath();
      ctx.arc(phone.x, phone.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw phone circle
      ctx.beginPath();
      ctx.arc(phone.x, phone.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Anomaly pulse effect for DANGER
      if (status === 'DANGER') {
        ctx.beginPath();
        ctx.arc(phone.x, phone.y, radius + 10 + Math.random() * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 - Math.random() * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw building outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

  }, [phones]);

  const getPhoneColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.CONNECTED;
  };

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
          <MapPin size={20} className="text-[#ffffff]" />
          <span className="font-mono text-sm font-bold text-[#ffffff]">
            PHONE NETWORK
          </span>
        </div>
        <div className="text-xs text-[#888888]">
          {Object.keys(phones || {}).length} phones
        </div>
      </div>

      {/* Canvas */}
      <div className="relative h-64 bg-[#000000]/50">
        <canvas 
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-full"
        />

        {/* Phone details overlay */}
        {hoveredPhone && (
          <div className="absolute top-2 right-2 bg-[#000000]/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#ffffff]/30 text-xs font-mono z-10">
            <div className="mb-1">PHONE: {hoveredPhone.phoneId}</div>
            <div className="mb-1">PILLAR: {hoveredPhone.pillarId}</div>
            <div className="mb-1">SCORE: {hoveredPhone.anomalyScore}</div>
            <div className="mb-1">BATTERY: {hoveredPhone.battery}%</div>
            <div className={getPhoneColor(hoveredPhone.status) === '#00ff00' ? 'text-[#00ff00]' : 'text-[#ff0000]'}>
              STATUS: {hoveredPhone.status}
            </div>
          </div>
        )}
      </div>

      {/* Phone List */}
      <div className="p-4 max-h-48 overflow-y-auto">
        {Object.entries(phones || {}).length === 0 ? (
          <div className="text-center text-[#888888] py-4">
            No phones connected to this building
          </div>
        ) : (
          Object.entries(phones).map(([phoneId, phone]) => {
            const statusColor = getPhoneColor(phone.status || 'SAFE');
            return (
              <motion.div
                key={phoneId}
                className="flex items-center justify-between p-2 mb-2 rounded-lg border border-[#888888]/20 hover:bg-[#ffffff]/5 transition-colors"
                onMouseEnter={() => setHoveredPhone(phone)}
                onMouseLeave={() => setHoveredPhone(null)}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${statusColor} animate-breath`}
                    style={{ backgroundColor: statusColor }}
                  />
                  <div className="font-mono">
                    <div className="text-white text-sm">{phoneId}</div>
                    <div className="text-[#888888] text-xs">{phone.pillarId}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-[#888888] text-xs">SCORE</div>
                    <div className={`font-mono text-sm ${statusColor}`}>{phone.anomalyScore}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#888888] text-xs">BATTERY</div>
                    <div className="font-mono text-sm">{phone.battery}%</div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}