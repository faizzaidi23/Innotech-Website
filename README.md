# Innotech Water Level Dashboard

A real-time water level monitoring dashboard with flood hazard detection. Built with React and WebSocket for live data streaming from ESP32.

## Features

- 🌊 Real-time water level monitoring
- 🚨 Flood hazard detection and alerts
- 📊 Live data visualization with charts
- 📡 WebSocket connection to ESP32
- 🔄 Auto-reconnect on connection loss
- 📱 Responsive design for all devices
- 🎨 Modern, visually appealing UI

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

### 3. Configure ESP32 Connection

1. Open the dashboard in your browser
2. Enter your ESP32's IP address (default: `192.168.1.100`)
3. Enter the WebSocket port (default: `81`)
4. Click "Connect"

## ESP32 WebSocket Data Format

Your ESP32 should send JSON data via WebSocket in one of these formats:

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

## Troubleshooting

### Connection Issues
- Ensure ESP32 and your computer are on the same WiFi network
- Check firewall settings (WebSocket uses specific ports)
- Verify ESP32 IP address is correct
- Check if ESP32 WebSocket server is running

### Data Not Displaying
- Verify ESP32 is sending data in correct JSON format
- Check browser console for WebSocket errors
- Ensure WebSocket message format matches expected structure

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool and dev server
- **Recharts** - Data visualization
- **WebSocket** - Real-time communication

## License

MIT
