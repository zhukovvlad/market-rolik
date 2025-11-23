import { Global, Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { AiVideoService } from './ai-video.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его в каждом файле
@Module({
  providers: [ProxyService, AiVideoService],
  exports: [ProxyService, AiVideoService],
})
export class CommonModule {}
