import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Activity,
  Building2,
  Wifi,
  WifiOff,
  Smartphone,
  Menu,
  X,
  ChevronRight,
  Bell,
  Battery,
  Info,
  Home,
  Settings,
  Download
} from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import { BuildingStatus, StatusBadge } from './components/BuildingStatus';
import { CrackVisualizer } from './components/CrackVisualizer';
import { PhoneNetwork } from './components/PhoneNetwork';
import { CrackTimeline } from './components/CrackTimeline';
import { LiveLogs } from './components/LiveLogs';
import { StatsGrid } from './components/StatsGrid';
import { DemoControls } from './components/DemoControls';
import { EmergencyOverlay } from './components/EmergencyOverlay';

// Building suggestions
const BUILDING_SUGGESTIONS = [
  'LAXMI-001',
  'MUSTAFABAD-004',
  'SHAHDARA-012',
  'DEMO-BUILDING',
  'KAROLBAGH-007',
  'PUSA-003',
  'OKHLA-009'
];

// Default demo data
const DEMO_BUILDINGS = {
  'LAXMI-001': {
    buildingId: 'LAXMI-001',
    phones: {
      'PHONE-01': { phoneId: 'PHONE-01', pillarId: 'P1', anomalyScore: 15, acousticScore: 12, vibrationScore: 18, battery: 85, status: 'SAFE' },
      'PHONE-02': { phoneId: 'PHONE-02', pillarId: 'P2', anomalyScore: 18, acousticScore: 15, vibrationScore: 21, battery: 72, status: 'SAFE' },
      'PHONE-03': { phoneId: 'PHONE-03', pillarId: 'P3', anomalyScore: 12, acousticScore: 10, vibrationScore: 14, battery: 91, status: 'SAFE' }
    },
    crackHistory: [],
    riskScore: 15,
    status: 'SAFE'
  },
  'DEMO-BUILDING': {
    buildingId: 'DEMO-BUILDING',
    phones: {
      'PHONE-01': { phoneId: 'PHONE-01', pillarId: 'P1', anomalyScore: 20, acousticScore: 18, vibrationScore: 22, battery: 85, status: 'SAFE' },
      'PHONE-02': { phoneId: 'PHONE-02', pillarId: 'P2', anomalyScore: 18, acousticScore: 15, vibrationScore: 21, battery: 72, status: 'SAFE' },
      'PHONE-03': { phoneId: 'PHONE-03', pillarId: 'P3', anomalyScore: 22, acousticScore: 19, vibrationScore: 25, battery: 91, status: 'SAFE' }
    },
    crackHistory: [],
    riskScore: 20,
    status: 'SAFE'
  }
};

function App() {
  const [view, setView] = useState('landing');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingInput, setBuildingInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showEmergency, setShowEmergency] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const { 
    socket, 
    connectionStatus, 
    buildings, 
    currentBuildingId, 
    demoMode: socketDemoMode,
    registerPhone,
    sendSensorData,
    sendHeartbeat,
    setCurrentBuilding,
    toggleDemoMode: toggleSocketDemoMode,
    resetBuilding
  } = useSocket();

  const logsRef = useRef([]);

  // Add log helper
  const addLog = (message, type = 'INFO') => {
    const log = { message, timestamp: Date.now(), type };
    logsRef.current = [...logsRef.current.slice(-99), log];
    setLogs(logsRef.current);
  };

  // Handle building selection
  const handleSelectBuilding = (buildingId) => {
    setSelectedBuilding(buildingId);
    setView('dashboard');
    addLog(`Selected building: ${buildingId}`);
  };

  // Handle building input
  const handleBuildingInput = (e) => {
    const value = e.target.value;
    setBuildingInput(value);
    if (value.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setBuildingInput(suggestion);
    setShowSuggestions(false);
  };

  // Simulate sensor data
  const simulateSensorData = (type) => {
    if (!selectedBuilding) return;

    addLog(`Simulating: ${type}`, 'SYSTEM');

    const simulatePhone = (phoneId, pillarId) => {
      let crackScore, freqPeak, accelDelta, acousticScore, vibrationScore;

      switch (type) {
        case 'normal':
          crackScore = 10 + Math.random() * 20;
          freqPeak = 2000 + Math.random() * 1500;
          accelDelta = 0.2 + Math.random() * 0.6;
          break;
        case 'anomaly':
          crackScore = 50 + Math.random() * 40;
          freqPeak = 3500 + Math.random() * 1500;
          accelDelta = 1.5 + Math.random() * 2;
          break;
        case 'warning':
          crackScore = 65 + Math.random() * 30;
          freqPeak = 4000 + Math.random() * 1000;
          accelDelta = 2.0 + Math.random() * 2;
          break;
        case 'danger':
          crackScore = 85 + Math.random() * 15;
          freqPeak = 4200 + Math.random() * 800;
          accelDelta = 3.5 + Math.random() * 2;
          break;
        default:
          return;
      }

      acousticScore = Math.round(crackScore * 0.7 + (freqPeak > 3000 ? 20 : 0));
      vibrationScore = Math.round(accelDelta * 30 + Math.random() * 10);

      sendSensorData(selectedBuilding, phoneId, {
        crackScore,
        freqPeak,
        accelDelta,
        acousticScore,
        vibrationScore,
        battery: Math.max(0, 100 - Math.random() * 0.5)
      });
    };

    simulatePhone('PHONE-01', 'P1');
    setTimeout(() => simulatePhone('PHONE-02', 'P2'), 200);
    setTimeout(() => simulatePhone('PHONE-03', 'P3'), 400);
  };

  // Reset building data
  const handleReset = () => {
    resetBuilding(selectedBuilding);
    addLog('Reset building data', 'SYSTEM');
  };

  // Handle demo mode toggle
  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    toggleSocketDemoMode();
    addLog(newMode ? 'Enabled demo mode' : 'Disabled demo mode', 'SYSTEM');
  };

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
    };
  }, []);

  // Request notification permission
  const requestNotification = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      addLog(`Notification permission: ${permission}`, 'SYSTEM');
    }
  };

  // Install app
  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      addLog(`App install: ${result}`, 'SYSTEM');
      setInstallPrompt(null);
      setShowInstallButton(false);
    }
  };

  // Check building status and show emergency if needed
  useEffect(() => {
    if (!selectedBuilding) return;

    const buildingData = buildings[selectedBuilding];
    
    if (buildingData && buildingData.status === 'DANGER') {
      setShowEmergency(true);
    }
  }, [buildings, selectedBuilding]);

  // Heartbeat simulation
  useEffect(() => {
    if (!selectedBuilding || demoMode) return;

    const interval = setInterval(() => {
      if (buildings[selectedBuilding]) {
        Object.keys(buildings[selectedBuilding].phones || {}).forEach(phoneId => {
          sendHeartbeat(selectedBuilding, phoneId);
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedBuilding, demoMode, buildings]);

  // Landing page component
  const LandingPage = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16 pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#000000]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0000] to-[#000000]" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ff0000 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tighter">
              <span className="text-[#ff0000]">YOUR WALLS</span>
              <br />
              <span className="text-white">SPEAK BEFORE</span>
              <br />
              <span className="text-[#ff0000]">THEY FALL</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#888888] mb-12 max-w-3xl mx-auto leading-relaxed">
              Turning discarded smartphones into a distributed acoustic and vibration monitoring network
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('dashboard')}
              className="bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold font-mono py-4 px-12 rounded-xl text-lg transition-all shadow-[#ff0000]/30 shadow-lg w-full md:w-auto"
            >
              PROTECT MY BUILDING
              <ChevronRight size={24} className="inline ml-2" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('dashboard')}
              className="border border-[#ffffff]/30 hover:bg-[#ffffff]/10 text-white font-bold font-mono py-4 px-12 rounded-xl text-lg transition-all w-full md:w-auto"
            >
              SEE HOW IT WORKS
            </motion.button>
          </motion.div>

          {/* Building Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative w-full aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#333333]">
              {/* Building silhouette */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-48 border-4 border-[#ffffff]/20 rounded-t-2xl bg-[#000000]" />
              </div>
              
              {/* Sensor nodes */}
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full bg-[#00ff00] animate-pulse"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 20}%`
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}

              {/* Connecting lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full">
                  <path
                    d="M160,150 L200,130 L240,160 L280,140 L320,170"
                    stroke="rgba(0, 255, 0, 0.3)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 max-w-3xl mx-auto text-left"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Turning e-waste into life-saving sensors</h3>
            <p className="text-[#888888] leading-relaxed mb-6">
              Diwar Bolti Hai explores whether discarded smartphones can be repurposed as a distributed sensing network. 
              A phone mounted near a pillar/structural element continuously analyzes:
            </p>
            <ul className="text-[#888888] space-y-2 mb-6">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#00ff00] rounded-full mr-3" />
                Microphone audio and acoustic energy in the 3–5 kHz range
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#00ff00] rounded-full mr-3" />
                Frequency spectrum / FFT analysis
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#00ff00] rounded-full mr-3" />
                Accelerometer vibration patterns
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-[#00ff00] rounded-full mr-3" />
                Temporal changes in vibration/acoustic patterns
              </li>
            </ul>
            <div className="border-l-2 border-[#ff0000] pl-6">
              <p className="text-[#888888] italic text-sm">
                "Detecting unusual structural acoustic and vibration patterns." <br />
                "A low-cost early-warning prototype."
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#222222] py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[#888888] mb-4">
            Experimental early-warning technology. Not a substitute for professional structural inspection or certified emergency systems.
          </p>
          <p className="text-[#666666] text-sm">
            © {new Date().getFullYear()} Diwar Bolti Hai. All rights reserved.
          </p>
        </div>
      </footer>
    </motion.div>
  );

  // Dashboard component
  const Dashboard = () => {
    const buildingData = buildings[selectedBuilding] || DEMO_BUILDINGS[selectedBuilding] || {
      buildingId: selectedBuilding,
      phones: {},
      crackHistory: [],
      riskScore: 0,
      status: 'SAFE'
    };

    const getBuildings = () => {
      const builtInBuildings = Object.keys(DEMO_BUILDINGS);
      const connectedBuildings = Object.keys(buildings);
      const allBuildings = [...new Set([...builtInBuildings, ...connectedBuildings])];
      return allBuildings.filter(b => !builtInBuildings.includes(b) || DEMO_BUILDINGS[b]);
    };

    return (
      <div className="min-h-screen bg-[#000000]">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#000000]/90 backdrop-blur-lg border-b border-[#222222]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Building2 size={24} className="text-[#ffffff]" />
                <h1 className="text-xl font-bold text-white">DIWAR BOLTI HAI</h1>
                <span className="text-sm text-[#888888]">LIVE MONITORING</span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Building Selector */}
                <div className="relative">
                  <div className="flex items-center space-x-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-[#333333]">
                    <Building2 size={16} className="text-[#888888]" />
                    <select
                      value={selectedBuilding || ''}
                      onChange={(e) => handleSelectBuilding(e.target.value)}
                      className="bg-transparent text-white font-mono outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Building</option>
                      {getBuildings().map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Connection Status */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${connectionStatus === 'connected' ? 'bg-[#00ff00]/10 border border-[#00ff00]/30' : 'bg-[#ff0000]/10 border border-[#ff0000]/30'}`}>
                  {connectionStatus === 'connected' ? <Wifi size={16} className="text-[#00ff00]" /> : <WifiOff size={16} className="text-[#ff0000]" />}
                  <span className={`text-xs font-mono ${connectionStatus === 'connected' ? 'text-[#00ff00]' : 'text-[#ff0000]'}`}>
                    {connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>

                {/* Demo Toggle */}
                <button
                  onClick={toggleDemoMode}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${demoMode ? 'bg-[#ff9500]/10 border-[#ff9500]/30' : 'bg-[#00ff00]/10 border-[#00ff00]/30'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${demoMode ? 'bg-[#ff9500] animate-pulse' : 'bg-[#00ff00]'}`} />
                  <span className="text-xs font-mono text-[#888888]">DEMO MODE</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Section */}
          <div className="mb-8">
            <BuildingStatus buildingData={buildingData} buildingId={selectedBuilding || 'BUILDING'} />
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <StatsGrid stats={buildingData} buildingData={buildingData} />
          </div>

          {/* Main Dashboard Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Crack Visualizer */}
              <CrackVisualizer
                frequencyData={new Float32Array([0.1, 0.2, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01])}
                currentScore={buildingData.riskScore}
              />

              {/* Phone Network */}
              <PhoneNetwork phones={buildingData.phones || {}} buildingId={selectedBuilding} />

              {/* Timeline */}
              <CrackTimeline history={buildingData.crackHistory || []} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Live Logs */}
              <LiveLogs logs={logs} />

              {/* Demo Controls */}
              <DemoControls
                demoMode={demoMode}
                onToggleDemo={toggleDemoMode}
                onSimulate={simulateSensorData}
                buildingId={selectedBuilding}
              />

              {/* Actions */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-mono font-bold text-[#ffffff] mb-4">ACTIONS</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      addLog('Alarm tested', 'SYSTEM');
                      setShowEmergency(true);
                      setTimeout(() => setShowEmergency(false), 5000);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-[#ff0000] font-bold font-mono py-3 px-4 rounded-lg border border-[#ff0000]/30 transition-colors"
                  >
                    <Bell size={20} />
                    <span>TEST ALARM</span>
                  </button>

                  <button
                    onClick={requestNotification}
                    className="w-full flex items-center justify-center space-x-2 bg-[#ffffff]/5 hover:bg-[#ffffff]/10 text-white font-bold font-mono py-3 px-4 rounded-lg border border-[#ffffff]/30 transition-colors"
                  >
                    <Bell size={20} />
                    <span>REQUEST NOTIFICATIONS</span>
                  </button>

                  {showInstallButton && (
                    <button
                      onClick={installApp}
                      className="w-full flex items-center justify-center space-x-2 bg-[#00ff00]/10 hover:bg-[#00ff00]/20 text-[#00ff00] font-bold font-mono py-3 px-4 rounded-lg border border-[#00ff00]/30 transition-colors"
                    >
                      <Download size={20} />
                      <span>INSTALL APP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Overlay */}
        <EmergencyOverlay
          show={showEmergency}
          buildingData={buildingData}
          onClose={() => setShowEmergency(false)}
          onTestAlarm={() => {
            addLog('Emergency alarm tested', 'SYSTEM');
          }}
        />
      </div>
    );
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingPage key="landing" />
        ) : (
          <Dashboard key="dashboard" />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;