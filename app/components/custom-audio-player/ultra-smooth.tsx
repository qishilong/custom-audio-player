"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download } from "lucide-react";
import { Button } from '@/app/components/ui/button';

interface SymmetricWaveBarProps {
  height: number;
  isActive: boolean;
  isPassed: boolean;
  isPlaying: boolean;
  barIndex: number;
  animationPhase: number;
  exactProgress: number; // 新增：精确的播放进度
  totalBars: number; // 新增：总柱子数量
}

// 对称波形条组件 - 使用CSS变量实现平滑动画
const SymmetricWaveBar: React.FC<SymmetricWaveBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  barIndex,
  animationPhase,
  exactProgress,
  totalBars
}) => {
  // 计算当前柱子的播放状态
  const barProgress = exactProgress - barIndex;
  const isPartiallyPassed = barProgress > 0 && barProgress < 1;
  const partialOpacity = isPartiallyPassed ? barProgress : 1;

  // 基于播放状态的动画高度调制
  const getAnimatedHeight = useCallback(() => {
    if (!isPlaying) return height;

    // 为播放中的音频添加轻微的波动效果
    const waveOffset = Math.sin(animationPhase + barIndex * 0.2) * 2;
    const breathingEffect = isPassed ? Math.sin(animationPhase * 0.5) * 1.5 : 0;

    return Math.max(10, height + waveOffset + breathingEffect);
  }, [height, isPlaying, animationPhase, barIndex, isPassed]);

  const animatedHeight = getAnimatedHeight();

  // 动态颜色计算
  const getBarColor = useCallback(() => {
    if (isPassed) {
      return "bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300";
    } else if (isPartiallyPassed) {
      return "bg-gradient-to-t from-cyan-500 via-cyan-400 to-cyan-300";
    } else {
      return "bg-gradient-to-t from-white/30 via-white/20 to-white/10";
    }
  }, [isPassed, isPartiallyPassed]);

  return (
    <div className="flex flex-col items-center justify-center h-full relative group">
      {/* 上半部分波形条 */}
      <div
        className={cn(
          "w-1.5 rounded-t-full origin-bottom transition-colors duration-100 ease-out",
          getBarColor(),
          isActive && "shadow-lg shadow-cyan-400/30",
        )}
        style={{
          height: `${animatedHeight}%`,
          maxHeight: "48px",
          minHeight: "6px",
          transition: 'height 0.1s ease-out, transform 0.1s ease-out',
          opacity: isPassed ? 1 : (isPartiallyPassed ? partialOpacity : 0.3),
        }}
      />

      {/* 中心连接点 */}
      <div className={cn(
        "w-2 h-1 transition-all duration-100 ease-out",
        isPassed || isPartiallyPassed ? "bg-cyan-400/80" : "bg-white/40",
        isActive && "bg-cyan-300"
      )}
        style={{
          opacity: isPassed ? 1 : (isPartiallyPassed ? partialOpacity : 0.4),
        }}
      />

      {/* 下半部分波形条 */}
      <div
        className={cn(
          "w-1.5 rounded-b-full origin-top transition-colors duration-100 ease-out",
          getBarColor(),
          isActive && "shadow-lg shadow-cyan-400/30",
        )}
        style={{
          height: `${animatedHeight}%`,
          maxHeight: "48px",
          minHeight: "6px",
          transition: 'height 0.1s ease-out, transform 0.1s ease-out',
          opacity: isPassed ? 1 : (isPartiallyPassed ? partialOpacity : 0.3),
        }}
      />

      {/* 当前播放位置的微光效果 */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="w-full h-full bg-cyan-400/10 rounded-full"
            style={{
              animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};

interface UltraSmoothAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const UltraSmoothAudioPlayer: React.FC<UltraSmoothAudioPlayerProps> = ({
  src,
  className,
  autoPlay = false,
  loop = false,
  showDownload = true,
  onTimeUpdate,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  // 生成对称波形数据 - 更自然的频谱分布
  const waveformData = useMemo(() => {
    const bars = 60;
    return Array.from({ length: bars }, (_, i) => {
      // 模拟音频频谱：低频能量较高，高频能量递减
      const lowFreq = Math.sin(i * 0.05) * 25;  // 低频基础
      const midFreq = Math.sin(i * 0.15) * 15;  // 中频谐波
      const highFreq = Math.sin(i * 0.4) * 8;   // 高频细节
      const randomVariation = (Math.random() - 0.5) * 10;

      // 创建更真实的音频频谱形状
      const frequencyResponse = Math.exp(-i * 0.02) * 20; // 自然衰减
      const baseHeight = 25 + lowFreq + midFreq + highFreq + randomVariation + frequencyResponse;

      return {
        id: i,
        height: Math.max(12, Math.min(80, baseHeight)),
      };
    });
  }, []);

  // 播放控制
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  // 波形点击跳转
  const handleWaveformClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformRef.current || duration === 0) return;

    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // 进度条点击跳转
  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // 下载功能
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audio_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [src]);

  // 时间格式化
  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 计算播放位置
  const getPlaybackPosition = useCallback(() => {
    if (duration === 0) return { activeIndex: -1, progress: 0, exactProgress: 0 };
    const progress = currentTime / duration;
    // 使用更精确的计算方法，避免 Math.floor 导致的滞后
    const exactProgress = progress * waveformData.length;
    const activeIndex = Math.round(exactProgress); // 使用 round 而不是 floor，更精确
    return { activeIndex, progress, exactProgress };
  }, [currentTime, duration, waveformData.length]);

  // 平滑滚动
  const updateScroll = useCallback(() => {
    if (!waveformRef.current || !containerRef.current || duration === 0) return;

    const { progress } = getPlaybackPosition();
    const container = containerRef.current;
    const waveform = waveformRef.current;

    const containerWidth = container.clientWidth;
    const waveformWidth = waveform.scrollWidth;
    const maxScroll = waveformWidth - containerWidth;

    if (maxScroll > 0) {
      const centerOffset = containerWidth / 2;
      const targetScroll = (progress * waveformWidth) - centerOffset;
      const clampedScroll = Math.max(0, Math.min(maxScroll, targetScroll));

      container.scrollTo({
        left: clampedScroll,
        behavior: 'smooth'
      });
    }
  }, [getPlaybackPosition, duration]);

  // 平滑动画循环
  const animate = useCallback((timestamp: number) => {
    if (isPlaying) {
      // 计算时间差来创建平滑的动画
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 更新动画相位
      setAnimationPhase(prev => prev + deltaTime * 0.002);

      // 继续动画循环
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying]);

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, audio.duration);
      updateScroll();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (!loop) {
        setCurrentTime(0);
      }
      onEnded?.();
    };

    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      console.error('Audio loading error');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, onEnded, updateScroll, loop]);

  // 动画控制
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, animate]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  const { activeIndex, progress, exactProgress } = getPlaybackPosition();

  return (
    <div className={cn(
      "w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl p-6 shadow-2xl border border-gray-800/50",
      className
    )}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 标题和状态 */}
      <div className="text-center mb-6">
        <div className="mb-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-8 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-1.5 h-10 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
          ) : !isPlaying && currentTime === 0 ? (
            <span className="text-cyan-400 text-xl font-light tracking-widest">未播放</span>
          ) : isPlaying ? (
            <span className="text-cyan-400 text-xl font-light tracking-widest">播放</span>
          ) : (
            <span className="text-white/80 text-xl font-light tracking-widest">暂停</span>
          )}
        </div>
        {!isLoading && (
          <div className="text-white/40 text-xs tracking-wider">
            点击波形跳转到任意位置
          </div>
        )}
      </div>

      {/* 对称波形显示区域 */}
      <div
        ref={containerRef}
        className="relative mb-6 overflow-x-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          ref={waveformRef}
          className="flex items-center justify-start gap-2 h-32 cursor-pointer px-8 relative"
          onClick={handleWaveformClick}
          style={{
            minHeight: "128px",
            width: `${waveformData.length * 16}px`
          }}
        >
          {waveformData.map((bar, index) => (
            <div
              key={bar.id}
              className="h-full flex items-center"
              style={{ width: "12px" }}
            >
              <SymmetricWaveBar
                height={bar.height}
                isActive={index === activeIndex}
                isPassed={index < activeIndex}
                isPlaying={isPlaying}
                barIndex={index}
                animationPhase={animationPhase}
                exactProgress={exactProgress}
                totalBars={waveformData.length}
              />
            </div>
          ))}

          {/* 播放位置指示线 */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-300 shadow-lg shadow-cyan-400/50 pointer-events-none"
              style={{
                left: `${32 + (progress * (waveformData.length * 16))}px`,
                transform: 'translateX(-50%)',
                transition: 'left 0.1s ease-out'
              }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div
          className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:bg-white/20 transition-colors duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 rounded-full transition-all duration-150 ease-out pointer-events-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-12 h-12 text-white hover:bg-white/10 transition-all duration-300 rounded-full border border-white/20 hover:border-cyan-400/50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-white font-mono text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
              {formatTime(currentTime)}
            </div>
            <div className="text-white/50 text-sm">/</div>
            <div className="text-white/70 font-mono text-sm bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm">
              {formatTime(duration)}
            </div>
          </div>
        </div>

        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-lg"
            disabled={!src || isLoading}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UltraSmoothAudioPlayer;
