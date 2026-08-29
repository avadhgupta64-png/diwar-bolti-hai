import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [buildings, setBuildings] = useState({});
  const [currentBuildingId, setCurrentBuildingId] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const demoIntervalRef = useRef(null);

  // Connect to socket
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('registered', (data) => {
      console.log('Registered:', data);
    });

    newSocket.on('building_warning', (data) => {
      setBuildings(prev => ({
        ...prev,
        [data.buildingId]: {
          ...prev[data.buildingId],
          status: 'WARNING',
          riskScore: data.riskScore
        }
      }));
    });

    newSocket.on('building_danger', (data) => {
      setBuildings(prev => ({
        ...prev,
        [data.buildingId]: {
          ...prev[data.buildingId],
          status: 'DANGER',
          riskScore: data.riskScore,
          evacuation: data.evacuation,
          message: data.message,
          confirmedPhones: data.confirmedPhones,
          phones: data.phones
        }
      }));
    });

    newSocket.on('building_status', (data) => {
      setBuildings(prev => ({
        ...prev,
        [data.buildingId]: {
          ...prev[data.buildingId],
          status: data.status,
          riskScore: data.riskScore
        }
      }));
    });

    newSocket.on('phone_update', (data) => {
      setBuildings(prev => {
        const building = prev[data.buildingId] || { phones: {} };
        return {
          ...prev,
          [data.buildingId]: {
            ...building,
            phones: {
              ...building.phones,
              [data.phoneId]: {
                phoneId: data.phoneId,
                status: data.status,
                anomalyScore: data.anomalyScore,
                acousticScore: data.acousticScore,
                vibrationScore: data.vibrationScore,
                lastUpdate: Date.now()
              }
            }
          }
        };
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Register a phone
  const registerPhone = useCallback((buildingId, pillarId, phoneId, lat, lng) => {
    if (!socket || demoMode) return false;

    socket.emit('register_phone', {
      buildingId,
      pillarId,
      phoneId,
      lat,
      lng
    });
    return true;
  }, [socket, demoMode]);

  // Send sensor data
  const sendSensorData = useCallback((buildingId, phoneId, data) => {
    if (!socket || demoMode) return false;

    socket.emit('sensor_data', {
      buildingId,
      phoneId,
      ...data,
      timestamp: Date.now()
    });
    return true;
  }, [socket, demoMode]);

  // Send heartbeat
  const sendHeartbeat = useCallback((buildingId, phoneId) => {
    if (!socket || demoMode) return;

    socket.emit('heartbeat', {
      buildingId,
      phoneId
    });
  }, [socket, demoMode]);

  // Set current building
  const setCurrentBuilding = useCallback((buildingId) => {
    setCurrentBuildingId(buildingId);
  }, []);

  // Toggle demo mode
  const toggleDemoMode = useCallback(() => {
    if (demoMode) {
      setDemoMode(false);
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    } else {
      setDemoMode(true);
    }
  }, [demoMode]);

  // Demo simulation
  useEffect(() => {
    if (!demoMode) return;

    const simulatePhoneData = (buildingId, phoneId, pillarId) => {
      const isAnomaly = Math.random() > 0.7;
      const crackScore = isAnomaly ? 55 + Math.random() * 45 : 10 + Math.random() * 30;
      const freqPeak = isAnomaly ? 3800 + Math.random() * 1200 : 2000 + Math.random() * 1500;
      const accelDelta = isAnomaly ? 2.5 + Math.random() * 2.5 : 0.2 + Math.random() * 0.8;
      const acousticScore = Math.round(crackScore * 0.7 + (freqPeak > 3000 ? 20 : 0));
      const vibrationScore = Math.round(accelDelta * 30 + Math.random() * 10);
      const battery = Math.max(0, 100 - Math.random() * 0.5);

      sendSensorData(buildingId, phoneId, {
        crackScore,
        freqPeak,
        accelDelta,
        acousticScore,
        vibrationScore,
        battery
      });
    };

    if (currentBuildingId) {
      const buildingPhones = [
        { phoneId: 'PHONE-01', pillarId: 'P1' },
        { phoneId: 'PHONE-02', pillarId: 'P2' },
        { phoneId: 'PHONE-03', pillarId: 'P3' }
      ];

      demoIntervalRef.current = setInterval(() => {
        buildingPhones.forEach(({ phoneId, pillarId }) => {
          simulatePhoneData(currentBuildingId, phoneId, pillarId);
        });
      }, 2000);
    }

    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [demoMode, currentBuildingId, sendSensorData]);

  // Reset building data
  const resetBuilding = useCallback((buildingId) => {
    setBuildings(prev => ({
      ...prev,
      [buildingId]: {
        buildingId,
        phones: {},
        crackHistory: [],
        riskScore: 0,
        status: 'SAFE'
      }
    }));
  }, []);

  return {
    socket,
    connectionStatus,
    buildings,
    currentBuildingId,
    demoMode,
    registerPhone,
    sendSensorData,
    sendHeartbeat,
    setCurrentBuilding,
    toggleDemoMode,
    resetBuilding
  };
}