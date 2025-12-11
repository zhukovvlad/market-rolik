import { Project } from "./types";

export const statusColors: Record<Project['status'], string> = {
    DRAFT: "bg-muted text-muted-foreground",
    QUEUED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    RENDERING: "bg-primary/10 text-primary",
    COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400",
    FAILED: "bg-destructive/10 text-destructive",
    GENERATING_IMAGE: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    IMAGE_READY: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    GENERATING_VIDEO: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
};

export const statusLabels: Record<Project['status'], string> = {
    DRAFT: "Черновик",
    QUEUED: "В очереди",
    PROCESSING: "Обработка",
    RENDERING: "Рендеринг",
    COMPLETED: "Готово",
    FAILED: "Ошибка",
    GENERATING_IMAGE: "Генерация фона",
    IMAGE_READY: "Фон готов",
    GENERATING_VIDEO: "Генерация видео",
};
