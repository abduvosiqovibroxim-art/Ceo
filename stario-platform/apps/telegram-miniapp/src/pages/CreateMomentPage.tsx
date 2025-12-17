import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';
import { artistsApi, Artist } from '../services/api';

type Step = 'artist' | 'occasion' | 'message' | 'payment';

// Generate avatar URL
const getAvatarUrl = (name: string) => {
  const colors = ['E91E63', '9C27B0', '673AB7', '3F51B5', '2196F3', '00BCD4', '009688', '4CAF50', 'FF9800', 'FF5722'];
  const colorIndex = name.length % colors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=${colors[colorIndex]}&color=fff&bold=true`;
};

const occasions = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'congratulations', label: 'Congratulations', emoji: '🎉' },
  { id: 'motivation', label: 'Motivation', emoji: '💪' },
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'holiday', label: 'Holiday', emoji: '🎄' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export default function CreateMomentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const artistIdFromUrl = searchParams.get('artist');

  const [step, setStep] = useState<Step>(artistIdFromUrl ? 'occasion' : 'artist');
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(artistIdFromUrl);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArtists, setTotalArtists] = useState(0);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');

  // Fetch artists list
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

  // Fetch selected artist details
  useEffect(() => {
    const fetchSelectedArtist = async () => {
      if (selectedArtistId) {
        try {
          const artist = await artistsApi.getById(selectedArtistId);
          setSelectedArtist(artist);
        } catch (err) {
          console.error('Error fetching artist:', err);
          // Try to find artist in loaded list
          const foundArtist = artists.find(a => a.id === selectedArtistId);
          if (foundArtist) {
            setSelectedArtist(foundArtist);
          }
        }
      }
    };
    fetchSelectedArtist();
  }, [selectedArtistId, artists]);

  const handleArtistSelect = (artistId: string) => {
    WebApp.HapticFeedback.selectionChanged();
    setSelectedArtistId(artistId);
    setStep('occasion');
  };

  const handleOccasionSelect = (occasionId: string) => {
    WebApp.HapticFeedback.selectionChanged();
    setSelectedOccasion(occasionId);
    setStep('message');
  };

  const handleSubmit = () => {
    if (!recipientName || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    WebApp.HapticFeedback.notificationOccurred('success');
    setStep('payment');
  };

  const handlePayment = () => {
    // In production, this would open Telegram payment
    WebApp.showPopup({
      title: 'Order Placed!',
      message: 'Your personalized video will be ready within 24 hours.',
      buttons: [{ type: 'ok' }],
    }, () => {
      navigate('/my-content');
    });
  };

  const getSteps = () => {
    if (artistIdFromUrl) {
      return ['occasion', 'message', 'payment'];
    }
    return ['artist', 'occasion', 'message', 'payment'];
  };

  const currentStepIndex = getSteps().indexOf(step);

  return (
    <div className="px-4 py-6 min-h-screen">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {getSteps().map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              currentStepIndex >= i
                ? 'bg-stario-purple'
                : 'bg-tg-secondary-bg'
            }`}
          />
        ))}
      </div>

      {/* Step: Choose Artist */}
      {step === 'artist' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-tg-text">
                Choose an artist
              </h1>
              <p className="text-tg-hint">
                Select who will create your moment
              </p>
            </div>
            <Link
              to="/artists"
              className="text-sm text-stario-purple font-medium"
            >
              See all
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="w-full flex items-center p-4 rounded-xl bg-tg-secondary-bg animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-3" />
                  <div className="w-14 h-14 rounded-full bg-gray-300" />
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-300 rounded w-16" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-300 rounded w-16 mb-1" />
                    <div className="h-3 bg-gray-300 rounded w-8 ml-auto" />
                  </div>
                </div>
              ))
            ) : artists.length > 0 ? (
              artists.map((artist, index) => (
                <motion.button
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleArtistSelect(artist.id)}
                  className={`w-full flex items-center p-4 rounded-xl transition-all ${
                    selectedArtistId === artist.id
                      ? 'bg-stario-purple/20 border-2 border-stario-purple'
                      : 'bg-tg-secondary-bg border-2 border-transparent'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-200 text-gray-600'
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
                    <p className="font-semibold text-tg-text">{artist.name}</p>
                    <p className="text-xs text-tg-hint">{artist.followers} followers</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-stario-purple">{artist.price.toLocaleString()}</p>
                    <p className="text-xs text-tg-hint">UZS</p>
                  </div>
                </motion.button>
              ))
            ) : (
              <p className="text-center text-tg-hint py-8">No artists found</p>
            )}
          </div>

          {/* See All Artists CTA */}
          <Link
            to="/artists"
            className="block w-full py-4 mt-4 bg-tg-secondary-bg text-tg-text rounded-xl font-semibold text-center"
          >
            View all artists ({totalArtists}+)
          </Link>
        </motion.div>
      )}

      {step === 'occasion' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-xl font-bold text-tg-text mb-2">
            What's the occasion?
          </h1>
          <p className="text-tg-hint mb-6">
            Choose the type of greeting you want
          </p>

          <div className="grid grid-cols-2 gap-3">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => handleOccasionSelect(occasion.id)}
                className="p-4 rounded-2xl bg-tg-secondary-bg text-left hover:scale-[1.02] transition-transform"
              >
                <span className="text-2xl mb-2 block">{occasion.emoji}</span>
                <span className="font-medium text-tg-text">{occasion.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {step === 'message' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-xl font-bold text-tg-text mb-2">
            Personalize your moment
          </h1>
          <p className="text-tg-hint mb-6">
            Tell us about the recipient
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-tg-text mb-2">
                Recipient's Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter name"
                className="w-full px-4 py-3 rounded-xl bg-tg-secondary-bg text-tg-text placeholder-tg-hint outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-tg-text mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What should the artist say?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-tg-secondary-bg text-tg-text placeholder-tg-hint outline-none resize-none"
              />
            </div>

            <button onClick={handleSubmit} className="w-full tg-button">
              Continue to Payment
            </button>
          </div>
        </motion.div>
      )}

      {step === 'payment' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-xl font-bold text-tg-text mb-2">
            Complete your order
          </h1>
          <p className="text-tg-hint mb-6">
            Review and pay for your moment
          </p>

          <div className="p-4 rounded-2xl bg-tg-secondary-bg mb-6">
            {selectedArtist && (
              <div className="flex items-center mb-4 pb-4 border-b border-tg-bg">
                <img
                  src={selectedArtist.image || getAvatarUrl(selectedArtist.name)}
                  alt={selectedArtist.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-semibold text-tg-text">{selectedArtist.name}</p>
                  <p className="text-xs text-tg-hint">{selectedArtist.category}</p>
                </div>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span className="text-tg-hint">Artist</span>
              <span className="text-tg-text font-medium">{selectedArtist?.name || 'Selected Artist'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-tg-hint">Occasion</span>
              <span className="text-tg-text font-medium capitalize">{selectedOccasion}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-tg-hint">Recipient</span>
              <span className="text-tg-text font-medium">{recipientName}</span>
            </div>
            <hr className="border-tg-bg my-3" />
            <div className="flex justify-between mb-2">
              <span className="text-tg-hint">Video Price</span>
              <span className="text-tg-text">{selectedArtist?.price.toLocaleString() || '0'} UZS</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-tg-hint">Service Fee</span>
              <span className="text-tg-text">5,000 UZS</span>
            </div>
            <hr className="border-tg-bg my-3" />
            <div className="flex justify-between">
              <span className="text-tg-text font-semibold">Total</span>
              <span className="text-stario-purple font-bold">
                {((selectedArtist?.price || 0) + 5000).toLocaleString()} UZS
              </span>
            </div>
          </div>

          <button onClick={handlePayment} className="w-full tg-button">
            Pay {((selectedArtist?.price || 0) + 5000).toLocaleString()} UZS
          </button>
        </motion.div>
      )}
    </div>
  );
}
