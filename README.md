# Diwar Bolti Hai 🏗️🔊

> **Turning e-waste into life-saving sensors.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-experimental-orange.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)
![Node.js](https://img.shields.io/badge/node-18+-339933.svg)

---

## 🎯 Problem Statement

In densely populated and underserved urban areas, many buildings lack affordable continuous structural monitoring. Traditional structural health monitoring systems are expensive, require professional installation, and are often beyond the reach of communities in developing regions.

Discarded Android phones (e-waste) represent a massive untapped resource. Each phone contains powerful sensors:
- **Microphone** for acoustic analysis
- **Accelerometer** for vibration monitoring
- **GPS** for location tracking
- **Battery** for portable operation

---

## 💡 Solution

**Diwar Bolti Hai** explores whether discarded smartphones can be repurposed as a distributed sensing network for structural anomaly detection.

The system works by:

1. **Sensor Collection**: Phones mounted near pillars/structural elements continuously analyze
   - Microphone audio and acoustic energy in the 3–5 kHz range
   - Frequency spectrum / FFT analysis
   - Accelerometer vibration patterns
   - Temporal changes in vibration/acoustic patterns

2. **Multi-Phone Consensus**: Instead of trusting one sensor, the system uses consensus across multiple phones within the same building to reduce false positives.

3. **Risk Assessment**: A prototype risk score combines:
   - Acoustic anomaly detection (45%)
   - Vibration anomaly detection (35%)
   - Multi-phone consensus (20%)

4. **Early Warning**: When anomalies are detected across multiple phones, the system provides early warnings to occupants.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OLD ANDROID PHONES                               │
│                                                                     │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐ │
│  │  PHONE 01    │        │  PHONE 02    │        │  PHONE 03    │ │
│  │              │        │              │        │              │ │
│  │  Microphone  │        │  Microphone  │        │  Microphone  │ │
│  │     ↓        │        │     ↓        │        │     ↓        │ │
│  │   FFT /      │        │   FFT /      │        │   FFT /      │ │
│  │   3–5kHz     │        │   3–5kHz     │        │   3–5kHz     │ │
│  │              │        │              │        │              │ │
│  │ Accelerometer│        │ Accelerometer│        │ Accelerometer│ │
│  │      ↓       │        │      ↓       │        │      ↓       │ │
│  │ Anomaly      │        │ Anomaly      │        │ Anomaly      │ │
│  │ Detection    │        │ Detection    │        │ Detection    │ │
│  └──────────────┘        └──────────────┘        └──────────────┘ │
│         │                      │                      │            │
│         └──────────────────────┼──────────────────────┘            │
│                                │ Socket.io                          │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NODE.JS BACKEND                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    /socket.io                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Multi-phone Consensus Engine                          │  │  │
│  │  │  - Track all phones per building                       │  │  │
│  │  │  - Calculate temporal persistence                      │  │  │
│  │  │  - Determine if anomalies are widespread               │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Risk Score Calculator                                 │  │  │
│  │  │  - Acoustic × 0.45                                     │  │  │
│  │  │  - Vibration × 0.35                                    │  │  │
│  │  │  - Consensus × 0.20                                    │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     REACT PWA DASHBOARD                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Building Status Dashboard                                  │  │
│  │  - Live sensor visualization                                │  │
│  │  - Phone network map                                        │  │
│  │  - Anomaly timeline                                         │  │
│  │  - Risk scores per building                                 │  │
│  │  - Emergency alerts with audio/vibration                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       WARNING / DANGER ALERT                        │
│                                                                     │
│  ✓ Multiple phones confirm anomaly                                 │
│  ✓ Risk score exceeds threshold                                    │
│  ✓ Emergency audio announced                                       │
│  ✓ Notification permissions granted                               │
│  ✓ Phone vibration triggered                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 How It Works

### Sensor Pipeline

1. **Microphone Analysis**
   - Audio sampled at 44.1 kHz
   - FFT performed on 1024-sample windows
   - Energy calculated in 3–5 kHz range (anomaly band)
   - Peak frequency tracked within band

2. **Accelerometer Analysis**
   - XYZ acceleration sampled
   - Delta values calculated between samples
   - Vibration score computed from acceleration changes

3. **Phone-level Anomaly Detection**
   - Individual phone calculates anomaly score (0–100)
   - Scores sent to backend via Socket.io

4. **Backend Consensus**
   - Multiple phones in same building tracked
   - Temporal window (60 seconds) for consistency check
   - Building risk score calculated
   - Status updates broadcast to all connected clients

### Detection Logic

```javascript
riskScore =
  acousticAnomaly × 0.45
  + vibrationAnomaly × 0.35
  + multiPhoneConsensus × 0.20
```

**Status Thresholds:**
- **0–34**: SAFE - No significant anomalies detected
- **35–64**: ANOMALY / MONITOR - Unusual activity detected
- **65–79**: WARNING - Unusual acoustic/vibration activity
- **80–100**: DANGER - Potential structural anomaly

---

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons
- **Vite PWA** - Progressive Web App

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - Real-time WebSocket communication
- **CORS** - Cross-origin resource sharing

### Sensor Client (Termux)
- **Python 3** - Core language
- **python-socketio** - WebSocket client
- **numpy** - FFT and signal processing
- **Termux APIs** - Sensor access (optional)

---

## 📸 Screenshots

**Landing Page**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│      YOUR WALLS SPEAK BEFORE THEY FALL                     │
│                                                             │
│   Turning e-waste into a low-cost monitoring network      │
│                                                             │
│         [ PROTECT MY BUILDING ]  [ SEE HOW IT WORKS ]     │
│                                                             │
│                 [ Building Visualization ]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ DIWAR BOLTI HAI | LIVE MONITORING | LAXMI-001 | CONNECTED   │
├─────────────────────────────────────────────────────────────┤
│  SAFE                                                       │
│  No significant anomalies detected                          │
│                                                             │
│  PHONES ACTIVE: 3    ANOMALIES: 0    RISK: 15/100         │
│                                                             │
│  [ FFT Spectrum ] [ Phone Network Map ]                    │
│                                                             │
│  [ Timeline ] [ Live Logs ]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Emergency Alert**
```
┌─────────────────────────────────────────────────────────────┐
│                      !!! DANGER !!!                         │
│                                                             │
│    BAHAR NIKLO - POTENTIAL STRUCTURAL ANOMALY              │
│                                                             │
│  MOVE TO A SAFE LOCATION AND FOLLOW LOCAL EMERGENCY        │
│                     PROCEDURES                              │
│                                                             │
│         [ TEST ALARM ] [ CALL EMERGENCY ]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Demo Instructions

### Running Locally

1. **Start Backend Server**
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

2. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3001
```

3. **Open Dashboard**
- Navigate to http://localhost:3001
- Select a building from the dropdown
- Use Demo Controls to simulate sensor data

### Running Termux Client

```bash
# Install dependencies
pip install -r requirements.txt

# Run in simulation mode (default)
python termux_client.py

# Or run with real sensors (Termux environment)
python termux_client.py
```

---

## 📱 PWA Installation

The app is installable as a Progressive Web App:

1. **Open in Chrome** on Android or desktop
2. **Click install button** in the address bar
3. **App installs** as a standalone application
4. **Works offline** with cached assets

Features:
- **Offline support** - Cache critical assets
- **Auto-updates** - Service worker updates on new versions
- **Standalone mode** - No browser UI when launched
- **Background sync** - Reconnect on network restoration

---

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Python 3.8+ (for Termux client)

### Setup

```bash
# Install all dependencies
cd frontend && npm install
cd ../backend && npm install

# Start development servers
cd backend && npm run dev
cd ../frontend && npm run dev
```

### Environment Variables

**Frontend:**
```
VITE_BACKEND_URL=http://localhost:3000
```

**Backend:**
```
PORT=3000
```

**Termux Client:**
```
SERVER_URL=http://localhost:3000
BUILDING_ID=DEMO-BUILDING
PHONE_ID=TERMUX-001
LAT=28.63
LNG=77.27
SIMULATION_MODE=True
```

---

## 🚢 Deployment

### Vercel (Frontend)

```bash
# Root vercel.json already configured
# Push to GitHub and connect in Vercel
# Or run:
vercel --prod
```

### Render (Backend)

1. **Create a Web Service** on Render
2. **Connect your repository**
3. **Set build command**: `npm install`
4. **Set start command**: `npm start`
5. **Set environment variable**: `PORT=3000`

---

## 📡 Socket API

### Events

**register_phone**
```json
{
  "buildingId": "LAXMI-001",
  "phoneId": "PHONE-01",
  "pillarId": "P1",
  "lat": 28.63,
  "lng": 77.27
}
```

**sensor_data**
```json
{
  "buildingId": "LAXMI-001",
  "phoneId": "PHONE-01",
  "crackScore": 45,
  "freqPeak": 4200,
  "accelDelta": 1.5,
  "acousticScore": 55,
  "vibrationScore": 48,
  "battery": 85.5,
  "timestamp": 1693300000000
}
```

**heartbeat**
```json
{
  "buildingId": "LAXMI-001",
  "phoneId": "PHONE-01"
}
```

### Broadcast Events

**building_warning**
```json
{
  "buildingId": "LAXMI-001",
  "riskScore": 67,
  "status": "WARNING",
  "message": "Unusual activity detected at LAXMI-001",
  "timestamp": 1693300000000
}
```

**building_danger**
```json
{
  "buildingId": "LAXMI-001",
  "riskScore": 92,
  "status": "DANGER",
  "evacuation": true,
  "message": "POTENTIAL STRUCTURAL ANOMALY DETECTED.",
  "confirmedPhones": 3,
  "phones": [
    {"phoneId": "PHONE-01", "anomalyScore": 85},
    {"phoneId": "PHONE-02", "anomalyScore": 88},
    {"phoneId": "PHONE-03", "anomalyScore": 83}
  ],
  "timestamp": 1693300000000
}
```

**phone_update**
```json
{
  "phoneId": "PHONE-01",
  "status": "WARNING",
  "anomalyScore": 65,
  "acousticScore": 58,
  "vibrationScore": 72,
  "buildingId": "LAXMI-001"
}
```

---

## 🔒 Security & Reliability

- **Input validation** - All sensor data validated server-side
- **CORS configuration** - Configured for specific origins
- **Heartbeat timeout** - Phones disconnected after 2 minutes
- **Payload limits** - 10MB max payload
- **Timestamp validation** - Server-side timestamps override client
- **No secrets** - Environment variables for sensitive data

---

## ⚠️ Safety Disclaimer

**IMPORTANT: This is an experimental prototype.**

- 🚫 **NOT** a scientific prediction system
- 🚫 **NOT** a certified structural engineering tool
- 🚫 **NOT** a replacement for professional inspections
- 🚫 **NOT** an emergency alert system

**DO NOT:**
- Rely on this system for life safety decisions
- Ignore certified structural engineering assessments
- Use this as the sole basis for evacuation decisions
- Replace emergency services communication

**DO:**
- Use as a supplementary monitoring tool
- Combine with professional inspections
- Treat alerts as early warnings to investigate
- Follow official emergency procedures

---

## 📈 Future Roadmap

```
Prototype
    ↓
Real structural-acoustic dataset
    ↓
TensorFlow Lite anomaly model
    ↓
On-device inference (edge AI)
    ↓
Calibrated multi-phone consensus
    ↓
Professional structural validation
    ↓
Community-scale deployment
```

### Planned Features

- **TensorFlow Lite** - On-device ML model for pattern recognition
- **Calibration** - Account for building-specific baselines
- **Historical trends** - Long-term anomaly pattern analysis
- **API access** - Third-party integration
- **Offline mode** - Local detection without server connection
- **Battery optimization** - Adaptive sampling rates

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Better acoustic signal processing
- [ ] More sophisticated vibration analysis
- [ ] ML-based anomaly detection
- [ ] Building-specific calibration
- [ ] Additional sensor types
- [ ] Performance optimization

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- **Problem identification**: Underserved urban communities
- **E-waste reuse**: Giving discarded phones new purpose
- **Open source**: Community collaboration and improvement

---

## 📞 Support

For issues and questions:
- GitHub Issues
- Documentation: [README.md](./README.md)
- License: [LICENSE](./LICENSE)

---

**Built with ❤️ for safer communities**

*"Your walls speak before they fall."*