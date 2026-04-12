import React, { useState, useEffect } from 'react';

interface AnimatedScoreProps {
  targetScore: number;
  className?: string;
  onColorChange?: (color: string) => void;
  variant?: 'text' | 'circular';
  size?: number;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ targetScore, className, onColorChange, variant = 'text', size = 160 }) => {
  const [currentScore, setCurrentScore] = useState(1);
  const [prevTarget, setPrevTarget] = useState(targetScore);

  if (targetScore !== prevTarget) {
    setCurrentScore(1);
    setPrevTarget(targetScore);
  }

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const updateScore = (time: number) => {
      const deltaTime = time - lastTime;
      
      setCurrentScore(prev => {
        if (prev >= targetScore) return targetScore;

        // Calculate speed based on distance to target
        const distance = targetScore - prev;
        let delay = 15; // fast speed (ms per tick)
        
        // Slow down as it gets closer (last 10 points)
        if (distance <= 10) {
          delay = 50 + (10 - distance) * 30; // progressively slower
        }

        if (deltaTime >= delay) {
          lastTime = time;
          return prev + 1;
        }
        return prev;
      });

      animationFrame = requestAnimationFrame(updateScore);
    };

    animationFrame = requestAnimationFrame(updateScore);

    return () => cancelAnimationFrame(animationFrame);
  }, [targetScore]);

  // Color logic: change every 10%
  const getColorClass = (score: number) => {
    if (score < 10) return 'text-red-600';
    if (score < 20) return 'text-red-500';
    if (score < 30) return 'text-orange-500';
    if (score < 40) return 'text-orange-400';
    if (score < 50) return 'text-yellow-500';
    if (score < 60) return 'text-yellow-400';
    if (score < 70) return 'text-lime-400';
    if (score < 80) return 'text-green-400';
    if (score < 90) return 'text-emerald-400';
    return 'text-cyan-400';
  };

  const getStrokeColor = (score: number) => {
    if (score < 10) return '#dc2626';
    if (score < 20) return '#ef4444';
    if (score < 30) return '#f97316';
    if (score < 40) return '#fb923c';
    if (score < 50) return '#eab308';
    if (score < 60) return '#facc15';
    if (score < 70) return '#a3e635';
    if (score < 80) return '#4ade80';
    if (score < 90) return '#34d399';
    return '#22d3ee';
  };

  const colorClass = getColorClass(currentScore);
  
  useEffect(() => {
    if (onColorChange) onColorChange(colorClass);
  }, [colorClass, onColorChange]);

  if (variant === 'circular') {
    const strokeWidth = size * 0.08;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (currentScore / 100) * circumference;

    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor(currentScore)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${colorClass}`}>{currentScore}%</span>
        </div>
      </div>
    );
  }

  return <span className={`${className} ${colorClass}`}>{currentScore}</span>;
};
