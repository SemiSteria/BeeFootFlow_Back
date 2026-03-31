import { Request, Response } from "express";
import rankingSystem from "../services/rank.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class RankController {

  // Victoire
  async updateRankVictory(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.users.findUnique({
        where: { id: String(userId) },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = rankingSystem.updateOnWin(
        user.elo,
        user.mmr,
        user.elo_peak
      );

      await prisma.users.update({
        where: { id: String(userId) },
        data: {
          rank: updated.elo,
          mmr: updated.mmr,
          peakRank: updated.peak_elo,
        },
      });

      return res.json({
        message: "Victory processed",
        data: updated,
      });

    } catch (error) {
      return res.status(500).json({ message: "Error updating rank (victory)", error });
    }
  }

  // Défaite
  async updateRankDefeat(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.users.findUnique({
        where: { id: String(userId) },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = rankingSystem.updateOnDefeat(
        user.elo,
        user.mmr,
        user.elo_peak
      );

      await prisma.users.update({
        where: { id: String(userId) },
        data: {
          rank: updated.elo,
          mmr: updated.mmr,
          peakRank: updated.peak_elo,
        },
      });

      return res.json({
        message: "Defeat processed",
        data: updated,
      });

    } catch (error) {
      return res.status(500).json({ message: "Error updating rank (defeat)", error });
    }
  }

  // 🏅 Leaderboard
  async getLeaderboard(req: Request, res: Response) {
    try {
      const players = await rankingSystem.getTop10Players();
      return res.json(players);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching leaderboard", error });
    }
  }

  // Rank utilisateur
  async getUserRank(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.users.findUnique({
        where: { id: String(userId) },
        select: {
          pseudo: true,
          profilePicture: true,
          rank: true,
          mmr: true,
          peakRank: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        ...user,
        rankLabel: rankingSystem.getRankLabel(user.rank),
      });

    } catch (error) {
      return res.status(500).json({ message: "Error fetching user rank", error });
    }
  }
}