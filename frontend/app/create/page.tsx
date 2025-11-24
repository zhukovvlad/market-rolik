"use client";

import { useState } from "react";
import UploadStep from "@/components/wizard/UploadStep";

export default function CreatePage() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Новый проект</h1>
      <p className="text-slate-500 mb-8">Шаг 1: Загрузите фото вашего товара</p>

      <div className="w-full">
        <UploadStep onImageUploaded={(url) => setUploadedUrl(url)} />
      </div>

      {uploadedUrl && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg max-w-xl w-full">
          <p className="text-sm font-medium text-green-800 mb-2">✅ Файл успешно загружен!</p>
          <p className="text-xs text-green-600 break-all">{uploadedUrl}</p>
        </div>
      )}
    </main>
  );
}