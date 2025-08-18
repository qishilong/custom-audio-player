# 自定义音频播放器组件

这是一套功能强大的自定义音频播放器组件，具有上下对称波形可视化、平滑动画过渡、点击跳转等特性。

## 组件类型

### 1. UltraSmoothAudioPlayer (超平滑版) 🌊 推荐
- **上下对称的波形设计**
- **超平滑的动画过渡，无闪烁感**
- **连续的呼吸式动画效果**
- **requestAnimationFrame 优化**
- **最佳的用户体验**

### 2. SmoothAudioPlayer (平滑版) 🎵
- 上下对称波形显示
- 平滑的动画过渡
- 呼吸式波形效果
- 优化的视觉体验

### 3. ProfessionalAudioPlayer (专业版) 🎧
- 专业级设计
- 音量控制
- 悬浮提示
- 粒子动画效果
- 传统的单向波形

### 4. AdvancedAudioPlayer (增强版) 🎼
- 平滑滚动效果
- 渐变视觉效果
- 更丰富的动画
- 进度条指示器

### 5. CustomAudioPlayer (基础版) 🎶
- 简洁的设计风格
- 基本的波形显示
- 点击跳转功能
- 适合简单需求

## 核心特性 ✨

### 🎯 对称波形设计
- 上下对称的波形柱子显示
- 自然的音频频谱模拟
- 视觉平衡感更佳

### 🌊 超平滑动画
- 无闪烁的平滑过渡
- 连续的动画循环
- 基于 requestAnimationFrame 优化
- 60fps 流畅体验

### 🎮 交互功能
- 点击波形任意位置快速跳转
- 平滑滚动跟随播放位置
- 实时播放状态显示

## 安装和使用

```tsx
import { ProfessionalAudioPlayer } from '@/components/custom-audio-player/exports';

function MyComponent() {
  return (
    <ProfessionalAudioPlayer
      src="/path/to/audio.mp3"
      autoPlay={false}
      loop={false}
      showDownload={true}
      showVolumeControl={true}
      onTimeUpdate={(currentTime, duration) => {
        console.log(`播放进度: ${currentTime}s / ${duration}s`);
      }}
      onEnded={() => console.log('播放结束')}
    />
  );
}
```

## 组件属性

### 通用属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `src` | `string` | 必填 | 音频文件的URL |
| `className` | `string` | `""` | 自定义CSS类名 |
| `autoPlay` | `boolean` | `false` | 是否自动播放 |
| `loop` | `boolean` | `false` | 是否循环播放 |
| `showDownload` | `boolean` | `true` | 是否显示下载按钮 |
| `onTimeUpdate` | `function` | `undefined` | 播放进度更新回调 |
| `onEnded` | `function` | `undefined` | 播放结束回调 |

### 专业版额外属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `showVolumeControl` | `boolean` | `true` | 是否显示音量控制 |

## 功能特性

### 🎵 核心功能
- ✅ 点击波形任意位置快速跳转
- ✅ 播放时波形实时高亮显示
- ✅ 支持循环播放和自动播放
- ✅ 音频文件下载功能

### 🎧 高级特性
- ✅ 平滑滚动跟随播放位置
- ✅ 音量控制和静音功能
- ✅ 丰富的动画和视觉效果
- ✅ 响应式设计，移动端友好

## 示例页面

访问 `/audio-player-test` 查看完整的演示页面，包含所有三个版本的播放器。

## 技术实现

- 使用 React Hooks 进行状态管理
- Canvas 或 CSS 实现波形可视化
- Web Audio API 支持
- Tailwind CSS 样式系统
- TypeScript 类型安全

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. 确保音频文件的CORS设置正确
2. 某些浏览器需要用户交互才能播放音频
3. 建议使用常见的音频格式（MP3、WAV、OGG）
4. 大型音频文件可能需要预加载时间

## 自定义样式

所有组件都支持通过 `className` 属性进行样式自定义：

```tsx
<ProfessionalAudioPlayer
  src="/audio.mp3"
  className="my-custom-player shadow-lg"
/>
```

## 性能优化

- 使用 `useMemo` 缓存波形数据
- 节流处理时间更新事件
- 懒加载音频资源
- 优化动画性能
