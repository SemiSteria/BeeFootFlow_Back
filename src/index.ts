import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import { generateQRCode } from './services/qrCodeService.js'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync } from 'fs'

const app = express()
const PORT = process.env.PORT ?? 3000

const htmlContent = readFileSync('./src/test.html', 'utf-8')

app.use(express.json())
app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.send(htmlContent)
})

app.post('/api/matches', async (req: Request, res: Response) => {
  const matchId = uuidv4()
  const qrCode = await generateQRCode(matchId)
  res.json({ matchId, qrCode })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})