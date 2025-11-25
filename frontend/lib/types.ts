export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'RENDERING' | 'COMPLETED' | 'FAILED';

export interface Project {
    id: string;
    title: string;
    status: ProjectStatus;
    createdAt: string;
    assets: { type: string; storageUrl: string }[];
    resultVideoUrl?: string;
}
