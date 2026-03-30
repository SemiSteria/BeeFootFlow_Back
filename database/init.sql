-- ============================================
-- BeeFootFlow - Schema PostgreSQL
-- Baby-foot connecte - Challenge 48h
-- ============================================

-- Creation de la base de donnees
-- CREATE DATABASE "BeeFootFlow";

-- Extension pour generer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE : users
-- Joueurs inscrits sur la plateforme
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudo VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1000,
    total_matches INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_goals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE : matches
-- Parties jouees (1v1 ou 2v2)
-- ============================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score_team_a INTEGER NOT NULL DEFAULT 0,
    score_team_b INTEGER NOT NULL DEFAULT 0,
    avg_ball_speed DECIMAL(6,2),          -- vitesse moyenne de balle (km/h)
    avg_time_between_goals INTEGER,        -- temps moyen entre les buts (secondes)
    avg_elo DECIMAL(8,2),                 -- elo moyen de la partie
    duration INTEGER,                      -- duree du match en secondes
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, in_progress, finished
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- ============================================
-- TABLE : match_players
-- Liaison joueurs <-> matchs (equipe A ou B)
-- Permet le 1v1 et le 2v2
-- ============================================
CREATE TABLE match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team VARCHAR(1) NOT NULL CHECK (team IN ('A', 'B')),
    UNIQUE(match_id, user_id)
);

-- ============================================
-- TABLE : goals
-- Chaque but marque pendant un match
-- ============================================
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team VARCHAR(1) NOT NULL CHECK (team IN ('A', 'B')),
    ball_speed DECIMAL(6,2),              -- vitesse de balle sur ce tir (km/h)
    time_since_last_goal INTEGER,          -- temps depuis le dernier but (secondes)
    scored_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX pour les requetes frequentes
-- ============================================
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_user ON match_players(user_id);
CREATE INDEX idx_goals_match ON goals(match_id);
CREATE INDEX idx_users_elo ON users(elo DESC);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- ============================================
-- VUE : classement des joueurs
-- ============================================
CREATE VIEW leaderboard AS
SELECT
    u.id,
    u.pseudo,
    u.elo,
    u.total_matches,
    u.total_wins,
    u.total_goals,
    CASE
        WHEN u.total_matches > 0
        THEN ROUND((u.total_wins::DECIMAL / u.total_matches) * 100, 1)
        ELSE 0
    END AS win_rate
FROM users u
ORDER BY u.elo DESC;

-- ============================================
-- VUE : resume d'un match avec stats
-- ============================================
CREATE VIEW match_summary AS
SELECT
    m.id AS match_id,
    m.score_team_a,
    m.score_team_b,
    m.avg_ball_speed,
    m.avg_elo,
    m.duration,
    m.status,
    m.created_at,
    m.finished_at,
    (SELECT COUNT(*) FROM goals g WHERE g.match_id = m.id) AS total_goals,
    (SELECT AVG(g.ball_speed) FROM goals g WHERE g.match_id = m.id) AS avg_goal_speed,
    (SELECT AVG(g.time_since_last_goal) FROM goals g WHERE g.match_id = m.id AND g.time_since_last_goal IS NOT NULL) AS avg_time_between_goals
FROM matches m;
