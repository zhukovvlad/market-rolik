import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ProxyService } from './common/proxy.service'; // <--- Импорт

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectQueue('video-generation') private readonly videoQueue: Queue,
    private readonly proxyService: ProxyService, // <--- Внедряем наш сервис
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-queue')
  async testQueue() {
    await this.videoQueue.add('test-job', {
      foo: 'bar',
      date: new Date(),
    });
    return { status: 'Job added to queue' };
  }

  // Новый метод для проверки прокси
  @Get('check-ip')
  async checkIp() {
    // Делаем запрос к сервису, который возвращает наш IP
    const data = await this.proxyService.get('https://api.ipify.org?format=json');
    return {
      message: 'Запрос выполнен успешно',
      my_ip: data, // Если прокси работает, тут будет IP прокси-сервера
    };
  }
}
