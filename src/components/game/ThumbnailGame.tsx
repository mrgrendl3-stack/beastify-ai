import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameVideo, fetchVideoPair, formatTimeAgo, formatDuration } from '../../services/youtubeGameService';
import { XIcon, HeartIcon, FlameIcon, CoinsIcon, TrophyIcon, ArrowRightIcon, ZapIcon, EyeIcon } from 'lucide-react';
import { AnimatedScore } from '../AnimatedScore';

type GameState = 'HOME' | 'LOADING' | 'PLAYING' | 'RESULT' | 'GAMEOVER';

interface ThumbnailGameProps {
  onClose: () => void;
}

const CATEGORIES = ['MrBeast style', 'Gaming', 'Football', 'TikTok / Drama', 'Random'];

export default function ThumbnailGame({ onClose }: ThumbnailGameProps) {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [category, setCategory] = useState<string>('Random');
  
  // Player Stats
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('beastify_game_best') || '0', 10));
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('beastify_game_coins') || '0', 10));
  
  // Round State
  const [videoA, setVideoA] = useState<GameVideo | null>(null);
  const [videoB, setVideoB] = useState<GameVideo | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [timer, setTimer] = useState(15);
  const [error, setError] = useState<string | null>(null);
  
  // Power-ups
  const [hintActive, setHintActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    localStorage.setItem('beastify_game_best', bestScore.toString());
  }, [bestScore]);

  useEffect(() => {
    localStorage.setItem('beastify_game_coins', coins.toString());
  }, [coins]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameState('LOADING');
    loadNextRound();
  };

  const loadNextRound = async () => {
    setGameState('LOADING');
    setSelectedVideoId(null);
    setHintActive(false);
    setError(null);
    try {
      const [vA, vB] = await fetchVideoPair(category);
      setVideoA(vA);
      setVideoB(vB);
      setTimer(15);
      setGameState('PLAYING');
    } catch (err) {
      console.error(err);
      setError('Failed to load videos. Please try again.');
      setGameState('GAMEOVER'); // Or a specific error state
    }
  };

  const handleTimeUp = useCallback(() => {
    // Treat as wrong answer
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    setSelectedVideoId('timeout');
    setGameState('RESULT');

    if (newLives <= 0) {
      setTimeout(() => {
        setGameState('GAMEOVER');
      }, 2500);
    }
  }, [lives]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, handleTimeUp]);

  const [riskMode, setRiskMode] = useState(false);

  const handleSelection = (videoId: string) => {
    if (gameState !== 'PLAYING') return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedVideoId(videoId);
    
    const isCorrect = 
      (videoId === videoA?.id && videoA.viewCount >= videoB!.viewCount) ||
      (videoId === videoB?.id && videoB.viewCount >= videoA!.viewCount);

    let newLives = lives;

    if (isCorrect) {
      // Calculate points
      let points = 1;
      let newStreak = streak + 1;
      
      if (newStreak >= 10) points *= 5;
      else if (newStreak >= 5) points *= 3;
      else if (newStreak >= 3) points *= 2;
      
      // Speed bonus
      if (timer >= 10) points += 2;
      else if (timer >= 5) points += 1;

      if (riskMode) points *= 2;

      setScore((prev) => {
        const newScore = prev + points;
        if (newScore > bestScore) setBestScore(newScore);
        return newScore;
      });
      setStreak(newStreak);
      setCoins((prev) => prev + (riskMode ? 20 : 10)); // More coins for risk
    } else {
      newLives = lives - (riskMode ? 2 : 1);
      setLives(newLives);
      setStreak(0);
    }

    setGameState('RESULT');

    if (newLives <= 0) {
      setTimeout(() => {
        setGameState('GAMEOVER');
      }, 2500);
    } else {
      setTimeout(() => {
        loadNextRound();
      }, 3000);
    }
  };

  const handleNextRound = () => {
    if (lives <= 0) {
      setGameState('GAMEOVER');
    } else {
      loadNextRound();
    }
  };

  const useHint = () => {
    if (coins >= 50 && !hintActive && gameState === 'PLAYING') {
      setCoins(prev => prev - 50);
      setHintActive(true);
    }
  };

  const toggleRiskMode = () => {
    if (gameState === 'PLAYING') {
      setRiskMode(!riskMode);
    }
  };

  const formatViews = (views: number) => {
    return new Intl.NumberFormat('en-US').format(views);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
          Which Thumbnail <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gets More Views?</span>
        </h1>
        <p className="text-gray-400 text-lg">Test your CTR instincts.</p>
      </div>

      <div className="flex items-center gap-6 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
        <div className="flex flex-col items-center">
          <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Best Score</span>
          <span className="text-3xl font-black text-white flex items-center gap-2">
            {bestScore} <TrophyIcon className="w-6 h-6 text-yellow-500" />
          </span>
        </div>
        <div className="w-px h-12 bg-gray-800"></div>
        <div className="flex flex-col items-center">
          <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Coins</span>
          <span className="text-3xl font-black text-white flex items-center gap-2">
            {coins} <CoinsIcon className="w-6 h-6 text-yellow-400" />
          </span>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-left">Select Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`p-3 rounded-xl font-bold text-sm transition-all ${category === cat ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={startGame}
        className="w-full max-w-md py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-2xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all active:scale-95"
      >
        START GAME
      </button>
    </div>
  );

  const renderVideoCard = (video: GameVideo | null, isA: boolean) => {
    if (!video) return null;
    
    const isSelected = selectedVideoId === video.id;
    const isResult = gameState === 'RESULT';
    const isWinner = isResult && video.viewCount >= (isA ? videoB!.viewCount : videoA!.viewCount);
    const isLoser = isResult && !isWinner;
    
    let cardClass = "relative w-full rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer border-4 flex flex-col ";
    
    if (!isResult) {
      cardClass += "border-transparent hover:border-cyan-500 hover:scale-[1.02] bg-gray-900";
    } else {
      cardClass += "cursor-default bg-gray-900 ";
      if (isWinner) {
          cardClass += "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] ";
      } else {
          cardClass += isSelected ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] " : "border-gray-800 opacity-50 grayscale-[50%] ";
      }
    }

    // Hint Logic: Show approximate range
    const getHintRange = (views: number) => {
      const magnitude = Math.pow(10, Math.floor(Math.log10(views)));
      const lowerBound = Math.max(0, Math.floor(views / magnitude) * magnitude - magnitude);
      const upperBound = Math.ceil(views / magnitude) * magnitude + magnitude;
      
      const format = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
      };
      
      return `${format(lowerBound)} - ${format(upperBound)}`;
    };

    return (
      <div 
        className={cardClass}
        onClick={() => handleSelection(video.id)}
      >
        <div className="aspect-video w-full relative">
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
          
          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-bold">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Hint Display */}
          {hintActive && !isResult && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/50 flex items-center gap-2 animate-fade-in">
              <EyeIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-sm">{getHintRange(video.viewCount)}</span>
            </div>
          )}
        </div>

        {/* Title & Time */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <h3 className="text-white font-bold text-lg md:text-xl line-clamp-2 leading-tight mb-2">{video.title}</h3>
          <p className="text-gray-400 text-sm font-medium">{formatTimeAgo(video.publishedAt)} • {video.channelTitle}</p>
        </div>

        {/* Views Reveal */}
        {isResult && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm ${isWinner ? 'bg-green-900/80' : isSelected ? 'bg-red-900/80' : 'bg-black/60'} animate-fade-in`}>
            <span className="text-sm font-black uppercase tracking-widest text-white/80 mb-2">Total Views</span>
            <span className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
              {formatViews(video.viewCount)}
            </span>
            {isSelected && !isWinner && (
                <span className="mt-4 text-red-400 font-bold text-xl uppercase tracking-widest animate-bounce">Incorrect</span>
            )}
            {isSelected && isWinner && (
                <span className="mt-4 text-green-400 font-bold text-xl uppercase tracking-widest animate-bounce">Correct!</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPlayingOrResult = () => (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-8 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Score</span>
            <span className="text-2xl font-black text-white">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Streak</span>
            <span className="text-2xl font-black text-orange-500 flex items-center gap-1">
              {streak} <FlameIcon className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Timer */}
        {gameState === 'PLAYING' && (
          <div className={`text-4xl font-black ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timer}
          </div>
        )}

        {/* Lives */}
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <HeartIcon key={i} className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          ))}
        </div>
      </div>

      {/* VS Area */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 relative">
        <div className="w-full md:w-1/2">
          {renderVideoCard(videoA, true)}
        </div>
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-gray-900 border-4 border-gray-800 rounded-full flex items-center justify-center shadow-2xl">
          <span className="text-xl font-black text-white">VS</span>
        </div>

        <div className="w-full md:w-1/2">
          {renderVideoCard(videoB, false)}
        </div>
      </div>

      {/* Power-ups & Risk Mode */}
      {gameState === 'PLAYING' && (
        <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in">
          <button
            onClick={useHint}
            disabled={coins < 50 || hintActive}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${hintActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'}`}
          >
            <span className="text-xl">👁️</span> Hint (50 <CoinsIcon className="w-4 h-4 inline" />)
          </button>
          <button
            onClick={toggleRiskMode}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${riskMode ? 'bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800'}`}
          >
            <span className="text-xl">😈</span> Double or Nothing
          </button>
        </div>
      )}

      {/* Next Round Button removed for auto-advance */}
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in p-6 text-center">
      <div className="space-y-4">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <HeartIcon className="w-12 h-12 text-red-500 fill-red-500" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-red-500 tracking-tighter uppercase">
          Game Over
        </h1>
        {error && <p className="text-gray-400">{error}</p>}
      </div>

      <div className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase tracking-widest">Final Score</span>
          <span className="text-4xl font-black text-white">{score}</span>
        </div>
        <div className="w-full h-px bg-gray-800"></div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase tracking-widest">Best Score</span>
          <span className="text-2xl font-black text-yellow-500 flex items-center gap-2">
            {bestScore} <TrophyIcon className="w-5 h-5" />
          </span>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button
          onClick={startGame}
          className="flex-1 py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-gray-200 transition-all active:scale-95"
        >
          Play Again
        </button>
        <button
          onClick={() => setGameState('HOME')}
          className="flex-1 py-4 bg-gray-800 text-white font-black text-lg rounded-xl hover:bg-gray-700 transition-all active:scale-95"
        >
          Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800/50 bg-black/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <ZapIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-white text-xl tracking-tight">Beastify<span className="text-cyan-400">Game</span></span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors"
        >
          <XIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {gameState === 'HOME' && renderHome()}
        {gameState === 'LOADING' && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Finding Matchup...</p>
          </div>
        )}
        {(gameState === 'PLAYING' || gameState === 'RESULT') && renderPlayingOrResult()}
        {gameState === 'GAMEOVER' && renderGameOver()}
      </div>
    </div>
  );
}
