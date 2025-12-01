export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string;
  aspectRatio?: string;
  [key: string]: unknown;
}
