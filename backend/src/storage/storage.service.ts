// src/storage/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private readonly logger = new Logger(StorageService.name);
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');

    // Инициализация клиента S3 для Timeweb
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('S3_REGION'),
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true, // Важно для S3-совместимых хранилищ типа Timeweb/Minio
    });
  }

  /**
   * Загружает буфер файла в S3 и возвращает публичную ссылку
   */
  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<string> {
    try {
      // Validate inputs
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }
      if (!mimeType || !mimeType.includes('/')) {
        throw new Error('Invalid MIME type format');
      }

      // Генерируем уникальное имя файла
      const extension = this.getExtension(mimeType);
      const fileName = `${folder}/${uuidv4()}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
        // ACL: 'public-read', // В Timeweb права управляются на уровне бакета, но иногда нужно явно указывать
      });

      await this.s3Client.send(command);

      // Формируем публичную ссылку (для Timeweb формат: https://s3.timeweb.com/bucket-name/file)
      // Или если привязан домен: https://bucket.s3.timeweb.com/file
      const endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
      const endpointUrl = new URL(endpoint);
      const publicUrl = `${endpointUrl.protocol}//${this.bucket}.${endpointUrl.host}/${fileName}`;

      this.logger.log(`✅ File uploaded to S3: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`❌ S3 Upload Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getExtension(mimeType: string): string {
    // 1. Убираем параметры (например, "image/svg+xml; charset=utf-8" -> "image/svg+xml")
    const cleanMime = mimeType.split(';')[0].trim().toLowerCase();

    // 2. Карта популярных типов
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/json': 'json',
      'audio/mpeg': 'mp3',
      'video/mp4': 'mp4',
    };

    if (mimeMap[cleanMime]) {
      return mimeMap[cleanMime];
    }

    // 3. Если нет в карте, пытаемся вытащить из подтипа
    // Пример: "application/vnd.ms-excel" -> "vnd.ms-excel"
    // Пример: "image/svg+xml" (если бы не было в карте) -> "svg"
    const subtype = cleanMime.split('/')[1];
    if (!subtype) return 'bin';

    // Берем левую часть до плюса (для +xml, +json и т.д.)
    return subtype.split('+')[0] || 'bin';
  }
}
