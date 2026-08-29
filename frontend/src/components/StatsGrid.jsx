import React from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldAlert, Activity, Users } from 'lucide-react';

export function StatsGrid({ stats, buildingData }) {
  const activePhones = Object.keys(buildingData?.phones || {}).length;
  const anomalyCount = buildingData?.crackHistory?.filter(e => e.timestamp > Date.now() - 600000).length || 0;
  const riskScore = buildingData?.riskScore || 0;
  const confirmedPhones = buildingData?.confirmedPhones || 0;
  const totalPhones = Object.keys(buildingData?.phones || {}).length;

  const statCards = [
    {
      icon: Phone,
      label: 'PHONES ACTIVE',
      value: activePhones,
      subValue: 'connected sensors',
      color: 'text-[#00ff00]'
    },
    {
      icon: ShieldAlert,
      label: 'ANOMALIES / 10 MIN',
      value: anomalyCount,
      subValue: 'events detected',
      color: 'text-[#ff9500]'
    },
    {
      icon: Activity,
      label: 'RISK SCORE',
      value: riskScore,
      subValue: '/100',
      color: riskScore > 70 ? 'text-[#ff0000]' : riskScore > 35 ? 'text-[#ff9500]' : 'text-[#00ff00]'
    },
    {
      icon: Users,
      label: 'CONSENSUS',
      value: `${confirmedPhones}/${totalPhones}`,
      subValue: 'phones agree',
      color: confirmedPhones > 1 ? 'text-[#00ff00]' : 'text-[#ff9500]'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            className="glass-card p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 rounded-lg bg-[#ffffff]/5">
                <Icon size={20} className={stat.color} />
              </div>
              <span className="text-[#888888] text-xs font-mono uppercase">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-[#888888] text-xs mt-1">{stat.subValue}</div>
          </motion.div>
        );
      })}
    </div>
  );
}