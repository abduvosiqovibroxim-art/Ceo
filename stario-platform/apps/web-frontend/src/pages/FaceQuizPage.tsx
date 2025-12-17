import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

interface Celebrity {
  id: string;
  name: string;
  name_uz: string;
  percentage: number;
  image: string;
  descriptor?: Float32Array;
}

type AppState = 'loading_models' | 'choose' | 'camera' | 'loading' | 'results';

// Celebrities database with real photos
const celebritiesData: Omit<Celebrity, 'descriptor'>[] = [
  { id: '1', name: 'Лола Юлдашева', name_uz: 'Lola Yuldasheva', percentage: 0, image: '/celebrities/lola_yuldasheva.jpg' },
  { id: '2', name: 'Шахзода', name_uz: 'Shahzoda', percentage: 0, image: '/celebrities/shahzoda.jpg' },
  { id: '3', name: 'Юлдуз Усмонова', name_uz: 'Yulduz Usmonova', percentage: 0, image: '/celebrities/yulduz_usmonova.jpg' },
  { id: '4', name: 'Озода Нурсаидова', name_uz: 'Ozoda Nursaidova', percentage: 0, image: '/celebrities/ozoda_nursaidova.jpg' },
  { id: '5', name: 'Райхон', name_uz: 'Rayhon', percentage: 0, image: '/celebrities/rayhon.jpg' },
  { id: '6', name: 'Шохруххон', name_uz: 'Shohruhxon', percentage: 0, image: '/celebrities/shohruhxon.jpg' },
  { id: '7', name: 'Севара Назархан', name_uz: 'Sevara Nazarkhan', percentage: 0, image: '/celebrities/sevara_nazarkhan.jpg' },
];

const translations = {
  uz: {
    title: "Face Quiz - O'zbek Yulduzlari",
    subtitle: "Qaysi o'zbek yulduziga o'xshaysiz? Rasmingizni yuklang yoki kameradan foydalaning!",
    camera: "Kamera",
    gallery: "Galereya",
    capture: "Suratga olish",
    back: "Orqaga",
    analyzing: "Tahlil qilinmoqda...",
    loadingModels: "AI modellar yuklanmoqda...",
    results: "Sizga o'xshash yulduzlar:",
    tryAgain: "Qayta urinish",
    noFace: "Yuz topilmadi",
    error: "Xatolik yuz berdi"
  },
  ru: {
    title: "Face Quiz - Узбекские Звёзды",
    subtitle: "На какую узбекскую звезду вы похожи? Загрузите фото или используйте камеру!",
    camera: "Камера",
    gallery: "Галерея",
    capture: "Сфотографировать",
    back: "Назад",
    analyzing: "Анализируем...",
    loadingModels: "Загрузка AI моделей...",
    results: "Похожие на вас звёзды:",
    tryAgain: "Попробовать снова",
    noFace: "Лицо не найдено",
    error: "Произошла ошибка"
  },
  en: {
    title: "Face Quiz - Uzbek Stars",
    subtitle: "Which Uzbek star do you look like? Upload a photo or use your camera!",
    camera: "Camera",
    gallery: "Gallery",
    capture: "Take Photo",
    back: "Back",
    analyzing: "Analyzing...",
    loadingModels: "Loading AI models...",
    results: "Stars you look like:",
    tryAgain: "Try Again",
    noFace: "No face detected",
    error: "An error occurred"
  }
};

// Calculate similarity percentage from Euclidean distance
function distanceToPercentage(distance: number): number {
  // Euclidean distance typically ranges from 0 (identical) to ~1.2 (very different)
  // Convert to percentage where 0 distance = 100%, 0.8+ distance = low match
  const maxDistance = 0.8;
  const percentage = Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100));
  return Math.round(percentage * 10) / 10;
}

export default function FaceQuizPage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || 'ru') as 'uz' | 'ru' | 'en';
  const t = translations[lang] || translations.ru;

  const [state, setState] = useState<AppState>('loading_models');
  const [results, setResults] = useState<Celebrity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load face-api models and celebrity face descriptors
  useEffect(() => {
    const loadModelsAndDescriptors = async () => {
      try {
        setLoadingProgress(10);

        // Load face-api.js models
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        setLoadingProgress(30);

        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        setLoadingProgress(50);

        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setLoadingProgress(70);

        // Load celebrity face descriptors
        const celebsWithDescriptors: Celebrity[] = [];

        for (let i = 0; i < celebritiesData.length; i++) {
          const celeb = celebritiesData[i];
          try {
            const img = await faceapi.fetchImage(celeb.image);
            const detection = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              celebsWithDescriptors.push({
                ...celeb,
                descriptor: detection.descriptor,
              });
            } else {
              celebsWithDescriptors.push({ ...celeb });
            }
          } catch (err) {
            console.warn(`Failed to load descriptor for ${celeb.name}:`, err);
            celebsWithDescriptors.push({ ...celeb });
          }
          setLoadingProgress(70 + Math.round((i + 1) / celebritiesData.length * 30));
        }

        setCelebrities(celebsWithDescriptors);
        setModelsLoaded(true);
        setState('choose');
      } catch (err) {
        console.error('Failed to load models:', err);
        setError(t.error);
        setState('choose');
      }
    };

    loadModelsAndDescriptors();
  }, []);

  const analyzeImage = async (imageBlob: Blob) => {
    setState('loading');
    setError(null);

    try {
      // Create image element from blob
      const imageUrl = URL.createObjectURL(imageBlob);
      const img = await faceapi.fetchImage(imageUrl);

      // Detect face and get descriptor
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      URL.revokeObjectURL(imageUrl);

      if (!detection) {
        setError(t.noFace);
        setState('choose');
        setPreviewImage(null);
        return;
      }

      const userDescriptor = detection.descriptor;

      // Compare with all celebrities
      const matches: Celebrity[] = celebrities
        .filter(celeb => celeb.descriptor)
        .map(celeb => {
          const distance = faceapi.euclideanDistance(userDescriptor, celeb.descriptor!);
          return {
            ...celeb,
            percentage: distanceToPercentage(distance),
          };
        })
        .sort((a, b) => b.percentage - a.percentage);

      if (matches.length === 0) {
        setError(t.error);
        setState('choose');
        setPreviewImage(null);
        return;
      }

      setResults(matches);
      setState('results');
    } catch (err) {
      console.error('Face analysis error:', err);
      setError(t.error);
      setState('choose');
      setPreviewImage(null);
    }
  };

  const captureFromCamera = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setPreviewImage(imageSrc);
    const blob = await fetch(imageSrc).then(r => r.blob());
    await analyzeImage(blob);
  }, [celebrities, t]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageSrc = event.target?.result as string;
      setPreviewImage(imageSrc);
      await analyzeImage(file);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setState('choose');
    setResults([]);
    setError(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCelebName = (celeb: Celebrity) => {
    if (lang === 'uz') return celeb.name_uz || celeb.name;
    return celeb.name;
  };

  return (
    <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white -mx-4 -mt-6 px-4 pt-6 pb-8" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">{t.title}</h1>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {state === 'loading_models' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl">{t.loadingModels}</p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm">{loadingProgress}%</p>
          </div>
        )}

        {state === 'choose' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <p className="text-gray-300 text-center max-w-md mb-4">
              {t.subtitle}
            </p>

            {modelsLoaded && (
              <div className="text-green-400 text-sm mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI Face Recognition Ready
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setState('camera')}
                disabled={!modelsLoaded}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.camera}
              </button>

              <label className={`bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center gap-3 ${!modelsLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t.gallery}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={!modelsLoaded}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {state === 'camera' && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-500">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 400,
                  height: 400,
                  facingMode: 'user'
                }}
                className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] object-cover"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={captureFromCamera}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-all transform hover:scale-105"
              >
                {t.capture}
              </button>

              <button
                onClick={() => setState('choose')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-all"
              >
                {t.back}
              </button>
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            {previewImage && (
              <img src={previewImage} alt="Preview" className="w-40 h-40 rounded-2xl object-cover mb-4" />
            )}
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl">{t.analyzing}</p>
            <p className="text-gray-400 text-sm">AI face matching...</p>
          </div>
        )}

        {state === 'results' && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xl">
            {previewImage && (
              <img src={previewImage} alt="Your photo" className="w-28 h-28 rounded-full object-cover border-4 border-purple-500" />
            )}
            <h2 className="text-2xl font-bold text-white">{t.results}</h2>

            <div className="grid gap-4 w-full px-4">
              {results.map((celeb, index) => (
                <div
                  key={celeb.id}
                  className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 flex items-center gap-4 ${
                    index === 0 ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/20' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={celeb.image}
                        alt={celeb.name}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                        #1
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{getCelebName(celeb)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            celeb.percentage >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            celeb.percentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                          style={{ width: `${celeb.percentage}%` }}
                        ></div>
                      </div>
                      <span className={`font-bold ${
                        celeb.percentage >= 60 ? 'text-green-400' :
                        celeb.percentage >= 40 ? 'text-yellow-400' :
                        'text-purple-400'
                      }`}>{celeb.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={reset}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-all transform hover:scale-105"
            >
              {t.tryAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
