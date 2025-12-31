/*
  孟菲斯后现代波普风格 - 记忆翻牌游戏
  设计特点：
  - 高饱和度色彩碰撞（品红、青绿、亮黄、橙红、紫罗兰）
  - 粗黑边框与多色偏移阴影
  - 夸张的弹性动画和交互效果
  - 不规则几何布局
  
  功能：
  - 基于用时的排行榜
  - 本地存储最佳成绩
*/

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// 卡牌图案数据 - 使用emoji作为简单图案
const cardSymbols = ["🌟", "💖", "⚡", "🎨", "🎵", "🔥", "💎", "🌈"];

// 卡牌颜色方案
const cardColors = [
  "bg-[oklch(0.65_0.25_330)]", // 品红
  "bg-[oklch(0.75_0.20_180)]", // 青绿
  "bg-[oklch(0.85_0.25_90)]", // 亮黄
  "bg-[oklch(0.65_0.28_25)]", // 橙红
  "bg-[oklch(0.65_0.25_270)]", // 紫罗兰
  "bg-[oklch(0.70_0.22_150)]", // 绿色
  "bg-[oklch(0.60_0.25_300)]", // 蓝紫
  "bg-[oklch(0.75_0.23_50)]", // 橙黄
];

interface CardType {
  id: number;
  symbol: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface ScoreRecord {
  playerName: string;
  time: number;
  timestamp: number;
}

export default function Home() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // 初始化排行榜数据
  useEffect(() => {
    const savedScores = localStorage.getItem("memoryGameScores");
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

  // 保存排行榜数据
  const saveScores = (newScores: ScoreRecord[]) => {
    const sorted = newScores.sort((a, b) => a.time - b.time).slice(0, 10);
    setScores(sorted);
    localStorage.setItem("memoryGameScores", JSON.stringify(sorted));
  };

  // 提交成绩
  const submitScore = () => {
    if (!playerName.trim()) {
      toast.error("请输入玩家名字");
      return;
    }

    const newRecord: ScoreRecord = {
      playerName: playerName.trim(),
      time: elapsedTime,
      timestamp: Date.now(),
    };

    const newScores = [...scores, newRecord];
    saveScores(newScores);
    toast.success("成绩已保存！");
    setPlayerName("");
    setShowLeaderboard(true);
  };

  // 清除排行榜
  const clearLeaderboard = () => {
    if (confirm("确定要清除所有排行榜数据吗？")) {
      setScores([]);
      localStorage.removeItem("memoryGameScores");
      toast.success("排行榜已清除");
    }
  };

  // 初始化游戏
  const initGame = () => {
    const gameCards: CardType[] = [];
    cardSymbols.forEach((symbol, index) => {
      // 每个图案创建两张卡牌
      gameCards.push({
        id: index * 2,
        symbol,
        color: cardColors[index],
        isFlipped: false,
        isMatched: false,
      });
      gameCards.push({
        id: index * 2 + 1,
        symbol,
        color: cardColors[index],
        isFlipped: false,
        isMatched: false,
      });
    });
    
    // 洗牌
    const shuffled = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(true);
    setGameEnded(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setShowLeaderboard(false);
  };

  // 计时器
  useEffect(() => {
    if (!gameStarted || matches === cardSymbols.length) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, matches, startTime]);

  // 翻牌逻辑
  const handleCardClick = (id: number) => {
    if (isChecking) return;
    if (flippedCards.includes(id)) return;
    if (cards[cards.findIndex(c => c.id === id)].isMatched) return;
    if (flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    // 翻转卡牌
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, isFlipped: true } : card
    ));

    // 如果翻开了两张牌
    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.symbol === secondCard?.symbol) {
        // 配对成功
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === firstId || card.id === secondId
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);
          toast.success("太棒了！配对成功！", {
            duration: 1500,
          });
        }, 600);
      } else {
        // 配对失败
        setTimeout(() => {
          setCards(prev => prev.map(card =>
            card.id === firstId || card.id === secondId
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  // 游戏胜利检测
  useEffect(() => {
    if (matches === cardSymbols.length && gameStarted) {
      setTimeout(() => {
        setGameEnded(true);
        toast.success(`🎉 恭喜通关！用时 ${elapsedTime} 秒！`, {
          duration: 5000,
        });
      }, 500);
    }
  }, [matches, gameStarted, elapsedTime]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative"
      style={{
        backgroundImage: 'url(/images/hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 装饰性几何图形 */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-[oklch(0.65_0.25_330)] rotate-45 animate-spin-slow opacity-10" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-20 right-10 w-12 h-12 rounded-full bg-[oklch(0.75_0.20_180)] animate-bounce opacity-10" style={{ animationDuration: '3s' }} />

      {/* 主菜单 - 显示排行榜 */}
      {!gameStarted && !showLeaderboard && (
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-black mb-3 memphis-border inline-block px-10 py-5 bg-white memphis-shadow transform -rotate-2" style={{ fontFamily: 'var(--font-poppins)' }}>
              记忆翻牌
            </h1>
            <p className="text-xl md:text-2xl mt-6 font-bold text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
              找到所有配对的卡牌！
            </p>
          </div>

          {/* 排行榜显示 */}
          {scores.length > 0 && (
            <div className="mb-8 max-w-md mx-auto">
              <Card className="p-6 memphis-border bg-white">
                <h2 className="text-2xl font-black mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>🏆 排行榜</h2>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {scores.map((score, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 memphis-border">
                      <span className="font-bold">#{index + 1}</span>
                      <span className="font-bold">{score.playerName}</span>
                      <span className="text-lg font-black" style={{ color: 'oklch(0.65 0.25 330)' }}>
                        {formatTime(score.time)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={clearLeaderboard}
                  variant="outline"
                  size="sm"
                  className="w-full memphis-border text-xs"
                >
                  清除排行榜
                </Button>
              </Card>
            </div>
          )}

          <Button
            onClick={initGame}
            size="lg"
            className="text-2xl px-14 py-6 memphis-border memphis-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-[oklch(0.65_0.25_330)] text-white font-black rounded-none"
            style={{ fontFamily: 'var(--font-poppins)', letterSpacing: '0.05em' }}
          >
            开始游戏
          </Button>
        </div>
      )}

      {/* 排行榜详情页 */}
      {showLeaderboard && !gameStarted && (
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-6 memphis-border inline-block px-8 py-4 bg-white memphis-shadow" style={{ fontFamily: 'var(--font-poppins)' }}>
            🏆 排行榜
          </h1>

          <Card className="p-8 memphis-border bg-white mb-6">
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {scores.map((score, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 memphis-border text-lg">
                  <span className="font-black text-2xl w-12">{index + 1}</span>
                  <span className="font-bold flex-1 text-left">{score.playerName}</span>
                  <span className="text-2xl font-black" style={{ color: 'oklch(0.65 0.25 330)' }}>
                    {formatTime(score.time)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setShowLeaderboard(false)}
              size="lg"
              className="text-lg px-12 py-5 memphis-border memphis-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-[oklch(0.75_0.20_180)] text-white font-black rounded-none"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              返回主菜单
            </Button>
            <Button
              onClick={initGame}
              size="lg"
              className="text-lg px-12 py-5 memphis-border memphis-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-[oklch(0.65_0.25_330)] text-white font-black rounded-none"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              再来一局
            </Button>
          </div>
        </div>
      )}

      {/* 游戏进行中 */}
      {gameStarted && !gameEnded && (
        <>
          {/* 游戏信息栏 */}
          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            <Card className="px-8 py-4 memphis-border bg-white">
              <div className="text-center">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">步数</div>
                <div className="text-3xl font-black mt-2" style={{ fontFamily: 'var(--font-space)' }}>{moves}</div>
              </div>
            </Card>
            <Card className="px-8 py-4 memphis-border bg-white">
              <div className="text-center">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">配对</div>
                <div className="text-3xl font-black mt-2" style={{ fontFamily: 'var(--font-space)' }}>{matches}/{cardSymbols.length}</div>
              </div>
            </Card>
            <Card className="px-8 py-4 memphis-border bg-white">
              <div className="text-center">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">用时</div>
                <div className="text-3xl font-black mt-2" style={{ fontFamily: 'var(--font-space)' }}>{formatTime(elapsedTime)}</div>
              </div>
            </Card>
          </div>

          {/* 卡牌网格 */}
          <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-md mx-auto mb-6">
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  aspect-square cursor-pointer memphis-border
                  transition-all duration-200
                  ${!card.isFlipped && !card.isMatched ? 'hover:-translate-y-1 active:translate-y-0 bg-white' : card.color}
                  ${card.isMatched ? 'animate-explode' : ''}
                `}
                style={{
                  transform: `rotate(${(index % 3 - 1) * 2}deg)`,
                  backgroundImage: card.isFlipped || card.isMatched ? 'none' : 'url(/images/card-back-pattern.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <span 
                  className="drop-shadow-lg" 
                  style={{ 
                    fontFamily: 'var(--font-fredoka)',
                    fontSize: '3.5rem',
                    lineHeight: '1',
                    height: '3.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.isFlipped || card.isMatched ? card.symbol : '?'}
                </span>
              </div>
            ))}
          </div>

          {/* 重新开始按钮 */}
          <Button
            onClick={initGame}
            size="lg"
            className="text-lg px-12 py-5 memphis-border memphis-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-[oklch(0.85_0.25_90)] text-white font-black rounded-none"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            重新开始
          </Button>
        </>
      )}

      {/* 游戏结束 - 输入玩家名字 */}
      {gameEnded && (
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-5xl md:text-6xl font-black mb-6 memphis-border inline-block px-8 py-4 bg-white memphis-shadow" style={{ fontFamily: 'var(--font-poppins)' }}>
            🎉 通关！
          </h1>

          <Card className="p-8 memphis-border bg-white mb-6">
            <div className="text-4xl font-black mb-6" style={{ color: 'oklch(0.65 0.25 330)' }}>
              {formatTime(elapsedTime)}
            </div>
            <p className="text-lg font-bold mb-6 text-gray-800">请输入您的名字保存成绩：</p>
            <Input
              type="text"
              placeholder="输入名字"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitScore()}
              className="mb-4 memphis-border text-lg py-6 font-bold"
              autoFocus
            />
            <Button
              onClick={submitScore}
              size="lg"
              className="w-full text-lg py-6 memphis-border memphis-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all bg-[oklch(0.65_0.25_330)] text-white font-black rounded-none"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              保存成绩
            </Button>
          </Card>

          <Button
            onClick={() => setShowLeaderboard(true)}
            variant="outline"
            size="lg"
            className="w-full memphis-border font-bold"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            查看排行榜
          </Button>
        </div>
      )}
    </div>
  );
}
