import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
// WebSocket version (no MQTT)
import './WaterLevelDashboard.css'

const WaterLevelDashboard = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [waterLevel, setWaterLevel] = useState(0)
  const [isHazardous, setIsHazardous] = useState(false)
  const [historyData, setHistoryData] = useState([])
  const [espIp, setEspIp] = useState('192.168.1.100')
  const [espPort, setEspPort] = useState('81')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [connectionError, setConnectionError] = useState('')
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const maxDataPoints = 100
  const [telegramEnabled, setTelegramEnabled] = useState(true)
  const [lastAlertLevel, setLastAlertLevel] = useState(null)
  const TELEGRAM_API_URL = 'http://localhost:3001/api/alert'

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      // Validate inputs first
      if (!espIp.trim() || !espPort.trim()) {
        setConnectionError('Please enter both IP address and port')
        return
      }

      // Validate IP format (basic check)
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipRegex.test(espIp.trim())) {
        setConnectionError('Please enter a valid IP address (e.g., 192.168.1.100)')
        return
      }

      // Validate port
      const portNum = parseInt(espPort)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setConnectionError('Please enter a valid port number (1-65535)')
        return
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      setConnectionStatus('Connecting...')
      setConnectionError('')
      setIsConnected(false)
      
      // Add trailing slash to WebSocket URL for proper connection
      const wsUrl = `ws://${espIp.trim()}:${espPort.trim()}/`
      console.log('Connecting WebSocket to:', wsUrl)
      const ws = new WebSocket(wsUrl)

      // 15s timeout if cannot connect
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== 1) {
          setConnectionError('Connection timeout. Check ESP IP/port and that WS server is running.')
          setConnectionStatus('Connection Timeout')
          try { ws.close() } catch {}
        }
      }, 15000)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log('WebSocket Connected')
        setConnectionStatus('Connected')
        setConnectionError('')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received data:', data) // Debug log
          handleWaterLevelData(data)
        } catch (err) {
          console.log('Parsing as raw number...')
          const level = parseFloat(event.data)
          if (!isNaN(level)) {
            handleWaterLevelData({ waterLevel: level })
          } else {
            console.error('Invalid data format:', event.data)
            setConnectionError('Invalid data format received from sensor')
          }
        }
      }

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error('WebSocket error:', error)
        setConnectionError(`Connection error: Cannot reach ${espIp}:${espPort}. Check if the server is running.`)
        setConnectionStatus('Connection Error')
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket Disconnected')
        setIsConnected(false)
        setConnectionStatus('Disconnected')
        // auto-reconnect after 3s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to open WebSocket:', error)
      setConnectionError(`Failed to connect: ${error.message || error}`)
      setConnectionStatus('Connection Failed')
      setIsConnected(false)
    }
  }

  const handleWaterLevelData = (data) => {
    // Extract water level from data
    // Support multiple possible field names
    const level = data.waterLevel || data.water_level || data.level || data.value || 0
    
    console.log('📊 Water level received:', level, '| Telegram enabled:', telegramEnabled)
    
    setWaterLevel(level)
    setLastUpdate(new Date())
    
    // Check if hazardous (flood situation)
    // You can adjust this threshold based on your ESP code
    const hazardThreshold = data.hazardThreshold || 80 // Default threshold
    const warningThreshold = 70 // Warning threshold for Telegram alerts
    const isHazard = level >= hazardThreshold
    setIsHazardous(isHazard)
    
    // Send Telegram alert if level is above warning threshold
    if (telegramEnabled && level >= warningThreshold) {
      console.log('🚨 Alert condition met! Level:', level, '≥', warningThreshold)
      sendTelegramAlert(level, isHazard)
    } else if (level < warningThreshold) {
      console.log('✅ Water level safe:', level, '< 70%')
    } else if (!telegramEnabled) {
      console.log('⚠️ Telegram alerts are disabled')
    }
    
    // Add to history for chart
    const timestamp = new Date().toLocaleTimeString()
    const newDataPoint = {
      time: timestamp,
      level: level,
      isHazardous: isHazard
    }

    setHistoryData(prevData => {
      const updated = [...prevData, newDataPoint]
      if (updated.length > maxDataPoints) {
        return updated.slice(-maxDataPoints)
      }
      return updated
    })
  }

  const sendTelegramAlert = async (level, isHazard) => {
    // Determine alert status
    const status = isHazard ? 'FLOOD_HAZARD' : 'WARNING'
    
    console.log('🔔 Sending Telegram alert | Status:', status, '| Last alert:', lastAlertLevel)
    
    // Only send if alert level changed to prevent spam
    if (lastAlertLevel === status) {
      console.log('⏸️ Alert skipped - same status already sent (cooldown)')
      return
    }

    try {
      console.log('📡 Calling Telegram API:', TELEGRAM_API_URL)
      const response = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waterLevel: level,
          status: status,
          timestamp: new Date().toLocaleString()
        })
      })

      const result = await response.json()
      console.log('📬 API Response:', result)
      
      if (result.success) {
        console.log('✅ Telegram alert sent successfully')
        setLastAlertLevel(status)
      } else {
        console.error('❌ Failed to send Telegram alert:', result.message)
      }
    } catch (error) {
      console.error('❌ Error sending Telegram alert:', error)
      // Don't show error to user, just log it
    }
  }

  const handleReconnect = () => {
    if (wsRef.current) wsRef.current.close()
    connectWebSocket()
  }

  const handleDisconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('Disconnected')
    setConnectionError('')
  }

  // Calculate water level percentage (assuming 0-100 scale, adjust as needed)
  const waterLevelPercent = Math.min(100, Math.max(0, waterLevel))
  
  // Get status color based on level
  const getStatusColor = () => {
    if (isHazardous) return '#ef4444' // Red for hazard
    if (waterLevelPercent >= 70) return '#f59e0b' // Orange for warning
    if (waterLevelPercent >= 50) return '#3b82f6' // Blue for normal-high
    return '#10b981' // Green for safe
  }

  const getStatusText = () => {
    if (isHazardous) return 'FLOOD HAZARD!'
    if (waterLevelPercent >= 70) return 'HIGH - WARNING'
    if (waterLevelPercent >= 50) return 'MODERATE'
    return 'SAFE'
  }

  return (
    <div className="water-level-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🌊 Water Level Monitoring</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '●' : '○'}
            </span>
            <span>{connectionStatus}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="input-group">
          <label>ESP IP Address:</label>
          <input
            type="text"
            value={espIp}
            onChange={(e) => setEspIp(e.target.value)}
            disabled={isConnected}
            placeholder="192.168.1.100"
          />
        </div>
        <div className="input-group">
          <label>WebSocket Port:</label>
          <input
            type="text"
            value={espPort}
            onChange={(e) => setEspPort(e.target.value)}
            disabled={isConnected}
            placeholder="81"
          />
        </div>
        <div className="button-group">
          {!isConnected ? (
            <button onClick={handleReconnect} className="btn btn-connect">
              Connect
            </button>
          ) : (
            <button onClick={handleDisconnect} className="btn btn-disconnect">
              Disconnect
            </button>
          )}
        </div>
        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(e) => {
                setTelegramEnabled(e.target.checked)
                setLastAlertLevel(null) // Reset alert level when toggling
              }}
              style={{ marginRight: '8px', width: 'auto' }}
            />
            📱 Telegram Alerts (70%+)
          </label>
        </div>
      </div>

      {/* Connection Error Display */}
      {connectionError && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{connectionError}</span>
        </div>
      )}

      {/* Hazard Alert Banner */}
      {isHazardous && (
        <div className="hazard-alert">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">
              <h2>FLOOD HAZARD DETECTED!</h2>
              <p>Water level is dangerously high. Immediate action required!</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Main Water Level Display */}
        <div className="water-level-container">
          <div className="water-level-card">
            <h2>Current Water Level</h2>
            <div className="level-display">
              <div className="level-value" style={{ color: getStatusColor() }}>
                {waterLevel.toFixed(1)}%
              </div>
              <div className="level-status" style={{ color: getStatusColor() }}>
                {getStatusText()}
              </div>
            </div>
            
            {/* Visual Water Level Indicator */}
            <div className="water-level-indicator">
              <div className="indicator-container">
                <div 
                  className="water-fill"
                  style={{ 
                    height: `${waterLevelPercent}%`,
                    backgroundColor: getStatusColor(),
                    boxShadow: isHazardous ? `0 0 20px ${getStatusColor()}` : 'none'
                  }}
                >
                  <span className="water-percentage">{Math.round(waterLevelPercent)}%</span>
                </div>
                <div className="indicator-marks">
                  <div className="mark mark-100">100%</div>
                  <div className="mark mark-75">75%</div>
                  <div className="mark mark-50">50%</div>
                  <div className="mark mark-25">25%</div>
                  <div className="mark mark-0">0%</div>
                </div>
              </div>
            </div>

            {lastUpdate && (
              <div className="last-update">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Chart */}
        {historyData.length > 0 && (
          <div className="chart-container">
            <div className="chart-card">
              <h3>Water Level History</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: '#9ca3af', fontSize: 14 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 24 }}
                    domain={[0, 100]}
                    label={{ value: 'Water Level (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="level" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLevel)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Info Cards */}
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <h4>Water Level</h4>
              <p className="info-value">{waterLevel.toFixed(1)}%</p>
            </div>
          </div>
          <div className={`info-card ${isHazardous ? 'hazard' : 'safe'}`}>
            <div className="info-icon">{isHazardous ? '🚨' : '✅'}</div>
            <div className="info-content">
              <h4>Status</h4>
              <p className="info-value">{getStatusText()}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon">📡</div>
            <div className="info-content">
              <h4>Connection</h4>
              <p className="info-value">{isConnected ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaterLevelDashboard

