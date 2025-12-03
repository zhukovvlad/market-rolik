import { AspectRatio } from '../constants';

export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string;
  aspectRatio?: AspectRatio;
  musicTheme?: 'energetic' | 'calm' | 'lofi';
  ttsEnabled?: boolean;
  ttsText?: string;
  ttsVoice?: 'ermil' | 'zahar' | 'jane' | 'alena' | 'omazh';
  [key: string]: unknown;
}
