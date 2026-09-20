import React from 'react';
import { Locale, i18n } from '../i18n';
import { Sliders, Smartphone, Monitor, Square, Layers, Wand2 } from 'lucide-react';

interface VideoSettingsPanelProps {
  locale: Locale;
  aspect: '9:16' | '16:9' | '1:1';
  setAspect: (v: '9:16' | '16:9' | '1:1') => void;
  source: 'pexels' | 'pixabay' | 'ai' | 'local';
  setSource: (v: 'pexels' | 'pixabay' | 'ai' | 'local') => void;
  transition: 'none' | 'fade' | 'slide' | 'zoom';
  setTransition: (v: 'none' | 'fade' | 'slide' | 'zoom') => void;
}

export const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({
  locale,
  aspect,
  setAspect,
  source,
  setSource,
  transition,
  setTransition,
}) => {
  const t = i18n[locale];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
        <Sliders className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-neutral-900">
          {t.videoSettings}
        </h2>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-neutral-700 mb-2">
          {t.aspectRatio}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            id="aspect-9-16-btn"
            onClick={() => setAspect('9:16')}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center transition-all ${
              aspect === '9:16'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-xs">9:16</span>
            <span className="text-[10px] text-neutral-400">Shorts / TikTok</span>
          </button>

          <button
            type="button"
            id="aspect-16-9-btn"
            onClick={() => setAspect('16:9')}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center transition-all ${
              aspect === '16:9'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Monitor className="h-5 w-5" />
            <span className="text-xs">16:9</span>
            <span className="text-[10px] text-neutral-400">YouTube</span>
          </button>

          <button
            type="button"
            id="aspect-1-1-btn"
            onClick={() => setAspect('1:1')}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center transition-all ${
              aspect === '1:1'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Square className="h-5 w-5" />
            <span className="text-xs">1:1</span>
            <span className="text-[10px] text-neutral-400">Instagram</span>
          </button>
        </div>
      </div>

      {/* Material Source & Transitions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="material-source" className="block text-xs font-semibold text-neutral-700 mb-1.5">
            {t.materialSource}
          </label>
          <div className="relative">
            <select
              id="material-source"
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="pexels">{t.sourcePexels}</option>
              <option value="pixabay">{t.sourcePixabay}</option>
              <option value="ai">{t.sourceAi}</option>
              <option value="local">{t.sourceLocal}</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="transition-mode" className="block text-xs font-semibold text-neutral-700 mb-1.5">
            {t.transitionMode}
          </label>
          <select
            id="transition-mode"
            value={transition}
            onChange={(e) => setTransition(e.target.value as any)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="none">{t.transNone}</option>
            <option value="fade">{t.transFade}</option>
            <option value="slide">{t.transSlide}</option>
            <option value="zoom">{t.transZoom}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
