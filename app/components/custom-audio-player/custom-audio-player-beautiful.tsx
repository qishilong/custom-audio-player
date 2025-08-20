import cn from 'classnames'
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { FC } from "react"


interface UltraSmoothAudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  handleLoadedMetadata?: (e?: any) => void
  handleError?: (e: any) => void
}

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

const SymmetricWaveBar: FC<SymmetricWaveBarProps> = ({
  height,
  isActive,
  isPassed,
  isPlaying,
  barIndex,
  animationPhase,
  exactProgress,
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
      return "bg-gradient-to-t from-cyan-500 via-cyan-400 to-[#44B4FF]";
    } else if (isPartiallyPassed) {
      return "bg-gradient-to-t from-cyan-500 via-cyan-400 to-[#44B4FF]";
    } else {
      return "bg-gradient-to-t from-white/30 via-white/20 to-white/10";
    }
  }, [isPassed, isPartiallyPassed]);

  return (
    <div className='h-full w-full flex items-center justify-center relative bg-white'>
      <div
        className={cn('w-full rounded-t-full origin-bottom transition-colors duration-100 ease-out cursor-pointer',
          getBarColor(),
          isActive && "shadow-lg bg-[#44B4FF]",
        )}
        style={{
          height: '100%',
          transition: 'height 0.1s ease-out, transform 0.1s ease-out',
          opacity: isPassed ? 1 : (isPartiallyPassed ? partialOpacity : 0.3),
        }}
      />
      {/* 当前播放位置的微光效果 */}
      {isActive && (
        <div className="absolute inset-0 h-[140%] translate-y-[-20%] pointer-events-none">
          <div
            className="w-full h-full bg-[rgba(68,180,255,0.5)] rounded-full"
            style={{
              animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
        </div>
      )}
    </div>
  )

}

const CustomAudioPlayerBeautiful: FC<UltraSmoothAudioPlayerProps> = ({
  src,
  className,
  autoPlay = false,
  loop = false,
  showDownload = true,
  onTimeUpdate,
  onEnded,
  handleLoadedMetadata,
  handleError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [loadError, handleLoadError] = useState(false);

  const waveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // 播放控制
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  // 时间格式化
  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getRemValue = useCallback((height: number | string) => {
    return Number(height) / 16
  }, [])

  // 生成对称波形柱子
  const waveformData = useMemo(() => {
    const bars = 42; // 波形条数量
    return Array.from({ length: bars }, (_, i) => {
      const offset = i % 6
      switch (offset) {
        case 0:
          return {
            id: i,
            height: getRemValue(6)
          }
        case 1:
          return {
            id: i,
            height: getRemValue(10)
          }
        case 2:
          return {
            id: i,
            height: getRemValue(14)
          }
        case 3:
          return {
            id: i,
            height: getRemValue(20)
          }
        case 4:
          return {
            id: i,
            height: getRemValue(14)
          }
        case 5:
          return {
            id: i,
            height: getRemValue(10)
          }
        default:
          return {
            id: Math.random().toString(36).substring(2, 15),
            height: getRemValue(20)
          }
      }
    })
  }, [getRemValue])

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

  // 计算播放位置
  const getPlaybackPosition = useCallback(() => {
    if (duration === 0) return { activeIndex: -1, progress: 0, exactProgress: 0 };
    const progress = currentTime / duration;
    // 使用更精确的计算方法，避免 Math.floor 导致的滞后
    const exactProgress = progress * waveformData.length;
    const activeIndex = Math.round(exactProgress); // 使用 round 而不是 floor，更精确
    return { activeIndex, progress, exactProgress };
  }, [currentTime, duration, waveformData.length]);

  const { activeIndex, progress, exactProgress } = getPlaybackPosition();

  // 下载功能
  const handleDownload = useCallback(async (src: string, filename?: string) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      if (filename) {
        link.download = filename;
      } else {
        link.download = `audio_${Date.now()}.mp3`;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

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


  if (loadError) {
    return null
  }

  return (
    <>
      <div
        className='w-[26.75rem] h-[2.8125rem] px-[0.94rem] flex items-center justify-between bg-[rgba(38,45,51,0.40)] rounded-[2.375rem]'
      >
        <div
          className={cn('w-[1.086rem]', { 'cursor-not-allowed': isLoading })}
          onClick={() => {
            if (isLoading) return

            togglePlayPause()
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <PlayIcon />
          ) : (
            <PauseIcon />
          )}
        </div>

        <div
          className='w-[14.49rem] flex items-center justify-between'
          ref={waveformRef}
          onClick={handleWaveformClick}
        >
          {waveformData.map((bar, index) => (
            <div
              key={bar.id}
              className='w-[0.125rem]'
              style={{
                height: `${bar.height}rem`
              }}
            >
              <SymmetricWaveBar
                key={bar.id}
                height={bar.height}
                isActive={index === activeIndex && index !== 0}
                isPassed={index < activeIndex}
                isPlaying={isPlaying}
                barIndex={index}
                animationPhase={animationPhase}
                exactProgress={exactProgress}
                totalBars={waveformData.length}
              />
            </div>
          ))}
        </div>

        <div className='flex items-center justify-between w-[7.62rem] gap-[0.59rem]'>
          <span className='flex-1 flex items-center justify-center text-white font-normal not-italic text-[0.79rem] tracking-[0.04725rem]'>
            <span>{formatTime(currentTime)}</span>
            <span className=''> / </span>
            <span className='text-[#AEAEAE]'>
              {formatTime(duration)}
            </span>
          </span>
          {showDownload && <span
            className={cn('w-[1.47rem] flex items-start justify-center cursor-pointer',
              { 'cursor-not-allowed': isLoading || !src }
            )}
            onClick={async () => {
              if (!src || isLoading) return;

              await handleDownload(src);
            }}
          >
            <DownloadIcon />
          </span>}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (handleLoadedMetadata) {
            handleLoadedMetadata(e)
          }
        }}
        onError={(e) => {
          handleLoadError(true)
          handleError?.(e);
        }}
      />
    </>
  )
}

const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none">
  <rect y="0.5" width="4.21053" height="20" rx="2.10526" fill="#D9D9D9" />
  <rect x="15.7891" y="0.5" width="4.21053" height="20" rx="2.10526" fill="#D9D9D9" />
</svg>)

const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
  <path d="M16.0422 7.23986C17.8245 8.24443 17.8245 10.7558 16.0422 11.7604L4.0116 18.5412C2.2293 19.5458 0.00141431 18.2901 0.00141441 16.281L0.00141512 2.7193C0.00141522 0.710168 2.2293 -0.545539 4.01161 0.459028L16.0422 7.23986Z" fill="#D9D9D9" />
</svg>

const loading = <svg xmlns="http://www.w3.org/2000/svg" width="41" height="40" viewBox="0 0 41 40" fill="none">
  <path d="M12.0583 5.3871C11.7059 5.59052 11.4488 5.92557 11.3435 6.31854C11.2382 6.71152 11.2934 7.13022 11.4968 7.48255L13.7977 11.4679C14.0012 11.8203 14.3362 12.0774 14.7292 12.1827C15.1222 12.288 15.5409 12.2328 15.8932 12.0294C16.2455 11.826 16.5026 11.4909 16.6079 11.098C16.7132 10.705 16.6581 10.2863 16.4547 9.93396L14.1537 5.94858C13.9503 5.59625 13.6152 5.33916 13.2223 5.23386C12.8293 5.12856 12.4106 5.18369 12.0583 5.3871Z" fill="white" fill-opacity="0.1" />
  <path d="M5.8864 11.5625C5.683 11.9149 5.62789 12.3336 5.73319 12.7265C5.83849 13.1195 6.09557 13.4545 6.44789 13.6579L10.4336 15.9595C10.6081 16.0618 10.8012 16.1285 11.0016 16.1559C11.202 16.1833 11.4059 16.1708 11.6015 16.1191C11.7971 16.0674 11.9805 15.9775 12.1412 15.8546C12.3019 15.7317 12.4367 15.5783 12.5378 15.4031C12.639 15.2279 12.7045 15.0344 12.7305 14.8338C12.7566 14.6332 12.7428 14.4294 12.6897 14.2342C12.6367 14.0389 12.5456 13.8561 12.4217 13.6962C12.2977 13.5363 12.1434 13.4026 11.9675 13.3026L7.9818 11.001C7.62947 10.7977 7.21078 10.7425 6.81782 10.8478C6.42486 10.9531 6.08982 11.2102 5.8864 11.5625Z" fill="white" fill-opacity="0.2" />
  <path d="M3.62425 20C3.62425 20.4068 3.78586 20.797 4.07353 21.0847C4.36119 21.3723 4.75135 21.534 5.15817 21.534L9.76066 21.5337C10.1657 21.531 10.5533 21.3682 10.8388 21.0808C11.1242 20.7934 11.2845 20.4048 11.2845 19.9997C11.2845 19.5947 11.1243 19.206 10.8388 18.9186C10.5533 18.6313 10.1658 18.4685 9.7607 18.4658L5.15821 18.4661C4.75138 18.4661 4.36122 18.6277 4.07355 18.9154C3.78588 19.203 3.62426 19.5932 3.62425 20Z" fill="white" fill-opacity="0.3" />
  <path d="M5.8864 28.4368C5.98712 28.6113 6.12122 28.7642 6.28104 28.8868C6.44085 29.0095 6.62326 29.0994 6.81784 29.1516C7.01242 29.2037 7.21536 29.217 7.41509 29.1907C7.61481 29.1644 7.80739 29.099 7.98185 28.9983L11.9672 26.6973C12.3196 26.4939 12.5767 26.1589 12.682 25.7659C12.7872 25.3729 12.7321 24.9542 12.5287 24.6019C12.3253 24.2496 11.9902 23.9925 11.5973 23.8872C11.2043 23.7819 10.7856 23.837 10.4333 24.0404L6.44787 26.3414C6.27342 26.4421 6.12051 26.5762 5.99788 26.736C5.87525 26.8958 5.78529 27.0782 5.73315 27.2728C5.68102 27.4674 5.66772 27.6704 5.69401 27.8701C5.7203 28.0698 5.78568 28.2624 5.8864 28.4368Z" fill="white" fill-opacity="0.4" />
  <path d="M12.0642 34.6127C12.4165 34.8161 12.8352 34.8713 13.2282 34.766C13.6211 34.6607 13.9562 34.4036 14.1596 34.0513L16.4611 30.0656C16.5634 29.891 16.6302 29.698 16.6576 29.4976C16.685 29.2971 16.6725 29.0932 16.6208 28.8977C16.569 28.7021 16.4792 28.5187 16.3563 28.358C16.2334 28.1973 16.0799 28.0625 15.9047 27.9613C15.7295 27.8602 15.536 27.7947 15.3354 27.7686C15.1348 27.7425 14.931 27.7564 14.7358 27.8094C14.5406 27.8624 14.3577 27.9535 14.1979 28.0775C14.038 28.2014 13.9042 28.3558 13.8042 28.5316L11.5027 32.5174C11.2993 32.8697 11.2442 33.2884 11.3495 33.6813C11.4548 34.0743 11.7119 34.4093 12.0642 34.6127Z" fill="white" fill-opacity="0.45" />
  <path d="M20.5013 36.875C20.9082 36.875 21.2983 36.7134 21.586 36.4257C21.8737 36.1381 22.0353 35.7479 22.0353 35.3411L22.035 30.7386C22.0323 30.3336 21.8695 29.946 21.5821 29.6605C21.2947 29.375 20.9061 29.2148 20.501 29.2148C20.096 29.2148 19.7073 29.375 19.42 29.6605C19.1326 29.946 18.9698 30.3335 18.9671 30.7386L18.9674 35.3411C18.9674 35.7479 19.129 36.1381 19.4167 36.4257C19.7044 36.7134 20.0945 36.875 20.5013 36.875Z" fill="white" fill-opacity="0.5" />
  <path d="M28.9362 34.6134C29.1106 34.5127 29.2635 34.3786 29.3862 34.2188C29.5088 34.0589 29.5987 33.8765 29.6509 33.682C29.703 33.4874 29.7163 33.2844 29.69 33.0847C29.6637 32.885 29.5984 32.6924 29.4976 32.5179L27.1967 28.5326C26.9933 28.1802 26.6582 27.9231 26.2652 27.8178C25.8723 27.7125 25.4536 27.7677 25.1012 27.9711C24.7489 28.1745 24.4918 28.5096 24.3865 28.9025C24.2812 29.2955 24.3363 29.7142 24.5398 30.0665L26.8407 34.0519C26.9414 34.2264 27.0755 34.3793 27.2354 34.5019C27.3952 34.6245 27.5776 34.7145 27.7722 34.7666C27.9667 34.8188 28.1697 34.8321 28.3694 34.8058C28.5691 34.7795 28.7617 34.7141 28.9362 34.6134Z" fill="white" fill-opacity="0.6" />
  <path d="M35.116 28.4373C35.3194 28.0849 35.3745 27.6662 35.2692 27.2733C35.1639 26.8803 34.9068 26.5453 34.5545 26.3419L30.5688 24.0403C30.3943 23.938 30.2012 23.8712 30.0008 23.8438C29.8004 23.8164 29.5965 23.829 29.4009 23.8807C29.2053 23.9324 29.0219 24.0223 28.8612 24.1452C28.7005 24.2681 28.5657 24.4215 28.4646 24.5967C28.3634 24.7719 28.2979 24.9654 28.2718 25.166C28.2458 25.3666 28.2596 25.5704 28.3127 25.7656C28.3657 25.9609 28.4568 26.1437 28.5807 26.3036C28.7047 26.4634 28.859 26.5972 29.0349 26.6972L33.0206 28.9987C33.3729 29.2021 33.7916 29.2573 34.1846 29.152C34.5775 29.0467 34.9126 28.7896 35.116 28.4373Z" fill="white" fill-opacity="0.7" />
  <path d="M37.3704 19.9998C37.3704 19.5929 37.2088 19.2028 36.9212 18.9151C36.6335 18.6274 36.2433 18.4658 35.8365 18.4658L31.234 18.4661C30.829 18.4688 30.4414 18.6316 30.1559 18.919C29.8704 19.2063 29.7102 19.595 29.7102 20C29.7102 20.4051 29.8704 20.7937 30.1559 21.0811C30.4414 21.3685 30.8289 21.5313 31.234 21.534L35.8365 21.5337C36.2433 21.5337 36.6335 21.3721 36.9211 21.0844C37.2088 20.7967 37.3704 20.4066 37.3704 19.9998Z" fill="white" fill-opacity="0.8" />
  <path d="M35.1146 11.5628C34.9112 11.2105 34.5762 10.9534 34.1832 10.8481C33.7902 10.7428 33.3715 10.7979 33.0192 11.0014L29.0338 13.3023C28.6815 13.5057 28.4244 13.8408 28.3191 14.2338C28.2138 14.6267 28.2689 15.0454 28.4723 15.3978C28.6758 15.7501 29.0108 16.0072 29.4038 16.1125C29.7967 16.2178 30.2155 16.1627 30.5678 15.9592L34.5532 13.6583C34.9055 13.4549 35.1626 13.1198 35.2679 12.7268C35.3732 12.3339 35.3181 11.9152 35.1146 11.5628Z" fill="white" fill-opacity="0.9" />
  <path d="M28.9399 5.38707C28.5875 5.18367 28.1688 5.12855 27.7759 5.23385C27.3829 5.33915 27.0479 5.59624 26.8445 5.94855L24.5429 9.93426C24.4406 10.1088 24.3739 10.3018 24.3465 10.5023C24.3191 10.7027 24.3316 10.9066 24.3833 11.1022C24.435 11.2977 24.5249 11.4812 24.6478 11.6418C24.7707 11.8025 24.9241 11.9374 25.0993 12.0385C25.2745 12.1396 25.468 12.2051 25.6686 12.2312C25.8692 12.2573 26.073 12.2434 26.2683 12.1904C26.4635 12.1374 26.6463 12.0463 26.8062 11.9223C26.9661 11.7984 27.0998 11.644 27.1998 11.4682L29.5014 7.48246C29.7048 7.13014 29.7599 6.71144 29.6546 6.31848C29.5493 5.92552 29.2922 5.59048 28.9399 5.38707Z" fill="white" />
  <path d="M20.5011 3.12688C20.0942 3.12688 19.7041 3.28849 19.4164 3.57616C19.1287 3.86382 18.9671 4.25398 18.9671 4.6608L18.9674 9.26329C18.9701 9.66835 19.1329 10.0559 19.4203 10.3414C19.7076 10.6269 20.0963 10.7871 20.5013 10.7871C20.9064 10.7871 21.2951 10.6269 21.5824 10.3414C21.8698 10.0559 22.0326 9.66839 22.0353 9.26333L22.035 4.66084C22.035 4.25402 21.8734 3.86386 21.5857 3.57618C21.298 3.28851 20.9079 3.12689 20.5011 3.12688Z" fill="white" />
</svg>

const DownloadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15" fill="none">
  <path d="M11.5673 12.8101C11.7434 12.8101 11.9123 12.88 12.0368 13.0045C12.1613 13.129 12.2312 13.2979 12.2312 13.474C12.2312 13.6501 12.1613 13.8189 12.0368 13.9434C11.9123 14.0679 11.7434 14.1379 11.5673 14.1379H0.945137C0.769063 14.1379 0.600201 14.0679 0.475698 13.9434C0.351195 13.8189 0.28125 13.6501 0.28125 13.474C0.28125 13.2979 0.351195 13.129 0.475698 13.0045C0.600201 12.88 0.769063 12.8101 0.945137 12.8101H11.5673ZM6.25623 0.862793C6.4323 0.862793 6.60116 0.932738 6.72567 1.05724C6.85017 1.18174 6.92012 1.35061 6.92012 1.52668V9.54576L10.1001 6.36575C10.2195 6.24646 10.3798 6.1771 10.5485 6.17177C10.7171 6.16644 10.8815 6.22554 11.0082 6.33706C11.1348 6.44858 11.2142 6.60414 11.2303 6.77213C11.2464 6.94012 11.1979 7.10791 11.0946 7.24141L11.0389 7.30382L6.72294 11.6224C6.60871 11.7368 6.45666 11.8056 6.29531 11.8159C6.13397 11.8261 5.97442 11.7772 5.84661 11.6782L5.78421 11.6231L1.47226 7.31842C1.35274 7.19918 1.28315 7.03887 1.27764 6.87013C1.27213 6.70138 1.33112 6.53688 1.4426 6.41009C1.55408 6.28329 1.70968 6.20374 1.87775 6.18761C2.04581 6.17148 2.2137 6.21999 2.34726 6.32326L2.40967 6.37836L5.59234 9.55439V1.52668C5.59234 1.35061 5.66229 1.18174 5.78679 1.05724C5.91129 0.932738 6.08015 0.862793 6.25623 0.862793Z" fill="white" />
</svg>)


export default CustomAudioPlayerBeautiful

