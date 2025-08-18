"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface WaveformBarProps {
  height: number;
  isActive: boolean;
  isPassed: boolean;
  isPlaying: boolean;
  animationDelay?: number;
  barIndex: number;
}

// 单个波形条组件
const WaveformBar: React.FC<WaveformBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  animationDelay = 0,
  barIndex
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative w-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer group",
        isPassed ? "bg-gradient-to-t from-cyan-500 to-cyan-300" : "bg-white/30",
        isActive && "bg-gradient-to-t from-cyan-400 to-cyan-200 shadow-lg shadow-cyan-400/50 scale-110",
        isPlaying && isActive && "animate-pulse",
        "hover:bg-cyan-300 hover:scale-105"
      )}
      style={{
        height: `${height}%`,
        animationDelay: `${animationDelay}ms`,
        minHeight: "8px",
        maxHeight: "72px"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 悬浮效果 */}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {Math.round((barIndex / 100) * 100)}%
        </div>
      )}

      {/* 播放时的粒子效果 */}
      {isPlaying && isActive && (
        <div className="absolute inset-0 animate-ping bg-cyan-400/30 rounded-full" />
      )}
    </div>
  );
};

interface ProfessionalAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  showVolumeControl?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const ProfessionalAudioPlayer: React.FC<ProfessionalAudioPlayerProps> = ({
  src,
  className,
  autoPlay = false,
  loop = false,
  showDownload = true,
  showVolumeControl = true,
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // 生成专业级波形数据
  const waveformData = useMemo(() => {
    const bars = 120; // 更多的波形条
    return Array.from({ length: bars }, (_, i) => {
      // 创建更复杂的波形模式，模拟真实音频
      const frequency1 = Math.sin(i * 0.15) * 25;
      const frequency2 = Math.sin(i * 0.08) * 15;
      const frequency3 = Math.sin(i * 0.3) * 10;
      const randomNoise = (Math.random() - 0.5) * 20;
      const baseHeight = 30;

      // 模拟音频的动态范围
      const dynamicRange = Math.sin(i * 0.02) * 30;

      const finalHeight = Math.max(
        10,
        Math.min(
          90,
          baseHeight + frequency1 + frequency2 + frequency3 + randomNoise + dynamicRange
        )
      );

      return {
        id: i,
        height: finalHeight,
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

  // 音量控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  // 静音切换
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

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
      // 保持当前播放位置在容器中心
      const centerOffset = containerWidth / 2;
      const targetScroll = (progress * waveformWidth) - centerOffset;
      const clampedScroll = Math.max(0, Math.min(maxScroll, targetScroll));

      container.scrollTo({
        left: clampedScroll,
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

    const handleVolumeChangeEvent = () => {
      setVolume(audio.volume);
      setIsMuted(audio.muted);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('volumechange', handleVolumeChangeEvent);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChangeEvent);
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
    <div className={cn(
      "w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-2xl p-6 shadow-2xl border border-gray-800",
      className
    )}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="text-white/60 text-sm ml-2">加载中...</span>
            </div>
          ) : !isPlaying && currentTime === 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-cyan-400 text-sm font-medium">未播放</span>
            </div>
          ) : isPlaying ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 text-sm font-medium">播放中</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span className="text-white/80 text-sm font-medium">已暂停</span>
            </div>
          )}
        </div>

        {/* 音量控制 */}
        {showVolumeControl && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="w-8 h-8 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Volume2 className={cn("w-4 h-4", isMuted && "opacity-50")} />
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-full outline-none slider"
            />
          </div>
        )}
      </div>

      {/* 波形显示区域 */}
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
          className="flex items-end justify-start gap-1 h-24 cursor-pointer px-8 relative"
          onClick={handleWaveformClick}
          style={{
            minHeight: "96px",
            width: `${waveformData.length * 10}px`
          }}
        >
          {waveformData.map((bar, index) => (
            <WaveformBar
              key={bar.id}
              height={bar.height}
              isActive={index === activeIndex}
              isPassed={index < activeIndex}
              isPlaying={isPlaying}
              animationDelay={index * 15}
              barIndex={index}
            />
          ))}

          {/* 播放位置指示器 */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-300 to-cyan-500 shadow-lg shadow-cyan-400/50 pointer-events-none transition-all duration-100"
              style={{
                left: `${32 + (progress * (waveformData.length * 10))}px`,
                transform: 'translateX(-50%)'
              }}
            >
              {/* 顶部圆点 */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div
          className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer hover:bg-white/20 transition-colors duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-100 ease-out relative pointer-events-none"
            style={{ width: `${progress * 100}%` }}
          >
            {/* 进度条光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
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
            className="w-12 h-12 text-white hover:bg-white/10 transition-all duration-200 rounded-full border border-white/20"
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
            <div className="text-white font-mono text-sm bg-white/10 px-3 py-1.5 rounded-lg">
              {formatTime(currentTime)}
            </div>
            <div className="text-white/50">/</div>
            <div className="text-white/70 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-lg">
              {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2">
          {showDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              disabled={!src || isLoading}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAudioPlayer;
