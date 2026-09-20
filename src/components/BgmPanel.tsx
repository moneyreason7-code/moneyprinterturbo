import React, { useEffect, useState, useRef } from 'react';
import { Locale, i18n } from '../i18n';
import { Music, Play, Pause, Upload, Volume2, Check } from 'lucide-react';
import { BgmFile } from '../types';

interface BgmPanelProps {
  locale: Locale;
  bgmType: 'random' | 'custom' | 'none';
  setBgmType: (v: 'random' | 'custom' | 'none') => void;
  bgmFile: string;
  setBgmFile: (v: string) => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
}

export const BgmPanel: React.FC<BgmPanelProps> = ({
  locale,
  bgmType,
  setBgmType,
  bgmFile,
  setBgmFile,
  bgmVolume,
  setBgmVolume,
}) => {
  const t = i18n[locale];
  const [bgmList, setBgmList] = useState<BgmFile[]>([]);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/v1/musics')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.files) {
          setBgmList(data.data.files);
          if (!bgmFile && data.data.files.length > 0) {
            setBgmFile(data.data.files[0].file);
          }
        }
      })
      .catch((err) => console.error('Failed to load bgm list', err));
  }, []);

  const handleTogglePlay = (url: string) => {
    if (!audioRef.current) return;
    if (playingTrack === url) {
      audioRef.current.pause();
      setPlayingTrack(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.volume = bgmVolume / 100;
      audioRef.current.play();
      setPlayingTrack(url);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await fetch('/api/v1/musics', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.data?.file) {
        const newTrack: BgmFile = {
          name: data.data.name || file.name,
          file: data.data.file,
          size: file.size,
          url: data.data.url,
        };
        setBgmList((prev) => [newTrack, ...prev]);
        setBgmFile(data.data.file);
        setBgmType('custom');
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrack(null)}
        onError={() => setPlayingTrack(null)}
      />

      <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
        <Music className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-neutral-900">
          {t.bgmSettings}
        </h2>
      </div>

      {/* Music Mode Selection */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-neutral-700 mb-2">
          {t.bgmMode}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setBgmType('random')}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              bgmType === 'random'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {t.bgmRandom}
          </button>
          <button
            type="button"
            onClick={() => setBgmType('custom')}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              bgmType === 'custom'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {t.bgmCustom}
          </button>
          <button
            type="button"
            onClick={() => setBgmType('none')}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              bgmType === 'none'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {t.bgmNone}
          </button>
        </div>
      </div>

      {bgmType !== 'none' && (
        <div className="space-y-4">
          {/* BGM Volume Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 text-neutral-500" />
                {t.bgmVolume}
              </span>
              <span className="font-mono text-indigo-600">{bgmVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bgmVolume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                setBgmVolume(vol);
                if (audioRef.current) {
                  audioRef.current.volume = vol / 100;
                }
              }}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* If custom selected, show track selection + upload */}
          {bgmType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  {t.bgmSelect}
                </label>
                <label className="cursor-pointer text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span>{isUploading ? 'Uploading...' : t.uploadCustomBgm}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                {bgmList.map((track) => {
                  const isSelected = bgmFile === track.file;
                  const isCurrentPlaying = playingTrack === track.url;
                  return (
                    <div
                      key={track.file}
                      onClick={() => setBgmFile(track.file)}
                      className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60 font-semibold text-indigo-900' : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                        <span className="truncate">{track.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePlay(track.url);
                        }}
                        className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition-all shrink-0"
                      >
                        {isCurrentPlaying ? (
                          <Pause className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" />
                        ) : (
                          <Play className="h-3.5 w-3.5 text-neutral-600" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
