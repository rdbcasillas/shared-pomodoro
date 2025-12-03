# The Loop

A shared Pomodoro timer that syncs in real-time across all devices. Perfect for teams working together in focused sessions.

## Features

- 🔄 **Real-time sync** across all devices via WebSocket
- 📱 **Fully responsive** design (mobile, tablet, desktop)
- 🔐 **Admin-only controls** with password protection
- 🎨 **Beautiful glassmorphic UI** with D3.js circular progress
- ⚡ **Global focus rhythm**: 32-minute work, 8-minute breaks, 30-minute long breaks

## Tech Stack

**Frontend:**
- Vue 3 + TypeScript
- Vite
- Socket.io Client
- D3.js for visualization

**Backend:**
- Node.js + Express
- Socket.io for real-time sync
- In-memory state (upgradeable to database)

## Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

2. **Configure environment:**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your admin password
# Default: theloop328
```

3. **Start the backend server:**

```bash
cd server
npm start
```

The server will run on `http://localhost:3001`

4. **Start the frontend (in a new terminal):**

```bash
npm run dev
```

The app will run on `http://localhost:5173`

## Usage

### For Admins

1. Open the app in your browser
2. Enter the admin password (default: `theloop328`)
3. Click "Start Global Timer"
4. All connected users will see the timer start in real-time
5. You can stop the timer at any time

### For Team Members

1. Open the app in your browser
2. If the timer is running, you'll see only the timer (no controls)
3. Focus on your work following the global rhythm!
4. No login required for viewers

## Testing Multi-Device

1. **Same Network:**
   - Find your computer's IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
   - Update `.env`: `VITE_SOCKET_URL=http://YOUR_IP:3001`
   - Access from phone: `http://YOUR_IP:5173`

2. **Multiple Browsers:**
   - Open the app in different browsers
   - Login as admin in one, start the timer
   - Other browsers will sync automatically

3. **Incognito/Private Windows:**
   - Now works! Each window connects to the same backend server
   - Timer syncs across all windows in real-time

## Development

```bash
# Run frontend dev server with hot reload
npm run dev

# Run backend with auto-reload (requires Node 18+)
cd server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## Project Structure

```
the-loop/
├── src/                  # Frontend Vue app
│   ├── components/       # Vue components
│   ├── composables/      # Composables (usePomodoro, useAdminAuth)
│   ├── views/            # Page views
│   └── assets/           # CSS and static assets
├── server/               # Backend Node.js server
│   ├── index.js          # Express + Socket.io server
│   └── package.json      # Server dependencies
├── .env                  # Environment variables (gitignored)
├── .env.example          # Example environment config
└── package.json          # Frontend dependencies
```

## Environment Variables

**Frontend (.env):**
- `VITE_ADMIN_PASSWORD` - Password for admin access (default: theloop328)
- `VITE_SOCKET_URL` - Backend WebSocket server URL (default: http://localhost:3001)

**Backend:**
- `PORT` - Server port (default: 3001)

## How It Works

1. **Admin starts timer** → Browser sends WebSocket event to server
2. **Server broadcasts** → All connected clients receive the start event
3. **All clients sync** → Timer displays the same time across all devices
4. **Real-time updates** → Phase changes, breaks, and stops sync instantly

The timer calculations happen client-side based on a shared start timestamp from the server, ensuring perfect sync without constant polling.

## Future Enhancements

- [ ] Persistent storage (PostgreSQL/MongoDB)
- [ ] Timer history and analytics
- [ ] Multiple rooms/teams
- [ ] Custom timer durations
- [ ] Sound notifications
- [ ] User accounts and profiles
- [ ] Mobile apps (React Native/Flutter)

## License

MIT

## Contributing

Pull requests welcome! Please ensure code follows the existing style and passes linting.

---

Built with ❤️ for focused, synchronized work sessions.
