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
      'https://theloop.up.railway.app',
      'https://shared-pomodoro-production.up.railway.app',
      'https://beautiful-reverence-production-b252.up.railway.app'
    ],
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'theloop328'

// In-memory admin override. Reset on server restart (acceptable for MVP).
let override = {
  forcedOff: false,
  reason: null,
  setAt: null
}

const checkPassword = (pw) => typeof pw === 'string' && pw === ADMIN_PASSWORD

app.get('/api/override', (req, res) => {
  res.json(override)
})

app.get('/api/time', (req, res) => {
  res.json({ now: Date.now() })
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Clock sync + current override state on connect
  socket.emit('server:hello', {
    now: Date.now(),
    override
  })

  socket.on('admin:verify', (data, ack) => {
    const ok = checkPassword(data?.password)
    if (typeof ack === 'function') ack({ ok })
  })

  socket.on('admin:force-off', (data, ack) => {
    if (!checkPassword(data?.password)) {
      if (typeof ack === 'function') ack({ ok: false, error: 'unauthorized' })
      return
    }
    override = {
      forcedOff: true,
      reason: typeof data.reason === 'string' ? data.reason.slice(0, 200) : null,
      setAt: Date.now()
    }
    io.emit('override:updated', override)
    if (typeof ack === 'function') ack({ ok: true, override })
  })

  socket.on('admin:resume', (data, ack) => {
    if (!checkPassword(data?.password)) {
      if (typeof ack === 'function') ack({ ok: false, error: 'unauthorized' })
      return
    }
    override = { forcedOff: false, reason: null, setAt: null }
    io.emit('override:updated', override)
    if (typeof ack === 'function') ack({ ok: true, override })
  })

  socket.on('time:sync', (_data, ack) => {
    if (typeof ack === 'function') ack({ now: Date.now() })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`The Loop server running on http://localhost:${PORT}`)
  console.log('Schedule: Mon-Fri 11:00-17:00 IST, 50/10 cycles (computed client-side)')
})
