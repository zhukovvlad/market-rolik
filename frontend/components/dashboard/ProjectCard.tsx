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

interface Project {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    assets: { type: string; storageUrl: string }[];
    resultVideoUrl?: string;
}

interface ProjectCardProps {
    project: Project;
    onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    QUEUED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    RENDERING: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
    DRAFT: "Черновик",
    QUEUED: "В очереди",
    PROCESSING: "Обработка",
    RENDERING: "Рендеринг",
    COMPLETED: "Готово",
    FAILED: "Ошибка",
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    // const [imageError, setImageError] = useState(false); // Больше не нужно, внутри MediaPreview

    const getStatusBadge = (status: string) => {
        const label = statusLabels[status] || status;
        const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";

        return (
            <Badge className={`${colorClass} hover:${colorClass}`}>
                {label}
            </Badge>
        );
    };

    const getPreviewAsset = (p: Project) => {
        // Приоритет: чистое фото -> любое фото -> первый ассет
        return p.assets?.find(a => a.type === 'IMAGE_CLEAN') || p.assets?.[0];
    };

    const previewAsset = getPreviewAsset(project);

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-shadow border-slate-200 flex flex-col h-full">
            <Link href={`/projects/${project.id}`} className="block relative h-48 bg-slate-100 overflow-hidden cursor-pointer">
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
                <CardTitle className="text-lg truncate" title={project.title}>
                    {project.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-2 flex-grow">
                <div className="flex items-center text-xs text-slate-400 gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                    <span className="text-slate-300">•</span>
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: ru })}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 gap-2 mt-auto">
                <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        Открыть
                    </Button>
                </Link>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
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
                                className="bg-red-600 hover:bg-red-700"
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
