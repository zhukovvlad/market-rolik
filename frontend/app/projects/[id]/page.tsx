"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, ArrowLeft, Clock, FileVideo, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Project } from "@/lib/types";
import axios from "axios";

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

export default function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { isLoading: isAuthLoading, token } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Загрузка проекта
    useEffect(() => {
        const fetchProject = async () => {
            if (!token) {
                setLoading(false);
                router.push("/dashboard");
                return;
            }

            try {
                const res = await axios.get<Project>(`${API_URL}/projects/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setProject(res.data);
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    toast.error("Проект не найден");
                } else {
                    toast.error("Ошибка загрузки проекта");
                }
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        if (!isAuthLoading) fetchProject();
    }, [id, isAuthLoading, router, token]);

    // Удаление
    const handleDelete = async () => {
        if (!confirm("Вы уверены? Это действие необратимо.")) return;
        
        if (!token) {
            toast.error("Требуется авторизация");
            router.push("/dashboard");
            return;
        }

        try {
            await axios.delete(`${API_URL}/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Проект удален");
            router.push("/dashboard");
        } catch (e) {
            toast.error("Ошибка удаления");
        }
    };

    // Скачивание файла
    const handleDownload = () => {
        if (project?.resultVideoUrl) {
            window.open(project.resultVideoUrl, '_blank');
        }
    };

    if (loading || isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    const getPreviewImage = () => {
        // Приоритет: основное изображение из settings или первое изображение из assets
        return project.settings?.mainImage || 
               project.assets?.find(a => a.type === 'IMAGE_CLEAN')?.storageUrl;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-6xl mt-16">
                {/* Навигация */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Назад к проектам
                    </Link>
                </div>

                {/* Заголовок */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            {project.title}
                            <Badge className={statusColors[project.status]}>
                                {statusLabels[project.status]}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Создано: {new Date(project.createdAt).toLocaleString('ru-RU')}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Удалить
                        </Button>
                        {project.status === 'COMPLETED' && project.resultVideoUrl && (
                            <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 shadow-md text-white">
                                <Download className="w-4 h-4 mr-2" /> Скачать MP4
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ЛЕВАЯ КОЛОНКА: Плеер / Превью */}
                    <div className="lg:col-span-1">
                        <Card className="overflow-hidden border-border shadow-sm">
                            <CardContent className="p-0 bg-black flex items-center justify-center aspect-ratio-9-16 relative group">
                                {project.status === 'COMPLETED' && project.resultVideoUrl ? (
                                    <video
                                        src={project.resultVideoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={getPreviewImage()}
                                    />
                                ) : (
                                    <div className="text-center text-slate-400 p-6">
                                        {project.status === 'PROCESSING' || project.status === 'QUEUED' || project.status === 'RENDERING' ? (
                                            <div className="flex flex-col items-center animate-pulse">
                                                <RefreshCw className="w-10 h-10 mb-4 animate-spin text-primary" />
                                                <p>Генерация видео...</p>
                                                <p className="text-xs mt-2">Это может занять 2-5 минут</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <FileVideo className="w-10 h-10 mb-4" />
                                                <p>Видео еще не готово</p>
                                                {getPreviewImage() && (
                                                    <img 
                                                        src={getPreviewImage()} 
                                                        alt="Preview" 
                                                        className="mt-4 max-w-full max-h-48 object-contain rounded"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА: Данные проекта */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Блок 1: О товаре */}
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-lg">Данные товара</h3>
                                <Separator />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">
                                            Название товара
                                        </label>
                                        <p className="text-foreground font-medium">
                                            {project.settings?.productName || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">
                                            Формат
                                        </label>
                                        <p className="text-foreground font-medium">
                                            {project.settings?.aspectRatio || "9:16"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-bold">
                                        Преимущества (УТП)
                                    </label>
                                    <ul className="mt-2 space-y-1">
                                        {project.settings?.usps && project.settings.usps.length > 0 ? (
                                            project.settings.usps.map((usp, i) => (
                                                <li key={i} className="flex items-center gap-2 text-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {usp}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground italic">Нет данных</li>
                                        )}
                                    </ul>
                                </div>

                                {project.settings?.description && (
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">
                                            Описание
                                        </label>
                                        <p className="mt-2 text-foreground">
                                            {project.settings.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Блок 2: Промпт (Техничка) */}
                        {project.settings?.prompt && (
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="font-semibold text-lg">Сценарий анимации</h3>
                                    <Separator />
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-bold">
                                            Prompt для AI
                                        </label>
                                        <div className="mt-2 p-3 bg-muted rounded-lg border border-border text-sm text-foreground font-mono whitespace-pre-wrap wrap-break-word">
                                            {project.settings.prompt}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
