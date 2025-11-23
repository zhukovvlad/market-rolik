"use client"; // Важно: это клиентский компонент

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, FileImage } from "lucide-react"; // Иконки (ставим ниже)
import { toast } from "sonner";

interface UploadStepProps {
  onImageSelect: (file: File) => void;
}

export default function UploadStep({ onImageSelect }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Обработка перетаскивания
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Когда бросили файл
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Когда выбрали через проводник
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Проверка типа
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, загрузите изображение (JPG, PNG)");
      return;
    }
    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс 5MB)");
      return;
    }

    // Создаем превью
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Передаем файл наверх (родителю)
    onImageSelect(file);
    toast.success("Изображение загружено!");
  };

  const clearImage = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className="w-full max-w-xl mx-auto border-dashed border-2 shadow-sm transition-all hover:border-indigo-400">
      <CardContent className="p-6">
        <div
          className={`relative flex flex-col items-center justify-center h-64 rounded-lg cursor-pointer transition-colors ${
            dragActive ? "bg-indigo-50 border-indigo-500" : "bg-slate-50 hover:bg-slate-100"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />

          {preview ? (
            <div className="relative w-full h-full p-2">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain rounded-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-4 right-4 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-full shadow-sm inline-block">
                <UploadCloud className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-700">
                  Перетащите фото сюда
                </p>
                <p className="text-sm text-slate-500">
                  или нажмите для выбора
                </p>
              </div>
              <p className="text-xs text-slate-400">
                JPG, PNG до 5MB
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}