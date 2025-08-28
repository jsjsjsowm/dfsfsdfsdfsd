import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Star, Target, Timer, Trophy } from "lucide-react";
import { StaticStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface GameProps {
  onCoinsChange: (coins: number) => void;
  onExperienceChange: (exp: number) => void;
}

export function GameEngine({ onCoinsChange, onExperienceChange }: GameProps) {
  const [player, setPlayer] = useState(StaticStorage.getPlayer("123456789"));
  const [clickPower, setClickPower] = useState(1);
  const [autoMiner, setAutoMiner] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(Date.now());
  const [gameMode, setGameMode] = useState<'clicker' | 'memory' | 'reaction' | 'puzzle'>('clicker');
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Auto-mining effect
  useEffect(() => {
    if (autoMiner > 0) {
      const interval = setInterval(() => {
        const coins = autoMiner;
        const newPlayer = {
          ...player!,
          coins: player!.coins + coins,
          experience: player!.experience + Math.floor(coins / 10)
        };
        setPlayer(newPlayer);
        StaticStorage.savePlayer(newPlayer);
        onCoinsChange(newPlayer.coins);
        onExperienceChange(newPlayer.experience);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoMiner, player, onCoinsChange, onExperienceChange]);

  // Combo system
  useEffect(() => {
    const comboTimeout = setTimeout(() => {
      if (comboCount > 0) {
        setComboCount(0);
      }
    }, 2000);
    return () => clearTimeout(comboTimeout);
  }, [lastClickTime, comboCount]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    let newCombo = timeDiff < 500 ? comboCount + 1 : 1;
    const multiplier = Math.min(1 + (newCombo * 0.1), 3);
    const coins = Math.floor(clickPower * multiplier);
    const exp = Math.floor(coins / 5);

    const newPlayer = {
      ...player!,
      coins: player!.coins + coins,
      experience: player!.experience + exp
    };

    setPlayer(newPlayer);
    setComboCount(newCombo);
    setLastClickTime(now);
    
    StaticStorage.savePlayer(newPlayer);
    onCoinsChange(newPlayer.coins);
    onExperienceChange(newPlayer.experience);

    // Achievement checks
    if (newCombo >= 10 && newCombo % 10 === 0) {
      toast({
        title: `${newCombo}x Combo!`,
        description: `Incredible clicking speed! +${coins} coins`,
      });
    }
  }, [player, clickPower, comboCount, lastClickTime, onCoinsChange, onExperienceChange, toast]);

  if (!player) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* Game Mode Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['clicker', 'memory', 'reaction', 'puzzle'] as const).map((mode) => (
          <Button
            key={mode}
            variant={gameMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setGameMode(mode)}
            className="min-w-fit capitalize"
          >
            {mode}
          </Button>
        ))}
      </div>

      {/* Current Game */}
      {gameMode === 'clicker' && <ClickerGame 
        onCoinClick={handleClick}
        comboCount={comboCount}
        clickPower={clickPower}
        autoMiner={autoMiner}
        player={player}
        onUpgrade={(type: 'click' | 'auto') => {
          if (type === 'click' && player.coins >= 100) {
            const newPlayer = { ...player, coins: player.coins - 100 };
            setPlayer(newPlayer);
            setClickPower(prev => prev + 1);
            StaticStorage.savePlayer(newPlayer);
            onCoinsChange(newPlayer.coins);
          } else if (type === 'auto' && player.coins >= 500) {
            const newPlayer = { ...player, coins: player.coins - 500 };
            setPlayer(newPlayer);
            setAutoMiner(prev => prev + 1);
            StaticStorage.savePlayer(newPlayer);
            onCoinsChange(newPlayer.coins);
          }
        }}
      />}

      {gameMode === 'memory' && <MemoryGame 
        onWin={(reward) => {
          const newPlayer = { ...player, coins: player.coins + reward, experience: player.experience + Math.floor(reward / 2) };
          setPlayer(newPlayer);
          StaticStorage.savePlayer(newPlayer);
          onCoinsChange(newPlayer.coins);
          onExperienceChange(newPlayer.experience);
        }}
      />}

      {gameMode === 'reaction' && <ReactionGame 
        onWin={(reward) => {
          const newPlayer = { ...player, coins: player.coins + reward, experience: player.experience + Math.floor(reward / 2) };
          setPlayer(newPlayer);
          StaticStorage.savePlayer(newPlayer);
          onCoinsChange(newPlayer.coins);
          onExperienceChange(newPlayer.experience);
        }}
      />}

      {gameMode === 'puzzle' && <PuzzleGame 
        onWin={(reward) => {
          const newPlayer = { ...player, coins: player.coins + reward, experience: player.experience + Math.floor(reward / 2) };
          setPlayer(newPlayer);
          StaticStorage.savePlayer(newPlayer);
          onCoinsChange(newPlayer.coins);
          onExperienceChange(newPlayer.experience);
        }}
      />}
    </div>
  );
}

function ClickerGame({ onCoinClick, comboCount, clickPower, autoMiner, player, onUpgrade }: any) {
  return (
    <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-primary/20">
      <div className="text-center space-y-6">
        {/* Main Click Button */}
        <div className="relative">
          <Button
            size="lg"
            onClick={onCoinClick}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-900 text-2xl font-bold shadow-lg transform active:scale-95 transition-all duration-150"
          >
            <Coins className="w-12 h-12" />
          </Button>
          
          {comboCount > 1 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse">
              {comboCount}x
            </Badge>
          )}
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">+{clickPower} per click</div>
          {comboCount > 1 && (
            <div className="text-lg text-primary animate-bounce">
              Combo Multiplier: {Math.min(1 + (comboCount * 0.1), 3).toFixed(1)}x
            </div>
          )}
        </div>

        {/* Upgrades */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => onUpgrade('click')}
            disabled={player?.coins < 100}
            className="flex flex-col p-4 h-auto"
          >
            <Zap className="w-6 h-6 mb-2" />
            <span className="text-sm">Click Power</span>
            <span className="text-xs text-muted-foreground">100 coins</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onUpgrade('auto')}
            disabled={player?.coins < 500}
            className="flex flex-col p-4 h-auto"
          >
            <Star className="w-6 h-6 mb-2" />
            <span className="text-sm">Auto Miner</span>
            <span className="text-xs text-muted-foreground">500 coins</span>
          </Button>
        </div>

        {autoMiner > 0 && (
          <div className="text-center">
            <div className="text-sm text-green-400">
              Auto-mining: +{autoMiner} coins/sec
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function MemoryGame({ onWin }: { onWin: (reward: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(1);
  const { toast } = useToast();

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

  const startGame = () => {
    const newSequence = [Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setPlayerSequence([]);
    setIsPlaying(true);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      // Flash effect would be handled by the button state
    }
    setIsShowing(false);
  };

  const handleColorClick = (colorIndex: number) => {
    if (isShowing) return;
    
    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      toast({
        title: "Game Over!",
        description: `You reached level ${level}`,
        variant: "destructive"
      });
      setIsPlaying(false);
      setLevel(1);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      const reward = level * 50;
      onWin(reward);
      toast({
        title: "Level Complete!",
        description: `+${reward} coins earned!`,
      });
      
      const nextSequence = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSequence);
      setPlayerSequence([]);
      setLevel(prev => prev + 1);
      setTimeout(() => showSequence(nextSequence), 1000);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-purple-500/20">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-purple-300">Memory Game</h3>
        <div className="text-sm text-muted-foreground">
          Remember and repeat the sequence
        </div>
        
        {!isPlaying ? (
          <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700">
            Start Game
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="text-lg font-semibold">Level {level}</div>
            <div className="grid grid-cols-2 gap-4">
              {colors.map((color, index) => (
                <Button
                  key={index}
                  className={`h-16 ${color} hover:opacity-80 transition-all duration-150`}
                  onClick={() => handleColorClick(index)}
                  disabled={isShowing}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function ReactionGame({ onWin }: { onWin: (reward: number) => void }) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const { toast } = useToast();

  const startGame = () => {
    setIsWaiting(true);
    setIsReady(false);
    setReactionTime(0);
    
    const delay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      setIsWaiting(false);
      setIsReady(true);
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (isWaiting) {
      toast({
        title: "Too Early!",
        description: "Wait for the green signal",
        variant: "destructive"
      });
      setIsWaiting(false);
      return;
    }

    if (isReady) {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setIsReady(false);
      
      let reward = 0;
      if (time < 300) reward = 200;
      else if (time < 500) reward = 150;
      else if (time < 800) reward = 100;
      else reward = 50;

      onWin(reward);
      toast({
        title: `${time}ms reaction time!`,
        description: `+${reward} coins earned!`,
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-800/50 to-green-900/50 border-green-500/20">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-green-300">Reaction Test</h3>
        <div className="text-sm text-muted-foreground">
          Click when the button turns green!
        </div>

        {!isWaiting && !isReady && reactionTime === 0 && (
          <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
            Start Test
          </Button>
        )}

        {(isWaiting || isReady) && (
          <Button
            onClick={handleClick}
            className={`w-full h-32 text-2xl font-bold transition-all duration-150 ${
              isWaiting 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
            }`}
          >
            {isWaiting ? 'WAIT...' : 'CLICK NOW!'}
          </Button>
        )}

        {reactionTime > 0 && (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-400">{reactionTime}ms</div>
            <Button onClick={startGame} variant="outline">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function PuzzleGame({ onWin }: { onWin: (reward: number) => void }) {
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [target, setTarget] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const generatePuzzle = () => {
    const numbers = Array.from({ length: 8 }, (_, i) => i + 1).concat([0]);
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    setPuzzle(shuffled);
    setTarget(15); // Sum of first row should be 15
    setMoves(0);
    setIsPlaying(true);
  };

  const swapTiles = (index1: number, index2: number) => {
    if (!isPlaying) return;
    
    const newPuzzle = [...puzzle];
    [newPuzzle[index1], newPuzzle[index2]] = [newPuzzle[index2], newPuzzle[index1]];
    setPuzzle(newPuzzle);
    setMoves(prev => prev + 1);

    // Check win condition (first 3 numbers sum to target)
    const firstRowSum = newPuzzle.slice(0, 3).reduce((sum, num) => sum + num, 0);
    if (firstRowSum === target) {
      const reward = Math.max(300 - moves * 10, 100);
      onWin(reward);
      toast({
        title: "Puzzle Solved!",
        description: `Completed in ${moves} moves. +${reward} coins!`,
      });
      setIsPlaying(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-800/50 to-blue-900/50 border-blue-500/20">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-blue-300">Number Puzzle</h3>
        <div className="text-sm text-muted-foreground">
          Make the first row sum to {target}
        </div>

        {!isPlaying && puzzle.length === 0 && (
          <Button onClick={generatePuzzle} className="bg-blue-600 hover:bg-blue-700">
            Start Puzzle
          </Button>
        )}

        {puzzle.length > 0 && (
          <div className="space-y-4">
            <div className="text-lg">Moves: {moves}</div>
            <div className="grid grid-cols-3 gap-2">
              {puzzle.map((num, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 text-xl font-bold"
                  onClick={() => {
                    const emptyIndex = puzzle.indexOf(0);
                    if (Math.abs(index - emptyIndex) === 1 || Math.abs(index - emptyIndex) === 3) {
                      swapTiles(index, emptyIndex);
                    }
                  }}
                  disabled={num === 0}
                >
                  {num || ''}
                </Button>
              ))}
            </div>
            
            {!isPlaying && (
              <Button onClick={generatePuzzle} variant="outline">
                New Puzzle
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}