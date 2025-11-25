"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadStep from "@/components/wizard/UploadStep";
import SettingsStep from "@/components/wizard/SettingsStep";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Шаг 1: Фото загружено
  const handleImageUploaded = (url: string) => {
    setUploadedUrl(url);
    setStep(2); // Переходим к настройкам
  };

  // Шаг 2: Запуск генерации
  const handleGenerate = async (settings: { prompt: string; aspectRatio: string }) => {
    if (!uploadedUrl) return;

    // 1. Берем токен
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Вы не авторизованы. Войдите в систему.");
      router.push("/");
      return;
    }

    setIsGenerating(true);
    try {
      // 2. Создаем проект (POST /projects)
      // Важно: userId больше не шлем, шлем только title и Токен
      const projectRes = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- КЛЮЧЕВОЙ МОМЕНТ
        },
        body: JSON.stringify({
          title: settings.prompt.slice(0, 30) || 'Новый проект'
        })
      });

      if (!projectRes.ok) throw new Error('Ошибка создания проекта');
      const project = await projectRes.json();

      // 3. Запускаем генерацию видео (POST /test-video)
      const genRes = await fetch(`${API_URL}/test-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl: uploadedUrl,
          prompt: settings.prompt
        })
      });

      if (!genRes.ok) throw new Error('Ошибка запуска генерации');

      toast.success("Магия запущена! 🚀");

      // 4. Перенаправляем в Дашборд
      router.push("/dashboard");

    } catch (e) {
      console.error(e);
      toast.error("Что-то пошло не так. Попробуйте еще раз.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {step === 1 ? "Шаг 1: Загрузка" : "Шаг 2: Настройки"}
          </h1>
          <p className="text-slate-500">
            {step === 1 ? "Загрузите фото товара для обработки" : "Настройте параметры анимации"}
          </p>
        </div>

        <div className="w-full flex justify-center">
          {step === 1 && (
            <UploadStep onImageUploaded={handleImageUploaded} />
          )}

          {step === 2 && uploadedUrl && (
            <SettingsStep
              imageUrl={uploadedUrl}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </main>
    </div>
  );
}