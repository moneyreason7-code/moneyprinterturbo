import React, { useState } from 'react';
import { Locale, i18n } from '../i18n';
import { Volume2, Type, Play, Eye } from 'lucide-react';

interface VoiceSubtitlePanelProps {
  locale: Locale;
  voice: string;
  setVoice: (v: string) => void;
  voiceSpeed: number;
  setVoiceSpeed: (v: number) => void;
  subtitleEnabled: boolean;
  setSubtitleEnabled: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  fontColor: string;
  setFontColor: (v: string) => void;
  strokeColor: string;
  setStrokeColor: (v: string) => void;
  position: 'bottom' | 'center' | 'top';
  setPosition: (v: 'bottom' | 'center' | 'top') => void;
}

const VOICES = [
  { id: 'id-ID-GadisNeural', name: 'Gadis (Ramah & Hangat · Indonesia)', lang: 'id' },
  { id: 'id-ID-ArdiNeural', name: 'Ardi (Jelas & Naratif · Indonesia)', lang: 'id' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Professional Warm · English)', lang: 'en' },
  { id: 'en-US-GuyNeural', name: 'Guy (Deep Documentary · English)', lang: 'en' },
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (自然亲切女声 · 中文)', lang: 'zh' },
  { id: 'zh-CN-YunxiNeural', name: '云希 (沉稳有声男声 · 中文)', lang: 'zh' },
  { id: 'zh-CN-YunjianNeural', name: '云健 (影视解说男声 · 中文)', lang: 'zh' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (七海 · Japanese)', lang: 'ja' },
];

export const VoiceSubtitlePanel: React.FC<VoiceSubtitlePanelProps> = ({
  locale,
  voice,
  setVoice,
  voiceSpeed,
  setVoiceSpeed,
  subtitleEnabled,
  setSubtitleEnabled,
  fontSize,
  setFontSize,
  fontColor,
  setFontColor,
  strokeColor,
  setStrokeColor,
  position,
  setPosition,
}) => {
  const t = i18n[locale];
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const handlePreviewVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sampleText =
        locale === 'zh'
          ? '欢迎使用 MoneyPrinterTurbo，这是一段配音试听样本。'
          : 'Welcome to MoneyPrinterTurbo. This is a voice preview.';
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.rate = voiceSpeed;
      utterance.onstart = () => setIsPlayingDemo(true);
      utterance.onend = () => setIsPlayingDemo(false);
      utterance.onerror = () => setIsPlayingDemo(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
        <Volume2 className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-neutral-900">
          {t.voiceSubtitleSettings}
        </h2>
      </div>

      {/* TTS Voice Selector */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="tts-voice" className="text-xs font-semibold text-neutral-700">
            {t.ttsVoice}
          </label>
          <button
            type="button"
            onClick={handlePreviewVoice}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Play className={`h-3 w-3 ${isPlayingDemo ? 'animate-pulse text-indigo-500' : ''}`} />
            <span>{isPlayingDemo ? 'Playing...' : '试听配音'}</span>
          </button>
        </div>
        <select
          id="tts-voice"
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
        >
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Speed */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
          <span>{t.voiceSpeed}</span>
          <span className="font-mono text-indigo-600">{voiceSpeed}x</span>
        </div>
        <input
          type="range"
          min="0.8"
          max="1.5"
          step="0.05"
          value={voiceSpeed}
          onChange={(e) => setVoiceSpeed(Number(e.target.value))}
          className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Subtitles Toggle */}
      <div className="border-t border-neutral-100 pt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="enable-subtitle-toggle" className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
            <Type className="h-4 w-4 text-indigo-600" />
            {t.enableSubtitle}
          </label>
          <input
            id="enable-subtitle-toggle"
            type="checkbox"
            checked={subtitleEnabled}
            onChange={(e) => setSubtitleEnabled(e.target.checked)}
            className="h-4 w-4 rounded-sm border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {subtitleEnabled && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  {t.fontSize} ({fontSize}px)
                </label>
                <input
                  type="range"
                  min="16"
                  max="42"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="subtitle-position" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  {t.subtitlePosition}
                </label>
                <select
                  id="subtitle-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs"
                >
                  <option value="bottom">{t.posBottom}</option>
                  <option value="center">{t.posCenter}</option>
                  <option value="top">{t.posTop}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="font-color-picker" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  {t.fontColor}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="font-color-picker"
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                    className="h-7 w-8 rounded-sm cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <span className="text-[11px] font-mono text-neutral-500">{fontColor}</span>
                </div>
              </div>

              <div>
                <label htmlFor="stroke-color-picker" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  {t.strokeColor}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="stroke-color-picker"
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="h-7 w-8 rounded-sm cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <span className="text-[11px] font-mono text-neutral-500">{strokeColor}</span>
                </div>
              </div>
            </div>

            {/* Subtitle Live Preview Box */}
            <div className="rounded-lg bg-neutral-900 p-3 text-center flex flex-col items-center justify-center min-h-[64px] border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3" /> {t.subtitlePreview}
              </span>
              <p
                style={{
                  fontSize: `${Math.min(fontSize, 24)}px`,
                  color: fontColor,
                  textShadow: `0 0 4px ${strokeColor}, 1px 1px 2px ${strokeColor}, -1px -1px 2px ${strokeColor}`,
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                {locale === 'zh' ? '这里是智能同步字幕预览样式' : 'Smart Synchronized Subtitle Preview'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
