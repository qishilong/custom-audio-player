// 导出所有音频播放器组件
export { default as CustomAudioPlayer } from "./index";
export { default as AdvancedAudioPlayer } from "./advanced";
export { default as ProfessionalAudioPlayer } from "./professional";
export { default as SmoothAudioPlayer } from "./smooth";
export { default as UltraSmoothAudioPlayer } from "./ultra-smooth";
export { default as AudioPlayerDemo } from "./demo";

// 类型定义
export interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showDownload?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export interface ProfessionalAudioPlayerProps extends AudioPlayerProps {
  showVolumeControl?: boolean;
}

// 默认导出超平滑版本（推荐）
export { default } from "./ultra-smooth";
