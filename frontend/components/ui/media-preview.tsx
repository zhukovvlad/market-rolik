import { useState } from "react";
import { ImageOff, Video, FileVideo } from "lucide-react";

interface MediaPreviewProps {
    src?: string | null;
    alt: string;
    type?: string; // 'IMAGE_CLEAN', 'VIDEO_FRAGMENT' etc.
    className?: string;
    aspectRatio?: "video" | "square" | "portrait"; // Можно добавить для управления пропорциями
}

export function MediaPreview({ src, alt, type, className }: MediaPreviewProps) {
    const [error, setError] = useState(false);

    // Если нет источника или произошла ошибка загрузки
    if (!src || error) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 ${className}`}>
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
        return (
            <video
                src={`${src}#t=0.001`} // Хак: Media Fragments URI заставляет браузер показать первый кадр
                className={`object-cover ${className}`}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseOver={e => { e.currentTarget.currentTime = 0; e.currentTarget.play(); }} // Сброс в начало при наведении
                onMouseOut={e => e.currentTarget.pause()}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`object-cover ${className}`}
            onError={() => setError(true)}
        />
    );
}
