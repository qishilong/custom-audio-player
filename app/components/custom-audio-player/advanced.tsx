"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download } from "lucide-react";
import { Button } from '@/app/components/ui/button';

interface WaveformBarProps {
  height: number;
  isActive: boolean;
  isPassed: boolean;
  isPlaying: boolean;
  animationDelay?: number;
}

// 单个波形条组件
const WaveformBar: React.FC<WaveformBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  animationDelay = 0
}) => {
  return (
    <div
      className={cn(
        "w-1.5 rounded-full transition-all duration-200 ease-out",
        isPassed ? "bg-cyan-400" : "bg-white/40",
        isActive && "bg-cyan-500 shadow-lg shadow-cyan-400/50",
        isPlaying && isActive && "animate-pulse scale-110"
      )}
      style={{
        height: `${height}%`,
        animationDelay: `${animationDelay}ms`,
        minHeight: "12px",
        maxHeight: "64px"
      }}
    />
  );
};

interface AdvancedAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const AdvancedAudioPlayer: React.FC<AdvancedAudioPlayerProps> = ({
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 生成更丰富的波形数据
  const waveformData = useMemo(() => {
    const bars = 100; // 增加波形条数量以获得更平滑的效果
    return Array.from({ length: bars }, (_, i) => {
      // 创建更自然的波形模式
      const baseHeight = 25 + Math.sin(i * 0.1) * 15; // 基础波形
      const randomVariation = Math.random() * 40; // 随机变化
      const peakEffect = Math.sin(i * 0.05) * 20; // 峰值效果

      return {
        id: i,
        height: Math.max(15, Math.min(85, baseHeight + randomVariation + peakEffect)),
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
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `audio_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (duration === 0) return { activeIndex: -1, progress: 0 };
    const progress = currentTime / duration;
    const activeIndex = Math.floor(progress * waveformData.length);
    return { activeIndex, progress };
  }, [currentTime, duration, waveformData.length]);

  // 滚动效果 - 让当前播放位置始终在中心
  const updateScroll = useCallback(() => {
    if (!waveformRef.current || !containerRef.current || duration === 0) return;

    const { progress } = getPlaybackPosition();
    const container = containerRef.current;
    const waveform = waveformRef.current;

    const containerWidth = container.clientWidth;
    const waveformWidth = waveform.scrollWidth;
    const maxScroll = waveformWidth - containerWidth;

    if (maxScroll > 0) {
      const targetScroll = progress * maxScroll;
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [duration, getPlaybackPosition]);

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

  // 自动播放处理
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  const { activeIndex, progress } = getPlaybackPosition();

  return (
    <div className={cn("w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-xl", className)}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 状态指示器 */}
      <div className="text-center mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-white/60 text-sm">加载中...</span>
          </div>
        ) : !isPlaying && currentTime === 0 ? (
          <span className="text-cyan-400 text-lg font-medium tracking-wider">未播放</span>
        ) : isPlaying ? (
          <span className="text-cyan-400 text-lg font-medium tracking-wider animate-pulse">播放</span>
        ) : (
          <span className="text-white/80 text-lg font-medium tracking-wider">暂停</span>
        )}
      </div>

      {/* 波形显示区域 - 带滚动 */}
      <div
        ref={containerRef}
        className="relative mb-6 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div
          ref={waveformRef}
          className="flex items-end justify-start gap-1 h-20 cursor-pointer px-4"
          onClick={handleWaveformClick}
          style={{
            minHeight: "80px",
            width: `${waveformData.length * 8}px` // 动态宽度确保可滚动
          }}
        >
          {waveformData.map((bar, index) => (
            <WaveformBar
              key={bar.id}
              height={bar.height}
              isActive={index === activeIndex}
              isPassed={index < activeIndex}
              isPlaying={isPlaying}
              animationDelay={index * 20}
            />
          ))}
        </div>

        {/* 进度指示线 */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-lg shadow-cyan-400/50 pointer-events-none transition-all duration-100"
            style={{
              left: `${progress * 100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div
          className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:bg-white/30 transition-colors duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-100 ease-out pointer-events-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧播放控制 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-10 h-10 text-white hover:bg-white/10 transition-all duration-200"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* 时间显示 */}
          <div className="text-white/90 text-sm font-mono bg-white/10 px-3 py-1 rounded-full">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 右侧下载按钮 */}
        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="w-10 h-10 text-white hover:bg-white/10 transition-all duration-200"
            disabled={!src}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdvancedAudioPlayer;
