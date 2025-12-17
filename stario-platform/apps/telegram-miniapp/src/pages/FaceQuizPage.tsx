import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import WebApp from '@twa-dev/sdk';

type QuizState = 'upload' | 'analyzing' | 'result';

export default function FaceQuizPage() {
  const [state, setState] = useState<QuizState>('upload');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setState('analyzing');
        // Simulate analysis
        setTimeout(() => {
          WebApp.HapticFeedback.notificationOccurred('success');
          setState('result');
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setImage(null);
    setState('upload');
  };

  return (
    <div className="px-4 py-6 min-h-screen flex flex-col">
      <h1 className="text-xl font-bold text-tg-text mb-2">Face Quiz</h1>
      <p className="text-tg-hint mb-6">
        Discover which artist you look like!
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-48 h-48 rounded-full bg-tg-secondary-bg flex flex-col items-center justify-center gap-3 mb-6"
            >
              <CameraIcon className="w-12 h-12 text-tg-hint" />
              <span className="text-sm text-tg-hint">Tap to upload</span>
            </button>
            <p className="text-sm text-tg-hint text-center max-w-xs">
              Upload a clear photo of your face to find your celebrity lookalike
            </p>
          </motion.div>
        )}

        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            {image && (
              <div className="w-48 h-48 rounded-full overflow-hidden mb-6 relative">
                <img src={image} alt="Your photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-stario-purple/30 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-2 text-tg-text">
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              <span>Analyzing your face...</span>
            </div>
          </motion.div>
        )}

        {state === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center"
          >
            <div className="relative mb-6">
              {/* Your photo */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {image && <img src={image} alt="You" className="w-full h-full object-cover" />}
              </div>
              {/* Match indicator */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-16 h-8 bg-stario-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                87%
              </div>
              {/* Artist photo */}
              <div className="absolute -right-20 top-0 w-32 h-32 rounded-full bg-gradient-to-br from-stario-purple to-stario-pink border-4 border-white shadow-lg" />
            </div>

            <h2 className="text-xl font-bold text-tg-text mb-2">You look like</h2>
            <h3 className="text-2xl font-bold text-stario-purple mb-4">Artist One!</h3>

            <p className="text-tg-hint text-center mb-6 max-w-xs">
              You share 87% facial similarity with this popular artist
            </p>

            <div className="w-full space-y-3">
              <button className="w-full tg-button">
                Create Moment with Artist One
              </button>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-tg-secondary-bg text-tg-text font-medium"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
