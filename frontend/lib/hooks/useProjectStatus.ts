import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/lib/utils';
import { Project } from '@/types/project';

export type UseProjectStatusOptions = {
  onStatusChange?: (project: Project, prevStatus: Project['status'] | undefined) => void;
};

/**
 * Hook для мониторинга статуса проекта с автоматическим polling
 * 
 * Опрашивает сервер каждые 3 секунды пока проект в "processing" статусах:
 * - DRAFT
 * - GENERATING_IMAGE
 * - GENERATING_VIDEO
 * - QUEUED
 * - PROCESSING
 * - RENDERING
 * 
 * После выхода из processing-статуса делает один быстрый refetch (через 500ms),
 * чтобы быстрее поймать финальный статус.
 */
export function useProjectStatus(projectId: string | null, enabled: boolean = true, options?: UseProjectStatusOptions) {
  const previousStatusRef = useRef<Project['status'] | undefined>(undefined);
  const previousNotifiedStatusRef = useRef<Project['status'] | undefined>(undefined);
  const previousProjectIdRef = useRef<string | null>(null);
  const onStatusChangeRef = useRef(options?.onStatusChange);
  
  // Keep callback ref up to date
  onStatusChangeRef.current = options?.onStatusChange;

  const resetRefsIfProjectChanged = (currentProjectId: string | null) => {
    if (previousProjectIdRef.current !== currentProjectId) {
      previousProjectIdRef.current = currentProjectId;
      previousStatusRef.current = undefined;
      previousNotifiedStatusRef.current = undefined;
    }
  };
  
  const query = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      resetRefsIfProjectChanged(projectId);

      const response = await axios.get<Project>(`${API_URL}/projects/${projectId}`, {
        withCredentials: true, // Send cookies
      });

      return response.data;
    },
    enabled: enabled && !!projectId,
    // Опрашивать каждые 3 сек, если статус в процессе генерации
    refetchInterval: (query) => {
      if (!query.state.data) return 3000; // Если данных еще нет - продолжаем опрашивать
      
      const processingStatuses = ['DRAFT', 'GENERATING_IMAGE', 'GENERATING_VIDEO', 'QUEUED', 'PROCESSING', 'RENDERING'];
      const currentStatus = query.state.data.status;

      resetRefsIfProjectChanged(projectId);
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

  // Handle status change callback using useEffect instead of deprecated onSuccess
  useEffect(() => {
    if (query.data) {
      resetRefsIfProjectChanged(projectId);

      const prevStatus = previousNotifiedStatusRef.current;
      if (query.data.status !== prevStatus) {
        onStatusChangeRef.current?.(query.data, prevStatus);
        previousNotifiedStatusRef.current = query.data.status;
      }
    }
  }, [query.data, projectId]);

  return query;
}
