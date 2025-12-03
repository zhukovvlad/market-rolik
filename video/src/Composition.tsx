import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate, Html5Audio, Sequence } from 'remotion';
import { z } from 'zod';

// Схема данных с валидацией URL и hex-цветов
export const myCompSchema = z.object({
  title: z.string(),
  mainImage: z.string().url(),
  usps: z.array(z.string()),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),

  audioUrl: z.string().nullable().optional(),       // Ссылка на TTS
  backgroundMusicUrl: z.string().nullable().optional(), // Ссылка на музыку
});

export const MyComposition: React.FC<z.infer<typeof myCompSchema>> = ({
  title,
  mainImage,
  usps,
  primaryColor,
  audioUrl,
  backgroundMusicUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- АНИМАЦИИ (Исправленные) ---

  // 1. УБРАЛИ bgOpacity. Фон виден сразу.

  // 2. Товар: не появляется с нуля, а делает "Pulse" (Пружинит от 100% до 105%)
  // Это привлекает внимание, но товар виден сразу на обложке.
  const scaleSpring = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });
  // Интерполируем: На 0 кадре масштаб 1.0 (нормальный), потом чуть растет
  const scale = interpolate(scaleSpring, [0, 1], [1, 1.05]);

  // 3. Заголовок: вылет с эффектом Pop-up
  const titleScale = interpolate(scaleSpring, [0, 1], [0.8, 1]);

  // Для обложки важно, чтобы ТОВАР был главным.

  // Динамический расчет задержки для TTS (0.5 секунды независимо от fps)
  const ttsDelayFrames = Math.round(fps * 0.5);

  return (
    <AbsoluteFill className="bg-white">

      {/* --- 🎵 АУДИО СЛОЙ --- */}

      {/* 1. Фоновая музыка */}
      {/* volume={0.2} — чтобы не перебивала голос */}
      {backgroundMusicUrl && (
        <Html5Audio
          src={backgroundMusicUrl}
          volume={0.2}
          loop
        />
      )}

      {/* 2. Голос диктора (TTS) */}
      {/* Задержка 0.5 сек (динамически рассчитывается по fps) */}
      {audioUrl && (
        <Sequence from={ttsDelayFrames}>
          <Html5Audio src={audioUrl} volume={1.0} />
        </Sequence>
      )}

      {/* СЛОЙ 1: ФОН (Виден сразу!) */}
      <AbsoluteFill>
        <Img
          src={mainImage}
          className="w-full h-full object-cover blur-2xl opacity-60 scale-110"
        />
        <div className="absolute inset-0 bg-black/20" />
      </AbsoluteFill>

      {/* СЛОЙ 2: ТОВАР (Виден сразу!) */}
      <AbsoluteFill className="flex items-center justify-center">
        <div
          style={{ transform: `scale(${scale})` }}
          className="relative w-[85%] aspect-[3/4] shadow-2xl rounded-3xl overflow-hidden border-4 border-white/80"
        >
          <Img
            src={mainImage}
            className="w-full h-full object-cover"
          />
        </div>
      </AbsoluteFill>

      {/* СЛОЙ 3: ЗАГОЛОВОК (Вылетает, но не перекрывает товар на старте) */}
      <AbsoluteFill>
        <div className="w-full text-center absolute top-[150px] z-20 px-4">
          <div
            style={{ transform: `scale(${titleScale})`, backgroundColor: primaryColor }}
            className="inline-block px-8 py-4 rounded-2xl shadow-xl backdrop-blur-md border border-white/20"
          >
            <h1 className="text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
              {title}
            </h1>
          </div>
        </div>
      </AbsoluteFill>

      {/* СЛОЙ 4: УТП (Вылетают позже, не мешают обложке) */}
      <AbsoluteFill className="items-center justify-end pb-40 px-8">
        <div className="flex flex-col gap-4 w-full">
          {usps.map((usp, index) => {
            const delay = 20 + (index * 10); // Чуть ускорили появление
            const slide = spring({ frame: frame - delay, fps });
            const slideX = interpolate(slide, [0, 1], [-500, 0]);
            const opacity = interpolate(slide, [0, 1], [0, 1]);

            return (
              <div
                key={index}
                style={{
                  transform: `translateX(${slideX}px)`,
                  opacity,
                  borderLeftColor: primaryColor
                }}
                className="bg-white/90 px-6 py-4 rounded-xl shadow-lg border-l-[12px] flex items-center gap-4"
              >
                <div className="h-4 w-4 rounded-full bg-slate-800" />
                <span className="text-3xl font-bold text-slate-800">{usp}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};