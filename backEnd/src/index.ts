import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { prisma } from './lib/prisma.js'
import { login } from './services/auth/login.js'
import { register } from './services/auth/register.js'
import { streamRouter } from './routes/stream.route.js'
import { handleImpact } from './modules/iot/index.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      const allowedOrigins = [
        process.env.FRONTEND_ORIGIN,
        ...(process.env.FRONTEND_ORIGINS
          ?.split(',')
          .map((value) => value.trim()) ?? []),
      ].filter(Boolean) as string[]

      const isLocalhostDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      )

      if (isLocalhostDevOrigin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.warn(`Blocked by CORS: ${origin}`)
      return callback(new Error('Not allowed by CORS'))
    },
  }),
)

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World' })
})

app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required',
      })
    }

    const user = await register({ email, password })
    return res.status(201).json({ user })
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return res.status(409).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required',
      })
    }

    const user = await login({ email, password })
    return res.status(200).json({ user })
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message })
    }

    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// SSE — Frontend
app.use('/stream', streamRouter)

// IoT - ESP32 POST impact data
app.post('/iot/impact', (req: Request, res: Response) => {
  try {
    const event = handleImpact(req.body)
    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect()
    console.log(`Server running on http://localhost:${PORT}`)
  } catch (error) {
    console.error('Failed to connect to database:', error)
    process.exit(1)
  }
})

const shutdown = async () => {
  await prisma.$disconnect()
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)