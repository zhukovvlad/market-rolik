/**
 * @fileoverview Video Processing Pipeline - Главный процессор для генерации маркетинговых видеороликов
 * 
 * Этот модуль реализует полный конвейер создания видео из статических изображений:
 * 1. Генерация AI-сцены (Photoroom API)
 * 2. Upscaling изображения (Stability AI)
 * 3. Генерация анимации (Kling AI)
 * 4. Синтез речи (TTS)
 * 5. Финальный рендер (Remotion)
 * 
 * @module VideoProcessor
 * @requires @nestjs/bull
 * @requires bull
 */

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiVideoService } from '../../common/ai-video.service';
import { StorageService } from '../../storage/storage.service';
import { ProjectsService } from '../../projects/projects.service';
import { ProxyService } from '../../common/proxy.service';
import { RenderService } from '../../common/render.service';
import { ProjectStatus } from '../../projects/project.entity';
import { VideoCompositionInput } from '../../common/interfaces/video-composition.interface';
import { TtsService } from '../../common/tts.service';
// import { AiTextService } from '../../common/ai-text.service'; // Раскомментируй, когда будет готов сервис текстов
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

/**
 * Вспомогательная функция для создания задержки в асинхронном коде
 * @param {number} ms - Количество миллисекунд для паузы
 * @returns {Promise<void>} Promise, который резолвится после указанного времени
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Вычисляет размеры изображения на основе соотношения сторон
 * 
 * Базовые размеры оптимизированы для последующего upscaling через Stability AI.
 * Используются умеренные разрешения (до 1024px), чтобы избежать лимитов API.
 * 
 * @param {string} ratio - Соотношение сторон (например, '16:9', '9:16', '1:1')
 * @returns {{ width: number; height: number }} Объект с шириной и высотой в пикселях
 * @default '9:16' - Вертикальный формат для соцсетей
 * 
 * @example
 * getDimensions('16:9') // { width: 1024, height: 576 }
 * getDimensions('9:16') // { width: 576, height: 1024 }
 */
function getDimensions(ratio: string = '9:16'): { width: number; height: number } {
  // Базовые размеры для генерации (не 4K, чтобы не перегружать вход Stability)
  // Stability потом увеличит это в x2 или x4
  switch (ratio) {
    case '16:9': return { width: 1024, height: 576 };
    case '9:16': return { width: 576, height: 1024 };
    case '1:1':  return { width: 1024, height: 1024 };
    case '4:3':  return { width: 1024, height: 768 };
    case '3:4':  return { width: 768, height: 1024 };
    default:     return { width: 576, height: 1024 };
  }
}

/**
 * Процессор очереди для генерации видео
 * 
 * Обрабатывает задачи из очереди 'video-generation' и управляет всем жизненным циклом
 * создания маркетингового видеоролика от исходного изображения до финального MP4.
 * 
 * @class VideoProcessor
 * @implements {OnModuleInit}
 * 
 * @description
 * Основной пайплайн включает:
 * - Этап 1 (Visual): Генерация сцены через Photoroom + Upscaling через Stability AI
 * - Этап 2 (Content): Параллельная генерация видео (Kling AI) и озвучки (TTS)
 * - Этап 3 (Assembly): Композиция финального видео через Remotion
 * 
 * Конфигурация через environment variables:
 * - VIDEO_POLL_DELAY_MS - Задержка между проверками статуса Kling (default: 10000)
 * - VIDEO_MAX_POLL_ATTEMPTS - Максимум попыток проверки статуса (default: 30)
 * - IMAGE_DOWNLOAD_TIMEOUT_MS - Таймаут скачивания изображений (default: 30000)
 * - VIDEO_DOWNLOAD_TIMEOUT_MS - Таймаут скачивания видео (default: 120000)
 * - PHOTOROOM_API_KEY - API ключ для Photoroom
 * - STABILITY_API_KEY - API ключ для Stability AI
 * - DEFAULT_SCENE_PROMPT - Промпт для генерации сцены по умолчанию
 */
@Processor('video-generation')
export class VideoProcessor {
  /** @private Logger instance для отслеживания работы процессора */
  private readonly logger = new Logger(VideoProcessor.name);
  
  /** @private Задержка между попытками проверки статуса Kling в миллисекундах */
  private readonly pollDelayMs: number;
  
  /** @private Максимальное количество попыток проверки статуса Kling */
  private readonly maxPollAttempts: number;
  
  /** @private Таймаут для скачивания изображений в миллисекундах */
  private readonly imageDownloadTimeoutMs: number;
  
  /** @private Таймаут для скачивания видео в миллисекундах */
  private readonly videoDownloadTimeoutMs: number;

  /**
   * Создает экземпляр VideoProcessor с внедренными зависимостями
   * 
   * @param {AiVideoService} aiVideoService - Сервис для работы с Kling AI video generation
   * @param {StorageService} storageService - Сервис для загрузки файлов в S3
   * @param {ProjectsService} projectsService - Сервис для управления проектами в БД
   * @param {ProxyService} proxyService - Прокси для HTTP запросов с retry логикой
   * @param {ConfigService} configService - Сервис конфигурации приложения
   * @param {RenderService} renderService - Сервис рендеринга видео через Remotion
   * @param {TtsService} ttsService - Сервис синтеза речи (Text-to-Speech)
   */
  constructor(
    private readonly aiVideoService: AiVideoService,
    private readonly storageService: StorageService,
    private readonly projectsService: ProjectsService,
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
    private readonly renderService: RenderService,
    private readonly ttsService: TtsService,
    // private readonly aiTextService: AiTextService, // Внедрить, когда будет готово
  ) {
    this.pollDelayMs = this.configService.get<number>('VIDEO_POLL_DELAY_MS') || 10000;
    this.maxPollAttempts = this.configService.get<number>('VIDEO_MAX_POLL_ATTEMPTS') || 30;
    this.imageDownloadTimeoutMs = this.configService.get<number>('IMAGE_DOWNLOAD_TIMEOUT_MS') || 30000;
    this.videoDownloadTimeoutMs = this.configService.get<number>('VIDEO_DOWNLOAD_TIMEOUT_MS') || 120000;
  }

  // ========================================================================
  // 🎨 ШАГ 1: ГЕНЕРАЦИЯ СЦЕНЫ (Photoroom v2/edit)
  // ========================================================================
  
  /**
   * Генерирует AI-сцену с помощью Photoroom API v2/edit
   * 
   * Принимает оригинальное изображение товара и создает профессиональную сцену
   * с заданными параметрами (промпт, размеры). Использует Photoroom's edit endpoint
   * для генерации background и композиции.
   * 
   * @private
   * @async
   * @param {string} imageUrl - URL исходного изображения товара
   * @param {string} prompt - Текстовый промпт для генерации сцены (например, "product on wooden table")
   * @param {number} width - Желаемая ширина выходного изображения в пикселях
   * @param {number} height - Желаемая высота выходного изображения в пикселях
   * @returns {Promise<Buffer>} Buffer с обработанным изображением в формате PNG
   * 
   * @throws {Error} Логирует ошибку, но возвращает оригинальное изображение как fallback
   * 
   * @example
   * const scene = await this.generateAiScene(
   *   'https://s3.../product.jpg',
   *   'product on marble surface, studio lighting',
   *   1024,
   *   1024
   * );
   * 
   * @description
   * Процесс обработки:
   * 1. Скачивает оригинальное изображение с таймаутом
   * 2. Проверяет наличие API ключа (mock mode для разработки)
   * 3. Создает FormData с изображением и параметрами
   * 4. Отправляет запрос к Photoroom API v2/edit
   * 5. При ошибке возвращает оригинал (graceful degradation)
   * 
   * Environment variables:
   * - PHOTOROOM_API_KEY - API ключ для авторизации (или 'mock' для тестирования)
   * - IMAGE_DOWNLOAD_TIMEOUT_MS - Таймаут скачивания изображения
   */
  private async generateAiScene(
    imageUrl: string, 
    prompt: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    this.logger.log(`🎨 Step 1: Generating Scene via Photoroom ("${prompt}") at ${width}x${height}...`);
    const apiKey = this.configService.get<string>('PHOTOROOM_API_KEY');
    
    // Скачиваем оригинал
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: this.imageDownloadTimeoutMs,
    });
    const inputBuffer = Buffer.from(imageResponse.data);

    if (!apiKey || apiKey === 'mock') {
        this.logger.warn('⚠️ Photoroom Mock: Skipping scene generation');
        return inputBuffer;
    }

    const formData = new FormData();
    formData.append('image_file', inputBuffer, { filename: 'original.jpg' });
    formData.append('prompt', prompt); 
    // Задаем размер выходной картинки (важно для 16:9 и прочих форматов)
    formData.append('width', width.toString());
    formData.append('height', height.toString());

    try {
      const response = await this.proxyService.post<Buffer>(
        'https://image-api.photoroom.com/v2/edit',
        formData,
        {
          headers: { 'x-api-key': apiKey, ...formData.getHeaders() },
          responseType: 'arraybuffer',
        },
      );
      return Buffer.from(response);
    } catch (error) {
      this.logger.error(`❌ Photoroom Scene Gen failed: ${error}. Using original.`);
      return inputBuffer; 
    }
  }

  // ========================================================================
  // 🚀 ШАГ 2: UPSCALE (Stability AI Fast)
  // ========================================================================
  
  /**
   * Масштабирует изображение с помощью Stability AI Fast Upscaler
   * 
   * Использует Stability AI's /v2beta/stable-image/upscale/fast endpoint для
   * быстрого увеличения разрешения изображения до 2x от исходного размера.
   * 
   * @private
   * @async
   * @param {Buffer} imageBuffer - Buffer с изображением для upscaling
   * @returns {Promise<Buffer>} Buffer с upscaled изображением или оригиналом при ошибке
   * 
   * @throws {Error} Логирует ошибку, но возвращает оригинальное изображение как fallback
   * 
   * @example
   * const upscaledImage = await this.upscaleImageFast(sceneBuffer);
   * 
   * @description
   * Процесс обработки:
   * 1. Проверяет наличие API ключа (mock mode для разработки)
   * 2. Умный pre-resize до 1024x1024 (fit: inside) для соблюдения API лимитов
   * 3. Конвертация в PNG формат
   * 4. Отправка к Stability AI /upscale/fast endpoint
   * 5. При ошибке возвращает оригинал (graceful degradation)
   * 
   * Технические детали:
   * - API лимит Stability: ~4.19 Megapixels на выходе
   * - Вход должен быть ≤1024px по длинной стороне
   * - Выход: 2x upscale (например, 1024x1024 to 2048x2048)
   * - Формат: PNG для максимального качества
   * - Header 'Accept: image/*' обязателен для получения бинарных данных
   * 
   * Environment variables:
   * - STABILITY_API_KEY - API ключ для авторизации (или 'mock' для тестирования)
   * 
   * @see {@link https://platform.stability.ai/docs/api-reference#tag/Upscale/paths/~1v2beta~1stable-image~1upscale~1fast/post}
   */
  private async upscaleImageFast(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.log('🚀 Step 2: Upscaling Image (Stability Fast)...');
    const apiKey = this.configService.get<string>('STABILITY_API_KEY');

    if (!apiKey || apiKey === 'mock') {
        this.logger.warn('⚠️ Stability Mock: Skipping upscale');
        return imageBuffer;
    }

    // 1. Умный ресайз перед отправкой (чтобы не словить 400 Bad Request из-за лимита пикселей)
    // Лимит Stability ~4.19Mpx на выходе. Вход должен быть не больше ~1024px по длинной стороне.
    const resizedBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside' }) 
        .toFormat('png')
        .toBuffer();

    const formData = new FormData();
    formData.append('image', resizedBuffer, { filename: 'scene.png' });
    formData.append('output_format', 'png'); 
    // ВАЖНО: Убираем 'prompt', так как /fast endpoint его не поддерживает!

    try {
      const response = await this.proxyService.post<Buffer>(
        'https://api.stability.ai/v2beta/stable-image/upscale/fast',
        formData,
        {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'image/*', // ВАЖНО: Исправленный заголовок (был image/png)
            ...formData.getHeaders() 
          },
          responseType: 'arraybuffer',
        },
      );
      this.logger.log(`✅ Upscale success!`);
      return Buffer.from(response);
    } catch (error) {
      let errMsg = String(error);
      if (axios.isAxiosError(error) && error.response?.data) {
          // Пытаемся прочитать текст ошибки из буфера
          errMsg = error.response.data.toString();
      }
      this.logger.error(`❌ Stability Upscale failed: ${errMsg}. Continuing with normal resolution.`);
      return imageBuffer; // Fallback: возвращаем обычную картинку
    }
  }

  // ========================================================================
  // 🎬 ГЛАВНЫЙ ПАЙПЛАЙН
  // ========================================================================
  
  /**
   * Главный обработчик задачи генерации видео из очереди 'generate-kling'
   * 
   * Запускает полный пайплайн создания маркетингового видеоролика:
   * - Этап 1 (Visual): Генерация сцены + Upscaling
   * - Этап 2 (Content): Параллельная генерация видео (Kling) и озвучки (TTS)
   * - Этап 3 (Assembly): Финальная композиция через Remotion
   * 
   * @public
   * @async
   * @param {Job<{ projectId: string; userId?: string }>} job - Bull Job с данными проекта
   * @param {string} job.data.projectId - ID проекта из базы данных
   * @param {string} [job.data.userId] - ID пользователя для проверки прав (опционально)
   * @returns {Promise<{ result: string }>} Объект с URL финального видео в S3
   * 
   * @throws {Error} При отсутствии изображения, ошибках авторизации или сбоях pipeline
   * 
   * @example
   * // Bull автоматически вызывает этот метод при появлении задачи в очереди
   * await queue.add('generate-kling', {
   *   projectId: '123e4567-e89b-12d3-a456-426614174000',
   *   userId: '456e7890-e89b-12d3-a456-426614174001'
   * });
   * 
   * @description
   * Workflow пайплайна:
   * 
   * 1. Подготовка:
   *    - Загрузка проекта из БД
   *    - Проверка прав доступа (userId)
   *    - Извлечение настроек (settings)
   * 
   * 2. Этап 1 - Визуал (последовательно):
   *    - Определение размеров на основе aspectRatio
   *    - Генерация AI-сцены через Photoroom (scenePrompt или DEFAULT_SCENE_PROMPT)
   *    - Upscaling через Stability AI (2x разрешение)
   *    - Сохранение high-res изображения в S3
   * 
   * 3. Этап 2 - Контент (параллельно):
   *    - Kling AI: Генерация видео анимации из изображения
   *    - TTS: Синтез речи из ttsText или productName+USPs
   *    - Оба процесса с graceful fallback при ошибках
   * 
   * 4. Этап 3 - Сборка:
   *    - Загрузка TTS аудио в S3 (если есть)
   *    - Получение фоновой музыки (musicTheme)
   *    - Подготовка VideoCompositionInput с удвоенными размерами
   *    - Рендер через Remotion
   *    - Загрузка финального MP4 в S3
   *    - Очистка временных файлов
   * 
   * 5. Завершение:
   *    - Обновление статуса проекта на COMPLETED
   *    - Сохранение resultVideoUrl
   *    - Возврат URL видео
   * 
   * Обработка ошибок:
   * - Логирование с stack trace
   * - Попытка обновить статус проекта на FAILED
   * - Nested try-catch для защиты от DB ошибок
   * - Пробрасывание оригинальной ошибки выше
   * 
   * Settings из проекта:
   * - mainImage (обязательно) - URL исходного изображения товара
   * - aspectRatio - Соотношение сторон (9:16, 16:9, 1:1, 4:3, 3:4)
   * - scenePrompt - Кастомный промпт для Photoroom
   * - productName - Название товара для титров
   * - usps - Массив USP для отображения
   * - ttsText - Текст для озвучки (или auto из productName+usps)
   * - ttsEnabled - Включить/выключить озвучку (default: true)
   * - ttsVoice - Голос для TTS
   * - musicTheme - Тема фоновой музыки
   * - prompt - Промпт для Kling AI анимации
   * 
   * @see {@link generateAiScene} Генерация сцены через Photoroom
   * @see {@link upscaleImageFast} Upscaling через Stability AI
   * @see {@link generateKlingVideoInternal} Генерация видео через Kling AI
   */
  @Process('generate-kling')
  async handleGenerateKling(job: Job<{ projectId: string; userId?: string }>) {
    const { projectId, userId } = job.data;
    const pipelineStartTime = Date.now();
    this.logger.log(`🎬 START Pipeline for Project ${projectId}`);

    try {
      const project = await this.projectsService.findOne(projectId);
      if (userId && project.userId !== userId) throw new Error('Unauthorized');
      
      const settings = project.settings || {};
      const originalImageUrl = settings.mainImage;
      if (!originalImageUrl) throw new Error('No main image found');

      // 0. Определяем размеры
      const { width, height } = getDimensions(settings.aspectRatio);

      // --- ЭТАП 1: ВИЗУАЛ (Последовательно) ---
      
      // 1.1 Генерируем сцену (Photoroom)
      const scenePromptValue = (settings.scenePrompt as string) ?? '';
      const bgPrompt = scenePromptValue.trim() 
        ? scenePromptValue 
        : this.configService.get<string>(
            'DEFAULT_SCENE_PROMPT',
            'professional product photography, on a wooden podium, cinematic lighting, high quality, 4k'
          );
      let visualBuffer = await this.generateAiScene(originalImageUrl, bgPrompt, width, height);

      // 1.2 Апскейл (Stability Fast) - 2 кредита
      visualBuffer = await this.upscaleImageFast(visualBuffer);

      // 1.3 Сохраняем готовую сцену (High Res)
      const highResUrl = await this.storageService.uploadFile(visualBuffer, 'image/png', 'processed');
      this.logger.log(`✅ High-Res Scene saved: ${highResUrl}`);


      // --- ЭТАП 2: КОНТЕНТ (Параллельно: Видео + Звук) ---
      this.logger.log('⚡ Starting Parallel Generation: Kling + TTS...');
      
      const textToSay = settings.ttsText || `${settings.productName || ''}. ${settings.usps?.join('. ') || ''}`;
      const shouldGenerateAudio = (settings.ttsEnabled !== false);

      // Динамический промпт (пока хардкод, позже подключим Gemini)
      let klingPrompt = settings.prompt || "slow cinematic camera zoom in, floating dust particles, high quality, 4k";

      const [s3VideoUrl, ttsResult] = await Promise.all([
        // KLING
        this.generateKlingVideoInternal(highResUrl, klingPrompt).catch(err => {
            this.logger.error(`❌ Kling failed: ${err}. Using static image.`);
            return null;
        }),

        // TTS
        shouldGenerateAudio
          ? this.ttsService.generateSpeech(textToSay, settings.ttsVoice).catch(() => null)
          : Promise.resolve(null),
      ]);


      // --- ЭТАП 3: СБОРКА (Remotion) ---
      let ttsUrl: string | null = null;
      if (ttsResult) {
         ttsUrl = await this.storageService.uploadFile(ttsResult.buffer, ttsResult.mimeType, 'audio');
      }
      const musicUrl = this.ttsService.getBackgroundMusicUrl(settings.musicTheme);

      const inputProps: VideoCompositionInput = {
        title: settings.productName || 'Новинка',
        mainImage: highResUrl, 
        bgVideoUrl: s3VideoUrl,
        usps: settings.usps || [],
        primaryColor: '#4f46e5',
        audioUrl: ttsUrl,
        backgroundMusicUrl: musicUrl,
        width: width * 2, 
        height: height * 2,
      };

      const outputFilePath = await this.renderService.renderVideo(inputProps);
      
      const fileBuffer = fs.readFileSync(outputFilePath);
      const finalS3Url = await this.storageService.uploadFile(fileBuffer, 'video/mp4', 'renders');
      
      try { fs.unlinkSync(outputFilePath); } catch (e) {}

      project.status = ProjectStatus.COMPLETED;
      project.resultVideoUrl = finalS3Url;
      await this.projectsService.save(project);

      this.logger.log(`🎉 PROJECT COMPLETE! URL: ${finalS3Url}`);
      return { result: finalS3Url };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error('Pipeline Failed', errorMessage);
      try {
        const project = await this.projectsService.findOne(projectId);
        if (project) {
          project.status = ProjectStatus.FAILED;
          await this.projectsService.save(project);
        }
      } catch (dbError) {
        const dbErrorMessage = dbError instanceof Error ? dbError.stack || dbError.message : String(dbError);
        this.logger.error('Failed to update project status', dbErrorMessage);
      }
      throw error;
    }
  }

  /**
   * Внутренний метод для генерации видео через Kling AI с polling механизмом
   * 
   * Запускает асинхронную задачу генерации видео в Kling AI и опрашивает статус
   * выполнения до получения результата или таймаута.
   * 
   * @private
   * @async
   * @param {string} imageUrl - URL изображения в S3 для генерации видео
   * @param {string} prompt - Текстовый промпт для управления анимацией
   * @returns {Promise<string>} URL сгенерированного видео в S3
   * 
   * @throws {Error} При сбое генерации или превышении максимального числа попыток
   * 
   * @example
   * const videoUrl = await this.generateKlingVideoInternal(
   *   'https://s3.../high-res-scene.png',
   *   'slow cinematic zoom, floating particles, 4k'
   * );
   * 
   * @description
   * Workflow генерации:
   * 
   * 1. Инициализация:
   *    - Создание задачи в Kling AI через aiVideoService
   *    - Получение taskId для отслеживания
   * 
   * 2. Polling цикл:
   *    - Максимум попыток: maxPollAttempts (default: 30)
   *    - Задержка между попытками: pollDelayMs (default: 10s)
   *    - Проверка статуса через aiVideoService.checkTaskStatus()
   * 
   * 3. Обработка результатов:
   *    - completed: Скачивание видео с таймаутом, загрузка в S3, возврат URL
   *    - failed: Выброс ошибки с описанием сбоя
   *    - processing: Продолжение polling
   *    - Timeout: Выброс ошибки после maxPollAttempts
   * 
   * 4. Скачивание и сохранение:
   *    - Использует proxyService.get с videoDownloadTimeoutMs (default: 2 min)
   *    - Загружает в S3 bucket в папку videos
   *    - Content-type: video/mp4
   * 
   * Конфигурация через environment variables:
   * - VIDEO_POLL_DELAY_MS - Задержка между проверками (ms)
   * - VIDEO_MAX_POLL_ATTEMPTS - Максимум попыток проверки
   * - VIDEO_DOWNLOAD_TIMEOUT_MS - Таймаут скачивания видео (ms)
   * 
   * Типичное время выполнения:
   * - Генерация: 30-120 секунд (зависит от сложности промпта)
   * - Скачивание: 10-60 секунд (зависит от размера видео)
   * - Общее: примерно 1-3 минуты
   * 
   * @see {@link AiVideoService#generateKlingVideo} Запуск задачи в Kling AI
   * @see {@link AiVideoService#checkTaskStatus} Проверка статуса задачи
   */
  private async generateKlingVideoInternal(imageUrl: string, prompt: string): Promise<string> {
    const taskId = await this.aiVideoService.generateKlingVideo(imageUrl, prompt);
    this.logger.log(`🎬 Kling Task ID: ${taskId}`);

    for (let i = 0; i < this.maxPollAttempts; i++) {
      await delay(this.pollDelayMs);
      const result = await this.aiVideoService.checkTaskStatus(taskId);

      if (result.status === 'completed') {
        this.logger.log(`✅ Kling Success!`);
        if (!result.videoUrl) throw new Error('Kling completed but no videoUrl provided');
        // Скачиваем и пересохраняем в S3
        const videoData = await this.proxyService.get<Buffer>(result.videoUrl, { 
          responseType: 'arraybuffer',
          timeout: this.videoDownloadTimeoutMs,
        });
        return await this.storageService.uploadFile(Buffer.from(videoData), 'video/mp4', 'videos');
      }
      if (result.status === 'failed') throw new Error(`Kling status: failed`);
    }
    throw new Error('Kling Timeout');
  }
}