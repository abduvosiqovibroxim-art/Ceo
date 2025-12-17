import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VoiceAnalyzer,
  VoiceProfile,
  RealtimeData,
  matchArchetypes,
  generateVoiceDescription,
  type VoiceArchetype
} from '../services/voiceAnalyzer';

// Voice archetypes with reference embeddings for matching
const voiceArchetypes: VoiceArchetype[] = [
  {
    id: '1',
    name: 'Романтичный баритон',
    type: 'Актёрский тип',
    image: '/celebrities/shohruhxon.jpg',
    description: 'Тёплый, обволакивающий голос с мягкой подачей',
    characteristics: ['Бархатистый тембр', 'Средняя высота', 'Романтичная подача'],
    // Low pitch, warm timbre, stable
    embedding: [0.35, 0.3, 0.85, 0.35, 0.7, 0.75, 0.7, 0.35, 0.4, 0.25, 0.3, 0.5, 0.6, 0.15, 0.04, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '2',
    name: 'Энергичный поп-вокал',
    type: 'Эстрадный тип',
    image: '/celebrities/shahzoda.jpg',
    description: 'Яркий, динамичный голос с позитивной энергетикой',
    characteristics: ['Звонкий тембр', 'Высокий диапазон', 'Энергичная подача'],
    // High pitch, bright timbre, energetic
    embedding: [0.7, 0.5, 0.75, 0.75, 0.3, 0.6, 0.8, 0.7, 0.65, 0.2, 0.55, 0.2, 0.6, 0.25, 0.08, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '3',
    name: 'Глубокий драматический',
    type: 'Театральный тип',
    image: '/celebrities/yulduz_usmonova.jpg',
    description: 'Насыщенный, экспрессивный голос с глубиной',
    characteristics: ['Глубокий тембр', 'Широкий диапазон', 'Драматичная подача'],
    // Medium-low pitch, rich timbre, expressive
    embedding: [0.45, 0.7, 0.7, 0.4, 0.65, 0.85, 0.75, 0.45, 0.5, 0.3, 0.3, 0.55, 0.5, 0.2, 0.1, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '4',
    name: 'Нежный лирический',
    type: 'Камерный тип',
    image: '/celebrities/ozoda_nursaidova.jpg',
    description: 'Чистый, прозрачный голос с мягкой эмоциональностью',
    characteristics: ['Чистый тембр', 'Высокий регистр', 'Нежная подача'],
    // High pitch, clear timbre, gentle
    embedding: [0.75, 0.25, 0.9, 0.65, 0.4, 0.55, 0.9, 0.6, 0.55, 0.15, 0.6, 0.2, 0.8, 0.1, 0.03, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '5',
    name: 'Медитативный world',
    type: 'Этнический тип',
    image: '/celebrities/sevara_nazarkhan.jpg',
    description: 'Глубокий, обволакивающий голос с философской ноткой',
    characteristics: ['Обволакивающий тембр', 'Низкий-средний', 'Медитативная подача'],
    // Low-medium pitch, warm and deep
    embedding: [0.4, 0.35, 0.8, 0.3, 0.75, 0.7, 0.65, 0.35, 0.4, 0.35, 0.25, 0.5, 0.5, 0.12, 0.03, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '6',
    name: 'Игривый танцевальный',
    type: 'Dance тип',
    image: '/celebrities/rayhon.jpg',
    description: 'Лёгкий, весёлый голос с игривой подачей',
    characteristics: ['Звонкий тембр', 'Высокий регистр', 'Игривая подача'],
    // High pitch, bright, dynamic
    embedding: [0.72, 0.6, 0.7, 0.8, 0.25, 0.5, 0.75, 0.75, 0.7, 0.25, 0.55, 0.15, 0.5, 0.22, 0.09, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '7',
    name: 'Элегантный гламур',
    type: 'Шоу-бизнес тип',
    image: '/celebrities/lola_yuldasheva.jpg',
    description: 'Утончённый, бархатистый голос с элегантной подачей',
    characteristics: ['Бархатистый тембр', 'Средний регистр', 'Элегантная подача'],
    // Medium pitch, balanced timbre
    embedding: [0.55, 0.4, 0.85, 0.5, 0.55, 0.7, 0.8, 0.5, 0.5, 0.2, 0.45, 0.4, 0.7, 0.16, 0.05, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '8',
    name: 'Харизматичный рассказчик',
    type: 'Дикторский тип',
    image: '/celebrities/shohruhxon.jpg',
    description: 'Уверенный, чёткий голос с харизмой',
    characteristics: ['Чёткий тембр', 'Средний регистр', 'Уверенная подача'],
    // Medium pitch, clear, confident
    embedding: [0.5, 0.3, 0.9, 0.55, 0.5, 0.65, 0.85, 0.55, 0.5, 0.18, 0.5, 0.35, 0.75, 0.18, 0.04, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '9',
    name: 'Мечтательный романтик',
    type: 'Балладный тип',
    image: '/celebrities/shahzoda.jpg',
    description: 'Мягкий, мечтательный голос с романтичной ноткой',
    characteristics: ['Мягкий тембр', 'Средний-высокий', 'Мечтательная подача'],
    // Medium-high pitch, soft
    embedding: [0.6, 0.35, 0.8, 0.45, 0.6, 0.6, 0.7, 0.45, 0.45, 0.28, 0.35, 0.35, 0.55, 0.13, 0.04, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    id: '10',
    name: 'Властный командный',
    type: 'Лидерский тип',
    image: '/celebrities/yulduz_usmonova.jpg',
    description: 'Сильный, уверенный голос с властной подачей',
    characteristics: ['Насыщенный тембр', 'Низкий-средний', 'Властная подача'],
    // Low-medium pitch, powerful
    embedding: [0.38, 0.45, 0.75, 0.45, 0.6, 0.8, 0.7, 0.5, 0.55, 0.22, 0.35, 0.5, 0.5, 0.28, 0.08, 0.5, 0.5, 0.5, 0.5, 0.5]
  }
];

type Step = 'intro' | 'permission' | 'recording' | 'analyzing' | 'result';

export default function VoiceQuizPage() {
  const [step, setStep] = useState<Step>('intro');
  const [recordingTime, setRecordingTime] = useState(0);
  const [matches, setMatches] = useState<Array<VoiceArchetype & { similarity: number }>>([]);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [voiceDescription, setVoiceDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Real-time visualization
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(0.1));
  const [spectrum, setSpectrum] = useState<number[]>(Array(16).fill(0.1));
  const [currentVolume, setCurrentVolume] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const analyzerRef = useRef<VoiceAnalyzer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle real-time data from analyzer
  const handleRealtimeData = (data: RealtimeData) => {
    setWaveform(data.waveform);
    setSpectrum(data.spectrum);
    setCurrentVolume(data.volume);
    setCurrentPitch(data.pitch);
    setIsSpeaking(data.isSpeaking);
  };

  // Request microphone permission
  const requestPermission = async () => {
    setStep('permission');
    setError(null);

    try {
      analyzerRef.current = new VoiceAnalyzer();
      const success = await analyzerRef.current.initialize();

      if (success) {
        startRecording();
      } else {
        setError('Не удалось получить доступ к микрофону');
        setStep('intro');
      }
    } catch (err) {
      console.error('Permission error:', err);
      setError('Пожалуйста, разрешите доступ к микрофону');
      setStep('intro');
    }
  };

  // Start recording
  const startRecording = () => {
    if (!analyzerRef.current) return;

    setRecordingTime(0);
    setStep('recording');

    // Start real analysis
    analyzerRef.current.startRecording(handleRealtimeData);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 10) {
          stopRecording();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop recording and analyze
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!analyzerRef.current) return;

    // Get final profile
    const profile = analyzerRef.current.stopRecording();
    setVoiceProfile(profile);

    // Start analysis animation
    setStep('analyzing');

    // Process results after animation
    setTimeout(() => {
      // Match with archetypes
      const matched = matchArchetypes(profile, voiceArchetypes, 7);
      setMatches(matched);

      // Generate description
      const description = generateVoiceDescription(profile);
      setVoiceDescription(description);

      setStep('result');
    }, 3000);
  };

  // Reset quiz
  const resetQuiz = () => {
    if (analyzerRef.current) {
      analyzerRef.current.destroy();
      analyzerRef.current = null;
    }

    setStep('intro');
    setMatches([]);
    setVoiceProfile(null);
    setVoiceDescription('');
    setRecordingTime(0);
    setWaveform(Array(32).fill(0.1));
    setSpectrum(Array(16).fill(0.1));
    setCurrentVolume(0);
    setCurrentPitch(0);
    setIsSpeaking(false);
    setError(null);
  };

  // Format pitch for display
  const formatPitch = (hz: number): string => {
    if (hz === 0) return '—';
    return `${Math.round(hz)} Hz`;
  };

  // Get pitch classification name in Russian
  const getPitchName = (classification: string): string => {
    const names: Record<string, string> = {
      bass: 'Бас',
      baritone: 'Баритон',
      tenor: 'Тенор',
      alto: 'Альт',
      mezzo: 'Меццо-сопрано',
      soprano: 'Сопрано'
    };
    return names[classification] || classification;
  };

  // Get timbre classification name in Russian
  const getTimbreName = (classification: string): string => {
    const names: Record<string, string> = {
      bright_clear: 'Яркий, чистый',
      warm_rich: 'Тёплый, богатый',
      dark_deep: 'Глубокий, бархатистый',
      neutral: 'Сбалансированный'
    };
    return names[classification] || classification;
  };

  return (
    <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white -mx-4 -mt-6 px-4 pt-6 pb-8" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="p-2 bg-white/10 rounded-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Voice Style Quiz</h1>
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          Real AI
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Intro Step */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center pt-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </motion.div>

            <h2 className="text-2xl font-bold mb-4">Узнай свой голосовой архетип!</h2>
            <p className="text-purple-200 mb-8 max-w-sm mx-auto">
              Реальный AI-анализ твоего голоса: громкость, высота, тембр
            </p>

            {error && (
              <div className="bg-red-500/20 text-red-300 p-4 rounded-xl mb-6 max-w-sm mx-auto">
                {error}
              </div>
            )}

            <div className="bg-white/10 rounded-2xl p-6 mb-6 max-w-sm mx-auto">
              <h3 className="font-semibold mb-4">Как это работает:</h3>
              <div className="space-y-3 text-left text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                  <p>Нажми кнопку и говори или пой 10 секунд</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                  <p>AI анализирует громкость, частоту и тембр</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                  <p>Получи реальный анализ и подходящие архетипы</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                  <p>Закажи видео или открытку с этим стилем!</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-purple-300/70 mb-6 max-w-sm mx-auto">
              * Анализ происходит локально в браузере. Голос не сохраняется и не отправляется на сервер.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={requestPermission}
              className="w-full max-w-sm py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30"
            >
              Начать запись
            </motion.button>
          </motion.div>
        )}

        {/* Permission Step */}
        {step === 'permission' && (
          <motion.div
            key="permission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pt-16"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-24 h-24 mx-auto mb-8 bg-purple-500/30 rounded-full flex items-center justify-center"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-bold mb-2">Разрешите доступ к микрофону</h2>
            <p className="text-purple-200">Нажмите "Разрешить" в диалоге браузера</p>
          </motion.div>
        )}

        {/* Recording Step */}
        {step === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center pt-4"
          >
            {/* Mic indicator */}
            <motion.div
              animate={{ scale: isSpeaking ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.5 }}
              className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                isSpeaking ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-white/20'
              }`}
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </motion.div>

            {/* Status */}
            <div className={`font-semibold mb-2 flex items-center justify-center gap-2 ${isSpeaking ? 'text-red-400' : 'text-purple-300'}`}>
              <span className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-purple-400'}`}></span>
              {isSpeaking ? 'Слышу голос!' : 'Говорите громче...'}
            </div>

            {/* Timer */}
            <div className="text-4xl font-bold mb-4">{recordingTime}s / 10s</div>

            {/* Real-time metrics */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-4">
              <div className="bg-white/10 rounded-lg p-3">
                <span className="text-purple-300 text-xs">Громкость</span>
                <div className="h-2 bg-white/20 rounded-full mt-1">
                  <motion.div
                    animate={{ width: `${currentVolume * 300}%` }}
                    transition={{ duration: 0.1 }}
                    className="h-full bg-gradient-to-r from-green-400 to-yellow-400 rounded-full max-w-full"
                  />
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <span className="text-purple-300 text-xs">Частота</span>
                <p className="font-semibold text-sm">{formatPitch(currentPitch)}</p>
              </div>
            </div>

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-1 h-20 mb-4">
              {waveform.map((height, i) => (
                <motion.div
                  key={i}
                  animate={{ height: Math.max(4, height * 80) }}
                  transition={{ duration: 0.05 }}
                  className={`w-2 rounded-full ${isSpeaking ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-white/30'}`}
                  style={{ height: `${Math.max(4, height * 80)}px` }}
                />
              ))}
            </div>

            {/* Spectrum visualization */}
            <div className="flex items-end justify-center gap-1 h-12 mb-6">
              {spectrum.map((value, i) => (
                <motion.div
                  key={i}
                  animate={{ height: Math.max(4, value * 48) }}
                  transition={{ duration: 0.1 }}
                  className="w-4 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                  style={{ height: `${Math.max(4, value * 48)}px` }}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="w-full max-w-sm py-4 bg-white/20 rounded-2xl font-bold text-lg border border-white/30"
            >
              Остановить
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center pt-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-24 h-24 mx-auto mb-8 border-4 border-purple-500 border-t-transparent rounded-full"
            />

            <h2 className="text-2xl font-bold mb-4">Анализируем голос...</h2>

            <div className="space-y-2 text-purple-200">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Обрабатываем {voiceProfile?.duration.toFixed(1) || '0'}с активной речи...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                Вычисляем спектральные характеристики...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                Определяем тембровый профиль...
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                Сопоставляем с архетипами...
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Result Step */}
        {step === 'result' && voiceProfile && matches.length > 0 && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-4 pb-8"
          >
            {/* Wow Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-center mb-6"
            >
              <span className="text-5xl">🎤✨</span>
              <h2 className="text-2xl font-bold mt-4">Анализ завершён!</h2>
              <p className="text-purple-200 mt-2">{voiceDescription}</p>
            </motion.div>

            {/* Real Voice Analysis Card */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-800/60 to-pink-800/40 rounded-2xl p-5 mb-6 max-w-md mx-auto border border-white/20"
            >
              <h3 className="font-bold mb-4 text-center flex items-center justify-center gap-2">
                <span className="text-green-400">●</span>
                Реальные характеристики голоса:
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Тембр</span>
                  <p className="font-semibold">{getTimbreName(voiceProfile.timbre.classification)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Высота</span>
                  <p className="font-semibold">{getPitchName(voiceProfile.pitch.classification)}</p>
                  <p className="text-xs text-purple-300">{Math.round(voiceProfile.pitch.average)} Hz</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Диапазон</span>
                  <p className="font-semibold">{Math.round(voiceProfile.pitch.min)}–{Math.round(voiceProfile.pitch.max)} Hz</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Стабильность</span>
                  <p className="font-semibold">{Math.round(voiceProfile.pitch.stability * 100)}%</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Яркость</span>
                  <div className="h-2 bg-white/20 rounded-full mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      style={{ width: `${voiceProfile.timbre.brightness * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <span className="text-purple-300 text-xs">Теплота</span>
                  <div className="h-2 bg-white/20 rounded-full mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                      style={{ width: `${voiceProfile.timbre.warmth * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional metrics */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-purple-300">Энергия</p>
                  <p className="font-bold">{Math.round(voiceProfile.delivery.energy * 100)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-300">Выразительность</p>
                  <p className="font-bold">{Math.round(voiceProfile.delivery.expressiveness * 100)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-300">Уверенность</p>
                  <p className="font-bold">{Math.round(voiceProfile.delivery.confidence * 100)}%</p>
                </div>
              </div>
            </motion.div>

            {/* Top Match */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-5 mb-6 max-w-md mx-auto border-2 border-yellow-400/50"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={matches[0].image}
                    alt={matches[0].name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
                  />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                    #1
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-300 text-xs mb-1">Твой главный архетип:</p>
                  <h3 className="text-xl font-bold">{matches[0].name}</h3>
                  <p className="text-purple-200 text-sm">{matches[0].type}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-white/20 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        style={{ width: `${matches[0].similarity}%` }}
                      />
                    </div>
                    <span className="text-yellow-400 font-bold">{matches[0].similarity}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-purple-200 mt-3 italic">
                "{matches[0].description}"
              </p>
              <p className="text-xs text-purple-300/70 mt-2">
                Твой голос напоминает стиль {matches[0].type.toLowerCase()} по подаче и тембру
              </p>
            </motion.div>

            {/* Other Matches */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="max-w-md mx-auto mb-6"
            >
              <h4 className="font-semibold mb-3">Также ассоциируется с:</h4>
              <div className="space-y-2">
                {matches.slice(1).map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-white/10 rounded-xl p-3 flex items-center gap-3"
                  >
                    <img
                      src={match.image}
                      alt={match.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{match.name}</p>
                      <p className="text-xs text-purple-300">{match.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-purple-400 font-bold">{match.similarity}%</span>
                      <p className="text-xs text-purple-300/70">сходство</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Technical details (collapsible) */}
            <motion.details
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 rounded-2xl p-4 mb-6 max-w-md mx-auto"
            >
              <summary className="cursor-pointer text-purple-300 text-sm">
                📊 Технические данные анализа
              </summary>
              <div className="mt-3 text-xs text-purple-200 space-y-1">
                <p>Длительность речи: {voiceProfile.duration.toFixed(1)}с</p>
                <p>Качество записи: {Math.round(voiceProfile.quality * 100)}%</p>
                <p>Spectral Centroid: {Math.round(voiceProfile.timbre.spectralCentroid)} Hz</p>
                <p>Spectral Rolloff: {Math.round(voiceProfile.timbre.spectralRolloff)} Hz</p>
                <p>Spectral Flatness: {voiceProfile.timbre.spectralFlatness.toFixed(3)}</p>
                <p>Embedding: [{voiceProfile.embedding.slice(0, 5).map(v => v.toFixed(2)).join(', ')}...]</p>
              </div>
            </motion.details>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="space-y-3 max-w-md mx-auto"
            >
              <Link
                to="/create-moment"
                className="block w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl font-bold text-center shadow-lg shadow-purple-500/30"
              >
                🎬 Получить видео с этим стилем
              </Link>

              <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold shadow-lg shadow-blue-500/30">
                💌 Заказать звуковую открытку
              </button>

              <button className="w-full py-4 bg-white/10 rounded-2xl font-bold border border-white/20">
                🤖 Создать AI-аватар с этим голосом
              </button>

              <button
                onClick={resetQuiz}
                className="w-full py-3 text-purple-300 text-sm"
              >
                Попробовать ещё раз
              </button>
            </motion.div>

            {/* Disclaimer */}
            <p className="text-xs text-purple-300/50 text-center mt-6 max-w-sm mx-auto">
              * Анализ выполнен локально. Голос не сохранён. Все голоса создаются как уникальные синтетические стили.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
