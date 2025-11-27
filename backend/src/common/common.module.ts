import { Global, Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { AiVideoService } from './ai-video.service';

import { AiTextService } from './ai-text.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его в каждом файле
@Module({
  providers: [ProxyService, AiVideoService, AiTextService],
  exports: [ProxyService, AiVideoService, AiTextService],
})
export class CommonModule { }
