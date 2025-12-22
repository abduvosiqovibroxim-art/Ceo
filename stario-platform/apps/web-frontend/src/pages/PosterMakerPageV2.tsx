/**
 * AI Poster Maker Page V2
 * Uses backend API for face swap and poster generation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  checkHealth,
  getCelebrities,
  getTemplates,
  uploadFaceFromDataUrl,
  uploadFace,
  generatePoster,
  waitForCompletion,
  getResultUrl,
  getCelebrityImageUrl,
  downloadPoster,
  type Celebrity,
  type Template,
  type FaceUploadResponse,
  type GenerateResponse,
} from '../services/posterMakerApi';

type Step = 'loading' | 'photo' | 'celebrity' | 'template' | 'generating' | 'result';

const translations = {
  ru: {
    title: 'AI Poster Maker',
    subtitle: 'Создай постер со своей любимой звездой!',
    uploadPhoto: 'Загрузите своё фото',
    camera: 'Камера',
    gallery: 'Галерея',
    capture: 'Сфотографировать',
    selectCelebrity: 'Выберите знаменитость',
    selectTemplate: 'Выберите сцену',
    generate: 'Создать постер',
    generating: 'Создаём постер...',
    result: 'Ваш постер готов!',
    download: 'Скачать',
    share: 'Поделиться',
    tryAgain: 'Создать ещё',
    back: 'Назад',
    error: 'Ошибка',
    apiOffline: 'Сервис временно недоступен',
    noFace: 'Лицо не обнаружено',
    lowQuality: 'Низкое качество фото',
    categories: {
      uzbek: 'Узбекские звёзды',
      hollywood: 'Голливуд',
      kpop: 'K-Pop',
      bollywood: 'Болливуд',
    },
    scenes: {
      hug: 'Обнимаемся',
      red_carpet: 'Красная дорожка',
      movie_poster: 'Постер фильма',
      selfie: 'Селфи',
      concert: 'На концерте',
    },
  },
  uz: {
    title: 'AI Poster Maker',
    subtitle: "Sevimli yulduzingiz bilan poster yarating!",
    uploadPhoto: 'Rasmingizni yuklang',
    camera: 'Kamera',
    gallery: 'Galereya',
    capture: 'Suratga olish',
    selectCelebrity: 'Mashhurni tanlang',
    selectTemplate: 'Sahnani tanlang',
    generate: 'Poster yaratish',
    generating: 'Poster yaratilmoqda...',
    result: 'Posteringiz tayyor!',
    download: 'Yuklab olish',
    share: 'Ulashish',
    tryAgain: 'Yana yaratish',
    back: 'Orqaga',
    error: 'Xatolik',
    apiOffline: 'Xizmat vaqtincha ishlamayapti',
    noFace: 'Yuz topilmadi',
    lowQuality: 'Surat sifati past',
    categories: {
      uzbek: "O'zbek yulduzlari",
      hollywood: 'Gollivud',
      kpop: 'K-Pop',
      bollywood: 'Bollivud',
    },
    scenes: {
      hug: 'Quchoqlashish',
      red_carpet: 'Qizil gilam',
      movie_poster: 'Film posteri',
      selfie: 'Selfi',
      concert: 'Konsertda',
    },
  },
};

export default function PosterMakerPageV2() {
  const [lang] = useState<'ru' | 'uz'>('ru');
  const t = translations[lang];

  // State
  const [step, setStep] = useState<Step>('loading');
  const [apiReady, setApiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // User selections
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<FaceUploadResponse | null>(null);
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Generation
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [result, setResult] = useState<GenerateResponse | null>(null);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        await checkHealth();
        const [celebs, tmpls] = await Promise.all([
          getCelebrities(),
          getTemplates(),
        ]);
        setCelebrities(celebs);
        setTemplates(tmpls);
        setApiReady(true);
        setStep('photo');
      } catch (err) {
        console.error('API init error:', err);
        setError(t.apiOffline);
        setStep('loading');
      }
    }
    init();
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setUserPhoto(dataUrl);

        // Upload to API
        const response = await uploadFace(file);
        setFaceData(response);

        if (!response.face_detected) {
          setError(response.message || t.noFace);
        } else if (response.face_quality === 'low') {
          setError(t.lowQuality);
        } else {
          setStep('celebrity');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || t.error);
    }
  };

  // Capture from webcam
  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setUserPhoto(imageSrc);
    setShowCamera(false);

    try {
      setError(null);
      const response = await uploadFaceFromDataUrl(imageSrc);
      setFaceData(response);

      if (!response.face_detected) {
        setError(response.message || t.noFace);
      } else if (response.face_quality === 'low') {
        setError(t.lowQuality);
      } else {
        setStep('celebrity');
      }
    } catch (err: any) {
      setError(err.message || t.error);
    }
  }, []);

  // Select celebrity
  const handleSelectCelebrity = (celebrity: Celebrity) => {
    setSelectedCelebrity(celebrity);
    setStep('template');
  };

  // Select template
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  // Generate poster
  const handleGenerate = async () => {
    if (!faceData || !selectedCelebrity || !selectedTemplate) return;

    setStep('generating');
    setGenerationProgress(0);
    setGenerationStage(t.generating);

    try {
      // Start generation
      const job = await generatePoster(
        faceData.face_id,
        selectedCelebrity.id,
        selectedTemplate.id
      );

      // Wait for completion
      const finalResult = await waitForCompletion(
        job.job_id,
        (progress, stage) => {
          setGenerationProgress(progress);
          setGenerationStage(stage);
        }
      );

      if (finalResult.status === 'completed' && finalResult.result_url) {
        setResult(finalResult);
        setStep('result');
      } else {
        setError(finalResult.error || t.error);
        setStep('template');
      }
    } catch (err: any) {
      setError(err.message || t.error);
      setStep('template');
    }
  };

  // Download
  const handleDownload = async () => {
    if (!result?.job_id) return;

    try {
      const blob = await downloadPoster(result.job_id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `poster_${result.job_id}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Share
  const handleShare = async () => {
    if (!result?.result_url) return;

    const url = getResultUrl(result.result_url);

    if (navigator.share) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'poster.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: `Мой постер с ${selectedCelebrity?.name}`,
          files: [file],
        });
      } catch (err) {
        console.error('Share error:', err);
      }
    } else {
      handleDownload();
    }
  };

  // Reset
  const handleReset = () => {
    setStep('photo');
    setUserPhoto(null);
    setFaceData(null);
    setSelectedCelebrity(null);
    setSelectedTemplate(null);
    setResult(null);
    setError(null);
  };

  // Go back
  const handleBack = () => {
    setError(null);
    if (step === 'celebrity') {
      setStep('photo');
      setUserPhoto(null);
      setFaceData(null);
    } else if (step === 'template') {
      setStep('celebrity');
      setSelectedCelebrity(null);
    } else if (step === 'result') {
      setStep('template');
      setResult(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-black text-white min-h-screen -mx-4 -mt-6 px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step !== 'photo' && step !== 'loading' && step !== 'generating' && (
          <button onClick={handleBack} className="p-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {step === 'photo' && (
          <Link to="/" className="p-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="text-xl font-bold">{t.title}</h1>
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          Real AI
        </span>
      </div>

      {/* Progress Steps */}
      {!['loading', 'generating', 'result'].includes(step) && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {['photo', 'celebrity', 'template'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-purple-500' :
                ['photo', 'celebrity', 'template'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {['photo', 'celebrity', 'template'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-1 ${
                ['photo', 'celebrity', 'template'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
              }`} />}
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Loading */}
        {step === 'loading' && !error && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Загрузка...</p>
          </motion.div>
        )}

        {/* Step 1: Upload Photo */}
        {step === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">{t.uploadPhoto}</h2>

            {showCamera ? (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  className="w-full rounded-2xl"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={() => setShowCamera(false)}
                    className="px-6 py-3 bg-white/20 rounded-full"
                  >
                    {t.back}
                  </button>
                  <button
                    onClick={handleCapture}
                    className="px-6 py-3 bg-purple-500 rounded-full font-semibold"
                  >
                    {t.capture}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userPhoto && (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={userPhoto} alt="Your photo" className="w-full" />
                    {faceData?.face_detected && (
                      <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
                        ✓ Лицо найдено
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="py-4 bg-purple-500/20 border border-purple-500/50 rounded-2xl flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">📷</span>
                    <span>{t.camera}</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-4 bg-purple-500/20 border border-purple-500/50 rounded-2xl flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">🖼️</span>
                    <span>{t.gallery}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {userPhoto && faceData?.face_detected && !error && (
                  <button
                    onClick={() => setStep('celebrity')}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-semibold"
                  >
                    Продолжить →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Select Celebrity */}
        {step === 'celebrity' && (
          <motion.div
            key="celebrity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">{t.selectCelebrity}</h2>

            <div className="grid grid-cols-2 gap-3">
              {celebrities.map(celebrity => (
                <motion.button
                  key={celebrity.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectCelebrity(celebrity)}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] bg-purple-900/50 ${
                    selectedCelebrity?.id === celebrity.id ? 'ring-4 ring-purple-500' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-purple-300/50">
                    {celebrity.name.charAt(0)}
                  </div>
                  <img
                    src={getCelebrityImageUrl(celebrity.image)}
                    alt={celebrity.name}
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
                    <p className="font-bold text-sm">{celebrity.name}</p>
                    <p className="text-xs text-purple-300">{celebrity.name_uz}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Template */}
        {step === 'template' && (
          <motion.div
            key="template"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">{t.selectTemplate}</h2>

            <div className="mb-6 text-center">
              <p className="text-gray-400">
                Вы и <span className="text-purple-400 font-semibold">{selectedCelebrity?.name}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {templates.map(template => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTemplate(template)}
                  className={`p-4 rounded-2xl bg-purple-900/30 border ${
                    selectedTemplate?.id === template.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-purple-500/20'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {template.scene_type === 'hug' && '🤗'}
                    {template.scene_type === 'red_carpet' && '🎬'}
                    {template.scene_type === 'movie_poster' && '🎥'}
                    {template.scene_type === 'selfie' && '🤳'}
                    {template.scene_type === 'concert' && '🎤'}
                  </div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-gray-400">{template.description}</p>
                </motion.button>
              ))}
            </div>

            {selectedTemplate && (
              <button
                onClick={handleGenerate}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-semibold"
              >
                {t.generate} ✨
              </button>
            )}
          </motion.div>
        )}

        {/* Generating */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-24 h-24 mb-6 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(147, 51, 234, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgb(147, 51, 234)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${generationProgress * 2.83} 283`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                {Math.round(generationProgress)}%
              </span>
            </div>
            <p className="text-lg font-semibold mb-2">{t.generating}</p>
            <p className="text-gray-400">{generationStage}</p>
          </motion.div>
        )}

        {/* Result */}
        {step === 'result' && result?.result_url && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">🎬</span>
              <h2 className="text-xl font-bold mt-2">{t.result}</h2>
              <p className="text-gray-400">
                с {selectedCelebrity?.name} • {selectedTemplate?.name}
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden mb-6 shadow-2xl shadow-purple-500/20">
              <img
                src={getResultUrl(result.result_url)}
                alt="Generated poster"
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                💾 {t.download}
              </button>

              <button
                onClick={handleShare}
                className="w-full py-4 bg-white/10 rounded-2xl font-semibold"
              >
                📤 {t.share}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-3 text-purple-400"
              >
                {t.tryAgain}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
