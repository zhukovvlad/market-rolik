import { Global, Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { AiVideoService } from './ai-video.service';

import { AiTextService } from './ai-text.service';
import { RenderService } from './render.service';
import { TtsService } from './tts.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его в каждом файле
@Module({
  providers: [
    ProxyService,
    AiVideoService,
    AiTextService,
    RenderService,
    TtsService,
  ],
  exports: [
    ProxyService,
    AiVideoService,
    AiTextService,
    RenderService,
    TtsService,
  ],
})
export class CommonModule {}
