"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface WaveformBarProps {
  height: number;
  isActive: boolean;
  isPlaying: boolean;
  animationDelay?: number;
}

// 单个波形条组件
const WaveformBar: React.FC<WaveformBarProps> = ({ height, isActive, isPlaying, animationDelay = 0 }) => {
  return (
    <div
      className={cn(
        "w-1 bg-white/60 rounded-full transition-all duration-150",
        isActive && "bg-cyan-400",
        isPlaying && isActive && "animate-pulse"
      )}
      style={{
        height: `${height}%`,
        animationDelay: `${animationDelay}ms`,
        minHeight: "8px"
      }}
    />
  );
};

interface CustomAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 生成波形数据（模拟音频波形）
  const waveformData = useMemo(() => {
    const bars = 60; // 波形条数量
    return Array.from({ length: bars }, (_, i) => ({
      id: i,
      height: Math.random() * 60 + 20, // 20-80% 高度
    }));
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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 计算当前播放位置对应的波形条索引
  const getActiveBarIndex = useCallback(() => {
    if (duration === 0) return -1;
    const progress = currentTime / duration;
    return Math.floor(progress * waveformData.length);
  }, [currentTime, duration, waveformData.length]);

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
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onEnded]);

  // 自动播放处理
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  const activeBarIndex = getActiveBarIndex();

  return (
    <div className={cn("w-full bg-gray-900 rounded-lg p-4", className)}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 波形显示区域 */}
      <div className="relative mb-4">
        {!isPlaying && currentTime === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-cyan-400 text-lg font-medium">未播放</span>
          </div>
        )}

        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-cyan-400 text-lg font-medium">播放</span>
          </div>
        )}

        <div
          ref={waveformRef}
          className="flex items-end justify-center gap-1 h-20 cursor-pointer relative"
          onClick={handleWaveformClick}
          style={{ minHeight: "80px" }}
        >
          {waveformData.map((bar, index) => (
            <WaveformBar
              key={bar.id}
              height={bar.height}
              isActive={index <= activeBarIndex}
              isPlaying={isPlaying}
              animationDelay={index * 50}
            />
          ))}
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div
          className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:bg-white/30 transition-colors duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-150 ease-out pointer-events-none"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        {/* 左侧播放控制 */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-8 h-8 text-white hover:bg-white/10"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          {/* 时间显示 */}
          <div className="text-white/80 text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 右侧下载按钮 */}
        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="w-8 h-8 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
