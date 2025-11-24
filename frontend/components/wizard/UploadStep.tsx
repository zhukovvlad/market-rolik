"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UploadStepProps {
  onImageUploaded: (url: string) => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
}

export default function UploadStep({ onImageUploaded }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount or change
  useEffect(() => {
    return () => {
      if (selectedFile) URL.revokeObjectURL(selectedFile.preview);
    };
  }, [selectedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = (file: File) => {
    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, загрузите изображение (JPG, PNG)");
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс 5MB)");
      return;
    }

    // Revoke previous if exists
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
    }

    setSelectedFile({
      file,
      preview: URL.createObjectURL(file)
    });
  };

  const removeFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/projects/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки");
      }

      const data = await response.json();
      toast.success("Изображение успешно загружено!");
      onImageUploaded(data.url);
    } catch (error) {
      toast.error("Не удалось загрузить файл. Попробуйте снова.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {!selectedFile ? (
        <Card className={`border-dashed border-2 transition-all ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400"
          }`}>
          <CardContent className="p-8">
            <div
              className="flex flex-col items-center justify-center text-center cursor-pointer h-64"
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
                disabled={isUploading}
              />

              <div className="bg-indigo-50 p-4 rounded-full mb-4">
                <UploadCloud className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Перетащите фото сюда
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                или нажмите для выбора
              </p>
              <p className="text-xs text-slate-400">
                JPG, PNG до 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative group aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={selectedFile.preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 right-4">
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 rounded-full shadow-md"
                onClick={removeFile}
                disabled={isUploading}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 h-12 text-lg"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Подтвердить и загрузить
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              className="text-slate-500 text-sm"
              onClick={removeFile}
              disabled={isUploading}
            >
              Выбрать другое фото
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}