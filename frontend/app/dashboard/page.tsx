"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/dashboard/ProjectCard"; // <--- Используем компонент
import { Plus, Video } from "lucide-react";
import { API_URL } from "@/lib/utils";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";

interface Project {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    assets: { type: string; storageUrl: string }[];
    resultVideoUrl?: string; // Добавил, так как ProjectCard его использует
}

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/projects`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoading(false);
            }
        };

        if (!isAuthLoading && user) {
            fetchProjects();
        }
    }, [user, isAuthLoading]);

    const handleDelete = async (projectId: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Оптимистичное обновление
        const oldProjects = [...projects];
        setProjects(prev => prev.filter(p => p.id !== projectId));

        try {
            const res = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Ошибка удаления");

            toast.success("Проект удален");
        } catch (error) {
            setProjects(oldProjects);
            toast.error("Не удалось удалить проект");
        }
    };

    if (isAuthLoading) return <div className="p-10 text-center">Загрузка...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Мои проекты</h1>
                        <p className="text-slate-500">Управляйте вашими видео-генерациями</p>
                    </div>
                    <Link href="/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> Новый проект
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>)}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">У вас пока нет проектов</h3>
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
    );
}
