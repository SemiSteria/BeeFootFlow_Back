import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PlayerRank {
  elo: number;
  mmr: number;
  peak_elo: number;
}

class RankingSystem {
  private readonly MMR_GAIN_WIN = 25;
  private readonly MMR_LOSS_DEFEAT = -20;

  async getTop10Players() {
    const players = await prisma.users.findMany({
      orderBy: { mmr: "desc" },
      take: 10,
      select: {
        pseudo: true,
        profilePicture: true,
        rank: true,
      },
    });

    return players.map((player, index) => ({
      username: player.pseudo,
      profilePicture: player.profilePicture,
      rank: this.getRankLabel(player.rank, index + 1), // ✅ position ajoutée
    }));
  }

  getRankLabel(mmr: number, leaderboardPosition?: number): string {
    const rankLabels = [
      { label: "Pollen", min: 0, max: 300 },
      { label: "Nectar", min: 301, max: 500 },
      { label: "Honey Drop", min: 501, max: 600 },
      { label: "Honeycomb", min: 601, max: 700 },
      { label: "Golden Honey", min: 701, max: 1000 },
    ];

    // 👑 Top 10
    if (mmr > 1000 && leaderboardPosition && leaderboardPosition <= 10) {
      return "Hive Sovereign";
    }

    // 🍯 Royal Jelly
    if (mmr > 1000) {
      return "Royal Jelly";
    }

    const found = rankLabels.find((r) => mmr >= r.min && mmr <= r.max);
    return found ? found.label : "Unranked";
  }
  private calculateRankGain(currentRank: number, mmr: number): number {
    const diff = mmr - currentRank;

    if (diff > 200) return 30;
    if (diff > 100) return 25;
    if (diff > 0) return 20;
    if (diff > -100) return 15;
    return 10;
  }

  private calculateRankLoss(currentRank: number, mmr: number): number {
    const diff = mmr - currentRank;

    if (diff > 200) return -10;
    if (diff > 100) return -15;
    if (diff > 0) return -20;
    if (diff > -100) return -25;
    return -30;
  }
  updateOnWin(currentRank: number, mmr: number, peakRank: number): PlayerRank {
    const gain = this.calculateRankGain(currentRank, mmr);
    const newRank = currentRank + gain;

    return {
      elo: newRank,
      mmr: mmr + this.MMR_GAIN_WIN,
      peak_elo: Math.max(peakRank, newRank),
    };
  }

  updateOnDefeat(
    currentRank: number,
    mmr: number,
    peakRank: number,
  ): PlayerRank {
    const loss = this.calculateRankLoss(currentRank, mmr);
    const newRank = Math.max(0, currentRank + loss);

    return {
      elo: newRank,
      mmr: Math.max(0, mmr + this.MMR_LOSS_DEFEAT),
      peak_elo: peakRank,
    };
  }
}

export default new RankingSystem();
