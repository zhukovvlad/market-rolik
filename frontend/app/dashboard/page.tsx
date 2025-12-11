"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/ProjectCard"; // <--- Используем компонент
import { Plus, Video } from "lucide-react";
import { API_URL } from "@/lib/utils";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";
import { Project } from "@/lib/types";
import { logger } from "@/lib/logger";
import { api } from "@/lib/api";

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchProjects = async () => {
            try {
                const res = await api.get<Project[]>('/projects');
                if (isMounted) {
                    setProjects(res.data);
                }
            } catch (error) {
                logger.error("Failed to fetch projects", "DashboardPage", error);
                toast.error("Не удалось загрузить проекты");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (!isAuthLoading && user) {
            fetchProjects();
        }

        return () => {
            isMounted = false;
        };
    }, [user, isAuthLoading]);

    const handleDelete = async (projectId: string) => {
        // Оптимистичное обновление
        const oldProjects = [...projects];
        setProjects(prev => prev.filter(p => p.id !== projectId));

        try {
            await api.delete(`/projects/${projectId}`);

            toast.success("Проект удален");
        } catch (error) {
            setProjects(oldProjects);
            toast.error("Не удалось удалить проект");
        }
    };

    if (isAuthLoading) return <div className="p-10 text-center">Загрузка...</div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <Navbar />

                <main className="container mx-auto px-4 pt-24 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Мои проекты</h1>
                        <p className="text-muted-foreground">Управляйте вашими видео-генерациями</p>
                    </div>
                    <Link href="/create">
                        <Button className="bg-primary hover:bg-primary/90 shadow-md text-primary-foreground">
                            <Plus className="mr-2 h-4 w-4" /> Новый проект
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl"></div>)}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                        <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">У вас пока нет проектов</h3>
                        <Link href="/create"><Button variant="outline">Создать проект</Button></Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
        </ProtectedRoute>
    );
}
