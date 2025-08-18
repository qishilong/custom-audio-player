"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import cn from "classnames"
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface WaveBarProps {
  height: number;
  isActive: boolean;
  isPassed: boolean;
  isPlaying: boolean;
  barIndex: number;
  exactProgress: number;
}

// 单个波形条组件 - 严格按照截图样式
const WaveBar: React.FC<WaveBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  barIndex,
  exactProgress
}) => {
  // 计算当前柱子的播放状态
  const barProgress = exactProgress - barIndex;
  const isPartiallyPassed = barProgress > 0 && barProgress < 1;

  // 严格按照截图的颜色：纯白色
  const getBarColor = useCallback(() => {
    // 截图显示所有波形条都是白色，不管播放状态
    if (isPassed) return "bg-cyan-400"; // 已播放：青色
    if (isPartiallyPassed) return "bg-cyan-300"; // 部分播放：浅青色  
    return "bg-white"; // 未播放：纯白色
  }, [isPassed, isPartiallyPassed]);

  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={getBarColor()}
        style={{
          width: "1px", // 更细的波形条，匹配截图
          height: `${height}px`, // 使用绝对像素值
          minHeight: "2px",
          borderRadius: "0.5px", // 轻微圆角
        }}
      />
    </div>
  );
};

interface ScreenshotMatchAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export const ScreenshotMatchAudioPlayer: React.FC<ScreenshotMatchAudioPlayerProps> = ({
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

  // 生成严格按照截图的波形数据
  const waveformData = useMemo(() => {
    // 截图显示约80-90个波形条，排列紧密
    const bars = 85;
    return Array.from({ length: bars }, (_, i) => {
      // 严格模拟截图中的波形分布
      // 截图显示了非常真实的音频波形模式

      // 基于截图观察的模式重新设计
      const position = i / bars;
      let height = 4; // 最小高度

      // 模拟截图中的具体波形模式
      // 左侧有一些中等高度的波形
      if (position < 0.2) {
        height = 8 + Math.random() * 12;
      }
      // 中间有几个明显的高峰
      else if (position > 0.25 && position < 0.35) {
        height = 15 + Math.random() * 20;
      }
      else if (position > 0.4 && position < 0.5) {
        height = 10 + Math.random() * 15;
      }
      // 右侧有一些较高的波形
      else if (position > 0.6 && position < 0.8) {
        height = 12 + Math.random() * 18;
      }
      else if (position > 0.85) {
        height = 6 + Math.random() * 10;
      }
      // 其他位置较低
      else {
        height = 3 + Math.random() * 8;
      }

      // 添加一些随机的高峰，模拟截图中的突出波形
      if (Math.random() < 0.1) {
        height += Math.random() * 15;
      }

      return {
        id: i,
        height: Math.max(2, Math.min(40, height)), // 限制在合理范围
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

  // 精确的播放位置计算
  const getPlaybackPosition = useCallback(() => {
    if (duration === 0) return { activeIndex: -1, progress: 0, exactProgress: 0 };
    const progress = currentTime / duration;
    const exactProgress = progress * waveformData.length;
    const activeIndex = Math.floor(exactProgress);
    return { activeIndex, progress, exactProgress };
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
  }, [onTimeUpdate, onEnded, loop]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  const { activeIndex, progress, exactProgress } = getPlaybackPosition();

  return (
    <div className={cn(
      "w-full bg-gray-900 rounded-xl p-4 shadow-xl",
      className
    )}>
      <audio ref={audioRef} src={src} loop={loop} preload="metadata" />

      {/* 简化的状态显示 */}
      <div className="text-center mb-4">
        {!isLoading && (
          <div className="text-white/60 text-sm">
            {isPlaying ? "播放中" : currentTime > 0 ? "已暂停" : "准备播放"}
          </div>
        )}
      </div>

      {/* 波形显示区域 - 严格按照截图的样式 */}
      <div
        ref={containerRef}
        className="relative mb-6 rounded-lg overflow-hidden"
        style={{
          minHeight: "60px",
          backgroundColor: "#1f2937", // 深灰色背景，匹配截图
        }}
      >
        <div
          ref={waveformRef}
          className="flex items-center justify-center gap-0.5 cursor-pointer px-2 py-3"
          onClick={handleWaveformClick}
          style={{
            height: "60px"
          }}
        >
          {waveformData.map((bar, index) => (
            <div
              key={bar.id}
              className="h-full flex items-center"
              style={{ width: "2px" }} // 更紧密的间距
            >
              <WaveBar
                height={bar.height}
                isActive={index === activeIndex}
                isPassed={index < exactProgress}
                isPlaying={isPlaying}
                barIndex={index}
                exactProgress={exactProgress}
              />
            </div>
          ))}

          {/* 播放位置指示线 - 更细更精确 */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none"
              style={{
                left: `${8 + (progress * ((waveformRef.current?.clientWidth || 200) - 16))}px`,
                transition: 'left 0.05s linear'
              }}
            />
          )}
        </div>
      </div>

      {/* 简化的进度条 */}
      <div className="mb-4">
        <div
          className="w-full h-0.5 bg-white/20 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 简化的控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-8 h-8 text-white hover:bg-white/10 rounded-full"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-white font-mono">
              {formatTime(currentTime)}
            </span>
            <span className="text-white/50">/</span>
            <span className="text-white/70 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {showDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="w-8 h-8 text-white/70 hover:text-white hover:bg-white/10 rounded"
            disabled={!src || isLoading}
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScreenshotMatchAudioPlayer;
