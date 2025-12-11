import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface ProductAnalysis {
  productName: string;
  description: string;
  usps: string[];
  scenePrompt: string; // EN для генерации фона
  category: string;
}

@Injectable()
export class AiTextService {
  private readonly logger = new Logger(AiTextService.name);
  private genAI: GoogleGenAI;
  private readonly modelName: string;
  private static readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName = this.configService.get<string>('GEMINI_MODEL_TEXT_SERVICE', 'gemini-2.5-flash');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will not work.');
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  /**
   * ВАРИАНТ 1: Анализ файла из памяти (для uploadFile контроллера)
   */
  async analyzeImageBuffer(buffer: Buffer, mimeType: string, uspCount: number = 3): Promise<ProductAnalysis | null> {
    try {
      const base64Image = buffer.toString('base64');
      return await this.callGemini(base64Image, mimeType, uspCount);
    } catch (error) {
      this.logger.error(`Buffer analysis failed: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * ВАРИАНТ 2: Анализ по URL (для импорта по ссылке)
   */
  async generateProductData(imageUrl: string, uspCount: number = 3): Promise<ProductAnalysis> {
    this.validateImageUrl(imageUrl);

    try {
      // Скачиваем изображение и конвертируем в base64
      const { buffer, mimeType } = await this.downloadImage(imageUrl);
      const base64Image = buffer.toString('base64');
      return await this.callGemini(base64Image, mimeType, uspCount);
    } catch (error) {
       this.logger.error(`URL analysis failed: ${error instanceof Error ? error.message : error}`);
       return {
        productName: 'Новый товар',
        description: 'Описание товара будет сгенерировано позже.',
        usps: ['Быстрая доставка', 'Высокое качество', 'Лучшая цена'],
        scenePrompt: 'professional product photography, studio lighting, 4k',
        category: 'other'
      };
    }
  }

  /**
   * Общая приватная логика общения с Gemini
   */
  private async callGemini(base64Image: string, mimeType: string, uspCount: number = 3): Promise<ProductAnalysis> {
    this.logger.log(`🤖 Sending request to Gemini (${this.modelName}) for ${uspCount} USPs...`);
    
    const prompt = `
      You are a world-class creative director, marketer, and product photographer.
      Analyze the provided IMAGE and generate structured data for a high-end commercial video.

      This prompt is SELF-ADAPTING:
      - First, identify what the product is.
      - Next, determine its implicit category (cosmetics, electronics, food, clothing, industrial, toys, tools, jewelry, others).
      - Then adapt the writing style, depth, tone, and background aesthetics to match the visual product type.
      - If category is ambiguous, choose the most visually and commercially appropriate interpretation based on the image.

      OUTPUT ONLY VALID JSON with the following fields:

      1. "productName": 
         - STRICTLY the actual product name (Brand + Product Type) as seen on the package or inferred.
         - DO NOT add marketing adjectives (e.g. avoid "Amazing", "Luxury", "Best" unless part of the official brand name).
         - Keep it factual, precise, and short (in Russian).

      2. "description": 
         - 1-2 sentences (in Russian).
         - Selling, emotional, vivid.
         - Tone adapts automatically: 
            * luxury → elegant and soft
            * tech → innovative and confident
            * organic → warm and natural
            * industrial → strong and functional
            * kids/toys → playful

      3. "usps": 
         - Array of EXACTLY ${uspCount} short unique selling points.
         - Base them on visual clues (text on package) OR standard benefits for this product type if text is unreadable.
         - Each USP should be concise (3-7 words).
         - Adapt the persuasion angle to the product's inferred customer segment. (in Russian).

      4. "scenePrompt": 
         - A high-end text-to-image background prompt written in ENGLISH.
         - Describe ONLY the environment, lighting, mood, textures, atmosphere. 
           NEVER mention or describe the product itself.
         - Must include the quality tags: 
             "cinematic lighting", "depth of field", "photorealistic", "8k", "masterpiece".
         - Auto-select visual style based on inferred category:
             * cosmetics/luxury → marble, silk, water ripples, pastel lighting  
             * electronics/tech → concrete, neon accents, sleek dark studio, futuristic ambience  
             * food/organic → wooden textures, warm sunlight, leaves, fruits, natural bokeh  
             * industrial/tools → metal, workshop blur, dramatic hard light  
             * jewelry → velvet, gold reflections, elegant soft shadows  
             * kids/toys → bright playful textures, soft glowing light  
         - If category doesn't match any rule, choose the *artistically best* commercial background.

      5. "category":
         - One-word inferred category ("cosmetics", "electronics", "food", "clothing", etc.).
         - If ambiguous, choose the closest commercially relevant category.

      Ensure JSON is valid and contains no comments, explanations, or extra text. Do not use markdown code blocks.
    `;

    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType: mimeType } },
        ],
        config: { responseMimeType: 'application/json' }
      });

      // ИСПРАВЛЕНИЕ: обращаемся как к свойству, без скобок
      const text = response.text;
      this.logger.log(`📝 Gemini Raw Response: ${text}`);
      
      const cleanText = text ? text.replace(/```json/g, '').replace(/```/g, '').trim() : '{}';
      
      const parsed = JSON.parse(cleanText);
      this.logger.log(`✅ Parsed JSON: ${JSON.stringify(parsed, null, 2)}`);

      return {
        productName: parsed.productName || 'Новый товар',
        description: parsed.description || '',
        usps: Array.isArray(parsed.usps) ? parsed.usps.slice(0, 7) : [],
        scenePrompt: parsed.scenePrompt || 'professional product photography, studio lighting, 4k',
        category: parsed.category || 'other'
      };
    } catch (e) {
      throw new Error(`AI Analysis Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Вспомогательные методы
  private validateImageUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (e) {
      throw new BadRequestException('Invalid URL format');
    }
    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('Only HTTPS URLs are allowed');
    }
  }

  private async downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
      
      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > AiTextService.MAX_IMAGE_SIZE) {
        throw new Error('Image too large');
      }
      
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength > AiTextService.MAX_IMAGE_SIZE) throw new Error('Image too large');
      
      return { 
        buffer, 
        mimeType: res.headers.get('content-type') || 'image/jpeg' 
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}