export type ProjectStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'RENDERING' | 'COMPLETED' | 'FAILED';

export interface ProjectSettings {
    productName?: string;
    description?: string;
    usps?: string[];
    mainImage?: string;
    prompt?: string;
    aspectRatio?: string;
    [key: string]: unknown;
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
