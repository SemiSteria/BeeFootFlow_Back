import { Router } from 'express';
import { RankController } from '../controllers/rank.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const rankController = new RankController();

router.post('/victory/:userId', authenticate, (req, res) => {
    rankController.updateRankVictory(req, res);
});

router.post('/defeat/:userId', authenticate, (req, res) => {
    rankController.updateRankDefeat(req, res);
});

router.get('/leaderboard', (req, res) => {
    rankController.getLeaderboard(req, res);
});

router.get('/user/:userId', authenticate, (req, res) => {
    rankController.getUserRank(req, res);
});

export default router;