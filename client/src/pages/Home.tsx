/*
  孟菲斯后现代波普风格 - 记忆翻牌游戏
  设计特点：
  - 高饱和度色彩碰撞（品红、青绿、亮黄、橙红、紫罗兰）
  - 粗黑边框与多色偏移阴影
  - 夸张的弹性动画和交互效果
  - 不规则几何布局
*/

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function Home() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [flipAnimations, setFlipAnimations] = useState<Set<number>>(new Set());

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
    setStartTime(Date.now());
    setElapsedTime(0);
    setFlipAnimations(new Set());
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

    // 添加翻转动画
    setFlipAnimations(prev => new Set(Array.from(prev).concat([id])));

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
          setFlipAnimations(new Set());
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
          setFlipAnimations(new Set());
        }, 1000);
      }
    }
  };

  // 游戏胜利检测
  useEffect(() => {
    if (matches === cardSymbols.length && gameStarted) {
      setTimeout(() => {
        toast.success(`🎉 恭喜通关！用时 ${elapsedTime} 秒，共 ${moves} 步！`, {
          duration: 5000,
        });
      }, 500);
    }
  }, [matches, gameStarted, elapsedTime, moves]);

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
      {/* 装饰性几何图形 - 减少以避免与背景冲突 */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-[oklch(0.65_0.25_330)] rotate-45 animate-spin-slow opacity-10" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-20 right-10 w-12 h-12 rounded-full bg-[oklch(0.75_0.20_180)] animate-bounce opacity-10" style={{ animationDuration: '3s' }} />

      {/* 游戏标题 */}
      <div className="text-center mb-8 relative">
        <div className="inline-block relative">
          <h1 
            className="text-6xl md:text-8xl font-black mb-2 text-transparent bg-clip-text" 
            style={{
              fontFamily: "'Playfair Display', serif",
              backgroundImage: 'linear-gradient(135deg, oklch(0.65_0.25_330) 0%, oklch(0.75_0.20_180) 50%, oklch(0.85_0.25_90) 100%)',
              letterSpacing: '-0.02em',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(4px 4px 0px oklch(0.65_0.25_330)) drop-shadow(8px 8px 0px rgba(0,0,0,0.1))'
            }}
          >
            记忆翻牌
          </h1>
          <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.65_0.25_330)] via-[oklch(0.75_0.20_180)] to-[oklch(0.85_0.25_90)]" />
        </div>
        <p className="text-lg md:text-xl mt-8 font-medium" style={{ fontFamily: 'var(--font-poppins)' }}>
          找到所有配对的卡牌！
        </p>
      </div>

      {/* 游戏开始前 */}
      {!gameStarted && (
        <div>
          <button
            onClick={initGame}
            className="relative text-2xl px-16 py-6 font-black text-white overflow-hidden group transition-all duration-200"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.65_0.25_330)] via-[oklch(0.75_0.20_180)] to-[oklch(0.65_0.25_330)] group-hover:via-[oklch(0.85_0.25_90)] transition-all duration-300" />
            {/* 粗黑边框 */}
            <div className="absolute inset-0 border-4 border-black" />
            {/* 阴影效果 */}
            <div className="absolute top-1 left-1 right-0 bottom-0 border-4 border-black opacity-20" />
            {/* 文字 */}
            <span className="relative z-10 block group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-100">开始游戏</span>
          </button>
        </div>
      )}

      {/* 游戏进行中 */}
      {gameStarted && (
        <>
          {/* 游戏信息栏 */}
          <div className="flex gap-4 mb-6 flex-wrap justify-center">
            <Card className="px-6 py-3 memphis-border bg-white">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">步数</div>
                <div className="text-2xl font-black" style={{ fontFamily: 'var(--font-space)' }}>{moves}</div>
              </div>
            </Card>
            <Card className="px-6 py-3 memphis-border bg-white">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">配对</div>
                <div className="text-2xl font-black" style={{ fontFamily: 'var(--font-space)' }}>{matches}/{cardSymbols.length}</div>
              </div>
            </Card>
            <Card className="px-6 py-3 memphis-border bg-white">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">用时</div>
                <div className="text-2xl font-black" style={{ fontFamily: 'var(--font-space)' }}>{formatTime(elapsedTime)}</div>
              </div>
            </Card>
          </div>

          {/* 卡牌网格 */}
          <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-md mx-auto mb-6" style={{ perspective: '1000px' }}>
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`
                  aspect-square cursor-pointer memphis-border
                  transition-all duration-200
                  ${!card.isFlipped && !card.isMatched ? 'hover:-translate-y-1 active:translate-y-0 bg-white' : card.color}
                  ${card.isMatched ? 'animate-explode' : ''}
                  ${flipAnimations.has(card.id) ? 'animate-card-flip' : ''}
                `}
                style={{
                  transform: `rotate(${(index % 3 - 1) * 2}deg)`,
                  backgroundImage: card.isFlipped || card.isMatched ? 'none' : 'url(/images/card-back-pattern.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transformStyle: 'preserve-3d'
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
          <button
            onClick={initGame}
            className="relative px-12 py-4 font-black text-white overflow-hidden group transition-all duration-200"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            {/* 背景渐变 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.85_0.25_90)] via-[oklch(0.65_0.25_330)] to-[oklch(0.75_0.20_180)] group-hover:via-[oklch(0.75_0.20_180)] transition-all duration-300" />
            {/* 粗黑边框 */}
            <div className="absolute inset-0 border-3 border-black" />
            {/* 阴影效果 */}
            <div className="absolute top-1 left-1 right-0 bottom-0 border-3 border-black opacity-20" />
            {/* 文字 */}
            <span className="relative z-10 block group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-100">重新开始</span>
          </button>
        </>
      )}
    </div>
  );
}
