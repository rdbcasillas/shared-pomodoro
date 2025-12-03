# The Loop - Backend Server

Node.js + Express + Socket.io server for real-time timer synchronization.

## Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:3001

## Deployment

This server is designed to be deployed on platforms that support WebSocket connections:

- Render.com (recommended)
- Railway.app
- Fly.io
- Any VPS with Node.js

### Environment Variables

- `PORT` - Server port (default: 3001)

The server will automatically use the PORT environment variable provided by the hosting platform.
