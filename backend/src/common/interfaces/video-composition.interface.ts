/**
 * Input props for Remotion video composition
 * This interface should match the zod schema in video/src/Composition.tsx
 */
export interface VideoCompositionInput extends Record<string, unknown> {
  title: string;
  mainImage: string;
  usps: string[];
  primaryColor: string;
  audioUrl?: string | null;       // Ссылка на голос (S3)
  backgroundMusicUrl?: string | null; // Ссылка на музыку
  bgVideoUrl?: string | null; // Ссылка на видео-фон (Kling)
  width?: number;
  height?: number;
}
