"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductDataStep from "@/components/wizard/ProductDataStep";
import SettingsStep from "@/components/wizard/SettingsStep";
import Navbar from "@/components/landing/Navbar";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import { ProductData } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const router = useRouter();

  // Шаг 1: Данные собраны
  const handleProductDataNext = (data: { imageUrl: string; productData: ProductData }) => {
    setUploadedUrl(data.imageUrl);
    setProductData(data.productData);
    
    // Auto-update project title from product title if still default
    if (projectTitle === "Untitled Project" && data.productData.title) {
      setProjectTitle(data.productData.title);
    }
    
    setStep(2); // Переходим к настройкам
  };

  // Шаг 2: Запуск генерации
  const handleGenerate = async (settings: { prompt: string; aspectRatio: string }) => {
    if (!uploadedUrl || !productData) return;

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
      const projectRes = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: projectTitle
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-heading">
            {step === 1 ? "Шаг 1: Данные товара" : "Шаг 2: Настройки видео"}
          </h1>
          <p className="text-muted-foreground">
            {step === 1 ? "Загрузите фото и заполните информацию" : "Выберите формат и стиль анимации"}
          </p>
        </div>

        <div className="w-full flex justify-center">
          {step === 1 && (
            <ProductDataStep 
              onNext={handleProductDataNext}
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