import { AspectRatio, MusicTheme, TtsVoice } from '../constants';

/**
 * Interface for project settings stored in the database
 * All fields are optional as they can be set incrementally during project creation
 */
export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string; // Kling animation prompt
  scenePrompt?: string; // Photoroom background generation prompt
  activeSceneAssetId?: string; // ID выбранного ассета для анимации
  aspectRatio?: AspectRatio;
  musicTheme?: MusicTheme;
  ttsEnabled?: boolean;
  ttsText?: string;
  ttsVoice?: TtsVoice;
  lastError?: string; // Последняя ошибка генерации
  failedAt?: string; // Время последней ошибки (ISO string)
}
