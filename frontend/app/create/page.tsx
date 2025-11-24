"use client";

import { useState, useRef, useEffect } from "react";
import UploadStep from "@/components/wizard/UploadStep";
import SettingsStep from "@/components/wizard/SettingsStep";
import { toast } from "sonner";

export default function CreatePage() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleGenerate = async (settings: { prompt: string; aspectRatio: string }) => {
    setIsGenerating(true);
    // console.log("Generating with settings:", settings);

    // Mock simulation for now
    timeoutRef.current = setTimeout(() => {
      setIsGenerating(false);
      toast.success("Генерация запущена! (Mock)");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Новый проект</h1>
      <p className="text-slate-500 mb-8">
        {uploadedUrl ? "Шаг 2: Настройки генерации" : "Шаг 1: Загрузите фото вашего товара"}
      </p>

      <div className="w-full flex justify-center">
        {!uploadedUrl ? (
          <UploadStep onImageUploaded={(url) => setUploadedUrl(url)} />
        ) : (
          <SettingsStep
            imageUrl={uploadedUrl}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </main>
  );
}