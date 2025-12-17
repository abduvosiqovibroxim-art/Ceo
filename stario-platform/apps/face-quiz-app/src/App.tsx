import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

interface Celebrity {
  id: string;
  name: string;
  name_uz: string;
  percentage: number;
  image: string;
}

interface AnalyzeResult {
  success: boolean;
  matches?: Celebrity[];
  error?: string;
}

type AppState = 'choose' | 'camera' | 'loading' | 'results';
type Lang = 'uz' | 'ru' | 'en';

const translations = {
  uz: {
    title: "Face Quiz - O'zbek Yulduzlari",
    subtitle: "Qaysi o'zbek yulduziga o'xshaysiz? Rasmingizni yuklang yoki kameradan foydalaning!",
    camera: "Kamera",
    gallery: "Galereya",
    capture: "Suratga olish",
    back: "Orqaga",
    analyzing: "Tahlil qilinmoqda...",
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
    results: "Stars you look like:",
    tryAgain: "Try Again",
    noFace: "No face detected",
    error: "An error occurred"
  }
};

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const t = translations[lang];

  const [state, setState] = useState<AppState>('choose');
  const [results, setResults] = useState<Celebrity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (imageBlob: Blob) => {
    setState('loading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg');

      const response = await fetch('/api/face-quiz/analyze', {
        method: 'POST',
        body: formData
      });

      const data: AnalyzeResult = await response.json();

      if (data.success && data.matches) {
        setResults(data.matches);
        setState('results');
      } else {
        setError(t.noFace);
        setState('choose');
        setPreviewImage(null);
      }
    } catch {
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
  }, [t]);

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
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-xl mx-auto">
        <h1 className="text-xl font-bold">{t.title}</h1>
        <div className="flex gap-2">
          {(['uz', 'ru', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                lang === l ? 'bg-white text-purple-900' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[80vh]">
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setState('camera')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.camera}
              </button>

              <label className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t.gallery}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
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
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${celeb.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-purple-400 font-bold">{celeb.percentage.toFixed(1)}%</span>
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
