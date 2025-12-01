import { Injectable, Logger } from '@nestjs/common';
import { renderMedia, selectComposition } from '@remotion/renderer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  async renderVideo(data: {
    title: string;
    mainImage: string;
    usps: string[];
    primaryColor: string;
  }): Promise<string> {
    
    this.logger.log('🎬 Starting Render process...');

    // 1. Путь к бандлу (который мы собрали)
    const bundleLocation = path.join(process.cwd(), 'remotion-build');
    
    // 2. Выбираем композицию (ID из Root.tsx)
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'WbClassic',
      inputProps: data, // Передаем данные
    });

    // 3. Создаем папку для готовых видео, если нет
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const fileName = `video-${Date.now()}.mp4`;
    const outputFile = path.join(outputDir, fileName);

    // 4. Рендерим!
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputFile,
      inputProps: data,

      chromiumOptions: {
        enableMultiProcessOnLinux: true, // Включаем многопроцессность (стабильнее)
        // @ts-ignore
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Критично для Docker/WSL (использует диск вместо RAM для шаринга)
            '--disable-gpu',           // Отключаем GPU, если его нет (на серверах часто помогает)
            '--disable-web-security'   // На всякий случай, чтобы не ругался на CORS локально
        ]
      } as any,
    });
    

    this.logger.log(`✅ Render done: ${outputFile}`);
    return outputFile; // Возвращаем путь к файлу
  }
}