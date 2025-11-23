"use client";

import UploadStep from "@/components/wizard/UploadStep";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Новый проект</h1>
      <p className="text-slate-500 mb-8">Шаг 1: Загрузите фото вашего товара</p>
      
      <div className="w-full">
        <UploadStep onImageSelect={(file) => console.log("Файл получен:", file)} />
      </div>
    </main>
  );
}