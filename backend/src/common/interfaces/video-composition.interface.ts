/**
 * Input props for Remotion video composition
 * This interface should match the zod schema in video/src/Composition.tsx
 */
export interface VideoCompositionInput extends Record<string, unknown> {
  title: string;
  mainImage: string;
  usps: string[];
  primaryColor: string;
}
