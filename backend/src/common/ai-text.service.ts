import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface ProductData {
  title: string;
  description: string;
  usps: string[];
}

@Injectable()
export class AiTextService {
  private readonly logger = new Logger(AiTextService.name);
  private genAI: GoogleGenAI;
  private readonly allowedHosts: string[] = [];
  private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  private static get MAX_IMAGE_SIZE_MB(): number {
    return AiTextService.MAX_IMAGE_SIZE / 1024 / 1024;
  }

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will not work.');
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey || '' });

    // Initialize allowed hosts from S3 config
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
    if (s3Endpoint) {
      try {
        const url = new URL(s3Endpoint);
        this.allowedHosts.push(url.hostname);
      } catch (e) {
        this.logger.warn(`Invalid S3_ENDPOINT: ${s3Endpoint}`);
      }
    }
  }

  private validateImageUrl(url: string): void {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      throw new BadRequestException('Invalid URL format');
    }

    if (parsedUrl.protocol !== 'https:') {
      throw new BadRequestException('Only HTTPS URLs are allowed');
    }

    if (this.allowedHosts.length > 0 && !this.allowedHosts.includes(parsedUrl.hostname)) {
      throw new BadRequestException(`Domain ${parsedUrl.hostname} is not allowed. Allowed domains: ${this.allowedHosts.join(', ')}`);
    }
  }

  async generateProductData(imageUrl: string): Promise<ProductData> {
    this.validateImageUrl(imageUrl);

    try {
      this.logger.log(`Analyzing image with Gemini 2.5 Flash: ${imageUrl}`);

      // Fetch image with timeout and size limits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      let imageResp: Response;
      try {
        imageResp = await fetch(imageUrl, { signal: controller.signal });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new BadRequestException('Image fetch timed out');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!imageResp.ok) {
        throw new BadRequestException(`Failed to fetch image: ${imageResp.statusText}`);
      }

      const contentLength = imageResp.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > AiTextService.MAX_IMAGE_SIZE) {
        throw new BadRequestException(`Image is too large (max ${AiTextService.MAX_IMAGE_SIZE_MB}MB)`);
      }

      const imageBuffer = await imageResp.arrayBuffer();

      if (imageBuffer.byteLength > AiTextService.MAX_IMAGE_SIZE) {
        throw new BadRequestException(`Image is too large (max ${AiTextService.MAX_IMAGE_SIZE_MB}MB)`);
      }

      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

      this.logger.log(`Image fetched successfully. Size: ${imageBuffer.byteLength} bytes, MIME: ${mimeType}`);

      const prompt = `
        Analyze this product image and generate a JSON response with the following fields:
        1. "title": A short, catchy product name (in Russian).
        2. "description": A selling description (2-3 sentences, in Russian).
        3. "usps": An array of 3 unique selling points (short phrases, in Russian).
        
        Return ONLY valid JSON. Do not use markdown code blocks.
      `;

      this.logger.log('Calling Gemini API...');
      
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      this.logger.log('Gemini API call completed');

      const text = response.text;

      // Clean up markdown if present (though responseMimeType: 'application/json' should handle it)
      const cleanText = text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : '{}';

      this.logger.log('Gemini response: ' + cleanText);

      const parsed = JSON.parse(cleanText);
      if (!parsed.title || !parsed.description || !Array.isArray(parsed.usps)) {
        this.logger.error('Invalid response structure. Parsed:', parsed);
        throw new Error('Invalid response structure from AI');
      }
      return parsed as ProductData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Enhanced error logging
      this.logger.error('Failed to generate product data');
      this.logger.error(`Error type: ${error?.constructor?.name}`);
      this.logger.error(`Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof Error) {
        this.logger.error(`Error stack: ${error.stack}`);
      }
      
      // Log the actual error object
      if (error && typeof error === 'object') {
        try {
          this.logger.error(`Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
        } catch (e) {
          this.logger.error('Could not stringify error object');
        }
      }
      
      // Fallback data
      return {
        title: 'Новый товар',
        description: 'Описание товара будет сгенерировано позже.',
        usps: ['Быстрая доставка', 'Высокое качество', 'Лучшая цена'],
      };
    }
  }
}
