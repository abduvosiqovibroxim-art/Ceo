import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { artistsApi, Artist } from '../services/api';

const steps = [
  { id: 1, nameKey: 'createMoment.steps.chooseArtist' },
  { id: 2, nameKey: 'createMoment.steps.writeMessage' },
  { id: 3, nameKey: 'createMoment.steps.reviewPay' },
];

// Generate avatar URL with initials and gradient background
const getAvatarUrl = (name: string) => {
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true&font-size=0.4`;
};

const occasions = [
  { id: 'birthday', labelKey: 'createMoment.occasions.birthday' },
  { id: 'congratulations', labelKey: 'createMoment.occasions.congratulations' },
  { id: 'thank_you', labelKey: 'createMoment.occasions.thankYou' },
  { id: 'get_well', labelKey: 'createMoment.occasions.getWell' },
  { id: 'just_because', labelKey: 'createMoment.occasions.justBecause' },
  { id: 'holiday', labelKey: 'createMoment.occasions.holiday' },
];

// Emotion presets for AI-generated content
const emotionPresets = [
  { id: 'birthday', emoji: '🎂', label: 'День рождения', color: 'from-pink-500 to-rose-500', description: 'Праздничное и радостное настроение' },
  { id: 'love', emoji: '❤️', label: 'Любовь', color: 'from-red-500 to-pink-500', description: 'Романтичное и тёплое обращение' },
  { id: 'motivation', emoji: '💪', label: 'Мотивация', color: 'from-orange-500 to-amber-500', description: 'Вдохновляющее и энергичное' },
  { id: 'funny', emoji: '😂', label: 'Весёлое', color: 'from-yellow-400 to-orange-400', description: 'Юмор и позитив' },
];

// Duration options
const durationOptions = [
  { seconds: 15, label: '15 сек', price: 0, description: 'Короткое приветствие' },
  { seconds: 30, label: '30 сек', price: 10000, description: 'Стандартное видео' },
  { seconds: 60, label: '60 сек', price: 25000, description: 'Расширенное видео' },
];

export default function CreateMomentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [occasion, setOccasion] = useState('birthday');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArtists, setTotalArtists] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState('birthday');
  const [selectedDuration, setSelectedDuration] = useState(30);

  // Fetch artists from API
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await artistsApi.getAll({ page_size: 10 });
        setArtists(response.items);
        setTotalArtists(response.total);
      } catch (err) {
        console.error('Error fetching artists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // In production, create order and redirect to payment
    navigate('/checkout');
  };

  const artist = artists.find((a) => a.id === selectedArtist);

  return (
    <div className="px-4 py-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <p className="mt-2 text-xs">{t(step.nameKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Choose Artist */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Header with See All button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{t('createMoment.selectArtist')}</h2>
              <p className="text-sm text-gray-500">{t('createMoment.top10Artists')}</p>
            </div>
            <Link
              to="/artists"
              className="flex items-center gap-1 text-indigo-600 font-medium text-sm hover:text-indigo-700"
            >
              {t('common.seeAll')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Artists Grid */}
          <div className="space-y-3">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="w-full flex items-center p-4 rounded-xl border-2 border-gray-200 bg-white animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-3" />
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-8 ml-auto" />
                  </div>
                </div>
              ))
            ) : (
              artists.map((artist, index) => (
                <motion.button
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedArtist(artist.id)}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                    selectedArtist === artist.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Artist Image */}
                  <div className="relative">
                    <img
                      src={artist.image || getAvatarUrl(artist.name)}
                      alt={artist.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {artist.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Artist Info */}
                  <div className="ml-3 text-left flex-1">
                    <p className="font-semibold text-gray-900">{artist.name}</p>
                    <p className="text-xs text-gray-500">{artist.followers} {t('artists.followers')}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{artist.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">UZS</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* See All Artists CTA */}
          <Link
            to="/artists"
            className="block w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-200 transition-colors"
          >
            {t('createMoment.viewAllArtists')} ({totalArtists}+)
          </Link>

          <button
            onClick={handleNext}
            disabled={!selectedArtist}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-indigo-700"
          >
            {t('common.next')}
          </button>
        </motion.div>
      )}

      {/* Step 2: Write Message */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold">{t('createMoment.createMessage')}</h2>

          {/* Emotion Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Выберите эмоцию видео
            </label>
            <div className="grid grid-cols-2 gap-3">
              {emotionPresets.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedEmotion === emotion.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${emotion.color} flex items-center justify-center text-2xl mx-auto mb-2`}>
                    {emotion.emoji}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{emotion.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{emotion.description}</p>
                  {selectedEmotion === emotion.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Длительность видео
            </label>
            <div className="grid grid-cols-3 gap-3">
              {durationOptions.map((duration) => (
                <button
                  key={duration.seconds}
                  onClick={() => setSelectedDuration(duration.seconds)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedDuration === duration.seconds
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-gray-900">{duration.label}</div>
                  <p className="text-xs text-gray-500 mt-1">{duration.description}</p>
                  {duration.price > 0 ? (
                    <p className="text-xs text-indigo-600 font-medium mt-1">+{duration.price.toLocaleString()} UZS</p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium mt-1">Базовая</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('createMoment.occasion')}
            </label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setOccasion(occ.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    occasion === occ.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t(occ.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('createMoment.recipientName')}
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={t('createMoment.enterName')}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('createMoment.message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('createMoment.messagePlaceholder')}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              AI адаптирует текст под выбранную эмоцию: {emotionPresets.find(e => e.id === selectedEmotion)?.label}
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              {t('common.back')}
            </button>
            <button
              onClick={handleNext}
              disabled={!recipientName || !message}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
            >
              {t('common.next')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review & Pay */}
      {currentStep === 3 && artist && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold">{t('createMoment.reviewOrder')}</h2>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <img
                src={artist.image || getAvatarUrl(artist.name)}
                alt={artist.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="ml-4">
                <p className="font-semibold">{artist.name}</p>
                <p className="text-sm text-gray-500">{t(`createMoment.occasions.${occasion}`)} {t('createMoment.video')}</p>
              </div>
            </div>

            {/* Emotion & Duration Summary */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emotionPresets.find(e => e.id === selectedEmotion)?.emoji}</span>
                  <div>
                    <p className="text-xs text-gray-500">Эмоция</p>
                    <p className="font-medium text-sm">{emotionPresets.find(e => e.id === selectedEmotion)?.label}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⏱️</span>
                  <div>
                    <p className="text-xs text-gray-500">Длительность</p>
                    <p className="font-medium text-sm">{durationOptions.find(d => d.seconds === selectedDuration)?.label}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">{t('createMoment.to')}: {recipientName}</p>
              <p className="text-sm text-gray-600 mt-2">"{message}"</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('createMoment.videoPrice')} ({durationOptions.find(d => d.seconds === selectedDuration)?.label})</span>
              <span>{artist.price.toLocaleString()} UZS</span>
            </div>
            {(durationOptions.find(d => d.seconds === selectedDuration)?.price || 0) > 0 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Доплата за длительность</span>
                <span>+{(durationOptions.find(d => d.seconds === selectedDuration)?.price || 0).toLocaleString()} UZS</span>
              </div>
            )}
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">{t('createMoment.serviceFee')}</span>
              <span>5,000 UZS</span>
            </div>
            <div className="flex justify-between font-bold mt-4 pt-4 border-t">
              <span>{t('cart.total')}</span>
              <span>{(artist.price + 5000 + (durationOptions.find(d => d.seconds === selectedDuration)?.price || 0)).toLocaleString()} UZS</span>
            </div>
          </div>

          {/* AI Generation Info */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <p className="font-medium text-indigo-900">AI-генерация видео</p>
                <p className="text-sm text-indigo-700 mt-1">
                  Наш ИИ создаст персональное видео с эмоцией "{emotionPresets.find(e => e.id === selectedEmotion)?.label}"
                  длительностью {selectedDuration} секунд. Обычно готово в течение 5-10 минут.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              {t('common.back')}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              {t('createMoment.payNow')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
