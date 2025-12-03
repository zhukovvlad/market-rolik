// IMPORTANT: Keep this in sync with backend/src/projects/constants.ts
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '3:4'] as const;
export type AspectRatio = typeof ASPECT_RATIOS[number];

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

export interface CreateProjectRequest {
  title: string;
  settings?: ProjectSettings;
}
