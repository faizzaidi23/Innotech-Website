/*
 * ESP32 Water Level Sensor - WebSocket Server
 * 
 * This code creates a WebSocket server that sends water level data
 * Compatible with the Innotech Water Level Dashboard (React Website)
 * 
 * Required Libraries:
 * - WebSockets by Markus Sattler (install from Library Manager)
 * - WiFi (built-in with ESP32)
 * - ArduinoJson by Benoit Blanchon (install from Library Manager)
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// WiFi credentials - CHANGE THESE!
const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password

// Sensor configuration
const int WATER_LEVEL_PIN = 34;  // Analog pin for water level sensor (GPIO34)
const int SENSOR_MIN = 0;        // Minimum sensor reading
const int SENSOR_MAX = 4095;     // Maximum sensor reading (ESP32 12-bit ADC)

// Thresholds
const float HAZARD_THRESHOLD = 80.0;  // Alert threshold for dangerous water level

// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);

// ============================================
// GLOBAL VARIABLES
// ============================================

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 1000; // Send data every 1 second

// ============================================
// SETUP FUNCTION
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║  ESP32 Water Level WebSocket Server   ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  // Initialize sensor pin
  pinMode(WATER_LEVEL_PIN, INPUT);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("\n✅ WebSocket Server Started!");
  Serial.println("📡 Waiting for client connections...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  webSocket.loop();  // Handle WebSocket events
  
  // Send water level data at regular intervals
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    sendWaterLevelData();
    lastSendTime = currentTime;
  }
}

// ============================================
// WIFI CONNECTION
// ============================================

void connectToWiFi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n\n✅ WiFi Connected Successfully!");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("📍 ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("🔌 WebSocket Port: 81\n");
    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.println("\n💡 Enter this in your website:");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    Serial.println("   Port: 81");
  } else {
    Serial.println("\n\n❌ WiFi Connection Failed!");
    Serial.println("Please check:");
    Serial.println("  1. WiFi SSID is correct");
    Serial.println("  2. WiFi password is correct");
    Serial.println("  3. Router is powered on");
    Serial.println("\nRestarting ESP32 in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

// ============================================
// WEBSOCKET EVENT HANDLER
// ============================================

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("❌ Client #%u disconnected\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("✅ Client #%u connected from %d.%d.%d.%d\n", 
                    num, ip[0], ip[1], ip[2], ip[3]);
      
      // Send initial data immediately
      sendWaterLevelData();
      break;
    }
      
    case WStype_TEXT:
      Serial.printf("📨 Received text from client #%u: %s\n", num, payload);
      break;
      
    case WStype_ERROR:
      Serial.printf("⚠️ Error with client #%u\n", num);
      break;
      
    default:
      break;
  }
}

// ============================================
// READ WATER LEVEL SENSOR
// ============================================

float readWaterLevel() {
  // Read analog value from sensor
  int sensorValue = analogRead(WATER_LEVEL_PIN);
  
  // Convert to percentage (0-100%)
  float percentage = map(sensorValue, SENSOR_MIN, SENSOR_MAX, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  // Optional: Add some smoothing or filtering here if needed
  
  return percentage;
}

// ============================================
// SEND WATER LEVEL DATA VIA WEBSOCKET
// ============================================

void sendWaterLevelData() {
  // Read current water level
  float waterLevel = readWaterLevel();
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["level"] = waterLevel;
  doc["hazardThreshold"] = HAZARD_THRESHOLD;
  doc["timestamp"] = millis();
  
  // Serialize to string
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send to all connected clients
  webSocket.broadcastTXT(jsonString);
  
  // Print to Serial Monitor
  Serial.print("💧 Water Level: ");
  Serial.print(waterLevel, 1);
  Serial.print("%");
  
  if (waterLevel >= HAZARD_THRESHOLD) {
    Serial.print(" 🚨 HAZARD!");
  } else if (waterLevel >= 70.0) {
    Serial.print(" ⚠️ WARNING");
  }
  
  Serial.println();
}

// ============================================
// ALTERNATIVE: SIMULATED DATA FOR TESTING
// ============================================

// Uncomment this function and use it instead of readWaterLevel() to test without a real sensor
/*
float readWaterLevel() {
  static float simulatedLevel = 50.0;
  static bool increasing = true;
  
  // Simulate water level changes
  if (increasing) {
    simulatedLevel += 0.5;
    if (simulatedLevel >= 95.0) increasing = false;
  } else {
    simulatedLevel -= 0.5;
    if (simulatedLevel <= 5.0) increasing = true;
  }
  
  return simulatedLevel;
}
*/
