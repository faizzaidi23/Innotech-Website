## 🚀 Quick Start - Telegram Alerts Setup

### ✅ What's Already Done:
- ✅ Backend server created (server.js)
- ✅ React component updated with Telegram alert function
- ✅ Dependencies installed
- ✅ Checkbox to enable/disable alerts in UI

### 🔧 What You Need to Do:

#### Step 1: Create Telegram Bot (2 minutes)
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow prompts to create your bot
4. **Copy the Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### Step 2: Get Your Chat ID (1 minute)
1. Search for **@userinfobot** on Telegram
2. Start a chat with it
3. **Copy your Chat ID** (looks like: `123456789`)

#### Step 3: Configure .env File
Open `.env` file and replace with your actual values:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
PORT=3001
```

#### Step 4: Start the Application
Open TWO terminals:

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend (React):**
```bash
npm run dev
```

OR run both together:
```bash
npm start
```

#### Step 5: Test Telegram Connection
Open your browser and visit:
```
http://localhost:3001/api/test-telegram
```

You should receive a test message on Telegram! 📱

### 📊 How It Works:

1. **Water level >= 70%** → ⚠️ WARNING alert sent
2. **Water level >= 80%** → 🚨 FLOOD HAZARD alert sent
3. **5-minute cooldown** between alerts (prevents spam)
4. **Toggle on/off** using the checkbox in the UI

### 🔍 Troubleshooting:

**No Telegram message received?**
- Make sure you started a chat with your bot (send `/start`)
- Check bot token and chat ID are correct in `.env`
- Verify backend server is running on port 3001

**Frontend can't connect to backend?**
- Check if server is running: `http://localhost:3001/api/health`
- Make sure both frontend and backend are running

### 📱 What Messages Look Like:

**Warning (70%+):**
```
⚠️ Water Level Warning

💧 Water Level: 72.5%
📊 Status: HIGH - WARNING
⏰ Time: 11/13/2025, 3:45:30 PM

Please monitor the situation closely.
```

**Flood Hazard (80%+):**
```
🚨 FLOOD HAZARD ALERT! 🚨

⚠️ Water Level: 85.0%
📊 Status: CRITICAL
⏰ Time: 11/13/2025, 3:50:15 PM

⚡ Immediate action required!
The water level has reached a dangerous level.
```

### ✨ You're All Set!
Once configured, you'll automatically receive Telegram alerts when water level exceeds 70%!
