// IMPORTANT: Keep this in sync with frontend/types/project.ts
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '3:4'] as const;
export type AspectRatio = typeof ASPECT_RATIOS[number];

export const MUSIC_THEMES = ['energetic', 'calm', 'lofi'] as const;
export type MusicTheme = typeof MUSIC_THEMES[number];

export const TTS_VOICES = ['ermil', 'zahar', 'jane', 'alena', 'omazh'] as const;
export type TtsVoice = typeof TTS_VOICES[number];
