import { compare } from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'

type LoginInput = {
  email: string
  password: string
}

export const login = async ({ email, password }: LoginInput) => {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValidPassword = await compare(password, user.password_hash)

  if (!isValidPassword) {
    throw new Error('Invalid credentials')
  }

  return {
    id: user.id,
    pseudo: user.pseudo,
    email: user.email,
    elo: user.elo,
    elo_peak: user.elo_peak,
    mmr: user.mmr,
    total_matches: user.total_matches,
    total_wins: user.total_wins,
    total_goals: user.total_goals,
    created_at: user.created_at,
  }
}