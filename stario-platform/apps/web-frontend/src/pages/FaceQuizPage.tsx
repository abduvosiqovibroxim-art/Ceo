import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import { compareFaceFromDataUrl, checkHealth, CelebrityMatch } from '../services/deepFaceService';

type AppState = 'loading' | 'choose' | 'camera' | 'analyzing' | 'results';

const translations = {
  uz: {
    title: "Face Quiz - O'zbek Yulduzlari",
    subtitle: "Qaysi o'zbek yulduziga o'xshaysiz? Rasmingizni yuklang yoki kameradan foydalaning!",
    camera: "Kamera",
    gallery: "Galereya",
    capture: "Suratga olish",
    back: "Orqaga",
    analyzing: "Tahlil qilinmoqda...",
    loading: "AI tizimi yuklanmoqda...",
    results: "Sizga o'xshash yulduzlar:",
    tryAgain: "Qayta urinish",
    noFace: "Yuz topilmadi. Yaxshi yoritilgan joyda qayta urinib ko'ring.",
    error: "Xatolik yuz berdi",
    disclaimer: "Bu o'yin ko'ngil ochish uchun. Natijalar taxminiy!",
    apiOffline: "AI serveri ishlamayapti. Keyinroq urinib ko'ring.",
    processingTime: "Tahlil vaqti"
  },
  ru: {
    title: "Face Quiz - Узбекские Звёзды",
    subtitle: "На какую узбекскую звезду вы похожи? Загрузите фото или используйте камеру!",
    camera: "Камера",
    gallery: "Галерея",
    capture: "Сфотографировать",
    back: "Назад",
    analyzing: "Анализируем...",
    loading: "Загрузка AI системы...",
    results: "Похожие на вас звёзды:",
    tryAgain: "Попробовать снова",
    noFace: "Лицо не найдено. Попробуйте при хорошем освещении.",
    error: "Произошла ошибка",
    disclaimer: "Это игра для развлечения. Результаты приблизительны!",
    apiOffline: "AI сервер недоступен. Попробуйте позже.",
    processingTime: "Время анализа"
  },
  en: {
    title: "Face Quiz - Uzbek Stars",
    subtitle: "Which Uzbek star do you look like? Upload a photo or use your camera!",
    camera: "Camera",
    gallery: "Gallery",
    capture: "Take Photo",
    back: "Back",
    analyzing: "Analyzing...",
    loading: "Loading AI system...",
    results: "Stars you look like:",
    tryAgain: "Try Again",
    noFace: "No face detected. Try in good lighting.",
    error: "An error occurred",
    disclaimer: "This is just for fun. Results are approximate!",
    apiOffline: "AI server is offline. Try again later.",
    processingTime: "Processing time"
  }
};

// Celebrity name mappings (folder name -> display names)
const celebrityNames: Record<string, { ru: string; uz: string }> = {
  'Shahzoda': { ru: 'Шахзода', uz: 'Shahzoda' },
  'Ziyoda': { ru: 'Зиёда', uz: 'Ziyoda' },
  'Yulduz Usmanova': { ru: 'Юлдуз Усмонова', uz: 'Yulduz Usmanova' },
  'Ozoda': { ru: 'Озода', uz: 'Ozoda' },
  'Sevara': { ru: 'Севара', uz: 'Sevara' },
  'Rayhon': { ru: 'Райхон', uz: 'Rayhon' },
  'Lola': { ru: 'Лола', uz: 'Lola' },
  'Munisa Rizayeva': { ru: 'Муниса Ризаева', uz: 'Munisa Rizayeva' },
  'Tohir Sodiqov': { ru: 'Тохир Содиков', uz: 'Tohir Sodiqov' },
  'Jasur Umirov': { ru: 'Жасур Умиров', uz: 'Jasur Umirov' },
  'Farukh Zakirov': { ru: 'Фарух Закиров', uz: 'Farukh Zakirov' },
  'Ali Otajonov': { ru: 'Али Отажонов', uz: 'Ali Otajonov' },
  'Dilsoz': { ru: 'Дильсоз', uz: 'Dilsoz' },
  'Jahondi Poziljonov': { ru: 'Жахонгир Позилжонов', uz: 'Jahondi Poziljonov' },
  'Ozodbek Nazarbekov': { ru: 'Озодбек Назарбеков', uz: 'Ozodbek Nazarbekov' },
};

function getCelebName(name: string, lang: string): string {
  const mapping = celebrityNames[name];
  if (!mapping) return name;
  return lang === 'uz' ? mapping.uz : mapping.ru;
}

export default function FaceQuizPage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || 'ru') as 'uz' | 'ru' | 'en';
  const t = translations[lang] || translations.ru;

  const [state, setState] = useState<AppState>('loading');
  const [results, setResults] = useState<CelebrityMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [celebritiesCount, setCelebritiesCount] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if DeepFace API is available
  useEffect(() => {
    const checkApi = async () => {
      try {
        const health = await checkHealth();
        setApiReady(health.status === 'healthy');
        setCelebritiesCount(health.celebrities_count);
        setState('choose');
      } catch (err) {
        console.error('DeepFace API not available:', err);
        setError(t.apiOffline);
        setState('choose');
      }
    };

    checkApi();
  }, []);

  const analyzeImage = async (dataUrl: string) => {
    setState('analyzing');
    setError(null);

    try {
      const response = await compareFaceFromDataUrl(dataUrl);

      if (!response.face_detected) {
        setError(t.noFace);
        setState('choose');
        setPreviewImage(null);
        return;
      }

      if (response.matches.length === 0) {
        setError(t.noFace);
        setState('choose');
        setPreviewImage(null);
        return;
      }

      setResults(response.matches);
      setProcessingTime(response.processing_time_ms);
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
    await analyzeImage(imageSrc);
  }, [t]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageSrc = event.target?.result as string;
      setPreviewImage(imageSrc);
      await analyzeImage(imageSrc);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setState('choose');
    setResults([]);
    setError(null);
    setPreviewImage(null);
    setProcessingTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl">{t.loading}</p>
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

            {apiReady && (
              <div className="flex flex-col gap-1 mb-2">
                <div className="text-green-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  DeepFace AI Ready ({celebritiesCount} celebrities)
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setState('camera')}
                disabled={!apiReady}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.camera}
              </button>

              <label className={`bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center gap-3 ${!apiReady ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t.gallery}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={!apiReady}
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

        {state === 'analyzing' && (
          <div className="flex flex-col items-center gap-4">
            {previewImage && (
              <img src={previewImage} alt="Preview" className="w-40 h-40 rounded-2xl object-cover mb-4" />
            )}
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl">{t.analyzing}</p>
            <p className="text-gray-400 text-sm">DeepFace AI processing...</p>
          </div>
        )}

        {state === 'results' && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xl">
            {previewImage && (
              <img src={previewImage} alt="Your photo" className="w-28 h-28 rounded-full object-cover border-4 border-purple-500" />
            )}
            <h2 className="text-2xl font-bold text-white">{t.results}</h2>
            <p className="text-gray-400 text-sm text-center italic -mt-2">{t.disclaimer}</p>

            <div className="grid gap-4 w-full px-4">
              {results.map((match, index) => (
                <div
                  key={match.name}
                  className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 flex items-center gap-4 ${
                    index === 0 ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/20' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                      {match.name.charAt(0)}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                        #1
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{getCelebName(match.name, lang)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            match.percentage >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            match.percentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                          }`}
                          style={{ width: `${match.percentage}%` }}
                        ></div>
                      </div>
                      <span className={`font-bold ${
                        match.percentage >= 60 ? 'text-green-400' :
                        match.percentage >= 40 ? 'text-yellow-400' :
                        'text-purple-400'
                      }`}>{match.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {processingTime > 0 && (
              <p className="text-gray-500 text-xs">
                {t.processingTime}: {(processingTime / 1000).toFixed(1)}s
              </p>
            )}

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
