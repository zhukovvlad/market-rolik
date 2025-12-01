import { AspectRatio } from '../constants';

export interface ProjectSettings {
  productName?: string;
  description?: string;
  usps?: string[];
  mainImage?: string;
  prompt?: string;
  aspectRatio?: AspectRatio;
  [key: string]: unknown;
}
