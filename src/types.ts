export interface TaskVideoRequest {
  video_subject: string;
  video_script?: string;
  video_terms?: string[];
  video_language?: string;
  video_aspect?: '9:16' | '16:9' | '1:1';
  voice_name?: string;
  voice_rate?: number;
  voice_volume?: number;
  bgm_type?: 'random' | 'custom' | 'none';
  bgm_file?: string;
  bgm_volume?: number;
  subtitle_enabled?: boolean;
  font_name?: string;
  font_size?: number;
  text_fore_color?: string;
  text_background_color?: string;
  stroke_color?: string;
  stroke_width?: number;
  subtitle_position?: 'bottom' | 'center' | 'top';
  video_source?: 'pexels' | 'pixabay' | 'ai' | 'local';
  video_concat_mode?: 'random' | 'sequential';
  video_transition_mode?: 'none' | 'fade' | 'slide' | 'zoom';
  paragraph_number?: number;
}

export interface VideoScene {
  id: number;
  text: string;
  keyword: string;
  duration: number; // in seconds
  videoUrl: string;
  imageUrl?: string;
  startTime: number;
  endTime: number;
}

export interface TaskRecord {
  task_id: string;
  request_id: string;
  state: number; // 0: pending, 1: running, 2: completed, 3: failed
  progress: number; // 0 - 100
  progress_message: string;
  params: TaskVideoRequest;
  created_at: string;
  updated_at: string;
  video_script?: string;
  video_terms?: string[];
  videos?: string[];
  subtitles?: string[];
  srt_content?: string;
  vtt_content?: string;
  bgm_url?: string;
  scenes?: VideoScene[];
  error?: string;
}

export interface BgmFile {
  name: string;
  file: string;
  size: number;
  url: string;
}

export interface ScriptGenerationParams {
  video_subject: string;
  video_language?: string;
  paragraph_number?: number;
  video_script_prompt?: string;
  custom_system_prompt?: string;
}

export interface TermsGenerationParams {
  video_subject: string;
  video_script: string;
  amount?: number;
}
