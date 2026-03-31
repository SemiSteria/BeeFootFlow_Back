import { Router, Request, Response } from 'express';
import { LobbyController } from '../controllers/lobby.controller.js';
const router = Router();
const lobbyController = new LobbyController();

// Create a new lobby
router.post('/create', (req: Request, res: Response) => {
    lobbyController.createLobby
});

// Join a lobby with code
router.post('/join/:code', (req: Request, res: Response) => {
    lobbyController.joinLobbyByCode
});

// Join a lobby with code
router.post('/team/:color/:code', (req: Request, res: Response) => {
    lobbyController.joinTeam
});

export default router;