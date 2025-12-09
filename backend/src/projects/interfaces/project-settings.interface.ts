import { AspectRatio } from '../constants';

export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string; // Kling animation prompt
  scenePrompt?: string; // Photoroom background generation prompt
  activeSceneAssetId?: string; // ID выбранного ассета для анимации
  aspectRatio?: AspectRatio;
  musicTheme?: 'energetic' | 'calm' | 'lofi';
  ttsEnabled?: boolean;
  ttsText?: string;
  ttsVoice?: 'ermil' | 'zahar' | 'jane' | 'alena' | 'omazh';
  [key: string]: unknown;
}
