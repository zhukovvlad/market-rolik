'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Play, Pause, RotateCcw, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/lib/utils';
import { Asset } from '@/types/project';
import Image from 'next/image';

interface ImagePreviewStepProps {
  projectId: string;
  sceneAssets: Asset[]; // История всех сгенерированных фонов
  activeSceneAssetId?: string;
  ttsAsset?: Asset | null;
  scenePrompt?: string;
  onAnimate: () => void;
  onBack: () => void;
}

export default function ImagePreviewStep({
  projectId,
  sceneAssets,
  activeSceneAssetId,
  ttsAsset,
  scenePrompt: initialScenePrompt,
  onAnimate,
  onBack,
}: ImagePreviewStepProps) {
  const [scenePrompt, setScenePrompt] = useState(initialScenePrompt || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(activeSceneAssetId || sceneAssets[0]?.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Получаем активную сцену
  const activeScene = sceneAssets.find(a => a.id === selectedAssetId) || sceneAssets[0];

  const handleRegenerateBackground = async () => {
    if (!scenePrompt.trim()) {
      toast.error('Введите промпт для генерации фона');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Пожалуйста, войдите в систему');
      return;
    }

    setIsRegenerating(true);
    try {
      await axios.post(
        `${API_URL}/projects/${projectId}/regenerate-bg`,
        { scenePrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Генерация фона запущена');
    } catch (error) {
      console.error('Regeneration failed', error);
      toast.error('Ошибка запуска генерации');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectScene = async (assetId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${API_URL}/projects/${projectId}/select-scene`,
        { assetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedAssetId(assetId);
      
      // Обновляем промпт на тот, что был у выбранной сцены
      const selectedAsset = sceneAssets.find(a => a.id === assetId);
      if (selectedAsset?.meta?.prompt) {
        setScenePrompt(selectedAsset.meta.prompt);
      }
      
      toast.success('Сцена выбрана');
    } catch (error) {
      console.error('Select scene failed', error);
      toast.error('Ошибка выбора сцены');
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <h2 className="text-2xl font-bold">Предпросмотр фона</h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="aspect-ratio-9-16 relative rounded-lg overflow-hidden border-2 border-border bg-muted">
            {activeScene ? (
              <Image
                src={activeScene.storageUrl}
                alt="Generated background"
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Scene History (если больше 1) */}
          {sceneAssets.length > 1 && (
            <div>
              <Label className="text-sm mb-2 block">История генераций</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {sceneAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleSelectScene(asset.id)}
                    className={`relative w-20 h-32 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      asset.id === selectedAssetId
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={asset.storageUrl}
                      alt={`Version ${sceneAssets.indexOf(asset) + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          {/* Prompt Editor */}
          <div>
            <Label htmlFor="scenePrompt" className="text-sm mb-2 block">
              Промпт фона
            </Label>
            <div className="flex gap-2">
              <Input
                id="scenePrompt"
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder="professional product photography, wooden podium..."
                className="flex-1"
              />
              <Button
                onClick={handleRegenerateBackground}
                disabled={isRegenerating}
                size="icon"
                variant="outline"
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Измените промпт и нажмите ↻ для регенерации
            </p>
          </div>

          {/* TTS Player */}
          {ttsAsset && (
            <div className="p-4 border rounded-lg bg-card">
              <Label className="text-sm mb-3 block">Озвучка (TTS)</Label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={toggleAudio}
                  size="icon"
                  variant="outline"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={resetAudio}
                  size="icon"
                  variant="ghost"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {ttsAsset.meta?.voice || 'alena'}
                </span>
              </div>
              <audio
                ref={audioRef}
                src={ttsAsset.storageUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              {ttsAsset.meta?.text && (
                <p className="text-xs text-muted-foreground mt-3">
                  {ttsAsset.meta.text}
                </p>
              )}
            </div>
          )}

          {/* Animate Button */}
          <div className="pt-4">
            <Button
              onClick={onAnimate}
              size="lg"
              className="w-full gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Анимировать видео
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Запустится генерация финального видео (~3-4 минуты)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
