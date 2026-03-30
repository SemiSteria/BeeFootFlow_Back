import { prisma } from '../../lib/prisma'
import { hash } from 'bcryptjs'

type RegisterInput = {
	email: string
	password: string
}

export const register = async ({ email, password }: RegisterInput) => {
	const pseudo = email.split('@')[0] || email
	const passwordHash = await hash(password, 12)

	const existingUser = await prisma.users.findUnique({ where: { email } })

	if (existingUser) {
		throw new Error('User already exists')
	}

	const user = await prisma.users.create({
		data: {
			email,
			pseudo,
			password_hash: passwordHash,
		},
		select: {
			id: true,
			pseudo: true,
			email: true,
			elo: true,
			elo_peak: true,
			mmr: true,
			total_matches: true,
			total_wins: true,
			total_goals: true,
			created_at: true,
		},
	})

	return user
}
