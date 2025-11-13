const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store last alert time to prevent spam
let lastAlertTime = {};
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown

// Telegram configuration - From environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';

/**
 * Send Telegram message
 * @param {string} message - Message to send
 * @returns {Promise} - Axios promise
 */
async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    throw error;
  }
}

/**
 * Check if cooldown period has passed
 * @param {string} alertType - Type of alert
 * @returns {boolean} - True if can send alert
 */
function canSendAlert(alertType) {
  const now = Date.now();
  if (!lastAlertTime[alertType]) {
    return true;
  }
  return (now - lastAlertTime[alertType]) > ALERT_COOLDOWN;
}

/**
 * POST /api/alert
 * Send water level alert via Telegram
 */
app.post('/api/alert', async (req, res) => {
  try {
    const { waterLevel, status, timestamp } = req.body;

    // Validate input
    if (waterLevel === undefined || waterLevel === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Water level is required' 
      });
    }

    // Check cooldown to prevent spam
    const alertType = status === 'FLOOD_HAZARD' ? 'hazard' : 'warning';
    if (!canSendAlert(alertType)) {
      return res.status(429).json({ 
        success: false, 
        message: 'Alert sent recently. Please wait before sending another.' 
      });
    }

    // Create alert message
    let message = '';
    if (status === 'FLOOD_HAZARD') {
      message = `
🚨 <b>FLOOD HAZARD ALERT!</b> 🚨

⚠️ Water Level: <b>${waterLevel.toFixed(1)}%</b>
📊 Status: <b>CRITICAL</b>
⏰ Time: ${timestamp || new Date().toLocaleString()}

⚡ Immediate action required!
The water level has reached a dangerous level.
      `.trim();
    } else {
      message = `
⚠️ <b>Water Level Warning</b>

💧 Water Level: <b>${waterLevel.toFixed(1)}%</b>
📊 Status: <b>HIGH - WARNING</b>
⏰ Time: ${timestamp || new Date().toLocaleString()}

Please monitor the situation closely.
      `.trim();
    }

    // Send to Telegram
    await sendTelegramMessage(message);

    // Update last alert time
    lastAlertTime[alertType] = Date.now();

    res.json({ 
      success: true, 
      message: 'Alert sent successfully',
      cooldownUntil: new Date(Date.now() + ALERT_COOLDOWN).toISOString()
    });

  } catch (error) {
    console.error('Error sending alert:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send alert',
      error: error.message 
    });
  }
});

/**
 * GET /api/test-telegram
 * Test Telegram connection
 */
app.get('/api/test-telegram', async (req, res) => {
  try {
    const testMessage = `
🔔 <b>Telegram Bot Test</b>

✅ Connection successful!
⏰ ${new Date().toLocaleString()}

Your water level monitoring system is ready.
    `.trim();

    await sendTelegramMessage(testMessage);
    res.json({ 
      success: true, 
      message: 'Test message sent successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test message',
      error: error.message 
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    telegram: {
      configured: TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE',
      cooldown: ALERT_COOLDOWN / 1000 + ' seconds'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Telegram Alert Server running on http://localhost:${PORT}`);
  console.log(`📱 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' ? '❌ NOT CONFIGURED' : '✅ Configured'}`);
  console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE' ? '❌ NOT CONFIGURED' : '✅ Configured'}`);
  console.log('\n⚙️  Configuration needed:');
  console.log('   1. Create a Telegram bot with @BotFather');
  console.log('   2. Get your Chat ID from @userinfobot');
  console.log('   3. Update TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in server.js');
});
