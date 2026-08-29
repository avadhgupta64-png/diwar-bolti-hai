const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 10 * 1024 * 1024
});

// Default buildings for demo
const DEFAULT_BUILDINGS = {
  'LAXMI-001': {
    buildingId: 'LAXMI-001',
    phones: new Map([
      ['PHONE-01', { phoneId: 'PHONE-01', pillarId: 'P1', lat: 28.63, lng: 77.27, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 85, acousticScore: 12, vibrationScore: 18, anomalyScore: 15, status: 'SAFE', socketId: null }],
      ['PHONE-02', { phoneId: 'PHONE-02', pillarId: 'P2', lat: 28.63, lng: 77.27, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 72, acousticScore: 15, vibrationScore: 21, anomalyScore: 18, status: 'SAFE', socketId: null }],
      ['PHONE-03', { phoneId: 'PHONE-03', pillarId: 'P3', lat: 28.63, lng: 77.27, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 91, acousticScore: 10, vibrationScore: 14, anomalyScore: 12, status: 'SAFE', socketId: null }]
    ]),
    crackHistory: [],
    riskScore: 15,
    status: 'SAFE'
  },
  'MUSTAFABAD-004': {
    buildingId: 'MUSTAFABAD-004',
    phones: new Map([
      ['PHONE-01', { phoneId: 'PHONE-01', pillarId: 'P1', lat: 28.65, lng: 77.20, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 88, acousticScore: 18, vibrationScore: 22, anomalyScore: 20, status: 'SAFE', socketId: null }],
      ['PHONE-02', { phoneId: 'PHONE-02', pillarId: 'P2', lat: 28.65, lng: 77.20, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 75, acousticScore: 20, vibrationScore: 25, anomalyScore: 22, status: 'SAFE', socketId: null }]
    ]),
    crackHistory: [],
    riskScore: 21,
    status: 'SAFE'
  },
  'SHAHDARA-012': {
    buildingId: 'SHAHDARA-012',
    phones: new Map([
      ['PHONE-01', { phoneId: 'PHONE-01', pillarId: 'P1', lat: 28.68, lng: 77.30, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 92, acousticScore: 8, vibrationScore: 10, anomalyScore: 9, status: 'SAFE', socketId: null }]
    ]),
    crackHistory: [],
    riskScore: 9,
    status: 'SAFE'
  },
  'DEMO-BUILDING': {
    buildingId: 'DEMO-BUILDING',
    phones: new Map([
      ['PHONE-01', { phoneId: 'PHONE-01', pillarId: 'P1', lat: 28.70, lng: 77.35, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 85, acousticScore: 15, vibrationScore: 18, anomalyScore: 16, status: 'SAFE', socketId: null }],
      ['PHONE-02', { phoneId: 'PHONE-02', pillarId: 'P2', lat: 28.70, lng: 77.35, connectedAt: Date.now(), lastHeartbeat: Date.now(), battery: 78, acousticScore: 12, vibrationScore: 15, anomalyScore: 13, status: 'SAFE', socketId: null }]
    ]),
    crackHistory: [],
    riskScore: 14,
    status: 'SAFE'
  }
};

const buildings = new Map(Object.entries(DEFAULT_BUILDINGS));

const RISK_WEIGHTS = {
  acoustic: 0.45,
  vibration: 0.35,
  consensus: 0.20
};

const STATUS_THRESHOLDS = {
  SAFE_MAX: 34,
  ANOMALY_MAX: 64,
  WARNING_MAX: 79,
  DANGER_MIN: 80
};

const CONSENSUS_WINDOW_MS = 60000;
const MIN_PHONE_CONSENSUS = 2;
const MAX_HISTORY_MS = 10 * 60 * 1000;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getStatusFromScore(riskScore) {
  if (riskScore <= STATUS_THRESHOLDS.SAFE_MAX) return 'SAFE';
  if (riskScore <= STATUS_THRESHOLDS.ANOMALY_MAX) return 'ANOMALY';
  if (riskScore <= STATUS_THRESHOLDS.WARNING_MAX) return 'WARNING';
  return 'DANGER';
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('register_phone', (data) => {
    try {
      const { buildingId, pillarId, phoneId, lat, lng } = data;

      if (!buildingId || !phoneId) {
        socket.emit('error', { message: 'buildingId and phoneId are required' });
        return;
      }

      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        socket.emit('error', { message: 'Invalid latitude' });
        return;
      }

      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        socket.emit('error', { message: 'Invalid longitude' });
        return;
      }

      socket.buildingId = buildingId;
      socket.join(buildingId);

      if (!buildings.has(buildingId)) {
        buildings.set(buildingId, {
          buildingId,
          phones: new Map(),
          crackHistory: [],
          riskScore: 0,
          status: 'SAFE'
        });
      }

      const building = buildings.get(buildingId);
      building.phones.set(phoneId, {
        phoneId,
        pillarId,
        lat,
        lng,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now(),
        battery: 100,
        acousticScore: 0,
        vibrationScore: 0,
        anomalyScore: 0,
        status: 'CONNECTED',
        socketId: socket.id
      });

      socket.emit('registered', { 
        status: 'ok', 
        message: `Registered ${phoneId} at ${buildingId}/${pillarId}` 
      });

      io.to(buildingId).emit('phone_update', {
        phoneId,
        action: 'connected',
        buildingId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error registering phone:', error);
      socket.emit('error', { message: 'Registration failed' });
    }
  });

  socket.on('sensor_data', (data) => {
    try {
      const { buildingId, phoneId, crackScore, freqPeak, accelDelta, timestamp, acousticScore, vibrationScore, battery } = data;

      if (!buildingId || !phoneId) {
        socket.emit('error', { message: 'buildingId and phoneId are required' });
        return;
      }

      if (typeof crackScore !== 'number' || crackScore < 0 || crackScore > 100) {
        socket.emit('error', { message: 'Invalid crackScore (must be 0-100)' });
        return;
      }

      if (typeof freqPeak !== 'number' || freqPeak < 0 || freqPeak > 20000) {
        socket.emit('error', { message: 'Invalid freqPeak (must be 0-20000 Hz)' });
        return;
      }

      if (typeof accelDelta !== 'number' || accelDelta < 0 || accelDelta > 10) {
        socket.emit('error', { message: 'Invalid accelDelta (must be 0-10 g)' });
        return;
      }

      const building = buildings.get(buildingId);
      if (!building) {
        socket.emit('error', { message: 'Building not found' });
        return;
      }

      const phone = building.phones.get(phoneId);
      if (!phone) {
        socket.emit('error', { message: 'Phone not registered' });
        return;
      }

      phone.lastHeartbeat = Date.now();
      phone.battery = battery ?? clamp(Math.round(phone.battery - Math.random() * 0.5), 0, 100);
      phone.acousticScore = acousticScore ?? clamp(Math.round(crackScore * 0.7 + (freqPeak > 3000 ? 20 : 0)), 0, 100);
      phone.vibrationScore = vibrationScore ?? clamp(Math.round(accelDelta * 30 + Math.random() * 10), 0, 100);
      phone.anomalyScore = clamp(Math.round((phone.acousticScore + phone.vibrationScore) / 2), 0, 100);

      const isAnomaly = crackScore > 40 || phone.anomalyScore > 45;
      
      if (isAnomaly) {
        const event = {
          phoneId,
          crackScore,
          freqPeak,
          accelDelta,
          acousticScore: phone.acousticScore,
          vibrationScore: phone.vibrationScore,
          anomalyScore: phone.anomalyScore,
          timestamp: timestamp || Date.now(),
          buildingId
        };
        
        building.crackHistory.push(event);
        building.crackHistory = building.crackHistory.filter(
          e => e.timestamp > Date.now() - MAX_HISTORY_MS
        );
      }

      const totalPhones = building.phones.size;
      
      if (totalPhones === 1) {
        building.riskScore = phone.anomalyScore;
      } else {
        let avgAnomaly = 0;
        building.phones.forEach(p => {
          avgAnomaly += p.anomalyScore;
        });
        avgAnomaly /= totalPhones;

        const recentEvents = building.crackHistory.filter(
          e => e.timestamp > Date.now() - CONSENSUS_WINDOW_MS
        );
        const anomalousPhones = new Set(recentEvents.map(e => e.phoneId));
        const consensusFactor = Math.min(anomalousPhones.size, totalPhones) / totalPhones;
        
        building.riskScore = Math.round(
          avgAnomaly * 0.8 + consensusFactor * 20
        );
      }

      const previousStatus = building.status;
      building.status = getStatusFromScore(building.riskScore);
      phone.status = building.status;

      socket.emit('sensor_update', {
        status: 'ok',
        buildingId,
        riskScore: building.riskScore,
        status: building.status
      });

      const broadcastData = {
        buildingId,
        riskScore: building.riskScore,
        status: building.status,
        timestamp: Date.now()
      };

      if (building.status === 'SAFE') {
        // Don't broadcast SAFE status
      } else if (building.status === 'ANOMALY' || building.status === 'WARNING') {
        if (previousStatus !== building.status) {
          io.to(buildingId).emit('building_warning', {
            ...broadcastData,
            message: `Unusual acoustic/vibration activity detected at ${buildingId}. Risk: ${building.riskScore}/100.`,
            acknowledgedPhones: building.crackHistory
              .filter(e => e.timestamp > Date.now() - CONSENSUS_WINDOW_MS)
              .map(e => e.phoneId)
          });
        }
      } else if (building.status === 'DANGER') {
        if (previousStatus !== building.status) {
          const confirmedPhones = new Set(
            building.crackHistory
              .filter(e => e.timestamp > Date.now() - CONSENSUS_WINDOW_MS)
              .map(e => e.phoneId)
          );
          
          io.to(buildingId).emit('building_danger', {
            ...broadcastData,
            evacuation: true,
            message: `POTENTIAL STRUCTURAL ANOMALY DETECTED. Move to a safe location and follow local emergency procedures.`,
            confirmedPhones: confirmedPhones.size,
            phones: building.crackHistory
              .filter(e => e.timestamp > Date.now() - CONSENSUS_WINDOW_MS)
              .map(e => ({ phoneId: e.phoneId, anomalyScore: e.anomalyScore }))
          });
        }
      }

      io.to(buildingId).emit('phone_update', {
        phoneId,
        status: phone.status,
        anomalyScore: phone.anomalyScore,
        acousticScore: phone.acousticScore,
        vibrationScore: phone.vibrationScore,
        buildingId
      });

    } catch (error) {
      console.error('Error processing sensor data:', error);
      socket.emit('error', { message: 'Sensor data processing failed' });
    }
  });

  socket.on('heartbeat', (data) => {
    try {
      const { buildingId, phoneId } = data;
      const building = buildings.get(buildingId);
      
      if (building && building.phones.has(phoneId)) {
        building.phones.get(phoneId).lastHeartbeat = Date.now();
      }
      
      socket.emit('heartbeat_ack', { status: 'ok', timestamp: Date.now() });
    } catch (error) {
      console.error('Error processing heartbeat:', error);
    }
  });

  socket.on('disconnect', () => {
    if (socket.buildingId) {
      const building = buildings.get(socket.buildingId);
      if (building) {
        for (const [phoneId, phone] of building.phones.entries()) {
          if (phone.socketId === socket.id || Date.now() - phone.lastHeartbeat > 30000) {
            building.phones.delete(phoneId);
            io.to(socket.buildingId).emit('phone_update', {
              phoneId,
              action: 'disconnected',
              buildingId: socket.buildingId,
              timestamp: Date.now()
            });
          }
        }
      }
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'Live',
    name: 'Diwar Bolti Hai',
    version: '1.0.0',
    buildings: Array.from(buildings.keys()).length,
    timestamp: Date.now()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: Date.now() 
  });
});

app.get('/buildings', (req, res) => {
  const buildingsList = Array.from(buildings.values()).map(b => ({
    buildingId: b.buildingId,
    phoneCount: b.phones.size,
    riskScore: b.riskScore,
    status: b.status,
    timestamp: b.crackHistory.length > 0 
      ? b.crackHistory[b.crackHistory.length - 1].timestamp 
      : null
  }));
  
  res.json({ buildings: buildingsList, timestamp: Date.now() });
});

app.get('/building/:id', (req, res) => {
  const building = buildings.get(req.params.id);
  
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }

  const phonesList = Array.from(building.phones.values()).map(p => ({
    phoneId: p.phoneId,
    pillarId: p.pillarId,
    lat: p.lat,
    lng: p.lng,
    connectedAt: p.connectedAt,
    lastHeartbeat: p.lastHeartbeat,
    battery: p.battery,
    acousticScore: p.acousticScore,
    vibrationScore: p.vibrationScore,
    anomalyScore: p.anomalyScore,
    status: p.status
  }));

  const recentHistory = building.crackHistory
    .slice(-50)
    .map(e => ({
      phoneId: e.phoneId,
      crackScore: e.crackScore,
      freqPeak: e.freqPeak,
      accelDelta: e.accelDelta,
      anomalyScore: e.anomalyScore,
      timestamp: e.timestamp
    }));

  res.json({
    buildingId: building.buildingId,
    phoneCount: building.phones.size,
    phones: phonesList,
    riskScore: building.riskScore,
    status: building.status,
    history: recentHistory,
    timestamp: building.crackHistory.length > 0
      ? building.crackHistory[building.crackHistory.length - 1].timestamp
      : null
  });
});

app.get('/building/:id/phones', (req, res) => {
  const building = buildings.get(req.params.id);
  
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }

  const phonesList = Array.from(building.phones.values()).map(p => ({
    phoneId: p.phoneId,
    pillarId: p.pillarId,
    lat: p.lat,
    lng: p.lng,
    connectedAt: p.connectedAt,
    lastHeartbeat: p.lastHeartbeat,
    battery: p.battery,
    acousticScore: p.acousticScore,
    vibrationScore: p.vibrationScore,
    anomalyScore: p.anomalyScore,
    status: p.status
  }));

  res.json({ phones: phonesList, timestamp: Date.now() });
});

app.get('/building/:id/history', (req, res) => {
  const building = buildings.get(req.params.id);
  
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }

  const history = building.crackHistory.map(e => ({
    phoneId: e.phoneId,
    crackScore: e.crackScore,
    freqPeak: e.freqPeak,
    accelDelta: e.accelDelta,
    anomalyScore: e.anomalyScore,
    timestamp: e.timestamp
  }));

  res.json({ history, timestamp: Date.now() });
});

setInterval(() => {
  const now = Date.now();
  for (const [id, building] of buildings.entries()) {
    const activePhones = Array.from(building.phones.values()).filter(
      p => now - p.lastHeartbeat < 60000
    );
    
    if (activePhones.length === 0) {
      buildings.delete(id);
      console.log(`Cleaned up stale building: ${id}`);
    }
  }
}, 5 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  for (const [id, building] of buildings.entries()) {
    for (const [phoneId, phone] of building.phones.entries()) {
      if (now - phone.lastHeartbeat > 120000) {
        building.phones.delete(phoneId);
        io.to(id).emit('phone_update', {
          phoneId,
          action: 'timeout',
          buildingId: id,
          timestamp: now
        });
      }
    }
  }
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Diwar Bolti Hai Backend running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`REST API: http://localhost:${PORT}`);
});