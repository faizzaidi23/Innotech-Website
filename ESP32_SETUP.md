# ESP32 WebSocket Setup Guide

## 🚀 Quick Start

### Step 1: Install Required Libraries

Open Arduino IDE and install these libraries:

1. **WebSockets by Markus Sattler**
   - Go to: Sketch → Include Library → Manage Libraries
   - Search: "WebSockets"
   - Install: "WebSockets by Markus Sattler"

2. **ArduinoJson by Benoit Blanchon**
   - Search: "ArduinoJson"
   - Install: "ArduinoJson by Benoit Blanchon"

### Step 2: Configure WiFi

Open `ESP32_WebSocket_WaterLevel.ino` and update these lines:

```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

**Example:**
```cpp
const char* ssid = "MyHomeWiFi";
const char* password = "MyPassword123";
```

### Step 3: Connect Sensor

**Default pin: GPIO 34 (A0)**

Connect your water level sensor:
- Sensor VCC → ESP32 3.3V
- Sensor GND → ESP32 GND
- Sensor Signal → ESP32 GPIO 34

**Using a different pin?** Change this line:
```cpp
const int WATER_LEVEL_PIN = 34;  // Change to your pin number
```

### Step 4: Upload Code

1. **Connect ESP32** to your computer via USB
2. **Select Board**: Tools → Board → ESP32 Dev Module
3. **Select Port**: Tools → Port → (your ESP32 port)
4. **Upload**: Click the Upload button (→)

### Step 5: Get ESP32 IP Address

1. **Open Serial Monitor** (Ctrl+Shift+M)
2. **Set baud rate**: 115200
3. **Look for this message:**
   ```
   ✅ WiFi Connected Successfully!
   📍 ESP32 IP Address: 192.168.1.XXX
   🔌 WebSocket Port: 81
   ```
4. **Copy the IP address!**

### Step 6: Connect from Website

1. Open your React website: `http://localhost:3000`
2. Enter ESP32 IP: `192.168.1.XXX`
3. Enter Port: `81`
4. Click "Connect"
5. Enable "📱 Telegram Alerts"

## 🧪 Testing Without Real Sensor

Want to test without a physical sensor? Follow these steps:

1. Open `ESP32_WebSocket_WaterLevel.ino`
2. Find this section at the bottom:
   ```cpp
   // ALTERNATIVE: SIMULATED DATA FOR TESTING
   ```
3. **Uncomment the simulated function** (remove the `/*` and `*/`)
4. Upload the code
5. It will simulate water levels going up and down automatically!

## 📊 Expected Output

### Serial Monitor Output:
```
✅ WiFi Connected Successfully!
📍 ESP32 IP Address: 192.168.1.100
🔌 WebSocket Port: 81

✅ WebSocket Server Started!
📡 Waiting for client connections...

✅ Client #0 connected from 192.168.1.50
💧 Water Level: 45.2%
💧 Water Level: 46.8%
💧 Water Level: 72.5% ⚠️ WARNING
💧 Water Level: 85.0% 🚨 HAZARD!
```

## 🔧 Troubleshooting

### "WiFi Connection Failed"
- ✅ Check SSID is correct (case-sensitive!)
- ✅ Check password is correct
- ✅ Make sure router is on
- ✅ ESP32 and router on same network

### "Compilation Error"
- ✅ Install WebSockets library
- ✅ Install ArduinoJson library
- ✅ Select correct board (ESP32 Dev Module)

### "No Client Connected"
- ✅ Check ESP32 IP address in Serial Monitor
- ✅ Enter correct IP in website
- ✅ Use port 81
- ✅ Both devices on same WiFi network

### "Sensor Reading Always 0% or 100%"
- ✅ Check sensor wiring
- ✅ Check sensor power (3.3V)
- ✅ Adjust SENSOR_MIN and SENSOR_MAX values
- ✅ Use simulated data to test website first

## ⚙️ Customization

### Change Update Frequency
```cpp
const unsigned long SEND_INTERVAL = 1000; // 1 second (1000ms)
// Change to 2000 for 2 seconds, 5000 for 5 seconds, etc.
```

### Change Warning Threshold
```cpp
const float HAZARD_THRESHOLD = 80.0; // Alert at 80%
// Change to 70.0 for 70%, 90.0 for 90%, etc.
```

### Change WebSocket Port
```cpp
WebSocketsServer webSocket = WebSocketsServer(81);
// Change 81 to another port (e.g., 80, 8080, etc.)
```

### Adjust Sensor Range
```cpp
const int SENSOR_MIN = 0;    // Minimum reading from your sensor
const int SENSOR_MAX = 4095; // Maximum reading from your sensor
```

## 🎯 Connection Flow

```
1. ESP32 connects to WiFi → Gets IP (192.168.1.100)
2. ESP32 starts WebSocket server on port 81
3. You enter IP in website → Website connects to ESP32
4. ESP32 sends water level data every second
5. Website receives data → Shows on dashboard
6. When level ≥ 70% → Telegram alert sent!
```

## 📱 Complete System Flow

```
[ESP32 Sensor] → WiFi → [WebSocket] → [React Website] → [Node.js Backend] → [Telegram]
```

## ✅ Checklist

- [ ] Libraries installed (WebSockets, ArduinoJson)
- [ ] WiFi credentials updated in code
- [ ] Sensor connected to GPIO 34
- [ ] Code uploaded to ESP32
- [ ] Serial Monitor shows IP address
- [ ] Website running (npm start)
- [ ] IP and port entered in website
- [ ] Connection successful
- [ ] Telegram alerts enabled

---

**Need help? Check the Serial Monitor for detailed status messages!**
