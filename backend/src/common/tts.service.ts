// src/common/tts.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';

@Injectable()
export class TtsService {
    private readonly logger = new Logger(TtsService.name);

    constructor(private readonly configService: ConfigService) { }

    async generateSpeech(text: string, voice: string = 'ermil'): Promise<Buffer> {
        const apiKey = this.configService.get<string>('YANDEX_API_KEY');

        // 1. MOCK MODE (Если ключа нет или он 'mock')
        if (!apiKey || apiKey === 'mock') {
            this.logger.warn(`⚠️ TTS Mock: Generating silent audio for "${text.slice(0, 10)}..."`);
            return this.generateSilentWav(2); // 2 seconds of silence
        }

        // 2. VALIDATION
        const folderId = this.configService.get<string>('YANDEX_FOLDER_ID');
        if (!folderId) {
            throw new Error('❌ TTS Configuration Error: YANDEX_FOLDER_ID is missing. Please check your .env file.');
        }

        // 3. YANDEX SPEECHKIT V1
        this.logger.log(`🗣️ TTS Generating (${voice}): "${text.slice(0, 20)}..."`);

        try {
            const params = new URLSearchParams();
            params.append('text', text);
            params.append('lang', 'ru-RU');
            params.append('voice', voice);
            params.append('folderId', folderId);
            params.append('format', 'mp3');

            const response = await axios.post(
                'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
                params,
                {
                    headers: { 'Authorization': `Api-Key ${apiKey}` },
                    responseType: 'arraybuffer',
                    timeout: 15000, // 15 seconds timeout
                }
            );
            return Buffer.from(response.data);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ TTS Generation failed: ${msg}`);
            throw error;
        }
    }

    getBackgroundMusicUrl(theme: string = 'energetic'): string {
        // 1. Try to get from config
        const configKey = `MUSIC_URL_${theme.toUpperCase()}`;
        const configUrl = this.configService.get<string>(configKey);
        if (configUrl) {
            return configUrl;
        }

        // 2. Fallback to defaults
        const defaults: Record<string, string> = {
            energetic: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
            calm: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
            lofi: 'https://github.com/remotion-dev/remotion/raw/main/packages/core/src/test/resources/sound.mp3',
        };
        return defaults[theme] || defaults['energetic'];
    }

    private generateSilentWav(durationSeconds: number): Buffer {
        const sampleRate = 44100;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
        const blockAlign = (numChannels * bitsPerSample) / 8;
        const subChunk2Size = durationSeconds * byteRate;
        const chunkSize = 36 + subChunk2Size;

        const buffer = Buffer.alloc(44 + subChunk2Size);

        // RIFF chunk descriptor
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(chunkSize, 4);
        buffer.write('WAVE', 8);

        // fmt sub-chunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
        buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
        buffer.writeUInt16LE(numChannels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(byteRate, 28);
        buffer.writeUInt16LE(blockAlign, 32);
        buffer.writeUInt16LE(bitsPerSample, 34);

        // data sub-chunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(subChunk2Size, 40);

        // Data is already 0 (silence) by default in Buffer.alloc

        return buffer;
    }
}