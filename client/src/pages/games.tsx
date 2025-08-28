import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Plus, Zap, Target, Clock, Trophy } from "lucide-react";

interface GamesPageProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

interface GameSession {
  id: string;
  score: number;
  timeLeft: number;
  isActive: boolean;
  coins: number;
  combo: number;
}

export function GamesPage({ activeTab, onNavigate }: GamesPageProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [clickPower, setClickPower] = useState(1);
  const [totalCoins, setTotalCoins] = useState(1000);

  // Clicker Game State
  const [clickCount, setClickCount] = useState(0);
  const [autoMiner, setAutoMiner] = useState(0);

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<Array<{id: number, symbol: string, flipped: boolean, matched: boolean}>>([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMatches, setMemoryMatches] = useState(0);

  // Reaction Game State
  const [reactionTarget, setReactionTarget] = useState<{x: number, y: number, active: boolean}>({x: 0, y: 0, active: false});
  const [reactionScore, setReactionScore] = useState(0);

  // Game timer effect
  useEffect(() => {
    if (gameSession?.isActive && gameSession.timeLeft > 0) {
      const timer = setInterval(() => {
        setGameSession(prev => prev ? {...prev, timeLeft: prev.timeLeft - 1} : null);
      }, 1000);
      return () => clearInterval(timer);
    } else if (gameSession?.timeLeft === 0) {
      endGame();
    }
  }, [gameSession?.isActive, gameSession?.timeLeft]);

  // Auto miner effect
  useEffect(() => {
    if (autoMiner > 0 && selectedGame === 'clicker') {
      const autoClick = setInterval(() => {
        handleCoinClick();
      }, 1000);
      return () => clearInterval(autoClick);
    }
  }, [autoMiner, selectedGame]);

  const games = [
    {
      id: 'clicker',
      title: 'Crypto Clicker',
      description: 'Click to earn coins and upgrade your mining power!',
      emoji: '💰',
      difficulty: 'Easy',
      reward: '10-50 coins per click',
      gradient: 'from-yellow-500 to-orange-600',
      color: 'text-yellow-400',
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Match crypto symbols to earn bonus rewards',
      emoji: '🧠',
      difficulty: 'Medium',
      reward: '100-500 coins',
      gradient: 'from-purple-500 to-pink-600',
      color: 'text-purple-400',
    },
    {
      id: 'reaction',
      title: 'Quick Reaction',
      description: 'Test your reflexes in this fast-paced game',
      emoji: '⚡',
      difficulty: 'Hard',
      reward: '200-1000 coins',
      gradient: 'from-blue-500 to-cyan-600',
      color: 'text-blue-400',
    },
    {
      id: 'puzzle',
      title: 'Crypto Puzzle',
      description: 'Solve puzzles to unlock treasure chests',
      emoji: '🧩',
      difficulty: 'Expert',
      reward: '500-2000 coins',
      gradient: 'from-green-500 to-emerald-600',
      color: 'text-green-400',
    }
  ];

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    
    const session: GameSession = {
      id: gameId,
      score: 0,
      timeLeft: gameId === 'clicker' ? 0 : 60, // Clicker has no time limit
      isActive: true,
      coins: 0,
      combo: 0,
    };

    setGameSession(session);

    // Initialize game-specific states
    if (gameId === 'memory') {
      initializeMemoryGame();
    } else if (gameId === 'reaction') {
      initializeReactionGame();
    }
  };

  const endGame = () => {
    if (gameSession) {
      setTotalCoins(prev => prev + gameSession.coins);
      
      // Save high score to localStorage
      const currentBest = localStorage.getItem(`best_${gameSession.id}`) || '0';
      if (gameSession.score > parseInt(currentBest)) {
        localStorage.setItem(`best_${gameSession.id}`, gameSession.score.toString());
      }
    }
    
    setGameSession(null);
    setSelectedGame(null);
  };

  const handleCoinClick = () => {
    if (selectedGame === 'clicker' && gameSession) {
      const coins = clickPower + (gameSession.combo * 0.1);
      setClickCount(prev => prev + 1);
      setGameSession(prev => prev ? {
        ...prev,
        score: prev.score + 1,
        coins: prev.coins + coins,
        combo: prev.combo + 1,
      } : null);
    }
  };

  const initializeMemoryGame = () => {
    const symbols = ['💎', '⚡', '🚀', '💰', '🔥', '⭐', '💎', '⚡', '🚀', '💰', '🔥', '⭐'];
    const shuffled = symbols.sort(() => Math.random() - 0.5);
    const cards = shuffled.map((symbol, index) => ({
      id: index,
      symbol,
      flipped: false,
      matched: false,
    }));
    setMemoryCards(cards);
    setMemoryFlipped([]);
    setMemoryMatches(0);
  };

  const handleMemoryCardClick = (cardId: number) => {
    if (memoryFlipped.length === 2 || memoryCards[cardId].matched || memoryCards[cardId].flipped) return;

    const newFlipped = [...memoryFlipped, cardId];
    setMemoryFlipped(newFlipped);
    
    const newCards = [...memoryCards];
    newCards[cardId].flipped = true;
    setMemoryCards(newCards);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first].symbol === memoryCards[second].symbol) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...memoryCards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setMemoryCards(matchedCards);
          setMemoryFlipped([]);
          setMemoryMatches(prev => prev + 1);
          
          if (gameSession) {
            setGameSession(prev => prev ? {
              ...prev,
              score: prev.score + 100,
              coins: prev.coins + 50,
            } : null);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...memoryCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setMemoryCards(resetCards);
          setMemoryFlipped([]);
        }, 1000);
      }
    }
  };

  const initializeReactionGame = () => {
    setReactionScore(0);
    spawnTarget();
  };

  const spawnTarget = () => {
    setTimeout(() => {
      setReactionTarget({
        x: Math.random() * 250,
        y: Math.random() * 200,
        active: true,
      });

      // Hide target after 1.5 seconds
      setTimeout(() => {
        setReactionTarget(prev => ({ ...prev, active: false }));
        if (gameSession?.isActive) {
          spawnTarget();
        }
      }, 1500);
    }, Math.random() * 2000 + 500);
  };

  const handleTargetClick = () => {
    if (reactionTarget.active && gameSession) {
      setReactionTarget(prev => ({ ...prev, active: false }));
      setReactionScore(prev => prev + 1);
      setGameSession(prev => prev ? {
        ...prev,
        score: prev.score + 10,
        coins: prev.coins + 25,
      } : null);
      
      if (gameSession.isActive) {
        spawnTarget();
      }
    }
  };

  const upgrades = [
    { id: 'click_power', name: 'Click Power', cost: 100, effect: '+1 coin per click', level: clickPower },
    { id: 'auto_miner', name: 'Auto Miner', cost: 500, effect: '+1 coin/sec', level: autoMiner },
  ];

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || totalCoins < upgrade.cost) return;

    setTotalCoins(prev => prev - upgrade.cost);
    
    if (upgradeId === 'click_power') {
      setClickPower(prev => prev + 1);
    } else if (upgradeId === 'auto_miner') {
      setAutoMiner(prev => prev + 1);
    }
  };

  if (selectedGame && gameSession) {
    const currentGame = games.find(g => g.id === selectedGame);
    
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 pb-20">
          {/* Game Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={endGame}
              className="text-sm"
            >
              ← Back
            </Button>
            <div className="text-center">
              <div className="text-2xl">{currentGame?.emoji}</div>
              <h2 className="font-bold">{currentGame?.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Coins</div>
              <div className="font-bold text-yellow-400">{gameSession.coins}</div>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-3 text-center">
              <div className="text-lg font-bold">{gameSession.score}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            {gameSession.timeLeft > 0 && (
              <div className="glass-card p-3 text-center">
                <div className="text-lg font-bold text-red-400">{gameSession.timeLeft}s</div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
            )}
            {selectedGame === 'clicker' && (
              <div className="glass-card p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{gameSession.combo}</div>
                <div className="text-xs text-muted-foreground">Combo</div>
              </div>
            )}
          </div>

          {/* Game Content */}
          <div className="space-y-6">
            {selectedGame === 'clicker' && (
              <>
                {/* Click Area */}
                <div className="flex justify-center">
                  <Button
                    className="w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-6xl relative overflow-hidden transform transition-transform active:scale-95"
                    onClick={handleCoinClick}
                    data-testid="button-coin-click"
                  >
                    <div className="absolute inset-0 bg-yellow-300/20 rounded-full animate-ping"></div>
                    💰
                  </Button>
                </div>

                {/* Upgrades */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">Upgrades</h3>
                  {upgrades.map((upgrade) => (
                    <div key={upgrade.id} className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{upgrade.name} Lv.{upgrade.level}</div>
                          <div className="text-sm text-muted-foreground">{upgrade.effect}</div>
                        </div>
                        <Button
                          onClick={() => buyUpgrade(upgrade.id)}
                          disabled={totalCoins < upgrade.cost}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600"
                        >
                          {upgrade.cost} 💰
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedGame === 'memory' && (
              <div className="grid grid-cols-4 gap-2">
                {memoryCards.map((card) => (
                  <Button
                    key={card.id}
                    className={`aspect-square text-2xl ${
                      card.flipped || card.matched 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                        : 'bg-gray-600'
                    }`}
                    onClick={() => handleMemoryCardClick(card.id)}
                    disabled={card.matched}
                    data-testid={`memory-card-${card.id}`}
                  >
                    {(card.flipped || card.matched) ? card.symbol : '?'}
                  </Button>
                ))}
              </div>
            )}

            {selectedGame === 'reaction' && (
              <div className="relative h-64 bg-gray-800 rounded-lg border-2 border-blue-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-cyan-900/20"></div>
                {reactionTarget.active && (
                  <Button
                    className="absolute w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 text-white p-0 transform transition-transform hover:scale-110"
                    style={{
                      left: `${reactionTarget.x}px`,
                      top: `${reactionTarget.y}px`,
                    }}
                    onClick={handleTargetClick}
                    data-testid="reaction-target"
                  >
                    🎯
                  </Button>
                )}
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-bold">Targets Hit: {reactionScore}</div>
                </div>
              </div>
            )}

            {selectedGame === 'puzzle' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧩</div>
                <h3 className="text-xl font-bold mb-2">Puzzle Game</h3>
                <p className="text-muted-foreground">Coming soon! Advanced puzzle mechanics</p>
              </div>
            )}
          </div>
        </main>

        <BottomNavigation
          activeTab={activeTab}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-3xl neon-blue">
            Mini Games
          </h1>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Coins</div>
            <div className="font-bold text-yellow-400 text-lg">{totalCoins}</div>
          </div>
        </div>

        <div className="grid gap-4">
          {games.map((game) => {
            const bestScore = localStorage.getItem(`best_${game.id}`) || '0';
            
            return (
              <div
                key={game.id}
                className="glass-card rounded-xl p-1 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${game.gradient} opacity-75 rounded-xl`}></div>
                
                <Button
                  className="w-full h-auto bg-transparent hover:bg-transparent p-6 relative z-10"
                  onClick={() => startGame(game.id)}
                  data-testid={`button-game-${game.id}`}
                >
                  <div className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl animate-float">{game.emoji}</div>
                      <div>
                        <h3 className="font-display font-bold text-xl text-white mb-1">
                          {game.title}
                        </h3>
                        <p className="text-white/90 text-sm mb-2">{game.description}</p>
                        <div className="flex items-center space-x-2">
                          <div className="bg-white/20 px-2 py-1 rounded-full">
                            <span className="text-xs font-medium text-white">{game.difficulty}</span>
                          </div>
                          {bestScore !== '0' && (
                            <div className="bg-yellow-500/20 px-2 py-1 rounded-full">
                              <span className="text-xs font-medium text-yellow-200">Best: {bestScore}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm">
                        <div className="text-sm font-bold text-white mb-1">{game.reward}</div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                          <span className="text-xs text-white/80">Reward</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Game Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-lg font-bold">{clickCount}</div>
            <div className="text-sm text-muted-foreground">Total Clicks</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-lg font-bold">{clickPower}</div>
            <div className="text-sm text-muted-foreground">Click Power</div>
          </div>
        </div>
      </main>

      <BottomNavigation
        activeTab={activeTab}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default GamesPage;