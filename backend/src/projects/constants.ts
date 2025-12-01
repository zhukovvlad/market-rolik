export const ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;
export type AspectRatio = typeof ASPECT_RATIOS[number];
