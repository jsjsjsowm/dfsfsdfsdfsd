import { type User, type Player, type DailyReward, type Achievement, type GameScore, type LeaderboardEntry, type InsertUser, type InsertPlayer, type InsertDailyReward, type InsertAchievement, type InsertGameScore } from "@shared/schema";
import { users, players, dailyRewards, achievements, gameScores, leaderboard } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player methods
  getPlayer(userId: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(userId: string, updates: Partial<Player>): Promise<Player>;
  
  // Daily rewards methods
  getDailyRewards(userId: string): Promise<DailyReward[]>;
  claimDailyReward(userId: string, day: number): Promise<DailyReward>;
  resetDailyRewards(userId: string): Promise<void>;
  
  // Achievement methods
  getAchievements(userId: string): Promise<Achievement[]>;
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Game score methods
  addGameScore(score: InsertGameScore): Promise<GameScore>;
  getRecentScores(userId: string, limit?: number): Promise<GameScore[]>;
  
  // Leaderboard methods
  getLeaderboard(period: string, limit?: number): Promise<(LeaderboardEntry & { user: User })[]>;
  updateLeaderboard(userId: string, score: number, period: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private players: Map<string, Player>;
  private dailyRewards: Map<string, DailyReward[]>;
  private achievements: Map<string, Achievement[]>;
  private gameScores: Map<string, GameScore[]>;
  private leaderboard: Map<string, LeaderboardEntry[]>;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.dailyRewards = new Map();
    this.achievements = new Map();
    this.gameScores = new Map();
    this.leaderboard = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      telegramId: insertUser.telegramId,
      username: insertUser.username || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      photoUrl: insertUser.photoUrl || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getPlayer(userId: string): Promise<Player | undefined> {
    return this.players.get(userId);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      id,
      userId: insertPlayer.userId,
      level: insertPlayer.level || 1,
      coins: insertPlayer.coins || 1000,
      experience: insertPlayer.experience || 0,
      totalScore: insertPlayer.totalScore || 0,
      gamesPlayed: insertPlayer.gamesPlayed || 0,
      clickPower: insertPlayer.clickPower || 1,
      autoMiner: insertPlayer.autoMiner || 0,
      totalClicks: insertPlayer.totalClicks || 0,
      bestCombo: insertPlayer.bestCombo || 0,
      totalWins: insertPlayer.totalWins || 0,
      updatedAt: new Date()
    };
    this.players.set(insertPlayer.userId, player);
    return player;
  }

  async updatePlayer(userId: string, updates: Partial<Player>): Promise<Player> {
    const existing = this.players.get(userId);
    if (!existing) {
      throw new Error('Player not found');
    }
    
    const updated: Player = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.players.set(userId, updated);
    return updated;
  }

  async getDailyRewards(userId: string): Promise<DailyReward[]> {
    return this.dailyRewards.get(userId) || [];
  }

  async claimDailyReward(userId: string, day: number): Promise<DailyReward> {
    const rewards = this.dailyRewards.get(userId) || [];
    const reward = rewards.find(r => r.day === day);
    
    if (!reward) {
      throw new Error('Daily reward not found');
    }
    
    if (reward.claimed) {
      throw new Error('Daily reward already claimed');
    }

    reward.claimed = true;
    reward.claimedAt = new Date();
    
    this.dailyRewards.set(userId, rewards);
    return reward;
  }

  async resetDailyRewards(userId: string): Promise<void> {
    const rewards: DailyReward[] = [];
    const resetAt = new Date();
    resetAt.setDate(resetAt.getDate() + 1);

    for (let day = 1; day <= 7; day++) {
      rewards.push({
        id: randomUUID(),
        userId,
        day,
        claimed: false,
        claimedAt: null,
        resetAt
      });
    }

    this.dailyRewards.set(userId, rewards);
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return this.achievements.get(userId) || [];
  }

  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      unlockedAt: new Date()
    };
    
    const userAchievements = this.achievements.get(insertAchievement.userId) || [];
    userAchievements.push(achievement);
    this.achievements.set(insertAchievement.userId, userAchievements);
    
    return achievement;
  }

  async addGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const id = randomUUID();
    const score: GameScore = {
      ...insertScore,
      id,
      playedAt: new Date()
    };
    
    const userScores = this.gameScores.get(insertScore.userId) || [];
    userScores.push(score);
    this.gameScores.set(insertScore.userId, userScores);
    
    return score;
  }

  async getRecentScores(userId: string, limit: number = 10): Promise<GameScore[]> {
    const scores = this.gameScores.get(userId) || [];
    return scores
      .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      .slice(0, limit);
  }

  async getLeaderboard(period: string, limit: number = 10): Promise<(LeaderboardEntry & { user: User })[]> {
    const entries = this.leaderboard.get(period) || [];
    
    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => {
        const user = this.users.get(entry.userId);
        return {
          ...entry,
          rank: index + 1,
          user: user!
        };
      });
  }

  async updateLeaderboard(userId: string, score: number, period: string): Promise<void> {
    const entries = this.leaderboard.get(period) || [];
    const existingIndex = entries.findIndex(e => e.userId === userId);
    
    if (existingIndex >= 0) {
      if (entries[existingIndex].score < score) {
        entries[existingIndex] = {
          ...entries[existingIndex],
          score,
          updatedAt: new Date()
        };
      }
    } else {
      entries.push({
        id: randomUUID(),
        userId,
        rank: 0,
        score,
        period,
        updatedAt: new Date()
      });
    }
    
    this.leaderboard.set(period, entries);
  }
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getPlayer(userId: string): Promise<Player | undefined> {
    const result = await this.db.select().from(players).where(eq(players.userId, userId)).limit(1);
    return result[0];
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const result = await this.db.insert(players).values(insertPlayer).returning();
    return result[0];
  }

  async updatePlayer(userId: string, updates: Partial<Player>): Promise<Player> {
    const result = await this.db
      .update(players)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(players.userId, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error('Player not found');
    }
    return result[0];
  }

  async getDailyRewards(userId: string): Promise<DailyReward[]> {
    return await this.db.select().from(dailyRewards).where(eq(dailyRewards.userId, userId));
  }

  async claimDailyReward(userId: string, day: number): Promise<DailyReward> {
    const result = await this.db
      .update(dailyRewards)
      .set({ claimed: true, claimedAt: new Date() })
      .where(and(eq(dailyRewards.userId, userId), eq(dailyRewards.day, day)))
      .returning();
    
    if (!result[0]) {
      throw new Error('Daily reward not found');
    }
    return result[0];
  }

  async resetDailyRewards(userId: string): Promise<void> {
    await this.db.delete(dailyRewards).where(eq(dailyRewards.userId, userId));
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return await this.db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const result = await this.db.insert(achievements).values(insertAchievement).returning();
    return result[0];
  }

  async addGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const result = await this.db.insert(gameScores).values(insertScore).returning();
    return result[0];
  }

  async getRecentScores(userId: string, limit: number = 10): Promise<GameScore[]> {
    return await this.db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, userId))
      .orderBy(desc(gameScores.playedAt))
      .limit(limit);
  }

  async getLeaderboard(period: string, limit: number = 10): Promise<(LeaderboardEntry & { user: User })[]> {
    const result = await this.db
      .select({
        id: leaderboard.id,
        userId: leaderboard.userId,
        rank: leaderboard.rank,
        score: leaderboard.score,
        period: leaderboard.period,
        updatedAt: leaderboard.updatedAt,
        user: users
      })
      .from(leaderboard)
      .innerJoin(users, eq(leaderboard.userId, users.id))
      .where(eq(leaderboard.period, period))
      .orderBy(desc(leaderboard.score))
      .limit(limit);

    return result;
  }

  async updateLeaderboard(userId: string, score: number, period: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(leaderboard)
      .where(and(eq(leaderboard.userId, userId), eq(leaderboard.period, period)))
      .limit(1);

    if (existing.length > 0 && existing[0].score >= score) {
      return; // Don't update if score is not better
    }

    if (existing.length > 0) {
      await this.db
        .update(leaderboard)
        .set({ score, rank: 0, updatedAt: new Date() })
        .where(eq(leaderboard.id, existing[0].id));
    } else {
      await this.db.insert(leaderboard).values({
        userId,
        rank: 0,
        score,
        period,
      });
    }
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
