import React, { useState, useEffect, useRef } from 'react';
import { Locale, i18n } from './i18n';
import { TaskRecord, TaskVideoRequest } from './types';
import { Header } from './components/Header';
import { ScriptPanel } from './components/ScriptPanel';
import { VideoSettingsPanel } from './components/VideoSettingsPanel';
import { VoiceSubtitlePanel } from './components/VoiceSubtitlePanel';
import { BgmPanel } from './components/BgmPanel';
import { TaskListPanel } from './components/TaskListPanel';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { Sparkles, ArrowRight, Video, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastState {
  type: 'info' | 'success' | 'error';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('id');
  const t = i18n[locale];

  // Script State
  const [subject, setSubject] = useState('Misteri Segitiga Bermuda dan Rahasianya');
  const [script, setScript] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [scriptLanguage, setScriptLanguage] = useState('id');
  const [paragraphCount, setParagraphCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState('');

  // Video Settings State
  const [aspect, setAspect] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [source, setSource] = useState<'pexels' | 'pixabay' | 'ai' | 'local'>('pexels');
  const [transition, setTransition] = useState<'none' | 'fade' | 'slide' | 'zoom'>('fade');

  // Voice & Subtitle State
  const [voice, setVoice] = useState('id-ID-GadisNeural');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [fontSize, setFontSize] = useState(22);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [subtitlePos, setSubtitlePos] = useState<'bottom' | 'center' | 'top'>('bottom');

  // BGM State
  const [bgmType, setBgmType] = useState<'random' | 'custom' | 'none'>('random');
  const [bgmFile, setBgmFile] = useState('');
  const [bgmVolume, setBgmVolume] = useState(30);

  // Tasks State
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModalTask, setActiveModalTask] = useState<TaskRecord | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const prevTasksRef = useRef<TaskRecord[]>([]);

  // Synchronize language selection with locale
  useEffect(() => {
    if (locale === 'id') {
      setScriptLanguage('id');
      setVoice('id-ID-GadisNeural');
      if (subject.includes('AI') || subject.includes('人工智能')) {
        setSubject('Misteri Segitiga Bermuda dan Rahasianya');
      }
    } else if (locale === 'zh') {
      setScriptLanguage('zh');
      setVoice('zh-CN-XiaoxiaoNeural');
      setSubject('人工智能如何改变日常生活');
    } else {
      setScriptLanguage('en');
      setVoice('en-US-JennyNeural');
      setSubject('How AI is changing everyday life');
    }
  }, [locale]);

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/v1/tasks');
      const data = await res.json();
      if (data.data?.tasks) {
        const newTasks: TaskRecord[] = data.data.tasks;
        
        // Detect if a task just finished
        if (prevTasksRef.current.length > 0) {
          newTasks.forEach((nt) => {
            const prev = prevTasksRef.current.find((pt) => pt.task_id === nt.task_id);
            if (prev && (prev.state === 0 || prev.state === 1) && nt.state === 2) {
              setToast({
                type: 'success',
                message: locale === 'id' 
                  ? `Video "${nt.params.video_subject || 'Video'}" selesai dirender!` 
                  : locale === 'zh'
                  ? `视频 "${nt.params.video_subject || 'Video'}" 已成功合成！`
                  : `Video "${nt.params.video_subject || 'Video'}" finished rendering!`,
                actionLabel: t.viewVideo,
                onAction: () => setActiveModalTask(nt),
              });
            }
          });
        }
        prevTasksRef.current = newTasks;
        setTasks(newTasks);

        // If an open modal task was updated in background, keep it in sync
        if (activeModalTask) {
          const updated = newTasks.find((tk: TaskRecord) => tk.task_id === activeModalTask.task_id);
          if (updated) {
            setActiveModalTask(updated);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Poll tasks if any task is running or pending
  useEffect(() => {
    const hasActiveTask = tasks.some((tk) => tk.state === 0 || tk.state === 1);
    if (!hasActiveTask) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 1500);

    return () => clearInterval(interval);
  }, [tasks, activeModalTask]);

  // Handle Video Generation Submission
  const handleStartGenerate = async () => {
    if (!subject.trim() && !script.trim()) {
      setToast({
        type: 'error',
        message: locale === 'id' 
          ? 'Silakan masukkan topik video atau naskah terlebih dahulu.' 
          : locale === 'zh' 
          ? '请先输入视频主题或文案脚本' 
          : 'Please provide a video subject or script first',
      });
      return;
    }

    setIsSubmitting(true);
    setToast({
      type: 'info',
      message: locale === 'id'
        ? 'Memulai sintesis video AI... Script, footage, dan audio sedang diproses.'
        : locale === 'zh'
        ? '已启动视频合成任务，正在处理文案、素材与音频...'
        : 'Video synthesis started! Processing script, footage, and audio track...',
    });

    const payload: TaskVideoRequest = {
      video_subject: subject,
      video_script: script,
      video_script_prompt: customPrompt,
      video_terms: terms,
      video_language: scriptLanguage,
      video_aspect: aspect,
      voice_name: voice,
      voice_rate: voiceSpeed,
      bgm_type: bgmType,
      bgm_file: bgmFile,
      bgm_volume: bgmVolume,
      subtitle_enabled: subtitleEnabled,
      font_size: fontSize,
      text_fore_color: fontColor,
      stroke_color: strokeColor,
      subtitle_position: subtitlePos,
      video_source: source,
      video_transition_mode: transition,
      paragraph_number: paragraphCount,
    };

    try {
      const res = await fetch('/api/v1/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.data?.task_id) {
        await fetchTasks();
        const taskSection = document.getElementById('task-list-section');
        taskSection?.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error(data.message || 'Failed to start video synthesis');
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Error creating task',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
      if (activeModalTask?.task_id === taskId) {
        setActiveModalTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const activeTaskCount = tasks.filter((t) => t.state === 0 || t.state === 1).length;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header
        locale={locale}
        setLocale={setLocale}
        activeTaskCount={activeTaskCount}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time Notification Banner */}
        {toast && (
          <div
            className={`rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs border transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-indigo-600 shrink-0 animate-pulse" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={toast.onAction}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-xs"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Info Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">💸</span>
              <h2 className="text-xl font-bold tracking-tight">
                {t.appName}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              {t.appDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartGenerate}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-md hover:bg-neutral-50 active:scale-98 transition-all disabled:opacity-50 shrink-0"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>{isSubmitting ? t.generating : t.startGenerate}</span>
            <ArrowRight className="h-4 w-4 text-indigo-600" />
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Generation & Keywords (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ScriptPanel
              locale={locale}
              subject={subject}
              setSubject={setSubject}
              script={script}
              setScript={setScript}
              terms={terms}
              setTerms={setTerms}
              language={scriptLanguage}
              setLanguage={setScriptLanguage}
              paragraphCount={paragraphCount}
              setParagraphCount={setParagraphCount}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
            />

            <VideoSettingsPanel
              locale={locale}
              aspect={aspect}
              setAspect={setAspect}
              source={source}
              setSource={setSource}
              transition={transition}
              setTransition={setTransition}
            />
          </div>

          {/* Right Column: Audio, Voice, Subtitles & BGM (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceSubtitlePanel
              locale={locale}
              voice={voice}
              setVoice={setVoice}
              voiceSpeed={voiceSpeed}
              setVoiceSpeed={setVoiceSpeed}
              subtitleEnabled={subtitleEnabled}
              setSubtitleEnabled={setSubtitleEnabled}
              fontSize={fontSize}
              setFontSize={setFontSize}
              fontColor={fontColor}
              setFontColor={setFontColor}
              strokeColor={strokeColor}
              setStrokeColor={setStrokeColor}
              position={subtitlePos}
              setPosition={setSubtitlePos}
            />

            <BgmPanel
              locale={locale}
              bgmType={bgmType}
              setBgmType={setBgmType}
              bgmFile={bgmFile}
              setBgmFile={setBgmFile}
              bgmVolume={bgmVolume}
              setBgmVolume={setBgmVolume}
            />

            {/* Bottom Generate Action for Mobile & Desktop */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
              <button
                type="button"
                onClick={handleStartGenerate}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isSubmitting ? t.generating : t.startGenerate}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Task Management & Execution Queue */}
        <div id="task-list-section" className="pt-2">
          <TaskListPanel
            locale={locale}
            tasks={tasks}
            onSelectTask={(task) => setActiveModalTask(task)}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </main>

      {/* Video Player Modal */}
      {activeModalTask && (
        <VideoPlayerModal
          locale={locale}
          task={activeModalTask}
          onClose={() => setActiveModalTask(null)}
        />
      )}
    </div>
  );
}
