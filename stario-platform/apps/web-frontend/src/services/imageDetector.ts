import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectionResult {
  objects: DetectedObject[];
  personDetected: boolean;
  personBox: DetectedObject['bbox'] | null;
  allDetections: number;
}

class ImageDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private loading: Promise<void> | null = null;

  async loadModel(): Promise<void> {
    if (this.model) return;

    if (this.loading) {
      await this.loading;
      return;
    }

    this.loading = (async () => {
      console.log('Loading COCO-SSD model...');
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      });
      console.log('COCO-SSD model loaded');
    })();

    await this.loading;
  }

  async detect(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DetectionResult> {
    await this.loadModel();

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const predictions = await this.model.detect(imageElement);

    const objects: DetectedObject[] = predictions.map(pred => ({
      class: pred.class,
      score: pred.score,
      bbox: {
        x: pred.bbox[0],
        y: pred.bbox[1],
        width: pred.bbox[2],
        height: pred.bbox[3]
      }
    }));

    const personDetection = objects.find(obj => obj.class === 'person' && obj.score > 0.5);

    return {
      objects,
      personDetected: !!personDetection,
      personBox: personDetection?.bbox || null,
      allDetections: objects.length
    };
  }

  async detectFromDataUrl(dataUrl: string): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const result = await this.detect(img);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  isLoaded(): boolean {
    return this.model !== null;
  }
}

export const imageDetector = new ImageDetector();
