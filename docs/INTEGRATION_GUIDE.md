# Human-in-the-Loop Integration Guide

## Что готово

### Backend ✅
- **Статусы**: `GENERATING_IMAGE`, `IMAGE_READY`, `GENERATING_VIDEO`
- **Процессоры**: 
  - `BackgroundProcessor` (generate-background) - Photoroom + Stability + TTS
  - `AnimationProcessor` (animate-image) - Kling + Remotion
- **API**:
  - `POST /projects` - запускает Этап 1
  - `POST /projects/:id/regenerate-bg` - регенерация фона
  - `POST /projects/:id/select-scene` - выбор старого варианта
  - `POST /projects/:id/animate` - запуск Этапа 2
- **История сцен**: все варианты фона сохраняются как Assets

### Frontend ✅
- **React Query** установлен и настроен
- **Polling hook**: `useProjectStatus()` - автоматический опрос каждые 3 сек
- **Компонент**: `ImagePreviewStep` - UI для Этапа 1

## Интеграция в Create Page

Обновите `/frontend/app/create/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useProjectStatus } from '@/lib/hooks/useProjectStatus';
import ProductDataStep from '@/components/wizard/ProductDataStep';
import ImagePreviewStep from '@/components/wizard/ImagePreviewStep';
import SettingsStep from '@/components/wizard/SettingsStep';
import axios from 'axios';
import { API_URL } from '@/lib/utils';

export default function CreatePage() {
  const [step, setStep] = useState<'product' | 'preview' | 'settings'>('product');
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Polling проекта
  const { data: project, isLoading } = useProjectStatus(projectId, !!projectId);
  
  // Отслеживаем смену статуса
  useEffect(() => {
    if (!project) return;
    
    if (project.status === 'IMAGE_READY' && step === 'product') {
      setStep('preview'); // Переход на превью когда фон готов
    }
    
    if (project.status === 'COMPLETED') {
      router.push(`/projects/${project.id}`); // Редирект когда видео готово
    }
  }, [project?.status]);

  const handleProductSubmit = async (data) => {
    // Создаем проект
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_URL}/projects`, {
      title: projectTitle,
      settings: {
        mainImage: data.imageUrl,
        productName: data.productData.title,
        description: data.productData.description,
        usps: data.productData.usps.filter(u => u.trim()),
      }
    }, { headers: { Authorization: `Bearer ${token}` }});
    
    setProjectId(res.data.id);
    // Джоб 'generate-background' уже запущен на бэке
    // Polling начнется автоматически
  };

  const handleAnimate = async () => {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_URL}/projects/${projectId}/animate`,
      {},
      { headers: { Authorization: `Bearer ${token}` }}
    );
    // Статус изменится на GENERATING_VIDEO
  };

  if (step === 'product') {
    return <ProductDataStep onNext={handleProductSubmit} />;
  }

  if (step === 'preview') {
    const sceneAssets = project?.assets?.filter(a => a.type === 'IMAGE_SCENE') || [];
    const ttsAsset = project?.assets?.find(a => a.type === 'AUDIO_TTS');
    
    return (
      <ImagePreviewStep
        projectId={project.id}
        sceneAssets={sceneAssets}
        activeSceneAssetId={project.settings.activeSceneAssetId}
        ttsAsset={ttsAsset}
        scenePrompt={project.settings.scenePrompt}
        onAnimate={handleAnimate}
        onBack={() => setStep('product')}
      />
    );
  }

  return null;
}
```

## Флоу пользователя

1. **Шаг 1**: Загрузка фото + AI анализ → Создание проекта
   - `POST /projects` → статус `GENERATING_IMAGE`
   - Polling каждые 3 сек
   
2. **Фон готов**: Статус → `IMAGE_READY`
   - Автоматический переход на `ImagePreviewStep`
   - Пользователь видит фон + может прослушать TTS
   
3. **Регенерация** (опционально):
   - Редактирует промпт → `POST /projects/:id/regenerate-bg`
   - Статус снова `GENERATING_IMAGE`
   - Новый вариант добавляется в историю
   
4. **Выбор из истории** (опционально):
   - Клик на миниатюру → `POST /projects/:id/select-scene`
   - `activeSceneAssetId` обновляется
   
5. **Запуск анимации**:
   - Кнопка "Анимировать" → `POST /projects/:id/animate`
   - Статус → `GENERATING_VIDEO`
   
6. **Финал**: Статус → `COMPLETED`
   - Редирект на страницу проекта с готовым видео

## Unit Economics

- **Этап 1** (дешево, ~5₽): Photoroom + Stability + TTS
  - Можно давать 3-5 бесплатных регенераций
  
- **Этап 2** (дорого, ~25₽): Kling + Remotion
  - Списывать кредиты только здесь
  
## Что НЕ нужно менять

- `ProductDataStep.tsx` - остается как есть
- `SettingsStep.tsx` - можно удалить (настройки теперь в ImagePreviewStep)
- Backend migrations - TypeORM автоматически создаст новые поля
