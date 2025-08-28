// Static storage for demo mode
export interface Player {
  id: string;
  userId: string;
  coins: number;
  experience: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReward {
  id: string;
  userId: string;
  day: number;
  claimed: boolean;
  claimedAt?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  reward: number;
  unlockedAt: string;
}

export class StaticStorage {
  private static getKey(type: string, userId?: string): string {
    return userId ? `cryptoquest_${type}_${userId}` : `cryptoquest_${type}`;
  }

  static getPlayer(userId: string): Player | null {
    const stored = localStorage.getItem(this.getKey('player', userId));
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Create default player
    const player: Player = {
      id: '1',
      userId,
      coins: 2500,
      experience: 1500,
      level: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.savePlayer(player);
    return player;
  }

  static savePlayer(player: Player): void {
    localStorage.setItem(this.getKey('player', player.userId), JSON.stringify(player));
  }

  static getDailyRewards(userId: string): DailyReward[] {
    const stored = localStorage.getItem(this.getKey('dailyRewards', userId));
    if (stored) {
      return JSON.parse(stored);
    }

    // Create default daily rewards
    const rewards: DailyReward[] = Array.from({ length: 7 }, (_, i) => ({
      id: `${i + 1}`,
      userId,
      day: i + 1,
      claimed: i < 2, // First 2 days claimed
      claimedAt: i < 2 ? new Date().toISOString() : undefined
    }));

    this.saveDailyRewards(userId, rewards);
    return rewards;
  }

  static saveDailyRewards(userId: string, rewards: DailyReward[]): void {
    localStorage.setItem(this.getKey('dailyRewards', userId), JSON.stringify(rewards));
  }

  static getAchievements(userId: string): Achievement[] {
    const stored = localStorage.getItem(this.getKey('achievements', userId));
    if (stored) {
      return JSON.parse(stored);
    }

    // Create default achievements
    const achievements: Achievement[] = [
      {
        id: '1',
        userId,
        type: 'welcome',
        title: 'Welcome Aboard!',
        description: 'Started your CryptoQuest journey',
        reward: 100,
        unlockedAt: new Date().toISOString()
      },
      {
        id: '2',
        userId,
        type: 'coins',
        title: 'Coin Collector',
        description: 'Earned your first 1000 coins',
        reward: 250,
        unlockedAt: new Date().toISOString()
      }
    ];

    this.saveAchievements(userId, achievements);
    return achievements;
  }

  static saveAchievements(userId: string, achievements: Achievement[]): void {
    localStorage.setItem(this.getKey('achievements', userId), JSON.stringify(achievements));
  }

  static getLeaderboard(): Array<{ userId: string; username: string; coins: number; level: number }> {
    const stored = localStorage.getItem(this.getKey('leaderboard'));
    if (stored) {
      return JSON.parse(stored);
    }

    // Create demo leaderboard
    const leaderboard = [
      { userId: '123456789', username: 'Demo', coins: 2500, level: 2 },
      { userId: '987654321', username: 'Player1', coins: 3200, level: 3 },
      { userId: '456789123', username: 'CryptoMaster', coins: 5500, level: 4 },
      { userId: '789123456', username: 'QuestHero', coins: 1800, level: 2 },
      { userId: '321654987', username: 'GamerX', coins: 4100, level: 3 }
    ].sort((a, b) => b.coins - a.coins);

    localStorage.setItem(this.getKey('leaderboard'), JSON.stringify(leaderboard));
    return leaderboard;
  }
}