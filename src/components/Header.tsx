import React from 'react';
import { Locale, i18n } from '../i18n';
import { Video, Sparkles, Globe, Film } from 'lucide-react';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  activeTaskCount: number;
}

export const Header: React.FC<HeaderProps> = ({ locale, setLocale, activeTaskCount }) => {
  const t = i18n[locale];

  return (
    <header className="border-b border-neutral-200 bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                {t.appName}
              </h1>
              <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                v1.4 Turbo
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-xs font-medium text-emerald-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Ready
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTaskCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/70 px-3 py-1.5 text-xs font-medium text-amber-800 animate-pulse">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>{activeTaskCount} tasks in progress</span>
            </div>
          )}

          <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
            <button
              id="lang-id-btn"
              onClick={() => setLocale('id')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                locale === 'id'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Indonesia
            </button>
            <button
              id="lang-en-btn"
              onClick={() => setLocale('en')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                locale === 'en'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              English
            </button>
            <button
              id="lang-zh-btn"
              onClick={() => setLocale('zh')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                locale === 'zh'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              简体中文
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
