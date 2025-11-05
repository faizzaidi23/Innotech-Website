# Innotech Water Level Dashboard

A real-time water level monitoring dashboard with flood hazard detection. Built with React and MQTT for live data streaming from ESP32, enabling remote monitoring from anywhere.

## Features

- 🌊 Real-time water level monitoring
- 🚨 Flood hazard detection and alerts
- 📊 Live data visualization with charts
- 📡 MQTT connection for remote access
- 🔄 Auto-reconnect on connection loss
- 📱 Responsive design for all devices
- 🎨 Modern, visually appealing UI
- 🌐 Works from anywhere (not limited to local network)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### 3. Configure MQTT Connection

1. Open the dashboard in your browser
2. Enter MQTT Broker URL (default: `wss://broker.hivemq.com:8004/mqtt`)
3. Enter MQTT Topic (default: `innotech/water-level`)
4. Click "Connect"

**Popular Free MQTT Brokers:**
- HiveMQ Cloud (Public): `wss://broker.hivemq.com:8004/mqtt`
- Mosquitto Test: `wss://test.mosquitto.org:8081`
- Eclipse IoT: `wss://mqtt.eclipseprojects.io:443/mqtt`

## ESP32 MQTT Data Format

Your ESP32 should publish JSON data to the MQTT topic in one of these formats:

### Option 1: Simple format
```json
{
  "waterLevel": 75.5
}
```

### Option 2: With hazard threshold
```json
{
  "waterLevel": 85.0,
  "hazardThreshold": 80
}
```

### Option 3: Alternative field names (also supported)
```json
{
  "water_level": 65.2
}
```
or
```json
{
  "level": 70.5
}
```

### Hazard Detection

The dashboard automatically detects flood hazards when:
- Water level ≥ 80% (default threshold)
- Or when the ESP32 sends a `hazardThreshold` value

When hazardous, the dashboard will:
- Show a prominent red alert banner
- Display "FLOOD HAZARD!" status
- Change the water level indicator to red
- Add pulsing animations

## Dashboard Components

### Main Display
- **Current Water Level**: Shows percentage and status
- **Visual Indicator**: Animated water level bar with color coding
- **Status**: SAFE, MODERATE, HIGH - WARNING, or FLOOD HAZARD!

### Real-time Chart
- Displays water level history over time
- Updates automatically as new data arrives
- Shows last 100 data points

### Info Cards
- Water level percentage
- Current status (Safe/Hazard)
- Connection status

## Color Coding

- 🟢 **Green (0-50%)**: SAFE - Normal water level
- 🔵 **Blue (50-70%)**: MODERATE - Elevated but safe
- 🟠 **Orange (70-80%)**: HIGH - WARNING - Approaching danger
- 🔴 **Red (≥80%)**: FLOOD HAZARD! - Immediate action required

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Customization

### Adjust Hazard Threshold

Edit `src/components/WaterLevelDashboard.jsx` and change the default threshold:

```javascript
const hazardThreshold = data.hazardThreshold || 80 // Change 80 to your desired threshold
```

### Change Water Level Scale

If your sensor uses a different scale (e.g., 0-200cm instead of 0-100%), modify the component to convert the values accordingly.

## ESP32 Code Example

Here's a sample Arduino code for ESP32 to publish water level data to MQTT:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "innotech/water-level";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Connect to MQTT broker
  client.setServer(mqtt_server, mqtt_port);
  while (!client.connected()) {
    if (client.connect("ESP32WaterLevel")) {
      Serial.println("MQTT connected");
    } else {
      Serial.print("MQTT connection failed, retrying...");
      delay(2000);
    }
  }
}

void loop() {
  // Ensure MQTT connection is maintained
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Read water level from your sensor (example)
  float waterLevel = readWaterLevel(); // Your sensor reading function
  
  // Create JSON payload
  String payload = "{\"waterLevel\":" + String(waterLevel) + "}";
  
  // Publish to MQTT topic
  client.publish(mqtt_topic, payload.c_str());
  
  delay(5000); // Publish every 5 seconds
}

float readWaterLevel() {
  // Replace with your actual sensor reading code
  // Example: analogRead() or sensor library
  return 75.5; // Mock value
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32WaterLevel")) {
      Serial.println("MQTT reconnected");
    } else {
      delay(2000);
    }
  }
}
```

**Required Libraries:**
- Install `PubSubClient` library in Arduino IDE
- Library Manager: Search for "PubSubClient" by Nick O'Leary

## Troubleshooting

### Connection Issues
- Verify MQTT broker URL is correct (use `wss://` for secure WebSocket)
- Check if MQTT broker requires authentication (some brokers need username/password)
- Ensure ESP32 is connected to WiFi and can reach the MQTT broker
- Check browser console for MQTT connection errors

### Data Not Displaying
- Verify ESP32 is publishing to the correct MQTT topic
- Check browser console for MQTT subscription errors
- Ensure MQTT message format matches expected JSON structure
- Test with an MQTT client tool (like MQTT Explorer) to verify data is being published

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool and dev server
- **Recharts** - Data visualization
- **MQTT** - Real-time communication (works from anywhere)

## License

MIT
