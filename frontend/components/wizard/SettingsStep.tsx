"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";

interface SettingsStepProps {
    imageUrl: string;
    onGenerate: (settings: { prompt: string; aspectRatio: string }) => void;
    isGenerating: boolean;
}

export default function SettingsStep({ imageUrl, onGenerate, isGenerating }: SettingsStepProps) {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState("9:16");

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4">
            {/* Левая колонка: Превью загруженного фото */}
            <Card className="overflow-hidden bg-slate-100 border-none shadow-inner">
                <CardContent className="p-0 h-full flex items-center justify-center relative min-h-[300px]">
                    <img
                        src={imageUrl}
                        alt="Reference"
                        className="w-full h-full object-contain max-h-[500px]"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
                        Исходное изображение
                    </div>
                </CardContent>
            </Card>

            {/* Правая колонка: Настройки */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Настройки магии ✨</h2>
                    <p className="text-slate-500 text-sm">Нейросеть оживит ваше фото на основе этих параметров.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Что должно происходить? (Промпт)</Label>
                        <Textarea
                            placeholder="Пример: Кроссовок медленно вращается в воздухе, вокруг летают неоновые искры, кинематографичный свет..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-32 resize-none bg-white"
                        />
                        <p className="text-xs text-slate-400">
                            Чем детальнее описание, тем круче результат.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Формат видео</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Выберите формат" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="9:16">📱 9:16 (Reels / Stories)</SelectItem>
                                <SelectItem value="3:4">🛒 3:4 (Карточка товара)</SelectItem>
                                <SelectItem value="16:9">🎬 16:9 (YouTube)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-14 shadow-lg shadow-indigo-200"
                    onClick={() => onGenerate({ prompt, aspectRatio })}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Генерация... (это займет ~2 мин)
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-5 w-5" />
                            Запустить генерацию
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
