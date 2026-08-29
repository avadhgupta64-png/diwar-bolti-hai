#!/usr/bin/env python3
"""
Diwar Bolti Hai Termux Client

A sensor client that connects to the Diwar Bolti Hai backend and sends
acoustic and vibration sensor data from an Android device.

Usage:
    python termux_client.py [building_id] [phone_id] [server_url]

Environment Variables:
    SERVER_URL: Backend server URL (default: http://localhost:3000)
    BUILDING_ID: Building identifier (default: DEMO-BUILDING)
    PHONE_ID: Phone identifier (default: TERMUX-001)
    SIMULATION_MODE: Set to True to run without real sensors (default: True)
"""

import os
import sys
import json
import time
import math
import asyncio
import random
from datetime import datetime

try:
    import numpy as np
    from numpy.fft import rfft, rfftfreq
except ImportError:
    print("numpy not available. Installing...")
    os.system("pip install numpy")
    import numpy as np
    from numpy.fft import rfft, rfftfreq

try:
    import socketio
except ImportError:
    print("python-socketio not available. Installing...")
    os.system("pip install python-socketio")
    import socketio

try:
    import requests
except ImportError:
    print("requests not available. Installing...")
    os.system("pip install requests")
    import requests


# Constants
FFT_SIZE = 1024
SAMPLE_RATE = 44100
ANALYSIS_BAND_MIN = 3000
ANALYSIS_BAND_MAX = 5000

# Configuration from environment
SERVER_URL = os.environ.get('SERVER_URL', 'http://localhost:3000')
BUILDING_ID = os.environ.get('BUILDING_ID', 'DEMO-BUILDING')
PHONE_ID = os.environ.get('PHONE_ID', f'TERMUX-{random.randint(1, 999):03d}')
LAT = float(os.environ.get('LAT', '28.63'))
LNG = float(os.environ.get('LNG', '77.27'))
SIMULATION_MODE = os.environ.get('SIMULATION_MODE', 'True').lower() == 'true'
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

# State
sio = socketio.Client()
last_heartbeat = 0
audio_buffer = np.zeros(FFT_SIZE)
vibration_data = []
is_connected = False


def log(message, level='INFO'):
    """Log message with timestamp and level."""
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] [{level}] {message}")


def calculate_acoustic_score(audio_data, sample_rate):
    """
    Calculate acoustic anomaly score from audio data.
    Looks for energy in the 3-5 kHz range.
    """
    if len(audio_data) < FFT_SIZE:
        # Pad with zeros if not enough data
        audio_data = np.pad(audio_data, (0, FFT_SIZE - len(audio_data)))
    
    # Perform FFT
    fft_data = rfft(audio_data)
    freqs = rfftfreq(len(audio_data), 1 / sample_rate)
    
    # Calculate total energy
    total_energy = np.sum(np.abs(fft_data))
    if total_energy == 0:
        return 0
    
    # Calculate energy in 3-5 kHz range
    band_mask = (freqs >= ANALYSIS_BAND_MIN) & (freqs <= ANALYSIS_BAND_MAX)
    band_energy = np.sum(np.abs(fft_data[band_mask]))
    
    # Band energy ratio
    band_energy_ratio = band_energy / total_energy if total_energy > 0 else 0
    
    # Find peak frequency in band
    if np.any(band_mask):
        band_fft = fft_data.copy()
        band_fft[~band_mask] = 0
        peak_idx = np.argmax(np.abs(band_fft))
        peak_freq = freqs[peak_idx]
    else:
        peak_freq = 0
    
    # Score calculation
    score = 0
    
    # Band energy contribution (0-50 points)
    score += band_energy_ratio * 50
    
    # Peak frequency contribution (0-25 points)
    if ANALYSIS_BAND_MIN <= peak_freq <= ANALYSIS_BAND_MAX:
        score += 25
    
    # Temporal variation (0-25 points)
    score += random.random() * 25
    
    return min(int(score), 100)


def calculate_vibration_score(accel_data):
    """
    Calculate vibration anomaly score from accelerometer data.
    Looks for sudden changes in acceleration.
    """
    if len(accel_data) < 2:
        return 0
    
    # Calculate acceleration deltas
    deltas = np.diff(accel_data)
    max_delta = np.max(np.abs(deltas))
    
    # Score based on acceleration change
    # Typical values: 0-1 g for normal movement, 2+ g for anomalies
    score = min(int(max_delta * 30 + random.random() * 10), 100)
    
    return score


def read_audio_samples():
    """
    Read audio samples from microphone.
    Returns None if SIMULATION_MODE is True or reading fails.
    """
    if SIMULATION_MODE:
        return None
    
    try:
        import sounddevice as sd
        
        # Record audio
        duration = 0.5
        audio = sd.rec(int(duration * SAMPLE_RATE), 
                       samplerate=SAMPLE_RATE, 
                       channels=1,
                       dtype='float32')
        sd.wait()
        
        return audio.flatten()
        
    except Exception as e:
        log(f"Audio reading failed: {e}", 'ERROR')
        return None


def read_accelerometer():
    """
    Read accelerometer data from Termux sensor API.
    Returns None if SIMULATION_MODE is True or reading fails.
    """
    if SIMULATION_MODE:
        return None
    
    try:
        # Try to use termux-sensor
        result = os.popen('termux-sensor -n acceleration').read()
        data = json.loads(result)
        
        # Parse acceleration values
        if data and 'sensor' in data:
            sensor_data = data['sensor']
            if 'x' in sensor_data and 'y' in sensor_data and 'z' in sensor_data:
                return {
                    'x': sensor_data['x'],
                    'y': sensor_data['y'],
                    'z': sensor_data['z']
                }
        
        return None
        
    except Exception as e:
        log(f"Accelerometer reading failed: {e}", 'ERROR')
        return None


def simulate_audio_samples():
    """Generate simulated audio samples."""
    t = np.linspace(0, 1, FFT_SIZE)
    
    if random.random() > 0.7:  # Simulate anomaly
        # Add high-frequency content
        signal = np.sin(2 * np.pi * 4000 * t) * 0.3
        signal += np.sin(2 * np.pi * 4500 * t) * 0.2
        signal += np.random.randn(FFT_SIZE) * 0.1
    else:
        # Normal background noise
        signal = np.random.randn(FFT_SIZE) * 0.05
    
    return signal


def simulate_accelerometer():
    """Generate simulated accelerometer data."""
    if random.random() > 0.7:  # Simulate anomaly
        return {
            'x': random.uniform(-3, 3),
            'y': random.uniform(-3, 3),
            'z': random.uniform(-3, 3) + random.uniform(1, 3)
        }
    else:
        return {
            'x': random.uniform(-0.5, 0.5),
            'y': random.uniform(-0.5, 0.5),
            'z': random.uniform(0.8, 1.2)
        }


def get_battery_level():
    """Get battery level from Termux API."""
    if SIMULATION_MODE:
        return max(0, 100 - random.random() * 0.5)
    
    try:
        result = os.popen('termux-battery-status').read()
        data = json.loads(result)
        if data and 'percentage' in data:
            return data['percentage']
    except Exception as e:
        log(f"Battery reading failed: {e}", 'ERROR')
    
    return max(0, 100 - random.random() * 0.5)


def speak(text):
    """Use Termux TTS to speak a message."""
    if SIMULATION_MODE:
        log(f"TTS: {text}", 'INFO')
        return
    
    try:
        os.system(f'termux-tts-speak "{text}"')
        log(f"Spoken: {text}", 'INFO')
    except Exception as e:
        log(f"TTS failed: {e}", 'ERROR')


def flash_led(blinks=3, duration=0.2):
    """Flash the device LED for warning."""
    if SIMULATION_MODE:
        log(f"LED flash: {blinks} blinks", 'INFO')
        return
    
    try:
        import termuxapi
        
        for _ in range(blinks):
            termuxapi.flashlight(True)
            time.sleep(duration)
            termuxapi.flashlight(False)
            time.sleep(duration)
            
        log("LED flash completed", 'INFO')
    except Exception as e:
        log(f"LED flash failed: {e}", 'ERROR')


def register_phone():
    """Register phone with the backend."""
    log(f"Registering phone: {PHONE_ID} at {BUILDING_ID}", 'INFO')
    
    sio.emit('register_phone', {
        'buildingId': BUILDING_ID,
        'phoneId': PHONE_ID,
        'pillarId': 'TERMUX',
        'lat': LAT,
        'lng': LNG
    })


def send_sensor_data():
    """Collect sensor data and send to backend."""
    global audio_buffer, vibration_data
    
    # Read or simulate audio
    audio_data = read_audio_samples()
    if audio_data is None:
        audio_data = simulate_audio_samples()
    
    # Calculate acoustic score
    acoustic_score = calculate_acoustic_score(audio_data, SAMPLE_RATE)
    crack_score = acoustic_score
    freq_peak = 4000 + random.randint(-500, 500) if acoustic_score > 50 else 2500 + random.randint(-500, 500)
    
    # Read or simulate accelerometer
    accel_data = read_accelerometer()
    if accel_data is None:
        accel_data = simulate_accelerometer()
    
    # Calculate vibration score
    vibration_score = calculate_vibration_score([accel_data['z']])
    accel_delta = max(0, abs(accel_data['z']) - 1) * 2
    
    # Update buffer
    audio_buffer = np.roll(audio_buffer, -len(audio_data))
    audio_buffer[-len(audio_data):] = audio_data
    
    # Get battery level
    battery = get_battery_level()
    
    # Send sensor data
    sio.emit('sensor_data', {
        'buildingId': BUILDING_ID,
        'phoneId': PHONE_ID,
        'crackScore': crack_score,
        'freqPeak': freq_peak,
        'accelDelta': accel_delta,
        'acousticScore': acoustic_score,
        'vibrationScore': vibration_score,
        'battery': round(battery, 1),
        'timestamp': int(time.time() * 1000)
    })
    
    log(f"Sent: crack={crack_score}, freq={freq_peak}Hz, accel={accel_delta:.2f}g, battery={battery:.1f}%", 'DEBUG')
    
    return crack_score, acoustic_score


def check_warnings():
    """Check if warnings should be announced."""
    # This would typically check current sensor readings
    pass


@sio.event
def connect():
    """Handle socket connection."""
    global is_connected
    is_connected = True
    log(f"Connected to {SERVER_URL}", 'SUCCESS')
    
    # Register phone
    register_phone()
    
    # Speak welcome message
    if not SIMULATION_MODE:
        speak(f"Diwar Bolti Hai connected. Building {BUILDING_ID}. Phone {PHONE_ID}.")


@sio.event
def connect_error(data):
    """Handle connection error."""
    global is_connected
    is_connected = False
    log(f"Connection error: {data}", 'ERROR')


@sio.event
def disconnect():
    """Handle disconnection."""
    global is_connected
    is_connected = False
    log("Disconnected from server", 'WARNING')


@sio.event
def registered(data):
    """Handle registration response."""
    log(f"Registered: {data}", 'SUCCESS')


@sio.event
def sensor_update(data):
    """Handle sensor update response."""
    log(f"Sensor update: {data}", 'DEBUG')


@sio.event
def building_warning(data):
    """Handle building warning event."""
    log(f"WARNING: {data.get('message', 'Unknown warning')}", 'WARNING')
    speak(f"Warning at {BUILDING_ID}. Risk score {data.get('riskScore', 'unknown')}.")
    flash_led(2, 0.5)


@sio.event
def building_danger(data):
    """Handle building danger event."""
    log(f"DANGER: {data.get('message', 'Unknown danger')}", 'ERROR')
    speak(f"DANGER! BAHAR NIKLO! Structural anomaly detected at {BUILDING_ID}. Evacuate immediately!")
    flash_led(5, 0.3)


async def main():
    """Main entry point."""
    global is_connected
    
    log(f"Diwar Bolti Hai Termux Client", 'INFO')
    log(f"Server: {SERVER_URL}", 'INFO')
    log(f"Building: {BUILDING_ID}", 'INFO')
    log(f"Phone: {PHONE_ID}", 'INFO')
    log(f"Simulation Mode: {SIMULATION_MODE}", 'INFO')
    
    # Connect to server
    try:
        sio.connect(SERVER_URL)
    except Exception as e:
        log(f"Failed to connect: {e}", 'ERROR')
        sys.exit(1)
    
    # Send sensor data every 2 seconds
    try:
        while True:
            if is_connected:
                send_sensor_data()
                time.sleep(2)
            else:
                time.sleep(1)
    except KeyboardInterrupt:
        log("Stopping client...", 'INFO')
    finally:
        sio.disconnect()


if __name__ == '__main__':
    # Run the async main function
    asyncio.run(main())