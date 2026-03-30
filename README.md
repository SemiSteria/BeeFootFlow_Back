# BeeFootFlow Back

## Prisma setup

1. Copier `.env.example` vers `.env`
2. Renseigner `DATABASE_URL`
3. Générer le client Prisma

```bash
npm run prisma:generate
```

4. Créer une migration et l'appliquer

```bash
npm run prisma:migrate -- --name init
```

5. Lancer le serveur

```bash
npm run dev
```

Route de vérification DB: `GET /health/db`