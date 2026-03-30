import { Router, Request, Response } from 'express'
import passport from '../config/passport.js'
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
  passport.authenticate('discord', { session: false })
)

oauthRouter.get('/discord/callback',
  passport.authenticate('discord', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=discord` }),
  (req: Request, res: Response) => redirectWithToken(res, req.user)
)

// Google
oauthRouter.get('/google',
  passport.authenticate('google', { session: false })
)

oauthRouter.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google` }),
  (req: Request, res: Response) => redirectWithToken(res, req.user)
)