import passport from 'passport'
import { Strategy as DiscordStrategy } from 'passport-discord'
import { Strategy as GoogleStrategy } from 'passport-oauth2'
import { prisma } from '../lib/prisma.js'

const DISCORD_CLIENT_ID     = process.env.DISCORD_CLIENT_ID     ?? ''
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? ''
const GOOGLE_CLIENT_ID      = process.env.GOOGLE_CLIENT_ID      ?? ''
const GOOGLE_CLIENT_SECRET  = process.env.GOOGLE_CLIENT_SECRET  ?? ''
const BASE_URL              = process.env.BASE_URL ?? 'http://localhost:3000'

// ─── Discord ──────────────────────────────────────────────────────────────────
passport.use('discord', new DiscordStrategy(
  {
    clientID:     DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL:  `${BASE_URL}/auth/discord/callback`,
    scope:        ['identify', 'email'],
  },
  async (_accessToken: string, _refreshToken: string, profile, done) => {
    try {
      const email = profile.email
      if (!email) return done(new Error('No email from Discord'))

      const avatarUrl = profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null

      let user = await prisma.users.findFirst({
        where: { OR: [{ discord_id: profile.id }, { email }] },
      })

      if (user) {
        if (!user.discord_id) {
          user = await prisma.users.update({
            where: { id: user.id },
            data: { discord_id: profile.id, avatar_url: avatarUrl },
          })
        }
      } else {
        user = await prisma.users.create({
          data: {
            email,
            pseudo:     profile.username ?? email.split('@')[0] ?? 'user',
            discord_id: profile.id,
            avatar_url: avatarUrl,
          },
        })
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

// ─── Google ───────────────────────────────────────────────────────────────────
passport.use('google', new GoogleStrategy(
  {
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL:         'https://oauth2.googleapis.com/token',
    clientID:         GOOGLE_CLIENT_ID,
    clientSecret:     GOOGLE_CLIENT_SECRET,
    callbackURL:      `${BASE_URL}/auth/google/callback`,
    scope:            ['profile', 'email'],
  },
  async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value
      if (!email) return done(new Error('No email from Google'))

      const avatarUrl = profile.photos?.[0]?.value ?? null

      let user = await prisma.users.findFirst({
        where: { OR: [{ google_id: profile.id }, { email }] },
      })

      if (user) {
        if (!user.google_id) {
          user = await prisma.users.update({
            where: { id: user.id },
            data: { google_id: profile.id, avatar_url: avatarUrl },
          })
        }
      } else {
        user = await prisma.users.create({
          data: {
            email,
            pseudo:    profile.displayName ?? email.split('@')[0] ?? 'user',
            google_id: profile.id,
            avatar_url: avatarUrl,
          },
        })
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
))

export default passport