export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '3:4'] as const;
export type AspectRatio = typeof ASPECT_RATIOS[number];

export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string;
  aspectRatio?: AspectRatio;
  [key: string]: unknown;
}

export interface CreateProjectRequest {
  title: string;
  settings?: ProjectSettings;
}
