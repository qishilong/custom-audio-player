"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface SymmetricWaveBarProps {
  height: number;
  isActive: boolean;
  isPassed: boolean;
  isPlaying: boolean;
  barIndex: number;
  totalBars: number;
}

// 对称波形条组件
const SymmetricWaveBar: React.FC<SymmetricWaveBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  barIndex,
  totalBars
}) => {
  // 计算动画延迟，创建波浪传播效果
  const animationDelay = isPlaying ? (barIndex * 50) : 0;

  // 动态高度变化，播放时有轻微的呼吸效果
  const dynamicHeight = isPlaying && isActive
    ? height + Math.sin(Date.now() * 0.01 + barIndex * 0.5) * 3
    : height;

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      {/* 上半部分波形条 */}
      <div
        className={cn(
          "w-1.5 rounded-t-full transition-all duration-500 ease-out origin-bottom",
          isPassed
            ? "bg-gradient-to-t from-cyan-500 to-cyan-300"
            : "bg-gradient-to-t from-white/20 to-white/10",
          isActive && "bg-gradient-to-t from-cyan-400 to-cyan-200",
        )}
        style={{
          height: `${dynamicHeight}%`,
          maxHeight: "40px",
          minHeight: "4px",
          transform: isPlaying && isPassed
            ? `scaleY(${1 + Math.sin(Date.now() * 0.008 + barIndex * 0.3) * 0.1})`
            : 'scaleY(1)',
          transitionDelay: `${animationDelay}ms`,
        }}
      />

      {/* 中心分割线 */}
      <div className={cn(
        "w-1.5 h-0.5 transition-all duration-300",
        isPassed ? "bg-cyan-400" : "bg-white/30"
      )} />

      {/* 下半部分波形条 */}
      <div
        className={cn(
          "w-1.5 rounded-b-full transition-all duration-500 ease-out origin-top",
          isPassed
            ? "bg-gradient-to-b from-cyan-500 to-cyan-300"
            : "bg-gradient-to-b from-white/20 to-white/10",
          isActive && "bg-gradient-to-b from-cyan-400 to-cyan-200",
        )}
        style={{
          height: `${dynamicHeight}%`,
          maxHeight: "40px",
          minHeight: "4px",
          transform: isPlaying && isPassed
            ? `scaleY(${1 + Math.sin(Date.now() * 0.008 + barIndex * 0.3) * 0.1})`
            : 'scaleY(1)',
          transitionDelay: `${animationDelay}ms`,
        }}
      />

      {/* 活跃指示器 - 只在当前播放位置显示 */}
      {isActive && isPlaying && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <div className="w-full h-full bg-cyan-400/20 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

interface SmoothAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const SmoothAudioPlayer: React.FC<SmoothAudioPlayerProps> = ({
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 生成更自然的对称波形数据
  const waveformData = useMemo(() => {
    const bars = 80;
    return Array.from({ length: bars }, (_, i) => {
      // 创建多层次的波形，模拟真实音频频谱
      const lowFreq = Math.sin(i * 0.1) * 20;
      const midFreq = Math.sin(i * 0.3) * 15;
      const highFreq = Math.sin(i * 0.8) * 10;
      const noise = (Math.random() - 0.5) * 10;

      // 基础高度加上频率变化
      const baseHeight = 30 + lowFreq + midFreq + highFreq + noise;

      return {
        id: i,
        height: Math.max(15, Math.min(85, baseHeight)),
      };
    });
  }, []);

  // 播放/暂停切换
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  // 点击波形跳转
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

  // 下载音频
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

  // 格式化时间显示
  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 计算当前播放位置
  const getPlaybackPosition = useCallback(() => {
    if (duration === 0) return { activeIndex: -1, progress: 0, exactProgress: 0 };
    const progress = currentTime / duration;
    const exactProgress = progress * waveformData.length;
    // 使用 round 而不是 floor，减少滞后
    const activeIndex = Math.round(exactProgress);
    return { activeIndex, progress, exactProgress };
  }, [currentTime, duration, waveformData.length]);

  // 平滑滚动效果
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
  }, [duration, getPlaybackPosition]);

  // 连续动画更新
  const updateAnimation = useCallback(() => {
    if (isPlaying) {
      // 强制重新渲染以实现平滑动画
      const bars = waveformRef.current?.querySelectorAll('[data-bar]');
      if (bars) {
        bars.forEach((bar, index) => {
          const element = bar as HTMLElement;
          const time = Date.now() * 0.001;
          const wave = Math.sin(time * 2 + index * 0.3) * 0.05 + 1;
          element.style.transform = `scaleY(${wave})`;
        });
      }
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
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

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

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
      updateAnimation();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateAnimation]);

  // 自动播放处理
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  const { activeIndex, progress } = getPlaybackPosition();

  return (
    <div className={cn(
      "w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl p-6 shadow-2xl border border-gray-800",
      className
    )}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 状态指示器 */}
      <div className="text-center mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="text-white/60 text-sm ml-2">加载中...</span>
          </div>
        ) : !isPlaying && currentTime === 0 ? (
          <span className="text-cyan-400 text-xl font-medium tracking-wider">未播放</span>
        ) : isPlaying ? (
          <span className="text-cyan-400 text-xl font-medium tracking-wider">播放</span>
        ) : (
          <span className="text-white/80 text-xl font-medium tracking-wider">暂停</span>
        )}
      </div>

      {/* 对称波形显示区域 */}
      <div
        ref={containerRef}
        className="relative mb-6 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          ref={waveformRef}
          className="flex items-center justify-start gap-1 h-32 cursor-pointer px-8 relative"
          onClick={handleWaveformClick}
          style={{
            minHeight: "128px",
            width: `${waveformData.length * 12}px`
          }}
        >
          {waveformData.map((bar, index) => (
            <div
              key={bar.id}
              data-bar={index}
              className="h-full flex items-center"
              style={{ width: "12px" }}
            >
              <SymmetricWaveBar
                height={bar.height}
                isActive={index === activeIndex}
                isPassed={index < activeIndex}
                isPlaying={isPlaying}
                barIndex={index}
                totalBars={waveformData.length}
              />
            </div>
          ))}

          {/* 播放位置指示线 */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-cyan-400 shadow-lg shadow-cyan-400/50 pointer-events-none transition-all duration-300 ease-out"
              style={{
                left: `${32 + (progress * (waveformData.length * 12))}px`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div
          className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer hover:bg-white/20 transition-colors duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ease-out rounded-full pointer-events-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧控制 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-12 h-12 text-white hover:bg-white/10 transition-all duration-300 rounded-full border border-white/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>

          {/* 时间显示 */}
          <div className="flex items-center gap-2">
            <div className="text-white font-mono text-sm bg-white/10 px-3 py-2 rounded-lg">
              {formatTime(currentTime)}
            </div>
            <div className="text-white/50">/</div>
            <div className="text-white/70 font-mono text-sm bg-white/5 px-3 py-2 rounded-lg">
              {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* 右侧控制 */}
        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
            disabled={!src || isLoading}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SmoothAudioPlayer;
