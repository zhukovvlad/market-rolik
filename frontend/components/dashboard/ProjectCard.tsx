import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Video, ImageOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { MediaPreview } from "@/components/ui/media-preview";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Project } from "@/lib/types";

interface ProjectCardProps {
    project: Project;
    onDelete: (id: string) => void;
}

const statusColors: Record<Project['status'], string> = {
    DRAFT: "bg-muted text-muted-foreground",
    QUEUED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    PROCESSING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    RENDERING: "bg-primary/10 text-primary",
    COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400",
    FAILED: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<Project['status'], string> = {
    DRAFT: "Черновик",
    QUEUED: "В очереди",
    PROCESSING: "Обработка",
    RENDERING: "Рендеринг",
    COMPLETED: "Готово",
    FAILED: "Ошибка",
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    // const [imageError, setImageError] = useState(false); // Больше не нужно, внутри MediaPreview

    const getStatusBadge = (status: Project['status']) => {
        const label = statusLabels[status] || status;
        const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

        return (
            <Badge className={`${colorClass} hover:${colorClass}`}>
                {label}
            </Badge>
        );
    };

    const getPreviewAsset = (p: Project) => {
        // Если проект завершен и есть видео, показываем его (или превью видео)
        if (p.status === 'COMPLETED' && p.resultVideoUrl) {
            return { type: 'VIDEO_RESULT', storageUrl: p.resultVideoUrl };
        }
        // Приоритет: чистое фото -> любое фото -> первый ассет
        return p.assets?.find(a => a.type === 'IMAGE_CLEAN') || p.assets?.[0];
    };

    const previewAsset = getPreviewAsset(project);

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-shadow border-border bg-card flex flex-col h-full">
            <Link href={`/projects/${project.id}`} className="block relative h-48 bg-muted overflow-hidden cursor-pointer">
                <MediaPreview
                    src={previewAsset?.storageUrl}
                    alt={project.title}
                    type={previewAsset?.type}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                    {getStatusBadge(project.status)}
                </div>
            </Link>

            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg truncate text-card-foreground" title={project.title}>
                    {project.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-2 grow">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                    <span className="text-muted-foreground/50">•</span>
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ru })}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 gap-2 mt-auto">
                <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10">
                        Открыть
                    </Button>
                </Link>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие нельзя отменить. Проект "{project.title}" и все сгенерированные файлы будут удалены.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(project.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                                Удалить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
