# BeeFootFlow — Backend

Real-time connected foosball platform. IoT time-of-flight (ToF) sensors mounted on
the table detect ball impacts; the backend computes ball speed, broadcasts events
to all connected clients through Server-Sent Events (SSE), and persists the
competitive data model (teams, matches, goals, ELO ranking).

## Architecture

    backEnd/src/
    ├── index.ts           # Express app: middleware, routes, auth endpoints
    ├── config/passport.ts # OAuth strategies (Discord, Google) + profile normalization
    ├── routes/            # HTTP endpoints (oauth.route.ts, stream.route.ts)
    ├── services/auth/     # Business logic (login, register)
    ├── modules/iot/       # IoT pipeline: ToF reading -> speed -> event bus
    ├── modules/math/      # Pure functions: ball speed calculation (unit-tested)
    ├── lib/               # Prisma client, JWT helpers
    └── type/              # Shared types (ToFReading, SpeedResult, ImpactEvent)

Layered separation: routes never contain business logic; all database access goes
through Prisma (PostgreSQL). The IoT pipeline is decoupled from delivery by an
internal EventEmitter bus.

## Getting started

1. Copy `.env.example` to `.env` and fill in the values:

       DATABASE_URL=postgresql://user:password@localhost:5432/beefootflow
       JWT_SECRET=<long random secret>
       GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
       DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET
       BASE_URL=http://localhost:3000

2. Install and prepare the database:

       npm install
       npm run prisma:generate
       npm run prisma:migrate -- --name init

3. Run the development server: `npm run dev`

Database health check: `GET /health/db`

## Tests

Unit tests (Vitest) cover the business core — the ball-speed math module and the
IoT pipeline — at 100 % coverage:

    npx vitest run --coverage --coverage.include='backEnd/src/modules/**'

An SSE load-measurement script is also versioned (`measure_sse.mjs`): it opens N
concurrent SSE clients, triggers impacts and reports end-to-end broadcast latency.

## IoT protocol

- The sensor controller POSTs a ToF reading to `POST /iot/impact`.
- `handleImpact()` validates the reading, computes the ball speed
  (`calculateBallSpeed`), builds a timestamped `ImpactEvent` and emits it on the
  internal bus.
- Every client connected to `GET /stream` receives the event as SSE:
  `data: { "speedResult": {...}, "timestamp": "..." }`.
- A comment ping is sent every 15 s to keep connections alive; listeners are
  removed on client disconnect (no memory leaks).

## Authentication

OAuth 2.0 via Passport (Discord and Google). Profiles are normalized into a single
`users` record — an existing account with the same email is linked instead of
duplicated. Successful logins are issued a JWT (Bearer).