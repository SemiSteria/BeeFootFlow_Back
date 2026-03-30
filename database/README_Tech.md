# BeeFootFlow - README Technique

## Objectif

Ce document explique les decisions techniques prises pour la base de donnees BeeFootFlow :

- pourquoi PostgreSQL ;
- pourquoi ce decoupage des tables ;
- pourquoi ces contraintes, index, triggers et vues ;
- quels compromis ont ete faits pour concilier simplicite, performance et evolutivite.

## Pourquoi PostgreSQL

PostgreSQL a ete retenu pour 4 raisons principales.

1. Integrite relationnelle forte
Le projet manipule des relations metier claires (joueurs, matchs, participants, buts). Les cles etrangeres, contraintes et checks permettent de garantir des donnees coherentes des l'ecriture.

2. Types avances utiles au domaine
- `UUID` pour des identifiants robustes et facilement exploitables en environnement distribue.
- `DECIMAL` pour les mesures de vitesse (precision et absence d'erreurs d'arrondi typiques des flottants).
- `ENUM` (`match_status`) pour verrouiller les etats autorises d'un match : `pending`, `in_progress`, `finished`.

3. Logique metier proche des donnees
Le trigger de fin de match met a jour automatiquement les statistiques joueurs (Elo/MMR, wins, goals, etc.).
Cela evite de dupliquer cette logique dans plusieurs couches applicatives.

4. Scalabilite raisonnable pour un tracker competitif
Avec des index adaptes et des vues de lecture metier, PostgreSQL permet de tenir la charge d'un usage applicatif standard sans complexite prematuree.

## Pourquoi cette organisation des tables

La modelisation suit une separation claire des responsabilites.

### `users`

Contient l'identite du joueur et ses metriques globales.

- Donnees d'identite : `pseudo`, `email`, `password_hash`.
- Metriques de progression : `elo`, `elo_peak`, `mmr`.
- Compteurs de performance : `total_matches`, `total_wins`, `total_goals`.

Raison du choix : garder les stats globales dans `users` permet des lectures rapides pour les profils et le classement sans recalcul systematique.

### `matches`

Represente une partie unique avec son contexte et son cycle de vie.

- Scores, limite de buts, duree, moyennes.
- Statut de workflow via `status match_status`.

Raison du choix : centraliser les informations de session dans une table racine facilite les requetes de suivi et les transitions d'etat.

### `match_players`

Table de jonction entre `users` et `matches`.

- Gere le n-n (un joueur joue plusieurs matchs, un match contient plusieurs joueurs).
- `team` (`A`/`B`) permet de reconstruire les equipes.
- `UNIQUE(match_id, user_id)` empeche l'inscription multiple du meme joueur dans un meme match.

Raison du choix : modele flexible pour couvrir 1v1 et 2v2 sans dupliquer de colonnes de joueurs dans `matches`.

### `goals`

Journal evenementiel des buts.

- Qui marque (`team`), vitesse (`ball_speed`), timing (`time_since_last_goal`), horodatage (`scored_at`).

Raison du choix : stocker les buts comme evenements atomiques permet des analyses fines (rythme, vitesse, dynamique du match).

## Pourquoi ce niveau de contraintes

Les contraintes sont utilisees pour proteger la coherence metier des l'insertion.

- Scores limites (`<= 10`) pour rester alignes avec la logique de partie.
- Equipes bornees a `A` ou `B`.
- Integrite referentielle avec `ON DELETE CASCADE` pour nettoyer proprement les donnees dependantes.
- Statut borne par enum pour eviter les valeurs invalides.

## Pourquoi un enum pour `status`

Le passage de `VARCHAR` a `ENUM` a ete fait pour fiabiliser le workflow de match.

- Valeurs strictement controlees : `pending`, `in_progress`, `finished`.
- Suppression des fautes de saisie et variantes incoherentes.
- Meilleure lisibilite metier du schema.
- Alignement naturel avec le trigger qui s'execute sur le passage a `finished`.

## Pourquoi ces index

Les index cibles sont poses sur les chemins de lecture les plus frequents.

- `match_players(match_id)` et `match_players(user_id)` pour naviguer rapidement entre joueurs et matchs.
- `goals(match_id)` pour les stats par match.
- `users(elo DESC)` pour le classement.
- `matches(status)` et `matches(created_at DESC)` pour le suivi des parties en cours et recentes.

Objectif : accelerer les requetes metier sans sur-indexer inutilement les tables.

## Pourquoi un trigger de mise a jour des stats

Le trigger `trg_update_user_stats` (fonction `update_user_stats`) applique automatiquement les regles de scoring quand un match passe a `finished`.

Ce choix garantit :

- une source unique de verite pour les calculs ;
- moins de risque d'oubli cote application ;
- des statistiques toujours synchronisees avec les donnees match.

## Pourquoi des vues metier

Deux vues sont exposees pour simplifier la consommation.

- `leaderboard` : classement pret a l'emploi avec win rate.
- `match_summary` : resume agrege des matchs.

Raison du choix : offrir des points d'entree SQL stables pour l'application et le reporting.

## Compromis assumes

- Elo actuel simple (+10/-10) pour garder un modele compréhensible et facile a verifier.
- Stats globales materialisees dans `users` pour privilegier la lecture rapide.
- Logique metier partiellement en base (trigger) pour securiser la coherence, au prix d'une complexite SQL un peu plus forte.

## Evolutions prevues

- Parametrer/calibrer l'algorithme Elo selon le niveau des equipes.
- Ajouter saisons/tournois et classements segmentes.
- Completer la couverture de tests SQL sur les transitions de statut et les updates automatiques.
- Introduire eventuellement une table d'historique Elo pour analyses temporelles plus fines.