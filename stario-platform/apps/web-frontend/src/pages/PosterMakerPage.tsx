import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  actorsCatalog,
  posterStyles,
  generateMovieTitle,
  analyzePhoto,
  PosterGenerator,
  type Actor,
  type PosterScene,
  type PosterStyle,
  type GeneratedPoster,
  type PhotoAnalysis
} from '../services/posterMaker';

type Step = 'actor' | 'photo' | 'style' | 'generating' | 'result';

export default function PosterMakerPage() {
  // State
  const [step, setStep] = useState<Step>('actor');
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [selectedScene, setSelectedScene] = useState<PosterScene | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<PosterStyle | null>(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [generatedPoster, setGeneratedPoster] = useState<GeneratedPoster | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select actor
  const handleSelectActor = (actor: Actor) => {
    setSelectedActor(actor);
    if (actor.scenes.length === 1) {
      setSelectedScene(actor.scenes[0]);
      setStep('photo');
    }
  };

  // Select scene
  const handleSelectScene = (scene: PosterScene) => {
    setSelectedScene(scene);
    setStep('photo');
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setUserPhoto(imageData);

      // Analyze photo
      const analysis = await analyzePhoto(imageData);
      setPhotoAnalysis(analysis);

      if (!analysis.faceDetected) {
        setError('Лицо не обнаружено. Попробуйте другое фото.');
      } else {
        setError(null);
        setStep('style');
      }
    };
    reader.readAsDataURL(file);
  };

  // Capture from webcam
  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setUserPhoto(imageSrc);
      setShowCamera(false);

      const analysis = await analyzePhoto(imageSrc);
      setPhotoAnalysis(analysis);

      if (!analysis.faceDetected) {
        setError('Лицо не обнаружено. Попробуйте снова.');
      } else {
        setError(null);
        setStep('style');
      }
    }
  }, []);

  // Select style
  const handleSelectStyle = (style: PosterStyle) => {
    setSelectedStyle(style);
  };

  // Generate poster
  const handleGenerate = async () => {
    if (!selectedActor || !selectedScene || !userPhoto || !selectedStyle) return;

    setStep('generating');
    setGeneratingProgress(0);

    // Generate movie title
    const title = movieTitle || generateMovieTitle();
    setMovieTitle(title);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Generate poster
      const generator = new PosterGenerator();
      const poster = await generator.generate(
        userPhoto,
        selectedActor,
        selectedScene,
        selectedStyle,
        title
      );

      clearInterval(progressInterval);
      setGeneratingProgress(100);

      setTimeout(() => {
        setGeneratedPoster(poster);
        setStep('result');
      }, 500);
    } catch (err) {
      console.error('Generation error:', err);
      setError('Ошибка при создании постера. Попробуйте снова.');
      setStep('style');
    }
  };

  // Download poster
  const handleDownload = () => {
    if (!generatedPoster) return;

    const link = document.createElement('a');
    link.download = `poster-${selectedActor?.name}-${Date.now()}.jpg`;
    link.href = generatedPoster.imageUrl;
    link.click();
  };

  // Share poster
  const handleShare = async () => {
    if (!generatedPoster) return;

    if (navigator.share) {
      try {
        const blob = await fetch(generatedPoster.imageUrl).then(r => r.blob());
        const file = new File([blob], 'poster.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: `Мой постер с ${generatedPoster.actorName}`,
          text: `Смотри какой постер я создал с ${generatedPoster.actorName}!`,
          files: [file]
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
    setStep('actor');
    setSelectedActor(null);
    setSelectedScene(null);
    setUserPhoto(null);
    setPhotoAnalysis(null);
    setSelectedStyle(null);
    setMovieTitle('');
    setGeneratedPoster(null);
    setError(null);
  };

  // Go back
  const handleBack = () => {
    if (step === 'photo') {
      if (selectedActor && selectedActor.scenes.length > 1) {
        setSelectedScene(null);
      } else {
        setSelectedActor(null);
        setStep('actor');
      }
    } else if (step === 'style') {
      setUserPhoto(null);
      setStep('photo');
    } else if (step === 'result') {
      setGeneratedPoster(null);
      setStep('style');
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-black text-white min-h-screen -mx-4 -mt-6 px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step !== 'actor' && step !== 'generating' && (
          <button onClick={handleBack} className="p-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {step === 'actor' && (
          <Link to="/" className="p-2 bg-white/10 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <h1 className="text-xl font-bold">AI Poster Maker</h1>
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          Real AI
        </span>
      </div>

      {/* Progress Steps */}
      {step !== 'result' && step !== 'generating' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {['actor', 'photo', 'style'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-purple-500' :
                ['actor', 'photo', 'style'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {['actor', 'photo', 'style'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-1 ${
                ['actor', 'photo', 'style'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
              }`} />}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Select Actor */}
        {step === 'actor' && (
          <motion.div
            key="actor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">Выбери актёра для постера</h2>

            <div className="grid grid-cols-2 gap-3">
              {actorsCatalog.map(actor => (
                <motion.button
                  key={actor.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectActor(actor)}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] bg-purple-900/50 ${
                    selectedActor?.id === actor.id ? 'ring-4 ring-purple-500' : ''
                  }`}
                >
                  {/* Fallback initials */}
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-purple-300/50">
                    {actor.name.charAt(0)}
                  </div>
                  <img
                    src={actor.image}
                    alt={actor.name}
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
                    <p className="font-bold text-sm">{actor.name}</p>
                    <p className="text-xs text-purple-300">{actor.scenes.length} сцен</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Scene selection if actor has multiple scenes */}
            {selectedActor && selectedActor.scenes.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <h3 className="text-md font-semibold mb-3">Выбери сцену:</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {selectedActor.scenes.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => handleSelectScene(scene)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl ${
                        selectedScene?.id === scene.id
                          ? 'bg-purple-500'
                          : 'bg-white/10'
                      }`}
                    >
                      <p className="font-medium">{scene.name}</p>
                      <p className="text-xs text-purple-300">{scene.genre}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 2: Upload Photo */}
        {step === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500 bg-purple-900/50 overflow-hidden relative">
                <img
                  src={selectedActor?.image}
                  alt={selectedActor?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="font-bold">{selectedActor?.name}</p>
                <p className="text-xs text-purple-300">{selectedScene?.name}</p>
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-2">Загрузи своё фото</h2>
            <p className="text-purple-300 text-sm mb-6">Для лучшего результата используй фото с хорошим освещением</p>

            {error && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {showCamera ? (
              <div className="relative mb-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-2xl"
                  videoConstraints={{
                    facingMode: 'user',
                    width: 720,
                    height: 960
                  }}
                />
                <div className="absolute inset-0 border-4 border-dashed border-purple-500/50 rounded-2xl pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-purple-400 rounded-full opacity-50" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowCamera(false)}
                    className="flex-1 py-3 bg-white/10 rounded-xl"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCapture}
                    className="flex-1 py-3 bg-purple-500 rounded-xl font-bold"
                  >
                    Снять
                  </button>
                </div>
              </div>
            ) : userPhoto ? (
              <div className="relative mb-4">
                <img
                  src={userPhoto}
                  alt="Your photo"
                  className="w-full max-w-xs mx-auto rounded-2xl"
                />
                {photoAnalysis && (
                  <div className="mt-3 text-xs text-purple-300">
                    Качество: {photoAnalysis.quality === 'high' ? 'Отлично' :
                      photoAnalysis.quality === 'medium' ? 'Хорошо' : 'Низкое'}
                  </div>
                )}
                <button
                  onClick={() => setUserPhoto(null)}
                  className="mt-3 px-4 py-2 bg-white/10 rounded-xl text-sm"
                >
                  Выбрать другое фото
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-white/10 rounded-2xl font-medium flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">🖼</span>
                  Выбрать из галереи
                </button>

                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full py-4 bg-purple-500 rounded-2xl font-bold flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📷</span>
                  Сделать фото
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Tips */}
            <div className="mt-6 bg-white/5 rounded-2xl p-4 text-left">
              <h4 className="font-semibold text-sm mb-2">Советы для лучшего результата:</h4>
              <ul className="text-xs text-purple-300 space-y-1">
                <li>• Хорошее освещение лица</li>
                <li>• Смотрите в камеру или слегка в сторону</li>
                <li>• Нейтральный фон</li>
                <li>• Лицо полностью в кадре</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Style */}
        {step === 'style' && (
          <motion.div
            key="style"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-purple-900/50 overflow-hidden">
                <img
                  src={selectedActor?.image}
                  alt={selectedActor?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-purple-300">+</span>
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 bg-pink-900/50 overflow-hidden">
                <img
                  src={userPhoto!}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-2 text-center">Выбери стиль постера</h2>
            <p className="text-purple-300 text-sm mb-4 text-center">Каждый стиль создаёт уникальную атмосферу</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {posterStyles.map(style => (
                <motion.button
                  key={style.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectStyle(style)}
                  className={`p-4 rounded-2xl text-left transition-all ${
                    selectedStyle?.id === style.id
                      ? 'bg-purple-500 ring-2 ring-purple-300'
                      : 'bg-white/10'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{style.preview}</span>
                  <p className="font-bold text-sm">{style.name}</p>
                </motion.button>
              ))}
            </div>

            {/* Movie title input */}
            <div className="mb-6">
              <label className="block text-sm text-purple-300 mb-2">
                Название фильма (необязательно)
              </label>
              <input
                type="text"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                placeholder="Оставь пустым для автогенерации"
                className="w-full px-4 py-3 bg-white/10 rounded-xl border border-white/20 focus:border-purple-500 outline-none"
              />
            </div>

            {/* Generate button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={!selectedStyle}
              className={`w-full py-4 rounded-2xl font-bold text-lg ${
                selectedStyle
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                  : 'bg-white/20 text-white/50'
              }`}
            >
              Создать постер
            </motion.button>
          </motion.div>
        )}

        {/* Generating */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pt-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-24 h-24 mx-auto mb-8 border-4 border-purple-500 border-t-transparent rounded-full"
            />

            <h2 className="text-2xl font-bold mb-4">Создаём постер...</h2>

            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${generatingProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
              </div>
              <p className="text-sm text-purple-300 mt-2">{Math.round(generatingProgress)}%</p>
            </div>

            <div className="space-y-2 text-purple-200 text-sm">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Анализируем фотографию...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                Подбираем освещение...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                Создаём композицию...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
                Применяем стиль «{selectedStyle?.name}»...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {step === 'result' && generatedPoster && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="mb-6"
            >
              <span className="text-5xl">🎬</span>
              <h2 className="text-2xl font-bold mt-4">Твой постер готов!</h2>
              <p className="text-purple-300 mt-2">
                с {generatedPoster.actorName} • стиль «{generatedPoster.styleName}»
              </p>
            </motion.div>

            {/* Poster Preview */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative mb-6"
            >
              <img
                src={generatedPoster.imageUrl}
                alt="Generated poster"
                className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl shadow-purple-500/30"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 max-w-sm mx-auto"
            >
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                📥 Скачать постер
              </button>

              <button
                onClick={handleShare}
                className="w-full py-4 bg-white/10 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                📤 Поделиться
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 bg-white/5 rounded-xl text-sm">
                  🖨 Заказать печать
                </button>
                <button className="py-3 bg-white/5 rounded-xl text-sm">
                  👕 Мерч
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 text-purple-300 text-sm"
              >
                Создать новый постер
              </button>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-xs text-purple-300/50 mt-6 max-w-sm mx-auto">
              * Художественный AI-монтаж. Не является реальной фотографией.
              Создано с уважением к образу артиста.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
