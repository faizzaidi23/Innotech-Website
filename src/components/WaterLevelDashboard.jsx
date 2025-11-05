import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import './WaterLevelDashboard.css'

const WaterLevelDashboard = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [waterLevel, setWaterLevel] = useState(0)
  const [isHazardous, setIsHazardous] = useState(false)
  const [historyData, setHistoryData] = useState([])
  const [espIp, setEspIp] = useState('192.168.1.100')
  const [espPort, setEspPort] = useState('81')
  const [lastUpdate, setLastUpdate] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const maxDataPoints = 100

  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [espIp, espPort])

  const connectWebSocket = () => {
    try {
      const wsUrl = `ws://${espIp}:${espPort}`
      console.log('Connecting to:', wsUrl)
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket Connected')
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWaterLevelData(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          // Try to parse as plain number if JSON fails
          const level = parseFloat(event.data)
          if (!isNaN(level)) {
            handleWaterLevelData({ waterLevel: level })
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket Disconnected')
        setIsConnected(false)
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setIsConnected(false)
    }
  }

  const handleWaterLevelData = (data) => {
    // Extract water level from data
    // Support multiple possible field names
    const level = data.waterLevel || data.water_level || data.level || data.value || 0
    
    setWaterLevel(level)
    setLastUpdate(new Date())
    
    // Check if hazardous (flood situation)
    // You can adjust this threshold based on your ESP code
    const hazardThreshold = data.hazardThreshold || 80 // Default threshold
    const isHazard = level >= hazardThreshold
    setIsHazardous(isHazard)
    
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

  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    connectWebSocket()
  }

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setIsConnected(false)
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
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="input-group">
          <label>ESP32 IP Address:</label>
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
      </div>

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
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
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

