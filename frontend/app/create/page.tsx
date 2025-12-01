"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProductDataStep from "@/components/wizard/ProductDataStep";
import SettingsStep from "@/components/wizard/SettingsStep";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { ProductData } from "@/types/product";
import { ProjectSettings, CreateProjectRequest } from "@/types/project";

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Состояние для редактируемого заголовка (оно живет здесь, в родителе)
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Шаг 1: Данные собраны
  const handleProductDataNext = (data: { imageUrl: string; productData: ProductData }) => {
    setUploadedUrl(data.imageUrl);
    setProductData(data.productData);
    
    // Если название проекта все еще дефолтное, а у товара появилось название — обновляем заголовок проекта
    if (projectTitle === "Untitled Project" && data.productData.title) {
      setProjectTitle(data.productData.title);
    }
    
    setStep(2); // Переходим к настройкам
  };

  // Шаг 2: Запуск генерации
  const handleGenerate = async (settings: Required<Pick<ProjectSettings, 'prompt' | 'aspectRatio'>>) => {
    if (!uploadedUrl || !productData) return;

    // 1. Берем токен
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Вы не авторизованы. Войдите в систему.");
      router.push("/");
      return;
    }

    // Create AbortController for this request chain
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    setIsGenerating(true);
    try {
      // 2. Создаем проект (POST /projects)
      const projectSettings: ProjectSettings = {
         productName: productData.title,
         description: productData.description,
         usps: productData.usps,
         mainImage: uploadedUrl,
         prompt: settings.prompt,
         aspectRatio: settings.aspectRatio
      };

      const requestBody: CreateProjectRequest = {
          title: projectTitle, // Отправляем актуальный заголовок
          settings: projectSettings
      };

      const projectRes = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal
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
        }),
        signal
      });

      if (!genRes.ok) throw new Error('Ошибка запуска генерации');

      toast.success("Магия запущена! 🚀");

      // 4. Перенаправляем в Дашборд
      router.push("/dashboard");

    } catch (e: any) {
      // Don't show error toast if request was aborted (user navigated away)
      if (e.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error(e);
      toast.error("Что-то пошло не так. Попробуйте еще раз.");
    } finally {
      if (abortControllerRef.current === controller) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 font-heading">
            {step === 1 ? "Шаг 1: Данные товара" : "Шаг 2: Настройки видео"}
          </h1>
          <p className="text-slate-500">
            {step === 1 ? "Загрузите фото и заполните информацию" : "Выберите формат и стиль анимации"}
          </p>
        </div>

        <div className="w-full flex justify-center">
          {step === 1 && (
            <ProductDataStep 
              onNext={handleProductDataNext}
              // 👇 ВОТ ЭТИ ПРОПСЫ МЫ ДОБАВИЛИ, ЧТОБЫ ИСПРАВИТЬ ОШИБКУ
              projectTitle={projectTitle}
              setProjectTitle={setProjectTitle}
              isEditingTitle={isEditingTitle}
              setIsEditingTitle={setIsEditingTitle}
            />
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