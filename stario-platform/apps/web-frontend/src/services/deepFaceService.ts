/**
 * DeepFace API Service
 * Connects to the Face Quiz backend for face comparison using DeepFace
 */

const FACE_API_URL = (import.meta as any).env?.VITE_FACE_API_URL || 'http://localhost:8003';

export interface CelebrityMatch {
  name: string;
  percentage: number;
  photo_path?: string;
}

export interface CompareResponse {
  matches: CelebrityMatch[];
  processing_time_ms: number;
  face_detected: boolean;
}

export interface Celebrity {
  name: string;
  photos_count: number;
}

export interface CelebritiesResponse {
  celebrities: Celebrity[];
  total: number;
}

export interface HealthResponse {
  status: string;
  celebrities_count: number;
  total_photos: number;
}

/**
 * Check if the Face Quiz backend is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${FACE_API_URL}/health`);

  if (!response.ok) {
    throw new Error('Face Quiz backend is not available');
  }

  return response.json();
}

/**
 * Get list of all celebrities in the database
 */
export async function getCelebrities(): Promise<CelebritiesResponse> {
  const response = await fetch(`${FACE_API_URL}/celebrities`);

  if (!response.ok) {
    throw new Error('Failed to fetch celebrities');
  }

  return response.json();
}

/**
 * Compare a face image with all celebrities in the database
 * Returns top 3 matches with similarity percentages
 */
export async function compareFace(file: File): Promise<CompareResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${FACE_API_URL}/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Face comparison failed' }));
    throw new Error(error.detail || 'Face comparison failed');
  }

  return response.json();
}

/**
 * Compare a face from a data URL (base64 encoded image)
 */
export async function compareFaceFromDataUrl(dataUrl: string): Promise<CompareResponse> {
  // Convert data URL to File
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

  return compareFace(file);
}

export default {
  checkHealth,
  getCelebrities,
  compareFace,
  compareFaceFromDataUrl,
};
