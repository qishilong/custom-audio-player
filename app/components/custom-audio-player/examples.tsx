// 使用示例

import React from 'react';
import { UltraSmoothAudioPlayer } from './ultra-smooth';

// 基本使用
function BasicExample() {
  return (
    <UltraSmoothAudioPlayer
      src="/path/to/your/audio.mp3"
      autoPlay={false}
      loop={false}
      showDownload={true}
    />
  );
}

// 带回调的使用
function AdvancedExample() {
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    console.log(`播放进度: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);

    // 可以在这里更新UI状态
    const progress = (currentTime / duration) * 100;
    console.log(`播放百分比: ${progress.toFixed(1)}%`);
  };

  const handleEnded = () => {
    console.log('音频播放完毕');
    // 可以在这里执行播放结束后的操作
  };

  return (
    <UltraSmoothAudioPlayer
      src="/path/to/your/audio.mp3"
      autoPlay={false}
      loop={true}
      showDownload={true}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className="custom-audio-player"
    />
  );
}

export { BasicExample, AdvancedExample };
