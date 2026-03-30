import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT

if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables')

export interface JwtPayload {
    id:     string
    email:  string
    pseudo: string
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' })
}

export function verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload
}
