# 🚨 Water Level Monitoring - Telegram Alert Setup

## Setup Instructions

### Step 1: Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Follow the instructions:
   - Choose a name for your bot (e.g., "Water Level Monitor")
   - Choose a username (must end in 'bot', e.g., "waterlevel_alert_bot")
4. **Save the Bot Token** you receive (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

**Option 1: Using @userinfobot**
1. Search for `@userinfobot` on Telegram
2. Start a chat with it
3. It will send you your Chat ID

**Option 2: Using @RawDataBot**
1. Search for `@RawDataBot` on Telegram  
2. Start a chat with it
3. Look for the `"id"` field in the response

**For Group Alerts:**
1. Add your bot to the group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `"chat":{"id":` value (will be negative for groups)

### Step 3: Configure the Server

1. **Install dependencies:**
   ```bash
   npm install express cors axios dotenv
   ```

2. **Create `.env` file** in the project root:
   ```env
   TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
   TELEGRAM_CHAT_ID=your_actual_chat_id_here
   PORT=3001
   ```

3. **Update `server.js`** with your credentials OR use the `.env` file

### Step 4: Update package.json

Add the server script to your `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "start": "concurrently \"npm run dev\" \"npm run server\""
  }
}
```

### Step 5: Run the Application

**Option 1: Run separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
node server.js
```

**Option 2: Run together (after installing concurrently)**
```bash
npm install concurrently --save-dev
npm start
```

### Step 6: Test the Setup

1. **Test Telegram connection:**
   - Open browser: `http://localhost:3001/api/test-telegram`
   - Check your Telegram for a test message

2. **Check server health:**
   - Open browser: `http://localhost:3001/api/health`

## How It Works

1. **Frontend** (React) monitors water level from ESP32
2. When level > 70%, it sends a POST request to the backend
3. **Backend** (Node.js) sends alert to Telegram
4. **Cooldown period** (5 minutes) prevents spam

## Alert Thresholds

- **🚨 FLOOD HAZARD** - Water level ≥ 80%
- **⚠️ WARNING** - Water level ≥ 70%
- **✅ SAFE** - Water level < 70%

## Troubleshooting

### Bot not sending messages?
- Check bot token is correct
- Make sure you've started a chat with your bot (send /start)
- For groups, make sure bot is added and has admin rights

### Server errors?
- Check if port 3001 is available
- Verify `.env` file exists and has correct values
- Check firewall settings

### CORS errors?
- Make sure both frontend and backend are running
- Check the API URL in the React component

## API Endpoints

- `POST /api/alert` - Send water level alert
- `GET /api/test-telegram` - Test Telegram connection  
- `GET /api/health` - Check server status

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your `.env` file to GitHub
- Add `.env` to your `.gitignore`
- Keep your bot token secret
- Use environment variables in production

## Example Alert Messages

**Hazard Alert:**
```
🚨 FLOOD HAZARD ALERT! 🚨

⚠️ Water Level: 85.5%
📊 Status: CRITICAL
⏰ Time: 11/13/2025, 2:30:15 PM

⚡ Immediate action required!
The water level has reached a dangerous level.
```

**Warning Alert:**
```
⚠️ Water Level Warning

💧 Water Level: 72.3%
📊 Status: HIGH - WARNING
⏰ Time: 11/13/2025, 2:30:15 PM

Please monitor the situation closely.
```
