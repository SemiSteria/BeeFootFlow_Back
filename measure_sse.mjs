#!/usr/bin/env node
/**
 * measure_sse.mjs — Mesure du flux SSE de BeeFootFlow (preuve C4.4)
 *
 * Ouvre N connexions SSE simultanées sur GET /stream, déclenche M impacts
 * via POST /iot/impact, et mesure pour chaque client la latence entre
 * l'horodatage de l'événement (timestamp serveur) et sa réception.
 *
 * Usage : node measure_sse.mjs [clients] [impacts]
 *         node measure_sse.mjs 50 20
 */
import http from 'node:http'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const N_CLIENTS = Number(process.argv[2] ?? 50)
const N_IMPACTS = Number(process.argv[3] ?? 20)

const latencies = []
let connected = 0
let received = 0

function openSseClient(id) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE}/stream`, { headers: { Accept: 'text/event-stream' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      connected++
      let buffer = ''
      res.on('data', (chunk) => {
        buffer += chunk.toString()
        let idx
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))
          if (!dataLine) continue // heartbeat (": ping")
          const event = JSON.parse(dataLine.slice(6))
          latencies.push(Date.now() - new Date(event.timestamp).getTime())
          received++
        }
      })
      resolve(req)
    })
    req.on('error', reject)
  })
}

function postImpact() {
  const body = JSON.stringify({ tof1Ms: 10, tof2Ms: 4, deltaMs: 100 })
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE}/iot/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => { res.resume(); res.on('end', resolve) })
    req.on('error', reject)
    req.end(body)
  })
}

const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))]

console.log(`Ouverture de ${N_CLIENTS} connexions SSE sur ${BASE}/stream ...`)
const clients = await Promise.all(Array.from({ length: N_CLIENTS }, (_, i) => openSseClient(i)))
console.log(`${connected}/${N_CLIENTS} clients connectés.`)

console.log(`Émission de ${N_IMPACTS} impacts (POST /iot/impact, 1 toutes les 100 ms) ...`)
const t0 = Date.now()
for (let i = 0; i < N_IMPACTS; i++) {
  await postImpact()
  await new Promise((r) => setTimeout(r, 100))
}
await new Promise((r) => setTimeout(r, 1000)) // laisser arriver les derniers événements
const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

latencies.sort((a, b) => a - b)
const expected = N_CLIENTS * N_IMPACTS
console.log('\n=== Résultats ===')
console.log(`Clients SSE simultanés   : ${connected}`)
console.log(`Impacts émis             : ${N_IMPACTS} (en ${elapsed}s)`)
console.log(`Événements reçus         : ${received} / ${expected} attendus (${((received / expected) * 100).toFixed(1)} %)`)
if (latencies.length) {
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
  console.log(`Latence diffusion (serveur → client, sur ${latencies.length} mesures) :`)
  console.log(`  moyenne ${avg.toFixed(1)} ms | p50 ${pct(latencies, 50)} ms | p95 ${pct(latencies, 95)} ms | max ${latencies[latencies.length - 1]} ms`)
}
clients.forEach((c) => c.destroy())
process.exit(0)
