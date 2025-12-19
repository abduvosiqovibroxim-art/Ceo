/**
 * YOLO Detection API Service
 * Connects to local YOLO API for object/person detection
 */

// @ts-ignore
const YOLO_API_URL = (import.meta.env?.VITE_YOLO_API_URL as string) || 'http://localhost:8002';

export interface Detection {
  class_name: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface DetectionResponse {
  detections: Detection[];
  count: number;
  image_width: number;
  image_height: number;
}

export interface YOLOHealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  model_path: string;
}

class YOLOService {
  private baseUrl: string;

  constructor(baseUrl: string = YOLO_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if YOLO API is healthy
   */
  async healthCheck(): Promise<YOLOHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('YOLO API is not available');
    }
    return response.json();
  }

  /**
   * Detect objects/persons in an image
   */
  async detect(imageFile: File | Blob): Promise<DetectionResponse> {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${this.baseUrl}/detect`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Detection failed' }));
      throw new Error(error.detail || 'Detection failed');
    }

    return response.json();
  }

  /**
   * Detect from base64 data URL
   */
  async detectFromDataUrl(dataUrl: string): Promise<DetectionResponse> {
    const blob = await this.dataUrlToBlob(dataUrl);
    return this.detect(blob);
  }

  /**
   * Check if person is detected in results
   */
  hasPersonDetected(response: DetectionResponse): boolean {
    return response.detections.some(d => d.class_name === 'person' && d.confidence > 0.5);
  }

  /**
   * Get best person detection from results
   */
  getBestPersonDetection(response: DetectionResponse): Detection | null {
    const persons = response.detections
      .filter(d => d.class_name === 'person')
      .sort((a, b) => b.confidence - a.confidence);
    return persons[0] || null;
  }

  /**
   * Convert data URL to Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }
}

export const yoloService = new YOLOService();
export default yoloService;
