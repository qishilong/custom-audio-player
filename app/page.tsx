import AudioPlayerDemo from "@/app/components/custom-audio-player/demo";

export default function AudioPlayerTestPage() {
  return (
    <div className="min-h-screen">
      <AudioPlayerDemo
        // 使用一个公开可用的示例音频文件
        audioUrl="https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3"
      />
    </div>
  );
}

