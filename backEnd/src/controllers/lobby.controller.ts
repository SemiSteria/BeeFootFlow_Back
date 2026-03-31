import { Request, Response } from "express";
import rankingSystem from "../services/rank.service.js";
import { PrismaClient } from "@prisma/client";
import { error } from "console";

const prisma = new PrismaClient();

export class LobbyController {
  // Victoire
  private generateCode(length: number = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = this.generateCode();

      const match = await prisma.matches.findUnique({
        where: { id: code },
      });

      if (!match) {
        exists = false;
      }
    }

    return code!;
  }

  async createLobby(req: Request, res: Response) {
    try {
      const code = await this.generateUniqueCode();
      await prisma.matches.create({ data: { id: code, playerConnected: 1 } });

      return res.status(200).json({ code: code });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error updating rank (victory)", error });
    }
  }

  // 🏅 Leaderboard
  async joinLobbyByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const match = await prisma.matches.findUnique({
        where: { id: String(code) },
      });
      if (!match) {
        throw error("Error, no Lobby founded");
      }
      prisma.matches.update({
        where: { id: String(code) },
        data: { playerConnected: match.playerConnected + 1 },
      });
      return res.status(200).json({message: "Lobby Joined, choose now a team"})
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }
  async joinTeam(req: Request, res: Response) {
    try {
      const { color, code } = req.params;

      const match = await prisma.matches.findUnique({
        where: { id: String(code) },
      });
      if (!match) {
        throw error("Error, no Lobby founded");
      }

      const matchPlayers = await prisma.match_players.findMany({
        where: { match_id: String(code) },
      });

      if (matchPlayers.length > 4) {
        throw error("Vous ne pouvez pas rejoindre le match")
      }
      if (String(color) !== "TeamA" || String(color) !== "TeamB") {
        throw error("Team given not accepted")
      }
      await prisma.match_players.create({
        data: {match_id: String(code), user_id: req.user!.id, team: color as any}
      });
      return res.status(200).json({message: "Lobby Joined, choose now a team"})
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }
}
