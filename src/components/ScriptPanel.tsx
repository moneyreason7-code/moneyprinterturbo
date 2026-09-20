import React, { useState } from 'react';
import { Locale, i18n } from '../i18n';
import { Sparkles, FileText, Tags, AlertCircle, RefreshCw } from 'lucide-react';

interface ScriptPanelProps {
  locale: Locale;
  subject: string;
  setSubject: (v: string) => void;
  script: string;
  setScript: (v: string) => void;
  terms: string[];
  setTerms: (v: string[]) => void;
  language: string;
  setLanguage: (v: string) => void;
  paragraphCount: number;
  setParagraphCount: (v: number) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({
  locale,
  subject,
  setSubject,
  script,
  setScript,
  terms,
  setTerms,
  language,
  setLanguage,
  paragraphCount,
  setParagraphCount,
  customPrompt,
  setCustomPrompt,
}) => {
  const t = i18n[locale];
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerateScript = async () => {
    if (!subject.trim()) {
      setErrorMsg(locale === 'zh' ? '请先填写视频主题或关键词' : 'Please enter a video subject first');
      return;
    }
    setErrorMsg('');
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/v1/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_subject: subject,
          video_language: language,
          paragraph_number: paragraphCount,
          video_script_prompt: customPrompt,
        }),
      });
      const data = await res.json();
      if (data.data?.video_script) {
        setScript(data.data.video_script);
        // Automatically extract terms if not present
        if (terms.length === 0) {
          handleGenerateTerms(data.data.video_script);
        }
      } else {
        throw new Error(data.message || 'Failed to generate script');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating script');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateTerms = async (currentScript?: string) => {
    const textToAnalyze = currentScript || script || subject;
    if (!textToAnalyze.trim()) {
      setErrorMsg(locale === 'zh' ? '请先填写主题或文案以提取素材关键词' : 'Please enter a subject or script to extract keywords');
      return;
    }
    setErrorMsg('');
    setIsGeneratingTerms(true);
    try {
      const res = await fetch('/api/v1/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_subject: subject,
          video_script: currentScript || script,
          amount: 5,
        }),
      });
      const data = await res.json();
      if (data.data?.video_terms) {
        setTerms(data.data.video_terms);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating terms');
    } finally {
      setIsGeneratingTerms(false);
    }
  };

  const handleTermsChange = (raw: string) => {
    const list = raw.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
    setTerms(list);
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-all">
      <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
        <FileText className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-neutral-900">
          {t.scriptSettings}
        </h2>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Video Subject */}
      <div className="mb-4">
        <label htmlFor="video-subject" className="block text-xs font-semibold text-neutral-700 mb-1.5">
          {t.videoSubject} <span className="text-rose-500">*</span>
        </label>
        <input
          id="video-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t.videoSubjectPlaceholder}
          className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-200/50"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          {t.videoSubjectHelp}
        </p>
      </div>

      {/* Script Language & Paragraph count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
        <div>
          <label htmlFor="script-language" className="block text-xs font-semibold text-neutral-700 mb-1">
            {t.scriptLanguage}
          </label>
          <select
            id="script-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="zh">简体中文 (Chinese)</option>
            <option value="en">English (US)</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="es">Español (Spanish)</option>
            <option value="fr">Français (French)</option>
            <option value="de">Deutsch (German)</option>
          </select>
        </div>

        <div>
          <label htmlFor="script-paragraphs" className="block text-xs font-semibold text-neutral-700 mb-1">
            {t.paragraphCount} ({paragraphCount} 镜头分段)
          </label>
          <input
            id="script-paragraphs"
            type="range"
            min="2"
            max="8"
            value={paragraphCount}
            onChange={(e) => setParagraphCount(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-2"
          />
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="mb-4">
        <label htmlFor="custom-prompt" className="block text-xs font-semibold text-neutral-700 mb-1">
          {t.customPrompt}
        </label>
        <input
          id="custom-prompt"
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={t.customPromptPlaceholder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
        />
      </div>

      {/* Action Buttons for AI Generation */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <button
          id="btn-generate-script"
          type="button"
          onClick={handleGenerateScript}
          disabled={isGeneratingScript}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
        >
          {isGeneratingScript ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isGeneratingScript ? t.generatingScript : t.generateScript}
        </button>

        <button
          id="btn-generate-terms"
          type="button"
          onClick={() => handleGenerateTerms()}
          disabled={isGeneratingTerms}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all disabled:opacity-50"
        >
          {isGeneratingTerms ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Tags className="h-3.5 w-3.5 text-neutral-500" />
          )}
          {isGeneratingTerms ? t.generatingTerms : t.generateTerms}
        </button>
      </div>

      {/* Video Script Textarea */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="video-script" className="text-xs font-semibold text-neutral-700">
            {t.videoScriptLabel}
          </label>
          <span className="text-[11px] text-neutral-400 font-mono">
            {script.length} chars
          </span>
        </div>
        <textarea
          id="video-script"
          rows={5}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={t.videoScriptPlaceholder}
          className="w-full rounded-lg border border-neutral-300 p-3 text-xs leading-relaxed focus:border-indigo-500 focus:outline-hidden font-sans"
        />
      </div>

      {/* Video Search Terms / Keywords */}
      <div>
        <label htmlFor="video-terms" className="block text-xs font-semibold text-neutral-700 mb-1">
          {t.videoTermsLabel}
        </label>
        <input
          id="video-terms"
          type="text"
          value={terms.join(', ')}
          onChange={(e) => handleTermsChange(e.target.value)}
          placeholder={t.videoTermsPlaceholder}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
        />
        {terms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {terms.map((term, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 border border-neutral-200"
              >
                #{term}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
