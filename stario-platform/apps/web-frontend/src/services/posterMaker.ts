/**
 * AI Poster Maker Service
 * Creates movie posters with user + celebrity compositing
 */

import { imageDetector } from './imageDetector';

// ============ TYPES ============

export interface Actor {
  id: string;
  name: string;
  name_uz: string;
  image: string;
  category: 'uzbek' | 'hollywood' | 'kdrama';
  scenes: PosterScene[];
}

export interface PosterScene {
  id: string;
  name: string;
  template: string;      // Background image URL
  actorPosition: Position;
  userPosition: Position;
  genre: string;
}

export interface Position {
  x: number;      // % from left
  y: number;      // % from top
  width: number;  // % of canvas width
  height: number; // % of canvas height
  zIndex: number;
}

export interface PosterStyle {
  id: string;
  name: string;
  preview: string;
  filters: StyleFilters;
  overlay?: string;
  typography: TypographyStyle;
}

export interface StyleFilters {
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  sepia: number;
  grayscale: number;
  blur: number;
}

export interface TypographyStyle {
  titleFont: string;
  titleColor: string;
  titleSize: number;
  subtitleFont: string;
  subtitleColor: string;
  accentColor: string;
}

export interface PhotoAnalysis {
  quality: 'low' | 'medium' | 'high';
  faceDetected: boolean;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  brightness: number;
  contrast: number;
  dominantColors: string[];
}

export interface GeneratedPoster {
  imageUrl: string;
  width: number;
  height: number;
  actorName: string;
  styleName: string;
  movieTitle: string;
}

// ============ ACTORS CATALOG ============

export const actorsCatalog: Actor[] = [
  {
    id: 'shahzoda',
    name: 'Шахзода',
    name_uz: 'Shahzoda',
    image: '/celebrities/shahzoda.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'shahzoda-drama',
        name: 'Драматический дуэт',
        template: '/posters/templates/drama-bg.jpg',
        actorPosition: { x: 10, y: 15, width: 40, height: 70, zIndex: 2 },
        userPosition: { x: 50, y: 20, width: 40, height: 65, zIndex: 1 },
        genre: 'drama'
      },
      {
        id: 'shahzoda-romance',
        name: 'Романтика',
        template: '/posters/templates/romance-bg.jpg',
        actorPosition: { x: 15, y: 20, width: 35, height: 60, zIndex: 2 },
        userPosition: { x: 50, y: 25, width: 35, height: 55, zIndex: 1 },
        genre: 'romance'
      }
    ]
  },
  {
    id: 'shohruhxon',
    name: 'Шохруххон',
    name_uz: 'Shohruhxon',
    image: '/celebrities/shohruhxon.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'shohruhxon-action',
        name: 'Боевик',
        template: '/posters/templates/action-bg.jpg',
        actorPosition: { x: 5, y: 10, width: 45, height: 75, zIndex: 2 },
        userPosition: { x: 50, y: 15, width: 45, height: 70, zIndex: 1 },
        genre: 'action'
      },
      {
        id: 'shohruhxon-thriller',
        name: 'Триллер',
        template: '/posters/templates/thriller-bg.jpg',
        actorPosition: { x: 55, y: 15, width: 40, height: 70, zIndex: 2 },
        userPosition: { x: 5, y: 20, width: 40, height: 65, zIndex: 1 },
        genre: 'thriller'
      }
    ]
  },
  {
    id: 'yulduz',
    name: 'Юлдуз Усмонова',
    name_uz: 'Yulduz Usmonova',
    image: '/celebrities/yulduz_usmonova.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'yulduz-musical',
        name: 'Мюзикл',
        template: '/posters/templates/musical-bg.jpg',
        actorPosition: { x: 10, y: 15, width: 40, height: 70, zIndex: 2 },
        userPosition: { x: 50, y: 20, width: 40, height: 65, zIndex: 1 },
        genre: 'musical'
      }
    ]
  },
  {
    id: 'ozoda',
    name: 'Озода Нурсаидова',
    name_uz: 'Ozoda Nursaidova',
    image: '/celebrities/ozoda_nursaidova.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'ozoda-romance',
        name: 'Романтика',
        template: '/posters/templates/romance-bg.jpg',
        actorPosition: { x: 15, y: 20, width: 35, height: 60, zIndex: 2 },
        userPosition: { x: 50, y: 25, width: 35, height: 55, zIndex: 1 },
        genre: 'romance'
      }
    ]
  },
  {
    id: 'sevara',
    name: 'Севара Назархан',
    name_uz: 'Sevara Nazarkhan',
    image: '/celebrities/sevara_nazarkhan.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'sevara-art',
        name: 'Арт-хаус',
        template: '/posters/templates/art-bg.jpg',
        actorPosition: { x: 10, y: 15, width: 40, height: 70, zIndex: 2 },
        userPosition: { x: 50, y: 20, width: 40, height: 65, zIndex: 1 },
        genre: 'art'
      }
    ]
  },
  {
    id: 'rayhon',
    name: 'Райхон',
    name_uz: 'Rayhon',
    image: '/celebrities/rayhon.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'rayhon-comedy',
        name: 'Комедия',
        template: '/posters/templates/comedy-bg.jpg',
        actorPosition: { x: 15, y: 20, width: 35, height: 60, zIndex: 2 },
        userPosition: { x: 50, y: 25, width: 35, height: 55, zIndex: 1 },
        genre: 'comedy'
      }
    ]
  },
  {
    id: 'lola',
    name: 'Лола Юлдашева',
    name_uz: 'Lola Yuldasheva',
    image: '/celebrities/lola_yuldasheva.jpg',
    category: 'uzbek',
    scenes: [
      {
        id: 'lola-glamour',
        name: 'Гламур',
        template: '/posters/templates/glamour-bg.jpg',
        actorPosition: { x: 10, y: 15, width: 40, height: 70, zIndex: 2 },
        userPosition: { x: 50, y: 20, width: 40, height: 65, zIndex: 1 },
        genre: 'glamour'
      }
    ]
  }
];

// ============ POSTER STYLES ============

export const posterStyles: PosterStyle[] = [
  {
    id: 'blockbuster',
    name: 'Блокбастер',
    preview: '🎬',
    filters: {
      brightness: 1.1,
      contrast: 1.2,
      saturate: 1.3,
      hueRotate: 0,
      sepia: 0,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Impact, sans-serif',
      titleColor: '#ffffff',
      titleSize: 48,
      subtitleFont: 'Arial, sans-serif',
      subtitleColor: '#cccccc',
      accentColor: '#ff6b00'
    }
  },
  {
    id: 'noir',
    name: 'Нуар',
    preview: '🎭',
    filters: {
      brightness: 0.9,
      contrast: 1.4,
      saturate: 0.3,
      hueRotate: 0,
      sepia: 0.2,
      grayscale: 0.7,
      blur: 0
    },
    typography: {
      titleFont: 'Georgia, serif',
      titleColor: '#ffffff',
      titleSize: 44,
      subtitleFont: 'Georgia, serif',
      subtitleColor: '#999999',
      accentColor: '#cc0000'
    }
  },
  {
    id: 'neon',
    name: 'Неон',
    preview: '💜',
    filters: {
      brightness: 1.0,
      contrast: 1.3,
      saturate: 1.5,
      hueRotate: -20,
      sepia: 0,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Arial Black, sans-serif',
      titleColor: '#ff00ff',
      titleSize: 46,
      subtitleFont: 'Arial, sans-serif',
      subtitleColor: '#00ffff',
      accentColor: '#ff00ff'
    }
  },
  {
    id: 'romance',
    name: 'Романтика',
    preview: '💕',
    filters: {
      brightness: 1.05,
      contrast: 0.95,
      saturate: 1.1,
      hueRotate: 10,
      sepia: 0.15,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Palatino, serif',
      titleColor: '#ffffff',
      titleSize: 42,
      subtitleFont: 'Palatino, serif',
      subtitleColor: '#ffcccc',
      accentColor: '#ff6699'
    }
  },
  {
    id: 'drama',
    name: 'Драма',
    preview: '🎪',
    filters: {
      brightness: 0.95,
      contrast: 1.25,
      saturate: 0.9,
      hueRotate: -10,
      sepia: 0.1,
      grayscale: 0.1,
      blur: 0
    },
    typography: {
      titleFont: 'Times New Roman, serif',
      titleColor: '#ffffff',
      titleSize: 44,
      subtitleFont: 'Times New Roman, serif',
      subtitleColor: '#aaaaaa',
      accentColor: '#4477aa'
    }
  },
  {
    id: 'action',
    name: 'Боевик',
    preview: '💥',
    filters: {
      brightness: 1.1,
      contrast: 1.35,
      saturate: 1.2,
      hueRotate: 5,
      sepia: 0.05,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Impact, sans-serif',
      titleColor: '#ff4400',
      titleSize: 50,
      subtitleFont: 'Arial Black, sans-serif',
      subtitleColor: '#ffffff',
      accentColor: '#ffaa00'
    }
  },
  {
    id: 'retro',
    name: 'Ретро 80-х',
    preview: '📼',
    filters: {
      brightness: 1.05,
      contrast: 1.15,
      saturate: 1.4,
      hueRotate: -15,
      sepia: 0.1,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Arial Black, sans-serif',
      titleColor: '#ff0066',
      titleSize: 46,
      subtitleFont: 'Arial, sans-serif',
      subtitleColor: '#00ccff',
      accentColor: '#ffcc00'
    }
  },
  {
    id: 'netflix',
    name: 'Netflix',
    preview: '🎥',
    filters: {
      brightness: 0.95,
      contrast: 1.2,
      saturate: 1.0,
      hueRotate: 0,
      sepia: 0,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Helvetica, Arial, sans-serif',
      titleColor: '#ffffff',
      titleSize: 40,
      subtitleFont: 'Helvetica, Arial, sans-serif',
      subtitleColor: '#999999',
      accentColor: '#e50914'
    }
  },
  {
    id: 'minimal',
    name: 'Минимализм',
    preview: '⬜',
    filters: {
      brightness: 1.0,
      contrast: 1.1,
      saturate: 0.8,
      hueRotate: 0,
      sepia: 0,
      grayscale: 0.2,
      blur: 0
    },
    typography: {
      titleFont: 'Helvetica Neue, sans-serif',
      titleColor: '#ffffff',
      titleSize: 36,
      subtitleFont: 'Helvetica Neue, sans-serif',
      subtitleColor: '#888888',
      accentColor: '#ffffff'
    }
  },
  {
    id: 'marvel',
    name: 'Супергерой',
    preview: '🦸',
    filters: {
      brightness: 1.15,
      contrast: 1.3,
      saturate: 1.25,
      hueRotate: 0,
      sepia: 0,
      grayscale: 0,
      blur: 0
    },
    typography: {
      titleFont: 'Impact, sans-serif',
      titleColor: '#ffffff',
      titleSize: 52,
      subtitleFont: 'Arial Black, sans-serif',
      subtitleColor: '#ffcc00',
      accentColor: '#cc0000'
    }
  }
];

// ============ MOVIE TITLE GENERATOR ============

const movieTitleParts = {
  adjectives: ['Последний', 'Тайный', 'Вечный', 'Потерянный', 'Забытый', 'Огненный', 'Ледяной', 'Золотой', 'Тёмный', 'Светлый'],
  nouns: ['Путь', 'Сердце', 'Город', 'Мир', 'Рассвет', 'Закат', 'Секрет', 'Шанс', 'Миг', 'Выбор'],
  endings: ['', 'судьбы', 'любви', 'мечты', 'надежды', 'времени', 'звёзд']
};

export function generateMovieTitle(): string {
  const adj = movieTitleParts.adjectives[Math.floor(Math.random() * movieTitleParts.adjectives.length)];
  const noun = movieTitleParts.nouns[Math.floor(Math.random() * movieTitleParts.nouns.length)];
  const ending = movieTitleParts.endings[Math.floor(Math.random() * movieTitleParts.endings.length)];

  return ending ? `${adj} ${noun.toLowerCase()} ${ending}` : `${adj} ${noun.toLowerCase()}`;
}

// ============ PHOTO ANALYSIS WITH YOLO/COCO-SSD ============

export async function analyzePhoto(imageData: string): Promise<PhotoAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // Calculate brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (data.length / 4) / 255;

      // Calculate contrast
      let minBrightness = 255;
      let maxBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < minBrightness) minBrightness = brightness;
        if (brightness > maxBrightness) maxBrightness = brightness;
      }
      const contrast = (maxBrightness - minBrightness) / 255;

      // Quality based on resolution
      let quality: 'low' | 'medium' | 'high' = 'medium';
      const pixels = img.width * img.height;
      if (pixels < 100000) quality = 'low';
      else if (pixels > 500000) quality = 'high';

      // Extract dominant colors
      const colorMap = new Map<string, number>();
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
      const sortedColors = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);
      const dominantColors = sortedColors.slice(0, 3).map(c => c[0]);

      // Real object detection with COCO-SSD (YOLO-like)
      let faceDetected = false;
      let faceBox: { x: number; y: number; width: number; height: number } | null = null;

      try {
        console.log('Running COCO-SSD detection...');
        const detection = await imageDetector.detect(img);
        console.log('Detection result:', detection);

        faceDetected = detection.personDetected;

        if (detection.personBox) {
          faceBox = {
            x: detection.personBox.x,
            y: detection.personBox.y,
            width: detection.personBox.width,
            height: detection.personBox.height
          };
        }

        // If no person detected, use center region as fallback
        if (!faceDetected) {
          faceBox = {
            x: img.width * 0.25,
            y: img.height * 0.1,
            width: img.width * 0.5,
            height: img.height * 0.6
          };
        }
      } catch (err) {
        console.error('Detection failed, using fallback:', err);
        // Fallback if detection fails
        faceBox = {
          x: img.width * 0.25,
          y: img.height * 0.1,
          width: img.width * 0.5,
          height: img.height * 0.6
        };
        faceDetected = true; // Assume face is present
      }

      resolve({
        quality,
        faceDetected,
        faceBox,
        brightness: avgBrightness,
        contrast,
        dominantColors
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}

// ============ POSTER GENERATOR ============

export class PosterGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private readonly POSTER_WIDTH = 800;
  private readonly POSTER_HEIGHT = 1200;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.POSTER_WIDTH;
    this.canvas.height = this.POSTER_HEIGHT;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generate(
    userPhoto: string,
    actor: Actor,
    scene: PosterScene,
    style: PosterStyle,
    movieTitle: string
  ): Promise<GeneratedPoster> {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.POSTER_WIDTH, this.POSTER_HEIGHT);

    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.POSTER_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.POSTER_WIDTH, this.POSTER_HEIGHT);

    // Load images
    const [actorImg, userImg] = await Promise.all([
      this.loadImage(actor.image),
      this.loadImage(userPhoto)
    ]);

    // Draw actor
    const actorPos = scene.actorPosition;
    await this.drawPerson(
      actorImg,
      actorPos.x / 100 * this.POSTER_WIDTH,
      actorPos.y / 100 * this.POSTER_HEIGHT,
      actorPos.width / 100 * this.POSTER_WIDTH,
      actorPos.height / 100 * this.POSTER_HEIGHT,
      style
    );

    // Draw user
    const userPos = scene.userPosition;
    await this.drawPerson(
      userImg,
      userPos.x / 100 * this.POSTER_WIDTH,
      userPos.y / 100 * this.POSTER_HEIGHT,
      userPos.width / 100 * this.POSTER_WIDTH,
      userPos.height / 100 * this.POSTER_HEIGHT,
      style
    );

    // Apply style filters
    this.applyFilters(style.filters);

    // Add overlays based on style
    this.addStyleOverlay(style);

    // Add typography
    this.addTypography(movieTitle, actor.name, style);

    // Add watermark
    this.addWatermark();

    return {
      imageUrl: this.canvas.toDataURL('image/jpeg', 0.92),
      width: this.POSTER_WIDTH,
      height: this.POSTER_HEIGHT,
      actorName: actor.name,
      styleName: style.name,
      movieTitle
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private async drawPerson(
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    _style: PosterStyle
  ): Promise<void> {
    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Calculate crop to focus on face/upper body
    const sourceAspect = img.width / img.height;
    const targetAspect = width / height;

    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (sourceAspect > targetAspect) {
      sw = img.height * targetAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetAspect;
      sy = 0; // Keep top of image (face area)
    }

    tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

    // Add vignette effect
    const vignetteGradient = tempCtx.createRadialGradient(
      width / 2, height / 2, height * 0.3,
      width / 2, height / 2, height * 0.8
    );
    vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
    tempCtx.fillStyle = vignetteGradient;
    tempCtx.fillRect(0, 0, width, height);

    // Draw to main canvas with soft edges
    this.ctx.save();

    // Create mask for soft edges
    const maskGradient = this.ctx.createLinearGradient(x, y + height - 50, x, y + height);
    maskGradient.addColorStop(0, 'rgba(255,255,255,1)');
    maskGradient.addColorStop(1, 'rgba(255,255,255,0)');

    this.ctx.drawImage(tempCanvas, x, y, width, height);
    this.ctx.restore();
  }

  private applyFilters(filters: StyleFilters): void {
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.POSTER_WIDTH, this.POSTER_HEIGHT);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r *= filters.brightness;
      g *= filters.brightness;
      b *= filters.brightness;

      // Contrast
      r = ((r / 255 - 0.5) * filters.contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * filters.contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * filters.contrast + 0.5) * 255;

      // Saturation
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray + filters.saturate * (r - gray);
      g = gray + filters.saturate * (g - gray);
      b = gray + filters.saturate * (b - gray);

      // Grayscale
      if (filters.grayscale > 0) {
        const gray2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = r * (1 - filters.grayscale) + gray2 * filters.grayscale;
        g = g * (1 - filters.grayscale) + gray2 * filters.grayscale;
        b = b * (1 - filters.grayscale) + gray2 * filters.grayscale;
      }

      // Sepia
      if (filters.sepia > 0) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r * (1 - filters.sepia) + tr * filters.sepia;
        g = g * (1 - filters.sepia) + tg * filters.sepia;
        b = b * (1 - filters.sepia) + tb * filters.sepia;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private addStyleOverlay(style: PosterStyle): void {
    // Add style-specific overlays
    if (style.id === 'neon') {
      // Neon glow effect
      const gradient = this.ctx.createLinearGradient(0, 0, this.POSTER_WIDTH, this.POSTER_HEIGHT);
      gradient.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.POSTER_WIDTH, this.POSTER_HEIGHT);
    } else if (style.id === 'retro') {
      // Retro scan lines
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < this.POSTER_HEIGHT; y += 4) {
        this.ctx.fillRect(0, y, this.POSTER_WIDTH, 2);
      }
    } else if (style.id === 'action') {
      // Fire gradient at bottom
      const fireGradient = this.ctx.createLinearGradient(0, this.POSTER_HEIGHT - 200, 0, this.POSTER_HEIGHT);
      fireGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
      fireGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
      fireGradient.addColorStop(1, 'rgba(200, 0, 0, 0.4)');
      this.ctx.fillStyle = fireGradient;
      this.ctx.fillRect(0, this.POSTER_HEIGHT - 200, this.POSTER_WIDTH, 200);
    }

    // Top gradient for text visibility
    const topGradient = this.ctx.createLinearGradient(0, 0, 0, 150);
    topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = topGradient;
    this.ctx.fillRect(0, 0, this.POSTER_WIDTH, 150);

    // Bottom gradient for text
    const bottomGradient = this.ctx.createLinearGradient(0, this.POSTER_HEIGHT - 300, 0, this.POSTER_HEIGHT);
    bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
    bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    this.ctx.fillStyle = bottomGradient;
    this.ctx.fillRect(0, this.POSTER_HEIGHT - 300, this.POSTER_WIDTH, 300);
  }

  private addTypography(movieTitle: string, actorName: string, style: PosterStyle): void {
    const typo = style.typography;

    // Movie title
    this.ctx.font = `bold ${typo.titleSize}px ${typo.titleFont}`;
    this.ctx.textAlign = 'center';

    // Title shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillText(movieTitle.toUpperCase(), this.POSTER_WIDTH / 2 + 3, this.POSTER_HEIGHT - 150 + 3);

    // Title
    this.ctx.fillStyle = typo.titleColor;
    this.ctx.fillText(movieTitle.toUpperCase(), this.POSTER_WIDTH / 2, this.POSTER_HEIGHT - 150);

    // Starring line
    this.ctx.font = `${16}px ${typo.subtitleFont}`;
    this.ctx.fillStyle = typo.subtitleColor;
    this.ctx.fillText('В ГЛАВНЫХ РОЛЯХ', this.POSTER_WIDTH / 2, this.POSTER_HEIGHT - 100);

    // Actor names
    this.ctx.font = `bold ${24}px ${typo.subtitleFont}`;
    this.ctx.fillStyle = typo.accentColor;
    this.ctx.fillText(`${actorName}  •  Вы`, this.POSTER_WIDTH / 2, this.POSTER_HEIGHT - 70);

    // Coming soon
    this.ctx.font = `${14}px ${typo.subtitleFont}`;
    this.ctx.fillStyle = typo.subtitleColor;
    this.ctx.fillText('СКОРО НА ВСЕХ ЭКРАНАХ', this.POSTER_WIDTH / 2, this.POSTER_HEIGHT - 35);

    // Top text (genre badge)
    this.ctx.font = `bold ${14}px ${typo.subtitleFont}`;
    this.ctx.fillStyle = typo.accentColor;
    this.ctx.fillText(`★ ${style.name.toUpperCase()} ★`, this.POSTER_WIDTH / 2, 40);
  }

  private addWatermark(): void {
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('AI Poster Maker • stario.uz', this.POSTER_WIDTH - 20, this.POSTER_HEIGHT - 10);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
