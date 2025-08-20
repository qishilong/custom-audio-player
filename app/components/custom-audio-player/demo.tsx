"use client";

import React from "react";
import { Play, Download } from "lucide-react";
import CustomAudioPlayer from "./index";
import AdvancedAudioPlayer from "./advanced";
import ProfessionalAudioPlayer from "./professional";
import SmoothAudioPlayer from "./smooth";
import UltraSmoothAudioPlayer from "./ultra-smooth";
import ScreenshotMatchAudioPlayer from "./screenshot-match";
import CustomAudioPlayerBeautiful from "./custom-audio-player-beautiful"

interface AudioPlayerDemoProps {
  audioUrl?: string;
  className?: string;
}

export const AudioPlayerDemo: React.FC<AudioPlayerDemoProps> = ({
  audioUrl = "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // 示例音频URL
  className = ""
}) => {
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    console.log(`播放进度: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
  };

  const handleEnded = () => {
    console.log("音频播放结束");
  };

  return (
    <div className={`space-y-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen ${className}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          自定义音频播放器演示
        </h1>
        <p className="text-gray-600 text-center mb-12">
          多种不同风格的波形音频播放器，支持点击跳转和实时滚动
        </p>

        {/* 截图匹配版本 - 最新 */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📸 截图匹配波形播放器 <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">完全匹配</span>
          </h2>
          <p className="text-gray-600 mb-6">
            特点：完全基于提供的截图设计，深色背景，白色细波形条，青色播放进度，传统垂直居中样式
          </p>
          <ScreenshotMatchAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div> */}

        {/* Figma 版本 */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Figma 设计波形播放器
          </h2>
          <p className="text-gray-600 mb-6">
            特点：上下对称设计，呼吸式动画效果，优化的视觉体验
          </p>
          <CustomAudioPlayerBeautiful
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>

        {/* 超平滑版本 - 新增 */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🌊 超平滑对称波形播放器 <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">推荐</span>
          </h2>
          <p className="text-gray-600 mb-6">
            特点：上下对称波形，超平滑动画过渡，无闪烁效果，连续动画循环
          </p>
          <UltraSmoothAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>

        {/* 平滑版本 */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎵 平滑对称波形播放器
          </h2>
          <p className="text-gray-600 mb-6">
            特点：上下对称设计，呼吸式动画效果，优化的视觉体验
          </p>
          <SmoothAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>

        {/* 专业版本 */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎵 专业级波形播放器
          </h2>
          <p className="text-gray-600 mb-6">
            特点：专业级设计，平滑动画，音量控制，悬浮提示，粒子效果
          </p>
          <ProfessionalAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            showVolumeControl={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div> */}

        {/* 增强版本 */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎧 增强波形播放器
          </h2>
          <p className="text-gray-600 mb-6">
            特点：平滑滚动，渐变效果，丰富动画，进度条指示
          </p>
          <AdvancedAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div> */}

        {/* 基础版本 */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎼 基础波形播放器
          </h2>
          <p className="text-gray-600 mb-6">
            特点：简洁设计，点击波形跳转，实时播放状态显示
          </p>
          <CustomAudioPlayer
            src={audioUrl}
            autoPlay={false}
            loop={false}
            showDownload={true}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div> */}

        {/* 功能特性 */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              核心功能
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                上下对称的波形显示设计
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                点击波形任意位置快速跳转
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                点击进度条控制播放进度
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                播放时波形实时高亮显示
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                支持循环播放和自动播放
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                音频文件下载功能
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              高级特性
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                超平滑动画过渡，无闪烁感
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                连续的呼吸式动画效果
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                平滑滚动跟随播放位置
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                自然的频谱分布模拟
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                响应式设计，移动端友好
              </li>
            </ul>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">📖</span>
            使用说明
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">播放控制</h4>
              <p className="text-sm text-gray-600">点击播放按钮开始播放，再次点击暂停</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">📊</span>
              </div>
              <h4 className="font-medium mb-2">交互跳转</h4>
              <p className="text-sm text-gray-600">点击波形条或进度条的任意位置跳转到对应时间点</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">下载音频</h4>
              <p className="text-sm text-gray-600">点击下载按钮保存音频文件到本地</p>
            </div>
          </div>
        </div>

        {/* 代码示例 */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">💻</span>
            代码示例
          </h3>
          <pre className="text-green-400 text-sm overflow-x-auto bg-gray-800 p-4 rounded-lg">
            {`// 导入组件
import { UltraSmoothAudioPlayer } from '@/components/custom-audio-player/ultra-smooth';
import { SmoothAudioPlayer } from '@/components/custom-audio-player/smooth';

// 超平滑对称波形播放器（推荐）
<UltraSmoothAudioPlayer
  src="/path/to/audio.mp3"
  autoPlay={false}
  loop={false}
  showDownload={true}
  onTimeUpdate={(currentTime, duration) => {
    console.log(\`播放进度: \${currentTime}s / \${duration}s\`);
  }}
  onEnded={() => console.log('播放结束')}
/>

// 平滑对称波形播放器
<SmoothAudioPlayer
  src="/path/to/audio.mp3"
  autoPlay={false}
  loop={false}
  showDownload={true}
  onTimeUpdate={(currentTime, duration) => {
    console.log(\`播放进度: \${currentTime}s / \${duration}s\`);
  }}
  onEnded={() => console.log('播放结束')}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerDemo;
