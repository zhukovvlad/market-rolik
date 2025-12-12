import { useState, type MouseEvent } from "react";
import { ImageOff, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
    src?: string | null;
    alt: string;
    type?: string; // 'IMAGE_CLEAN', 'VIDEO_FRAGMENT' etc.
    className?: string;
}

export function MediaPreview({ src, alt, type, className }: MediaPreviewProps) {
    const [error, setError] = useState(false);

    // Если нет источника или произошла ошибка загрузки
    if (!src || error) {
        return (
            <div className={cn("w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50", className)}>
                {error ? (
                    <>
                        <ImageOff className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs">Ошибка загрузки</span>
                    </>
                ) : (
                    <FileVideo className="w-12 h-12 opacity-20" />
                )}
            </div>
        );
    }

    // Определяем, видео это или нет
    // Можно расширить логику, проверяя mime-type, если он есть
    const isVideo = type === 'VIDEO_FRAGMENT' || src.endsWith('.mp4') || src.endsWith('.webm');

    if (isVideo) {
        const handleMouseOver = (e: MouseEvent<HTMLVideoElement>) => {
            const video = e.currentTarget;
            video.currentTime = 0;
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Игнорируем ошибки воспроизведения (например, если пользователь быстро убрал мышь)
                });
            }
        };

        const handleMouseOut = (e: MouseEvent<HTMLVideoElement>) => {
            const video = e.currentTarget;
            video.pause();
        };

        return (
            <video
                src={`${src}#t=0.001`} // Хак: Media Fragments URI заставляет браузер показать первый кадр
                className={cn("object-cover", className)}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onError={() => setError(true)}
            />
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={cn("object-cover", className)}
            onError={() => setError(true)}
        />
    );
}
