// src/common/tts.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { URLSearchParams } from 'url';

export interface TtsResult {
    buffer: Buffer;
    mimeType: string;
    format: 'mp3' | 'wav';
}

@Injectable()
export class TtsService {
    private readonly logger = new Logger(TtsService.name);

    constructor(private readonly configService: ConfigService) { }

    async generateSpeech(text: string, voice: string = 'ermil'): Promise<TtsResult> {
        const apiKey = this.configService.get<string>('YANDEX_API_KEY');

        // 1. MOCK MODE (Если ключа нет или он 'mock')
        if (!apiKey || apiKey === 'mock') {
            this.logger.warn(`⚠️ TTS Mock: Generating silent MP3 for "${text.slice(0, 10)}..."`);
            return {
                buffer: this.generateSilentMp3(2),
                mimeType: 'audio/mpeg',
                format: 'mp3'
            };
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
            return {
                buffer: Buffer.from(response.data),
                mimeType: 'audio/mpeg',
                format: 'mp3'
            };
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

    /**
     * Generates a minimal silent MP3 file for mock/test mode.
     * 
     * NOTE: This is a simplified implementation using hardcoded MP3 frame bytes.
     * For production or if compatibility issues arise, consider:
     * - Bundling a small pre-generated silent.mp3 asset
     * - Using an audio library for programmatic generation
     * 
     * Current implementation: ID3v2 header + repeated silent MP3 frames
     * Format: MPEG-1 Layer III, 44.1kHz, mono, 32kbps
     * Frame duration: ~26ms per frame
     */
    private generateSilentMp3(durationSeconds: number): Buffer {
        // ID3v2.4 header (10 bytes, no tags)
        const id3Header = Buffer.from([
            0x49, 0x44, 0x33,       // "ID3"
            0x04, 0x00,             // Version 2.4.0
            0x00,                   // Flags
            0x00, 0x00, 0x00, 0x00  // Size (0 = no tags)
        ]);
        
        // Single silent MP3 frame (20 bytes)
        // Sync word (0xFFxFB) + header bits for 44.1kHz mono 32kbps + silence data
        const silentFrame = Buffer.from([
            0xFF, 0xFB, 0x90, 0x00, // Header
            0x00, 0x00, 0x00, 0x00, // Silent data
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00
        ]);
        
        // Calculate frames needed (~38 frames/second at 26ms per frame)
        const framesNeeded = Math.ceil(durationSeconds * 38);
        
        // Replicate the silent frame
        const frames = Buffer.alloc(silentFrame.length * framesNeeded);
        for (let i = 0; i < framesNeeded; i++) {
            silentFrame.copy(frames, i * silentFrame.length);
        }
        
        return Buffer.concat([id3Header, frames]);
    }
}