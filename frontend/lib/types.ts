export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'RENDERING' | 'COMPLETED' | 'FAILED' | 'GENERATING_IMAGE' | 'IMAGE_READY' | 'GENERATING_VIDEO';

export interface ProjectSettings {
    productName?: string;
    description?: string;
    usps?: string[];
    mainImage?: string;
    prompt?: string;
    aspectRatio?: string;
}

export interface Project {
    id: string;
    title: string;
    status: ProjectStatus;
    createdAt: string;
    assets: { type: string; storageUrl: string }[];
    resultVideoUrl?: string;
    settings?: ProjectSettings;
}
