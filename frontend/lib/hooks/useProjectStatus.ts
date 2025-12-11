import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/utils';
import { Project } from '@/types/project';

/**
 * Hook для мониторинга статуса проекта с автоматическим polling
 * 
 * Опрашивает сервер каждые 3 секунды пока проект в статусах:
 * - GENERATING_IMAGE
 * - GENERATING_VIDEO
 * 
 * Останавливает polling когда проект достигает:
 * - IMAGE_READY (ждет действия пользователя)
 * - COMPLETED
 * - FAILED
 */
export function useProjectStatus(projectId: string | null, enabled: boolean = true) {
  const previousStatusRef = useRef<string | undefined>(undefined);
  
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const response = await axios.get<Project>(`${API_URL}/projects/${projectId}`, {
        withCredentials: true, // Send cookies
      });

      return response.data;
    },
    enabled: enabled && !!projectId,
    // Опрашивать каждые 3 сек, если статус в процессе генерации
    refetchInterval: (query) => {
      if (!query.state.data) return 3000; // Если данных еще нет - продолжаем опрашивать
      
      const processingStatuses = ['GENERATING_IMAGE', 'GENERATING_VIDEO', 'QUEUED', 'PROCESSING', 'RENDERING'];
      const currentStatus = query.state.data.status;
      const prevStatus = previousStatusRef.current;
      
      // Сохраняем текущий статус для следующей проверки
      previousStatusRef.current = currentStatus;
      
      // Если сейчас processing - продолжаем опрашивать
      if (processingStatuses.includes(currentStatus)) {
        return 3000;
      }
      
      // Если был processing и стал финальный - еще один запрос через 500ms
      if (prevStatus && processingStatuses.includes(prevStatus)) {
        console.log(`🔄 Status changed from ${prevStatus} to ${currentStatus}, will refetch once more`);
        // Сбрасываем previousStatus чтобы не зациклиться
        previousStatusRef.current = undefined;
        return 500;
      }
      
      // Иначе - прекращаем опрос
      return false;
    },
    // Продолжать в фоне даже если окно не в фокусе
    refetchIntervalInBackground: true,
    // Всегда рефетчить при монтировании, чтобы поймать FAILED статус
    refetchOnMount: 'always',
    // Рефетчить при фокусе окна
    refetchOnWindowFocus: true,
    // Не показывать старые данные из кеша
    staleTime: 0,
  });
}
