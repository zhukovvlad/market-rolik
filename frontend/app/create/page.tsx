"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ProductDataStep from "@/components/wizard/ProductDataStep";
import ImagePreviewStep from "@/components/wizard/ImagePreviewStep";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { ProductData } from "@/types/product";
import { AspectRatio, CreateProjectRequest, Project } from "@/types/project";
import { useProjectStatus } from "@/lib/hooks/useProjectStatus";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type WizardStep = 'product' | 'preview' | 'animating';

export default function CreatePage() {
  const [step, setStep] = useState<WizardStep>('product');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const queryClient = useQueryClient();
  
  const router = useRouter();
  
  // Polling проекта - начинается автоматически когда projectId установлен
  const { data: project, isLoading } = useProjectStatus(projectId, !!projectId, {
    onStatusChange: (nextProject) => {
      console.log('📊 Project status changed:', nextProject.status);

      // Когда фон готов - переходим на превью
      if (nextProject.status === 'IMAGE_READY') {
        setStep((prevStep) => {
          if (prevStep !== 'product') return prevStep;
          toast.success('Фон готов! Проверьте результат');
          return 'preview';
        });
      }

      // Когда видео готово - редирект на страницу проекта
      if (nextProject.status === 'COMPLETED') {
        toast.success('Видео готово! 🎉');
        router.push(`/projects/${nextProject.id}`);
      }

      // Если ошибка - показываем детали и сбрасываем
      if (nextProject.status === 'FAILED') {
        console.log('❌ Project failed. Settings:', nextProject.settings);

        const settings = nextProject.settings;
        const lastError =
          settings && typeof settings === 'object' && 'lastError' in settings
            ? (settings as { lastError?: unknown }).lastError
            : undefined;
        const errorMsg = typeof lastError === 'string' ? lastError : 'Ошибка генерации проекта';

        let userFriendlyMsg = 'Ошибка генерации проекта';

        if (typeof errorMsg === 'string') {
          if (errorMsg.includes('404')) {
            userFriendlyMsg = 'Ошибка API. Проверьте ключи доступа к внешним сервисам (Photoroom, Stability AI)';
          } else if (errorMsg.includes('timeout')) {
            userFriendlyMsg = 'Превышено время ожидания. Попробуйте позже';
          } else if (errorMsg.includes('Request failed')) {
            userFriendlyMsg = 'Ошибка запроса к внешнему API. Проверьте настройки сервиса';
          } else {
            userFriendlyMsg = `Ошибка: ${errorMsg}`;
          }
        }

        toast.error(userFriendlyMsg, { duration: 6000 });

        // Возвращаем на первый шаг для повторной попытки
        setTimeout(() => {
          setStep('product');
          setProjectId(null);
        }, 1500);
      }
    },
  });

  // Шаг 1: Создание проекта и запуск генерации фона
  const handleProductDataNext = async (data: { imageUrl: string; productData: ProductData; scenePrompt?: string; aspectRatio: AspectRatio }) => {
    try {
      const requestBody: CreateProjectRequest = {
        title: projectTitle,
        settings: {
          productName: data.productData.title,
          description: data.productData.description,
          usps: data.productData.usps.filter(u => u.trim().length > 0),
          mainImage: data.imageUrl,
          aspectRatio: data.aspectRatio,
          ...(data.scenePrompt && { scenePrompt: data.scenePrompt }), // Передаем промпт от AI только если он есть
        }
      };

      const res = await axios.post(`${API_URL}/projects`, requestBody, {
        withCredentials: true // Send cookies
      });

      setProjectId(res.data.id);
      toast.success("Генерация фона запущена...");
      // Polling начнется автоматически через useProjectStatus
      
    } catch (error) {
      console.error('Project creation failed', error);
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          toast.error("Ошибка сети. Проверьте подключение к интернету");
        } else if (error.response.status === 401) {
          toast.error("Сессия истекла. Пожалуйста, войдите снова");
          router.push("/");
        } else {
          toast.error(`Ошибка создания проекта: ${error.response.statusText}`);
        }
      } else {
        toast.error("Ошибка создания проекта");
      }
    }
  };

  // Шаг 2: Запуск анимации видео
  const handleAnimate = async () => {
    if (!projectId) return;

    const projectQueryKey = ['project', projectId] as const;
    const previousProject = queryClient.getQueryData<Project>(projectQueryKey);

    try {
      // Optimistically kick polling back on immediately (polling stops at IMAGE_READY).
      queryClient.setQueryData<Project>(projectQueryKey, (prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'GENERATING_VIDEO' };
      });
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
      setStep('animating');

      await axios.post(
        `${API_URL}/projects/${projectId}/animate`,
        {},
        { withCredentials: true } // Send cookies
      );

      toast.success('Анимация запущена! Это займет ~3-4 минуты');
    } catch (error) {
      console.error('Animation failed', error);

      if (previousProject) {
        queryClient.setQueryData<Project>(projectQueryKey, previousProject);
      }
      queryClient.invalidateQueries({ queryKey: projectQueryKey });
      setStep('preview');
      toast.error('Ошибка запуска анимации');
    }
  };

  const handleBackToProduct = () => {
    setStep('product');
  };

  // Получаем ассеты для превью
  const sceneAssets = project?.assets?.filter(a => a.type === 'IMAGE_SCENE') || [];
  const ttsAsset = project?.assets?.find(a => a.type === 'AUDIO_TTS');

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-heading">
            {step === 'product' && "Шаг 1: Данные товара"}
            {step === 'preview' && "Шаг 2: Предпросмотр фона"}
            {step === 'animating' && "Генерация видео"}
          </h1>
          <p className="text-muted-foreground">
            {step === 'product' && "Загрузите фото и заполните информацию"}
            {step === 'preview' && "Проверьте фон, отредактируйте промпт или запустите анимацию"}
            {step === 'animating' && "Пожалуйста, подождите. Генерация займет несколько минут..."}
          </p>
        </div>

        <div className="w-full flex justify-center">
          {step === 'product' && (
            <ProductDataStep 
              onNext={handleProductDataNext}
              projectTitle={projectTitle}
              setProjectTitle={setProjectTitle}
              isEditingTitle={isEditingTitle}
              setIsEditingTitle={setIsEditingTitle}
              initialImageUrl={null}
              initialProductData={null}
            />
          )}

          {step === 'preview' && project && sceneAssets.length > 0 && (
            <ImagePreviewStep
              projectId={project.id}
              sceneAssets={sceneAssets}
              activeSceneAssetId={project.settings?.activeSceneAssetId}
              ttsAsset={ttsAsset}
              scenePrompt={project.settings?.scenePrompt}
              aspectRatio={project.settings?.aspectRatio}
              onAnimate={handleAnimate}
              onBack={handleBackToProduct}
            />
          )}

          {step === 'animating' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">
                Генерируем ваше видео с помощью AI...
              </p>
              {project?.status && (
                <p className="text-sm text-muted-foreground">
                  Статус: {project.status}
                </p>
              )}
            </div>
          )}

          {/* Показываем лоадер пока грузится проект после создания */}
          {projectId && isLoading && step === 'product' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">
                Генерируем фон с помощью AI...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}