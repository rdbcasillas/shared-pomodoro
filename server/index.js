import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://shared-pomodoro-production.up.railway.app'
    ],
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// In-memory timer state
let timerState = {
  startTimestamp: null,
  isRunning: false,
  startedBy: null
}

// Get current timer state
app.get('/api/timer', (req, res) => {
  res.json(timerState)
})

// Start timer (admin only - frontend should handle auth)
app.post('/api/timer/start', (req, res) => {
  timerState.startTimestamp = Date.now()
  timerState.isRunning = true
  timerState.startedBy = req.body.adminId || 'admin'

  // Broadcast to all connected clients
  io.emit('timer:started', timerState)

  res.json(timerState)
})

// Stop timer (admin only - frontend should handle auth)
app.post('/api/timer/stop', (req, res) => {
  timerState.startTimestamp = null
  timerState.isRunning = false
  timerState.startedBy = null

  // Broadcast to all connected clients
  io.emit('timer:stopped', timerState)

  res.json(timerState)
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Send current timer state to newly connected client
  socket.emit('timer:state', timerState)

  // Handle admin starting timer
  socket.on('timer:start', (data) => {
    timerState.startTimestamp = Date.now()
    timerState.isRunning = true
    timerState.startedBy = data.adminId || 'admin'

    // Broadcast to all clients including sender
    io.emit('timer:started', timerState)
  })

  // Handle admin stopping timer
  socket.on('timer:stop', () => {
    timerState.startTimestamp = null
    timerState.isRunning = false
    timerState.startedBy = null

    // Broadcast to all clients including sender
    io.emit('timer:stopped', timerState)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🔄 The Loop server running on http://localhost:${PORT}`)
  console.log(`📡 Socket.io ready for real-time sync`)
})
