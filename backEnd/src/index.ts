import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import passport from './config/passport.js'
import { prisma } from './lib/prisma.js'
import { login } from './services/auth/login.js'
import { register } from './services/auth/register.js'
import { oauthRouter } from './routes/oauth.route.js'
import { streamRouter } from './routes/stream.route.js'
import { handleImpact } from './modules/iot/index.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())
app.use(passport.initialize())
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

app.get('/', (_req: Request, res: Response) => {
  return res.send('Hello World!')
})

app.use('/auth', oauthRouter)

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

app.post('/teams', async (req: Request, res: Response) => {
  try {
    const { name, tag, userId } = req.body as {
      name?: string
      tag?: string
      userId?: string
    }

    const normalizedName = name?.trim()
    const normalizedTag = tag?.trim().toUpperCase()

    if (!normalizedName || !userId) {
      return res.status(400).json({
        message: 'name and userId are required',
      })
    }

    if (normalizedName.length < 3 || normalizedName.length > 60) {
      return res.status(400).json({
        message: 'name must be between 3 and 60 characters',
      })
    }

    if (normalizedTag && (normalizedTag.length < 2 || normalizedTag.length > 10)) {
      return res.status(400).json({
        message: 'tag must be between 2 and 10 characters',
      })
    }

    const user = await prisma.users.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const team = await prisma.teams.create({
      data: {
        name: normalizedName,
        tag: normalizedTag ?? null,
        captain_id: userId,
        members: {
          create: {
            user_id: userId,
            role: 'captain',
          },
        },
      },
      select: {
        id: true,
        name: true,
        tag: true,
        captain_id: true,
        created_at: true,
      },
    })

    return res.status(201).json({ team })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        message: 'Team name or tag already exists',
      })
    }

    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/teams/user/:userId', async (req: Request, res: Response) => {
  try {
    const rawUserId = req.params.userId

    if (typeof rawUserId !== 'string' || !rawUserId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const userId = rawUserId

    const teams = await prisma.teams.findMany({
      where: {
        OR: [
          { captain_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
      orderBy: { created_at: 'desc' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
              },
            },
          },
        },
      },
    })

    return res.status(200).json({ teams })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/matchesScore', async (_req: Request, res: Response) => {
  try {
    const matches = await prisma.matches.findMany({
      orderBy: { created_at: 'desc' },
    })

    return res.status(200).json({ matches })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/matchesScore/:id', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id

    if (!matchId || typeof matchId !== 'string') {
      return res.status(400).json({ message: 'Match ID is required' })
    }

    const match = await prisma.matches.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return res.status(404).json({ message: 'Match not found' })
    }

    return res.status(200).json({ match })
  } catch (error) {
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