// IMPORTANT: Keep this in sync with backend/src/projects/constants.ts
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '3:4'] as const;
export type AspectRatio = typeof ASPECT_RATIOS[number];

export const MUSIC_THEMES = ['energetic', 'calm', 'lofi'] as const;
export type MusicTheme = typeof MUSIC_THEMES[number];

export const TTS_VOICES = [
  { value: 'ermil', label: 'Эрмиль (мужской)' },
  { value: 'zahar', label: 'Захар (мужской)' },
  { value: 'jane', label: 'Джейн (женский)' },
  { value: 'alena', label: 'Алёна (женский)' },
  { value: 'omazh', label: 'Омаж (женский)' },
] as const;
export type TtsVoice = typeof TTS_VOICES[number]['value'];

export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string; // Kling animation prompt
  scenePrompt?: string; // Photoroom background generation prompt
  activeSceneAssetId?: string; // ID выбранной сцены для анимации
  aspectRatio?: AspectRatio;
  musicTheme?: MusicTheme;
  ttsEnabled?: boolean;
  ttsText?: string;
  ttsVoice?: TtsVoice;
  lastError?: string; // Последняя ошибка генерации
  failedAt?: string; // Время последней ошибки (ISO string)
  [key: string]: unknown;
}

// Type for required settings when generating a project
export type GenerateSettings = Required<Pick<ProjectSettings, 'prompt' | 'aspectRatio' | 'musicTheme' | 'ttsEnabled' | 'ttsVoice'>> & Pick<ProjectSettings, 'ttsText'>;

export interface CreateProjectRequest {
  title: string;
  settings?: ProjectSettings;
}

export type ProjectStatus = 
  | 'DRAFT'
  | 'GENERATING_IMAGE'
  | 'IMAGE_READY'
  | 'GENERATING_VIDEO'
  | 'COMPLETED'
  | 'FAILED'
  // Legacy statuses
  | 'QUEUED'
  | 'PROCESSING'
  | 'RENDERING';

export type AssetType = 
  | 'IMAGE_CLEAN'
  | 'IMAGE_SCENE'
  | 'IMAGE_UPSCALED'
  | 'VIDEO_FRAGMENT'
  | 'AUDIO_TTS'
  | 'AUDIO_VOICEOVER'
  | 'AUDIO_MUSIC';

export interface Asset {
  id: string;
  type: AssetType;
  provider: string;
  storageUrl: string;
  meta?: {
    prompt?: string;
    width?: number;
    height?: number;
    text?: string;
    voice?: string;
    createdAt?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  assets?: Asset[];
  resultVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
