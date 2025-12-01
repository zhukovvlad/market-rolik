import { Global, Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { AiVideoService } from './ai-video.service';

import { AiTextService } from './ai-text.service';
import { RenderService } from './render.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его в каждом файле
@Module({
  providers: [ProxyService, AiVideoService, AiTextService, RenderService],
  exports: [ProxyService, AiVideoService, AiTextService, RenderService],
})
export class CommonModule { }
