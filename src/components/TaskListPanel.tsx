import React from 'react';
import { Locale, i18n } from '../i18n';
import { TaskRecord } from '../types';
import { Film, CheckCircle2, Clock, AlertTriangle, Play, Download, Trash2, FileText } from 'lucide-react';

interface TaskListPanelProps {
  locale: Locale;
  tasks: TaskRecord[];
  onSelectTask: (task: TaskRecord) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskListPanel: React.FC<TaskListPanelProps> = ({
  locale,
  tasks,
  onSelectTask,
  onDeleteTask,
}) => {
  const t = i18n[locale];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-neutral-900">
            {t.taskManager}
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
            {tasks.length}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 text-center">
          <Film className="mx-auto h-10 w-10 text-neutral-300 mb-2.5" />
          <p className="text-sm font-medium text-neutral-600">
            {t.noTasks}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {tasks.map((task) => {
            const isCompleted = task.state === 2;
            const isRunning = task.state === 1;
            const isFailed = task.state === 3;

            return (
              <div
                key={task.task_id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 hover:border-neutral-300 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-semibold text-sm text-neutral-900 truncate">
                      {task.params.video_subject || 'Video Generation'}
                    </span>
                    <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-[11px] font-mono text-neutral-700">
                      {task.params.video_aspect || '9:16'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {t.taskStatusCompleted}
                      </span>
                    )}
                    {isRunning && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-xs font-medium text-amber-700 animate-pulse">
                        <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                        {t.taskStatusRunning} ({task.progress}%)
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        {t.taskStatusFailed}
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.task_id)}
                      className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-200 hover:text-rose-600 transition-all"
                      title={t.deleteTask}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and message if running */}
                {isRunning && (
                  <div className="my-2.5">
                    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500 font-mono">
                      {task.progress_message}
                    </p>
                  </div>
                )}

                {/* Metadata & Scenes Count */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 my-2">
                  <span>
                    {t.scenesCount}:{' '}
                    <strong className="text-neutral-700 font-medium">
                      {task.scenes?.length || task.params.paragraph_number || 4}
                    </strong>
                  </span>
                  {task.scenes && (
                    <span>
                      {t.duration}:{' '}
                      <strong className="text-neutral-700 font-medium">
                        {task.scenes.reduce((a, s) => a + s.duration, 0).toFixed(1)} {t.seconds}
                      </strong>
                    </span>
                  )}
                  <span>
                    {t.createdAt}: {new Date(task.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Actions when completed */}
                {isCompleted && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/60">
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>{t.viewVideo}</span>
                    </button>

                    {task.srt_content && (
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([task.srt_content!], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${task.params.video_subject || 'subtitles'}.srt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
                      >
                        <FileText className="h-3.5 w-3.5 text-amber-500" />
                        <span>SRT</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const videoUrl = task.scenes?.[0]?.videoUrl || task.videos?.[0];
                        if (videoUrl) {
                          const a = document.createElement('a');
                          a.href = videoUrl;
                          a.download = `${task.params.video_subject || 'video'}.mp4`;
                          a.target = '_blank';
                          a.click();
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
                    >
                      <Download className="h-3.5 w-3.5 text-neutral-600" />
                      <span>{t.downloadVideo}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
