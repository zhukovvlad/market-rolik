import { Global, Module } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его в каждом файле
@Module({
  providers: [ProxyService],
  exports: [ProxyService],
})
export class CommonModule {}