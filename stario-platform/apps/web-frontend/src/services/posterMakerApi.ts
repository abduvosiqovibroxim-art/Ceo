/**
 * AI Poster Maker API Service
 * Connects to the Poster Maker backend for face swap and poster generation
 */

const POSTER_API_URL = (import.meta as any).env?.VITE_POSTER_API_URL || 'http://localhost:8007';

// ============ Types ============

export type SceneType = 'hug' | 'red_carpet' | 'movie_poster' | 'selfie' | 'wedding' | 'concert';
export type CelebrityCategory = 'uzbek' | 'hollywood' | 'kpop' | 'bollywood';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Celebrity {
  id: string;
  name: string;
  name_uz: string;
  image: string;
  category: CelebrityCategory;
  photos_count: number;
}

export interface Template {
  id: string;
  name: string;
  name_uz: string;
  scene_type: SceneType;
  preview: string;
  description: string;
}

export interface FaceUploadResponse {
  face_id: string;
  preview_url: string;
  face_detected: boolean;
  face_quality: 'low' | 'medium' | 'high';
  message?: string;
}

export interface GenerateResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  stage?: string;
  result_url?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  celebrities_count: number;
  templates_count: number;
  face_swap_ready: boolean;
}

// ============ API Functions ============

/**
 * Check if the Poster Maker API is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${POSTER_API_URL}/health`);
  if (!response.ok) {
    throw new Error('Poster Maker API is not available');
  }
  return response.json();
}

/**
 * Get list of available celebrities
 */
export async function getCelebrities(category?: CelebrityCategory): Promise<Celebrity[]> {
  const url = category
    ? `${POSTER_API_URL}/celebrities?category=${category}`
    : `${POSTER_API_URL}/celebrities`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch celebrities');
  }

  const data = await response.json();
  return data.celebrities;
}

/**
 * Get list of available templates
 */
export async function getTemplates(): Promise<Template[]> {
  const response = await fetch(`${POSTER_API_URL}/templates`);
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  const data = await response.json();
  return data.templates;
}

/**
 * Upload user's face photo
 */
export async function uploadFace(file: File): Promise<FaceUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${POSTER_API_URL}/upload-face`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Face upload failed');
  }

  return response.json();
}

/**
 * Upload face from data URL (base64)
 */
export async function uploadFaceFromDataUrl(dataUrl: string): Promise<FaceUploadResponse> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  return uploadFace(file);
}

/**
 * Start poster generation
 */
export async function generatePoster(
  faceId: string,
  celebrityId: string,
  templateId: string
): Promise<GenerateResponse> {
  const response = await fetch(`${POSTER_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      face_id: faceId,
      celebrity_id: celebrityId,
      template_id: templateId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(error.detail || 'Poster generation failed');
  }

  return response.json();
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<GenerateResponse> {
  const response = await fetch(`${POSTER_API_URL}/job/${jobId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Job not found' }));
    throw new Error(error.detail || 'Failed to get job status');
  }

  return response.json();
}

/**
 * Poll job status until completion
 */
export async function waitForCompletion(
  jobId: string,
  onProgress?: (progress: number, stage: string) => void,
  maxWaitMs: number = 60000
): Promise<GenerateResponse> {
  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getJobStatus(jobId);

    if (onProgress && status.stage) {
      onProgress(status.progress, status.stage);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Generation timed out');
}

/**
 * Get full URL for result image
 */
export function getResultUrl(resultPath: string): string {
  if (resultPath.startsWith('http')) {
    return resultPath;
  }
  return `${POSTER_API_URL}${resultPath}`;
}

/**
 * Get full URL for celebrity image
 */
export function getCelebrityImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${POSTER_API_URL}${imagePath}`;
}

/**
 * Download poster
 */
export async function downloadPoster(jobId: string): Promise<Blob> {
  const response = await fetch(`${POSTER_API_URL}/download/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to download poster');
  }

  return response.blob();
}

export default {
  checkHealth,
  getCelebrities,
  getTemplates,
  uploadFace,
  uploadFaceFromDataUrl,
  generatePoster,
  getJobStatus,
  waitForCompletion,
  getResultUrl,
  getCelebrityImageUrl,
  downloadPoster,
};
