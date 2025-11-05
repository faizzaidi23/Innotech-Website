/*
 * ESP32 Water Level Sensor - MQTT Publisher
 * 
 * This code publishes water level readings to an MQTT broker
 * Compatible with the Innotech Water Level Dashboard
 * 
 * Required Libraries:
 * - PubSubClient (by Nick O'Leary)
 * - WiFi (built-in with ESP32)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "broker.hivemq.com";  // Public MQTT broker
const int mqtt_port = 1883;                      // Standard MQTT port
const char* mqtt_topic = "innotech/water-level"; // MQTT topic

// Sensor pin (adjust based on your sensor)
const int waterLevelPin = A0;  // Analog pin for water level sensor

// Hazard threshold (percentage)
const float HAZARD_THRESHOLD = 80.0;

// ============================================
// GLOBAL OBJECTS
// ============================================

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastPublish = 0;
const unsigned long publishInterval = 5000; // Publish every 5 seconds

// ============================================
// SETUP FUNCTION
// ============================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Water Level Monitor ===");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  // Connect to MQTT broker
  connectToMQTT();
  
  Serial.println("Setup complete! Starting to publish data...");
}

// ============================================
// MAIN LOOP
// ============================================

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();
  
  // Publish data at regular intervals
  unsigned long currentTime = millis();
  if (currentTime - lastPublish >= publishInterval) {
    publishWaterLevel();
    lastPublish = currentTime;
  }
  
  delay(100);
}

// ============================================
// WIFI CONNECTION
// ============================================

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

// ============================================
// MQTT CONNECTION
// ============================================

void connectToMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Generate unique client ID
    String clientId = "ESP32WaterLevel-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected!");
      Serial.print("Publishing to topic: ");
      Serial.println(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ============================================
// SENSOR READING
// ============================================

float readWaterLevel() {
  // Read analog value from sensor
  int sensorValue = analogRead(waterLevelPin);
  
  // Convert to percentage (0-100%)
  // Adjust these values based on your sensor's actual range
  float minValue = 0;    // Minimum sensor reading
  float maxValue = 4095; // Maximum sensor reading (12-bit ADC for ESP32)
  
  float percentage = map(sensorValue, minValue, maxValue, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  return percentage;
  
  // Alternative: If you have a specific sensor library, use it here
  // Example: return yourSensor.readLevel();
}

// ============================================
// MQTT PUBLISH
// ============================================

void publishWaterLevel() {
  if (!client.connected()) {
    return;
  }
  
  // Read water level from sensor
  float waterLevel = readWaterLevel();
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["waterLevel"] = waterLevel;
  doc["hazardThreshold"] = HAZARD_THRESHOLD;
  doc["timestamp"] = millis();
  
  // Serialize JSON to string
  char payload[200];
  serializeJson(doc, payload);
  
  // Publish to MQTT topic
  bool published = client.publish(mqtt_topic, payload);
  
  if (published) {
    Serial.print("Published: ");
    Serial.println(payload);
  } else {
    Serial.println("Publish failed!");
  }
}

// ============================================
// MQTT CALLBACK (for receiving messages)
// ============================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Handle incoming MQTT messages if needed
  // Currently not used, but can be extended for commands
}

