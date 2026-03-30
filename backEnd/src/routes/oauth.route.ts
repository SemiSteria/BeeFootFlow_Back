import { Router, Request, Response } from 'express'
import passport, { isDiscordConfigured, isGoogleConfigured } from '../config/passport.js'
import { signToken } from '../lib/jwt.js'

export const oauthRouter = Router()

const FRONTEND_URL = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

// Helper — redirect with JWT token
function redirectWithToken(res: Response, user: any) {
  const token = signToken({ id: user.id, email: user.email, pseudo: user.pseudo })
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
}

// Discord 
oauthRouter.get('/discord',
  (req: Request, res: Response, next) => {
    if (!isDiscordConfigured) {
      return res.status(503).json({ message: 'Discord OAuth is not configured' })
    }

    return next()
  },
  passport.authenticate('discord', { session: false })
)

oauthRouter.get('/discord/callback',
  (req: Request, res: Response, next) => {
    if (!isDiscordConfigured) {
      return res.status(503).json({ message: 'Discord OAuth is not configured' })
    }

    return next()
  },
  passport.authenticate('discord', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=discord` }),
  (req: Request, res: Response) => redirectWithToken(res, req.user)
)

// Google
oauthRouter.get('/google',
  (req: Request, res: Response, next) => {
    if (!isGoogleConfigured) {
      return res.status(503).json({ message: 'Google OAuth is not configured' })
    }

    return next()
  },
  passport.authenticate('google', { session: false })
)

oauthRouter.get('/google/callback',
  (req: Request, res: Response, next) => {
    if (!isGoogleConfigured) {
      return res.status(503).json({ message: 'Google OAuth is not configured' })
    }

    return next()
  },
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google` }),
  (req: Request, res: Response) => redirectWithToken(res, req.user)
)