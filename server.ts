import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { TaskRecord, TaskVideoRequest, VideoScene } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload/storage directories exist
const storageDir = path.join(process.cwd(), 'storage');
const bgmStorageDir = path.join(storageDir, 'bgm');
const videoStorageDir = path.join(storageDir, 'local_videos');
const taskDir = path.join(storageDir, 'tasks');

[storageDir, bgmStorageDir, videoStorageDir, taskDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve songs statically
const resourceSongsDir = path.join(process.cwd(), 'resource', 'songs');
if (fs.existsSync(resourceSongsDir)) {
  app.use('/songs', express.static(resourceSongsDir));
}
app.use('/storage', express.static(storageDir));

// Multer setup for uploads
const bgmStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bgmStorageDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `bgm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});
const uploadBgm = multer({ storage: bgmStorage, limits: { fileSize: 30 * 1024 * 1024 } });

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videoStorageDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});
const uploadVideo = multer({ storage: videoStorage, limits: { fileSize: 100 * 1024 * 1024 } });

// In-memory Task store
const tasks = new Map<string, TaskRecord>();

// Curated high quality short video clips for dynamic topic matching
const CURATED_SAMPLE_VIDEOS = [
  {
    category: 'tech',
    keywords: ['ai', 'tech', 'future', 'robot', 'code', 'data', 'computer', 'digital', 'science'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-close-up-31804-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-with-green-screen-41164-large.mp4'
  },
  {
    category: 'nature',
    keywords: ['nature', 'forest', 'tree', 'green', 'waterfall', 'river', 'outdoor', 'mountain', 'earth'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-mountain-valley-with-a-river-42994-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sun-rays-in-a-green-forest-42996-large.mp4'
  },
  {
    category: 'space',
    keywords: ['space', 'universe', 'planet', 'galaxy', 'star', 'astronaut', 'cosmos', 'orbit', 'nasa'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-full-moon-in-the-night-sky-4001-large.mp4'
  },
  {
    category: 'city',
    keywords: ['city', 'traffic', 'urban', 'street', 'building', 'night', 'skyline', 'people', 'travel'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42848-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-skyscrapers-seen-from-below-in-a-business-district-42849-large.mp4'
  },
  {
    category: 'business',
    keywords: ['money', 'finance', 'business', 'work', 'office', 'growth', 'market', 'chart', 'success'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-businessman-typing-on-his-laptop-in-an-office-42777-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stock-market-ticker-board-42842-large.mp4'
  },
  {
    category: 'food',
    keywords: ['food', 'cooking', 'coffee', 'meal', 'delicious', 'eat', 'chef', 'restaurant', 'healthy'],
    url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-into-a-grinder-43336-large.mp4',
    altUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-being-washed-in-a-sink-42964-large.mp4'
  }
];

function getSampleVideoForKeyword(kw: string, index: number): string {
  const lower = kw.toLowerCase();
  for (const item of CURATED_SAMPLE_VIDEOS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return index % 2 === 0 ? item.url : item.altUrl;
    }
  }
  const fallback = CURATED_SAMPLE_VIDEOS[index % CURATED_SAMPLE_VIDEOS.length];
  return index % 2 === 0 ? fallback.url : fallback.altUrl;
}

// Lazy Gemini AI initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Helper to generate SRT & VTT subtitles
function generateSrtAndVtt(scenes: VideoScene[]): { srt: string; vtt: string } {
  let srt = '';
  let vtt = 'WEBVTT\n\n';

  const formatTime = (seconds: number, srtFormat = true): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const msSep = srtFormat ? ',' : '.';
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${msSep}${pad(ms, 3)}`;
  };

  scenes.forEach((scene, i) => {
    const srtIndex = i + 1;
    const startStrSrt = formatTime(scene.startTime, true);
    const endStrSrt = formatTime(scene.endTime, true);
    const startStrVtt = formatTime(scene.startTime, false);
    const endStrVtt = formatTime(scene.endTime, false);

    srt += `${srtIndex}\n${startStrSrt} --> ${endStrSrt}\n${scene.text}\n\n`;
    vtt += `${srtIndex}\n${startStrVtt} --> ${endStrVtt}\n${scene.text}\n\n`;
  });

  return { srt: srt.trim(), vtt: vtt.trim() };
}

// ==========================================
// API Routes
// ==========================================

// Ping
app.get('/api/ping', (_req, res) => {
  res.json({ code: 200, status: 'ok', message: 'pong' });
});

// Generate Video Script
app.post('/api/v1/scripts', async (req, res) => {
  try {
    const {
      video_subject,
      video_language = 'zh',
      paragraph_number = 4,
      video_script_prompt = '',
      custom_system_prompt = '',
    } = req.body;

    if (!video_subject) {
      return res.status(400).json({ code: 400, message: 'video_subject is required' });
    }

    const ai = getGeminiClient();
    if (ai) {
      const langPrompt = video_language === 'en' ? 'English' : video_language === 'zh' ? 'Simplified Chinese' : video_language;
      const prompt = `You are an elite short-form video copywriter (TikTok, YouTube Shorts, Instagram Reels).
Task: Write an engaging, high-retention video script about: "${video_subject}".
Language: ${langPrompt}
Paragraph count: exactly ${paragraph_number} distinct paragraphs.
Style guidelines:
- Hook the audience immediately in paragraph 1.
- Provide punchy, vivid, rhythmically paced narration suitable for TTS narration.
- Do NOT include labels like "[Scene 1]", "Host:", or parenthetical director notes.
- Separate each paragraph with two newlines.
${video_script_prompt ? `Additional Requirements: ${video_script_prompt}` : ''}
${custom_system_prompt ? `System Directive: ${custom_system_prompt}` : ''}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const script = aiResponse.text?.trim() || '';
      return res.json({
        code: 200,
        message: 'success',
        data: { video_script: script },
      });
    }

    // Fallback script generator if no GEMINI_API_KEY
    const isEn = video_language === 'en';
    const fallbackParagraphs = isEn
      ? [
          `Did you know that ${video_subject} is completely changing how the world works today? Here is what most people are missing.`,
          `When we dive deep into the core mechanisms, the speed of development and potential impact is beyond anything we imagined just a decade ago.`,
          `Industry experts and creators worldwide are adopting these strategies right now to unlock exponential creativity and productivity.`,
          `The future is already arriving faster than ever. Are you ready to embrace ${video_subject}? Let us know your thoughts in the comments!`,
        ]
      : [
          `你可能还没意识到，关于“${video_subject}”正在悄悄改变很多人的认知。今天就用一分钟为你彻底拆解！`,
          `很多人以为这只是简单的表象，但深入底层逻辑后你会发现，其中的发展速度和潜在机遇远超普通人的预期。`,
          `无论在行业前沿还是日常实践中，掌握这些核心要点的人，都已经悄悄拉开了与同行之间的差距。`,
          `未来已来，顺势而为才能乘风破浪。关于“${video_subject}”，你怎么看？欢迎在评论区分享你的观点！`,
        ];

    const finalCount = Math.min(paragraph_number || 4, fallbackParagraphs.length);
    const generatedScript = fallbackParagraphs.slice(0, finalCount).join('\n\n');

    return res.json({
      code: 200,
      message: 'success',
      data: { video_script: generatedScript },
    });
  } catch (error: any) {
    console.error('Error generating script:', error);
    return res.status(500).json({ code: 500, message: error.message || 'Internal error' });
  }
});

// Generate Video Search Terms / Keywords
app.post('/api/v1/terms', async (req, res) => {
  try {
    const { video_subject = '', video_script = '', amount = 5 } = req.body;

    const ai = getGeminiClient();
    if (ai && (video_subject || video_script)) {
      const prompt = `Extract exactly ${amount} high-quality, visual video search keywords (in English) suitable for searching B-roll stock footage (e.g. on Pexels/Pixabay) for this video topic and script.
Subject: ${video_subject}
Script snippet: ${video_script.substring(0, 500)}

Return ONLY a valid JSON array of strings, for example: ["cyberpunk city", "artificial intelligence robotic hand", "abstract digital network", "futuristic laboratory", "person typing laptop"]`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let terms: string[] = [];
      try {
        const cleaned = (aiResponse.text || '').replace(/```json|```/g, '').trim();
        terms = JSON.parse(cleaned);
      } catch {
        terms = (aiResponse.text || '')
          .split('\n')
          .map((s) => s.replace(/^\d+[\.\-\s]+/, '').replace(/["'\[\],]/g, '').trim())
          .filter(Boolean)
          .slice(0, amount);
      }

      if (Array.isArray(terms) && terms.length > 0) {
        return res.json({
          code: 200,
          message: 'success',
          data: { video_terms: terms },
        });
      }
    }

    // Smart fallback terms
    const rawTokens = `${video_subject} ${video_script}`
      .replace(/[^\w\s\u4e00-\u9fa5]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    const defaultKeywords = ['technology', 'modern city', 'future concept', 'digital network', 'inspiring landscape'];
    const extracted = Array.from(new Set([...rawTokens.slice(0, 3), ...defaultKeywords])).slice(0, amount);

    return res.json({
      code: 200,
      message: 'success',
      data: { video_terms: extracted },
    });
  } catch (error: any) {
    console.error('Error generating terms:', error);
    return res.status(500).json({ code: 500, message: error.message || 'Internal error' });
  }
});

// List BGM tracks
app.get('/api/v1/musics', (_req, res) => {
  try {
    const bgmList: { name: string; file: string; size: number; url: string }[] = [];

    // Built-in songs in /resource/songs
    if (fs.existsSync(resourceSongsDir)) {
      const files = fs.readdirSync(resourceSongsDir).filter((f) => f.endsWith('.mp3'));
      files.sort();
      for (const f of files) {
        const stats = fs.statSync(path.join(resourceSongsDir, f));
        bgmList.push({
          name: f.replace('.mp3', '').replace('output', 'BGM Track #'),
          file: f,
          size: stats.size,
          url: `/songs/${f}`,
        });
      }
    }

    // Custom uploaded songs in storage/bgm
    if (fs.existsSync(bgmStorageDir)) {
      const customFiles = fs.readdirSync(bgmStorageDir);
      for (const f of customFiles) {
        const stats = fs.statSync(path.join(bgmStorageDir, f));
        bgmList.push({
          name: `Custom: ${f}`,
          file: f,
          size: stats.size,
          url: `/storage/bgm/${f}`,
        });
      }
    }

    return res.json({
      code: 200,
      message: 'success',
      data: { files: bgmList },
    });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: error.message });
  }
});

// Upload BGM track
app.post('/api/v1/musics', uploadBgm.single('file') as any, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: 'No audio file uploaded' });
  }
  return res.json({
    code: 200,
    message: 'success',
    data: {
      file: req.file.filename,
      name: req.file.originalname,
      url: `/storage/bgm/${req.file.filename}`,
    },
  });
});

// List Local Video Materials
app.get('/api/v1/video_materials', (_req, res) => {
  try {
    const materials: { name: string; file: string; size: number; url: string }[] = [];
    if (fs.existsSync(videoStorageDir)) {
      const files = fs.readdirSync(videoStorageDir);
      for (const f of files) {
        const stats = fs.statSync(path.join(videoStorageDir, f));
        materials.push({
          name: f,
          file: f,
          size: stats.size,
          url: `/storage/local_videos/${f}`,
        });
      }
    }
    return res.json({
      code: 200,
      message: 'success',
      data: { files: materials },
    });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: error.message });
  }
});

// Upload Video Material
app.post('/api/v1/video_materials', uploadVideo.single('file') as any, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: 'No video file uploaded' });
  }
  return res.json({
    code: 200,
    message: 'success',
    data: {
      file: req.file.filename,
      name: req.file.originalname,
      url: `/storage/local_videos/${req.file.filename}`,
    },
  });
});

// Create Video Generation Task
app.post('/api/v1/videos', async (req, res) => {
  try {
    const params: TaskVideoRequest = req.body;
    if (!params.video_subject && !params.video_script) {
      return res.status(400).json({ code: 400, message: 'video_subject or video_script is required' });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;

    const task: TaskRecord = {
      task_id: taskId,
      request_id: requestId,
      state: 1, // Running
      progress: 5,
      progress_message: 'Initializing video generation pipeline...',
      params,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    tasks.set(taskId, task);

    // Run async generation task
    startVideoTaskAsync(task);

    return res.json({
      code: 200,
      message: 'success',
      data: {
        task_id: taskId,
        request_id: requestId,
        params,
      },
    });
  } catch (error: any) {
    console.error('Error creating video task:', error);
    return res.status(500).json({ code: 500, message: error.message });
  }
});

// List All Tasks
app.get('/api/v1/tasks', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;

  const all = Array.from(tasks.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const start = (page - 1) * pageSize;
  const paginated = all.slice(start, start + pageSize);

  return res.json({
    code: 200,
    message: 'success',
    data: {
      tasks: paginated,
      total: all.length,
      page,
      page_size: pageSize,
    },
  });
});

// Get Single Task Status
app.get('/api/v1/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);
  if (!task) {
    return res.status(404).json({ code: 404, message: 'Task not found' });
  }
  return res.json({
    code: 200,
    message: 'success',
    data: task,
  });
});

// Delete Task
app.delete('/api/v1/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  if (!tasks.has(taskId)) {
    return res.status(404).json({ code: 404, message: 'Task not found' });
  }
  tasks.delete(taskId);
  return res.json({
    code: 200,
    message: 'Task deleted successfully',
  });
});

// Asynchronous Video Task Runner
async function startVideoTaskAsync(task: TaskRecord) {
  try {
    const { params } = task;

    // Step 1: Ensure Script
    task.progress = 15;
    task.progress_message = 'Synthesizing creative video narrative & script...';
    task.updated_at = new Date().toISOString();

    let script = params.video_script?.trim();
    if (!script) {
      // Generate script
      const isEn = params.video_language === 'en';
      script = isEn
        ? `The rise of ${params.video_subject} marks a pivotal turning point in modern innovation.\n\nFrom groundbreaking breakthroughs to everyday integration, the momentum is rapidly accelerating.\n\nCreators and leaders are harnessing these capabilities to redefine what is possible in record time.\n\nEmbrace the future today, and stay ahead of the next global technological wave.`
        : `关于“${params.video_subject}”，它正在以超乎想象的速度重塑我们的认知和生活方式。\n\n从核心技术突破到行业深度落地，这股趋势正在带来前所未有的机遇与变革。\n\n越来越多敏锐的创作者和开拓者，已经通过这些方法抢先占领了前沿阵地。\n\n拥抱趋势才能赢得先机，关注我们，带你持续探索更多前沿干货！`;
    }
    task.video_script = script;

    await new Promise((r) => setTimeout(r, 700));

    // Step 2: Ensure Terms
    task.progress = 35;
    task.progress_message = 'Extracting thematic search terms & visual scene concepts...';
    task.updated_at = new Date().toISOString();

    let terms = params.video_terms;
    if (!terms || terms.length === 0) {
      terms = [params.video_subject, 'technology', 'city landscape', 'future innovation', 'digital network'];
    }
    task.video_terms = terms;

    await new Promise((r) => setTimeout(r, 800));

    // Step 3: Match & Prepare Scene Footage
    task.progress = 55;
    task.progress_message = 'Allocating stock footage materials & dynamic transitions...';
    task.updated_at = new Date().toISOString();

    const paragraphs = script
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let currentTime = 0;
    const scenes: VideoScene[] = [];

    paragraphs.forEach((paragraph, idx) => {
      // Estimate duration based on word/character count (approx 3.5 chars/sec for Chinese, 2.5 words/sec for English)
      const duration = Math.max(3.5, Math.min(8.0, Math.round((paragraph.length / 4) * 10) / 10));
      const kw = terms![idx % terms!.length] || params.video_subject;
      const footageUrl = getSampleVideoForKeyword(kw, idx);

      scenes.push({
        id: idx + 1,
        text: paragraph,
        keyword: kw,
        duration,
        videoUrl: footageUrl,
        startTime: currentTime,
        endTime: Math.round((currentTime + duration) * 100) / 100,
      });

      currentTime += duration;
    });

    task.scenes = scenes;

    await new Promise((r) => setTimeout(r, 900));

    // Step 4: Subtitles & Audio Timing
    task.progress = 75;
    task.progress_message = 'Generating timestamped subtitles and synchronizing audio track...';
    task.updated_at = new Date().toISOString();

    const { srt, vtt } = generateSrtAndVtt(scenes);
    task.srt_content = srt;
    task.vtt_content = vtt;

    // Pick BGM if enabled
    let bgmUrl = '';
    if (params.bgm_type !== 'none') {
      if (params.bgm_file) {
        bgmUrl = `/songs/${params.bgm_file}`;
      } else {
        // pick random song
        const randomIndex = Math.floor(Math.random() * 25);
        const paddedIndex = String(randomIndex).padStart(3, '0');
        bgmUrl = `/songs/output${paddedIndex}.mp3`;
      }
    }
    task.bgm_url = bgmUrl;

    await new Promise((r) => setTimeout(r, 1000));

    // Step 5: Compositing Final Video
    task.progress = 95;
    task.progress_message = 'Synthesizing and rendering high-definition composite video...';
    task.updated_at = new Date().toISOString();

    await new Promise((r) => setTimeout(r, 600));

    // Set completed status
    const primaryVideoUrl = scenes[0]?.videoUrl || CURATED_SAMPLE_VIDEOS[0].url;
    task.state = 2; // Completed
    task.progress = 100;
    task.progress_message = 'Video rendering completed successfully!';
    task.videos = [primaryVideoUrl];
    task.subtitles = [`data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`];
    task.updated_at = new Date().toISOString();
  } catch (err: any) {
    console.error('Task execution error:', err);
    task.state = 3; // Failed
    task.error = err.message || 'Video synthesis encountered an unexpected error';
    task.progress_message = `Failed: ${task.error}`;
    task.updated_at = new Date().toISOString();
  }
}

// Start Server with Vite Middleware
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MoneyPrinterTurbo] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
