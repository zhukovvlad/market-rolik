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
      // Генерируем уникальное имя файла
      const extension = mimeType.split('/')[1] || 'bin';
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
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      // Убираем https:// чтобы чисто склеить
      const cleanEndpoint = endpoint
        ?.replace('https://', '')
        .replace('http://', '');

      const publicUrl = `https://${this.bucket}.${cleanEndpoint}/${fileName}`;

      this.logger.log(`File uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`S3 Upload Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
