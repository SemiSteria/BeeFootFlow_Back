-- ============================================
-- BeeFootFlow - Requetes SQL Types
-- ============================================

-- ============================================
-- CLASSEMENT : Top joueurs par Elo
-- ============================================
SELECT * FROM leaderboard;

-- ============================================
-- CLASSEMENT : Top 3 joueurs
-- ============================================
SELECT pseudo, elo, elo_peak, mmr, win_rate
FROM leaderboard
LIMIT 3;

-- ============================================
-- STATS JOUEUR : profil complet d'un joueur
-- ============================================
SELECT
    u.pseudo,
    u.elo,
    u.elo_peak,
    u.mmr,
    u.total_matches,
    u.total_wins,
    u.total_goals,
    CASE WHEN u.total_matches > 0
        THEN ROUND((u.total_wins::DECIMAL / u.total_matches) * 100, 1)
        ELSE 0
    END AS win_rate,
    (SELECT AVG(g.ball_speed) FROM goals g
     JOIN match_players mp ON mp.match_id = g.match_id
     WHERE mp.user_id = u.id AND g.team = mp.team) AS avg_ball_speed
FROM users u
WHERE u.pseudo = 'KingFoot';

-- ============================================
-- HISTORIQUE : derniers matchs d'un joueur
-- ============================================
SELECT
    m.id AS match_id,
    m.score_team_a,
    m.score_team_b,
    mp.team,
    CASE
        WHEN m.score_team_a > m.score_team_b AND mp.team = 'A' THEN 'Victoire'
        WHEN m.score_team_b > m.score_team_a AND mp.team = 'B' THEN 'Victoire'
        WHEN m.score_team_a = m.score_team_b THEN 'Egalite'
        ELSE 'Defaite'
    END AS resultat,
    m.duration,
    m.avg_ball_speed,
    m.created_at
FROM matches m
JOIN match_players mp ON mp.match_id = m.id
JOIN users u ON u.id = mp.user_id
WHERE u.pseudo = 'KingFoot' AND m.status = 'finished'
ORDER BY m.created_at DESC;

-- ============================================
-- TOP VITESSE : buts les plus rapides
-- ============================================
SELECT
    g.ball_speed,
    g.team,
    m.score_team_a,
    m.score_team_b,
    g.scored_at
FROM goals g
JOIN matches m ON m.id = g.match_id
WHERE g.ball_speed IS NOT NULL
ORDER BY g.ball_speed DESC
LIMIT 10;

-- ============================================
-- STATS MATCH : detail d'un match specifique
-- ============================================
SELECT * FROM match_summary WHERE match_id = 'b1111111-1111-1111-1111-111111111111';

-- ============================================
-- JOUEURS D'UN MATCH : composition des equipes
-- ============================================
SELECT
    mp.team,
    u.pseudo,
    u.elo,
    u.mmr
FROM match_players mp
JOIN users u ON u.id = mp.user_id
WHERE mp.match_id = 'b1111111-1111-1111-1111-111111111111'
ORDER BY mp.team;

-- ============================================
-- BUTS D'UN MATCH : timeline des buts
-- ============================================
SELECT
    g.team,
    g.ball_speed,
    g.time_since_last_goal,
    g.scored_at
FROM goals g
WHERE g.match_id = 'b1111111-1111-1111-1111-111111111111'
ORDER BY g.scored_at;

-- ============================================
-- MATCHS EN COURS
-- ============================================
SELECT
    m.id,
    m.score_team_a,
    m.score_team_b,
    m.created_at
FROM matches m
WHERE m.status = 'in_progress';

-- ============================================
-- STATS GLOBALES : resume de la plateforme
-- ============================================
SELECT
    (SELECT COUNT(*) FROM users) AS total_joueurs,
    (SELECT COUNT(*) FROM matches WHERE status = 'finished') AS total_matchs_joues,
    (SELECT COUNT(*) FROM goals) AS total_buts,
    (SELECT ROUND(AVG(ball_speed), 2) FROM goals WHERE ball_speed IS NOT NULL) AS vitesse_moyenne_globale,
    (SELECT MAX(ball_speed) FROM goals) AS vitesse_record;
