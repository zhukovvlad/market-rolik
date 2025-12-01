import { ASPECT_RATIOS } from './constants';
import * as fs from 'fs';
import * as path from 'path';

describe('Constants Sync', () => {
  it('should match frontend ASPECT_RATIOS', () => {
    // Path to frontend file relative to this test file
    // We are in /home/zhukovvlad/Projects/market-rolik/backend/src/projects/constants.spec.ts
    // We want /home/zhukovvlad/Projects/market-rolik/frontend/types/project.ts
    // So: ../../../frontend/types/project.ts
    const frontendPath = path.resolve(process.cwd(), '../frontend/types/project.ts');
    if (!fs.existsSync(frontendPath)) {
      console.warn('Frontend file not found, skipping sync test');
      return;
    }

    const frontendContent = fs.readFileSync(frontendPath, 'utf-8');
    // Extract the array content using regex
    // Matches: export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '3:4'] as const;
    const match = frontendContent.match(/export const ASPECT_RATIOS = (\[.*?\]) as const;/s);
    
    if (match && match[1]) {
      // Parse the array string (assuming it's valid JSON-like structure with single quotes)
      // Replace single quotes with double quotes to parse as JSON
      const jsonString = match[1].replace(/'/g, '"');
      const frontendRatios = JSON.parse(jsonString);
      
      expect(frontendRatios).toEqual(expect.arrayContaining(ASPECT_RATIOS));
      expect(ASPECT_RATIOS).toEqual(expect.arrayContaining(frontendRatios));
    } else {
      throw new Error('Could not extract ASPECT_RATIOS from frontend/types/project.ts');
    }
  });
});
