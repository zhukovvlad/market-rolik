import { Project } from "./types";

export const statusColors: Record<Project['status'], string> = {
    DRAFT: "bg-muted text-muted-foreground",
    QUEUED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    RENDERING: "bg-primary/10 text-primary",
    COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400",
    FAILED: "bg-destructive/10 text-destructive",
};

export const statusLabels: Record<Project['status'], string> = {
    DRAFT: "Черновик",
    QUEUED: "В очереди",
    PROCESSING: "Обработка",
    RENDERING: "Рендеринг",
    COMPLETED: "Готово",
    FAILED: "Ошибка",
};
