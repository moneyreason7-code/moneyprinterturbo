import React, { useState, useEffect, useRef } from 'react';
import { Locale, i18n } from '../i18n';
import { TaskRecord, VideoScene } from '../types';
import { X, Play, Pause, Download, Volume2, VolumeX, Maximize2, FileText, Film, Layers } from 'lucide-react';

interface VideoPlayerModalProps {
  locale: Locale;
  task: TaskRecord;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ locale, task, onClose }) => {
  const t = i18n[locale];
  const scenes = task.scenes || [];
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const currentScene = scenes[currentSceneIdx] || scenes[0];

  const aspect = task.params.video_aspect || '9:16';
  const subtitleEnabled = task.params.subtitle_enabled !== false;
  const fontColor = task.params.text_fore_color || '#FFFFFF';
  const strokeColor = task.params.stroke_color || '#000000';
  const fontSize = task.params.font_size || 22;
  const subPos = task.params.subtitle_position || 'bottom';

  // Synchronize Scene changes
  useEffect(() => {
    if (!videoRef.current || !currentScene) return;
    videoRef.current.src = currentScene.videoUrl;
    videoRef.current.load();
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentSceneIdx]);

  // Video Time Update & Scene Advance
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const sceneElapsed = videoRef.current.currentTime;
    const sceneBase = scenes.slice(0, currentSceneIdx).reduce((acc, s) => acc + s.duration, 0);
    setCurrentTime(sceneBase + sceneElapsed);

    // If scene reached its designated duration, jump to next scene
    if (currentScene && sceneElapsed >= currentScene.duration) {
      if (currentSceneIdx < scenes.length - 1) {
        setCurrentSceneIdx((prev) => prev + 1);
      } else {
        // Video finished, loop to start
        setCurrentSceneIdx(0);
        setCurrentTime(0);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      bgmRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      bgmRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleDownloadSrt = () => {
    if (!task.srt_content) return;
    const blob = new Blob([task.srt_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.params.video_subject || 'subtitles'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideo = () => {
    const videoUrl = currentScene?.videoUrl || task.videos?.[0];
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${task.params.video_subject || 'video'}.mp4`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Background audio */}
      {task.bgm_url && (
        <audio
          ref={bgmRef}
          src={task.bgm_url}
          loop
          autoPlay={isPlaying}
          muted={isMuted}
        />
      )}

      <div className="relative w-full max-w-4xl rounded-2xl bg-neutral-900 text-white shadow-2xl border border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5 truncate pr-4">
            <Film className="h-5 w-5 text-indigo-400 shrink-0" />
            <span className="font-semibold text-sm truncate">
              {task.params.video_subject || 'Video Preview'}
            </span>
            <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400 font-mono">
              {aspect}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSrt}
              className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all"
              title="Download Subtitles (.SRT)"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>SRT</span>
            </button>
            <button
              onClick={handleDownloadVideo}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.downloadVideo}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas / Player Area */}
        <div className="flex-1 min-h-0 bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Framed Container adapting to Aspect Ratio */}
          <div
            className="relative bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center transition-all"
            style={{
              width: aspect === '9:16' ? '280px' : aspect === '1:1' ? '400px' : '640px',
              height: aspect === '9:16' ? '498px' : aspect === '1:1' ? '400px' : '360px',
              maxWidth: '100%',
              maxHeight: '60vh',
            }}
          >
            <video
              ref={videoRef}
              src={currentScene?.videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                if (currentSceneIdx < scenes.length - 1) {
                  setCurrentSceneIdx((p) => p + 1);
                } else {
                  setCurrentSceneIdx(0);
                }
              }}
              playsInline
              muted={true} // Keep video sound muted so BGM plays cleanly
              className="w-full h-full object-cover"
            />

            {/* Live Subtitle Overlay */}
            {subtitleEnabled && currentScene && (
              <div
                className={`absolute left-4 right-4 text-center pointer-events-none transition-all duration-200 ${
                  subPos === 'top' ? 'top-6' : subPos === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'
                }`}
              >
                <span
                  style={{
                    fontSize: `${Math.max(14, Math.min(fontSize, aspect === '9:16' ? 18 : 22))}px`,
                    color: fontColor,
                    textShadow: `0 0 6px ${strokeColor}, 1.5px 1.5px 3px ${strokeColor}, -1.5px -1.5px 3px ${strokeColor}`,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    display: 'inline-block',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {currentScene.text}
                </span>
              </div>
            )}

            {/* Play/Pause Center Overlay (when paused) */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
              >
                <div className="rounded-full bg-indigo-600/90 p-4 text-white shadow-lg hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 fill-white translate-x-0.5" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-all"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-lg p-2 text-neutral-400 hover:text-white transition-all"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <span className="text-xs font-mono text-neutral-400">
                {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                Scene {currentSceneIdx + 1} of {scenes.length}
              </span>
            </div>
          </div>

          {/* Scene Timeline Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {scenes.map((scene, i) => (
              <button
                key={scene.id}
                onClick={() => setCurrentSceneIdx(i)}
                className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-all shrink-0 max-w-[200px] border ${
                  currentSceneIdx === i
                    ? 'border-indigo-500 bg-indigo-950/60 text-white ring-1 ring-indigo-500'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                  #{i + 1}
                </span>
                <span className="truncate text-[11px]">{scene.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
