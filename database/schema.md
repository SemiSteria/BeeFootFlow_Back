# BeeFootFlow.db - Schema Relationnel

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR pseudo UK
        VARCHAR password_hash
        INTEGER elo
        INTEGER total_matches
        INTEGER total_wins
        INTEGER total_goals
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    matches {
        UUID id PK
        INTEGER score_team_a
        INTEGER score_team_b
        DECIMAL avg_ball_speed
        INTEGER avg_time_between_goals
        DECIMAL avg_elo
        INTEGER duration
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP finished_at
    }

    match_players {
        UUID id PK
        UUID match_id FK
        UUID user_id FK
        VARCHAR team
    }

    goals {
        UUID id PK
        UUID match_id FK
        VARCHAR team
        DECIMAL ball_speed
        INTEGER time_since_last_goal
        TIMESTAMP scored_at
    }

    users ||--o{ match_players : "joue dans"
    matches ||--o{ match_players : "contient"
    matches ||--o{ goals : "a des buts"
```

## Relations

| Relation | Description |
|----------|-------------|
| `users` → `match_players` | Un joueur peut participer a plusieurs matchs |
| `matches` → `match_players` | Un match a 2 a 4 joueurs (1v1 ou 2v2) |
| `matches` → `goals` | Un match contient 0 a N buts |

## Metriques couvertes

| Metrique | Localisation |
|----------|-------------|
| Equipe A / Equipe B | `match_players.team` (A ou B) |
| Score | `matches.score_team_a` / `matches.score_team_b` |
| Nombre de buts | `COUNT` sur `goals` |
| Vitesse de balle | `goals.ball_speed` |
| Vitesse moyenne de balle | `matches.avg_ball_speed` |
| Temps entre buts (par but) | `goals.time_since_last_goal` |
| Temps moyen entre buts (par match) | `matches.avg_time_between_goals` |
| Elo moyen | `matches.avg_elo` |
| Temps de match | `matches.duration` |
