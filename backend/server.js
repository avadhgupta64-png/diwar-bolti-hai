const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const buildings = new Map();
const ALERT_THRESHOLD = 5;
io.on('connection', (socket) => {
  socket.on('register_phone', ({ buildingId, pillarId, phoneId }) => {
    socket.buildingId = buildingId;
    socket.join(buildingId);
    if (!buildings.has(buildingId)) buildings.set(buildingId, { phones: new Map(), crackHistory: [] });
    buildings.get(buildingId).phones.set(phoneId, { pillarId, lastSeen: Date.now() });
    socket.emit('registered', { status: 'ok' });
  });
  socket.on('sensor_data', (data) => {
    const building = buildings.get(data.buildingId);
    if (!building) return;
    const isCrack = data.crackScore > 65 && data.accelDelta > 1.5;
    if (isCrack) {
      building.crackHistory.push({ ...data, receivedAt: Date.now() });
      building.crackHistory = building.crackHistory.filter(e => e.receivedAt > Date.now() - 10*60*1000);
      const recent = building.crackHistory.length;
      if (recent >= 3) io.to(data.buildingId).emit('building_warning', { message: `Darar badh rahi hai: ${recent} cracks` });
      if (recent >= ALERT_THRESHOLD) io.to(data.buildingId).emit('building_danger', { message: `KHATRA! BAHAR NIKLO! ${recent} cracks!`, evacuation: true });
    }
  });
});
app.get('/', (req,res)=> res.json({status:'Live', buildings: Array.from(buildings.keys())}));
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`Running on ${PORT}`));
